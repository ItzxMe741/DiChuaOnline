import sys
import asyncio
import json
import uuid
import os
import time
from contextlib import suppress
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
from typing import Dict
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from redis.asyncio import Redis

app = FastAPI(title="Chùa An Lạc 3D - Đi Chùa Online")
PUBLIC_DIR = Path(__file__).resolve().parent / "public"

REDIS_URL = os.getenv("REDIS_URL")
redis_client = Redis.from_url(REDIS_URL, decode_responses=True) if REDIS_URL else None
INSTANCE_ID = str(uuid.uuid4())
ROOM_PREFIX = "chua-an-lac:default"
PLAYERS_KEY = f"{ROOM_PREFIX}:players"
ACTIVE_PLAYERS_KEY = f"{ROOM_PREFIX}:active"
INCENSE_KEY = f"{ROOM_PREFIX}:incense"
CHAT_KEY = f"{ROOM_PREFIX}:chat"
EVENTS_CHANNEL = f"{ROOM_PREFIX}:events"

# Store connected players
# { connection_id: { "ws": WebSocket, "data": { "id", "name", "robe", "x", "y", "z", "rotY", "action", "last_active" } } }
players: Dict[str, dict] = {}

# Active incense sticks placed in the temple { id: { "urnId": str, "x", "y", "z", "playerName", "timestamp" } }
incense_list = []

# Chat history (last 50 messages)
chat_history = []


async def save_shared_player(player_data: dict):
    if not redis_client:
        return
    player_id = player_data["id"]
    await redis_client.hset(PLAYERS_KEY, player_id, json.dumps(player_data))
    await redis_client.zadd(ACTIVE_PLAYERS_KEY, {player_id: time.time()})


async def load_shared_players(exclude_id: str = None):
    if not redis_client:
        return [p["data"] for p in players.values() if p["data"]["id"] != exclude_id]

    cutoff = time.time() - 120
    stale_ids = await redis_client.zrangebyscore(ACTIVE_PLAYERS_KEY, "-inf", cutoff)
    if stale_ids:
        await redis_client.zrem(ACTIVE_PLAYERS_KEY, *stale_ids)
        await redis_client.hdel(PLAYERS_KEY, *stale_ids)

    active_ids = await redis_client.zrangebyscore(ACTIVE_PLAYERS_KEY, cutoff, "+inf")
    stored_players = await redis_client.hgetall(PLAYERS_KEY)
    return [
        json.loads(stored_players[player_id])
        for player_id in active_ids
        if player_id != exclude_id and player_id in stored_players
    ]


async def load_shared_list(key: str, start: int, end: int, fallback: list):
    if not redis_client:
        return fallback[start:end + 1] if end >= 0 else fallback[start:]
    stored_items = await redis_client.lrange(key, start, end)
    return [json.loads(item) for item in stored_items]


async def save_shared_item(key: str, item: dict, keep: int):
    if redis_client:
        await redis_client.rpush(key, json.dumps(item, ensure_ascii=False))
        await redis_client.ltrim(key, -keep, -1)


async def forward_remote_events(websocket: WebSocket, player_id: str, pubsub):
    async for event in pubsub.listen():
        if event.get("type") != "message":
            continue
        try:
            envelope = json.loads(event["data"])
            if envelope.get("instance") == INSTANCE_ID or envelope.get("exclude_id") == player_id:
                continue
            await websocket.send_json(envelope["message"])
        except WebSocketDisconnect:
            return
        except Exception as error:
            print(f"Error forwarding shared event to {player_id}: {error}")
            return


async def remember_chat_message(message: dict):
    chat_history.append(message)
    if len(chat_history) > 100:
        del chat_history[:-100]
    await save_shared_item(CHAT_KEY, message, 100)

@app.get("/")
async def get_index():
    index_file = PUBLIC_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return RedirectResponse("/index.html", status_code=307)


@app.get("/health")
async def health_check():
    if not redis_client:
        return {"status": "ok", "sharedMultiplayer": False, "room": "default"}
    try:
        await redis_client.ping()
    except Exception as error:
        print(f"Redis health check failed: {error}")
        raise HTTPException(status_code=503, detail="Shared multiplayer storage is unavailable")
    return {"status": "ok", "sharedMultiplayer": True, "room": "default"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    player_id = str(uuid.uuid4())[:8]
    pubsub = None
    relay_task = None
    
    player_data = {
        "id": player_id,
        "name": "Phật tử vô danh",
        "robe": "blue",
        "x": 0.0,
        "y": 0.0,
        "z": 16.0,
        "rotY": 3.14159,
        "action": "idle",
        "chantCount": 0
    }
    
    try:
        if redis_client:
            pubsub = redis_client.pubsub()
            await pubsub.subscribe(EVENTS_CHANNEL)
            relay_task = asyncio.create_task(forward_remote_events(websocket, player_id, pubsub))

        players[player_id] = {"ws": websocket, "data": player_data}
        await save_shared_player(player_data)
        last_shared_save = time.monotonic()

        # Load one shared room snapshot so visitors on different Vercel instances meet.
        all_players_data = await load_shared_players(exclude_id=player_id)
        shared_incense = await load_shared_list(INCENSE_KEY, -40, -1, incense_list)
        shared_chat = await load_shared_list(CHAT_KEY, -30, -1, chat_history)
        await websocket.send_json({
            "type": "welcome",
            "playerId": player_id,
            "players": all_players_data,
            "incense": shared_incense,
            "chatHistory": shared_chat
        })
        
        # Notify other players that a new devotee joined
        await broadcast({
            "type": "player_joined",
            "player": player_data
        }, exclude_id=player_id)
        
        # Listen for messages
        while True:
            raw_data = await websocket.receive_text()
            msg = json.loads(raw_data)
            msg_type = msg.get("type")
            
            if msg_type == "init_player":
                player_data["name"] = msg.get("name", "Phật tử")[:25]
                player_data["robe"] = msg.get("robe", "blue")
                await save_shared_player(player_data)
                last_shared_save = time.monotonic()
                await broadcast({
                    "type": "player_updated",
                    "player": player_data
                })
                
                # System announcement in chat
                sys_msg = {
                    "id": str(uuid.uuid4())[:8],
                    "sender": "Hệ thống",
                    "text": f"Đạo hữu {player_data['name']} đã hoan hỷ bước vào chùa.",
                    "isSystem": True
                }
                await remember_chat_message(sys_msg)
                await broadcast({"type": "chat_message", "message": sys_msg})

            elif msg_type == "move":
                player_data["x"] = float(msg.get("x", 0))
                player_data["y"] = float(msg.get("y", 0))
                player_data["z"] = float(msg.get("z", 0))
                player_data["rotY"] = float(msg.get("rotY", 0))
                player_data["action"] = msg.get("action", "idle")
                now = time.monotonic()
                if now - last_shared_save >= 1:
                    await save_shared_player(player_data)
                    last_shared_save = now
                
                # Relay movement to other players
                await broadcast({
                    "type": "player_moved",
                    "id": player_id,
                    "x": player_data["x"],
                    "y": player_data["y"],
                    "z": player_data["z"],
                    "rotY": player_data["rotY"],
                    "action": player_data["action"]
                }, exclude_id=player_id)
                
            elif msg_type == "action":
                action_name = msg.get("action")
                player_data["action"] = action_name
                payload = {
                    "type": "player_action",
                    "id": player_id,
                    "name": player_data["name"],
                    "action": action_name,
                    "data": msg.get("data", {})
                }
                
                if action_name == "incense":
                    new_incense = {
                        "id": str(uuid.uuid4())[:8],
                        "urn": msg.get("data", {}).get("urn", "main_altar"),
                        "x": msg.get("data", {}).get("x", 0),
                        "y": msg.get("data", {}).get("y", 1.8),
                        "z": msg.get("data", {}).get("z", -4.5),
                        "playerName": player_data["name"]
                    }
                    incense_list.append(new_incense)
                    await save_shared_item(INCENSE_KEY, new_incense, 40)
                    payload["incenseItem"] = new_incense
                    
                elif action_name == "rosary_chant":
                    player_data["chantCount"] = msg.get("data", {}).get("count", 0)
                    payload["chantCount"] = player_data["chantCount"]
                    payload["mantra"] = msg.get("data", {}).get("mantra", "Nam Mô A Di Đà Phật")
                    
                await broadcast(payload)

            elif msg_type == "chat":
                text = msg.get("text", "").strip()
                if text:
                    chat_item = {
                        "id": str(uuid.uuid4())[:8],
                        "playerId": player_id,
                        "sender": player_data["name"],
                        "text": text[:200],
                        "isSystem": False
                    }
                    await remember_chat_message(chat_item)
                    await broadcast({"type": "chat_message", "message": chat_item})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Error handling player {player_id}: {e}")
    finally:
        if player_id in players:
            name = players[player_id]["data"]["name"]
            del players[player_id]
            if redis_client:
                try:
                    await redis_client.hdel(PLAYERS_KEY, player_id)
                    await redis_client.zrem(ACTIVE_PLAYERS_KEY, player_id)
                except Exception as error:
                    print(f"Error removing shared player {player_id}: {error}")
            await broadcast({
                "type": "player_left",
                "id": player_id
            })
            sys_msg = {
                "id": str(uuid.uuid4())[:8],
                "sender": "Hệ thống",
                "text": f"Đạo hữu {name} đã rời chùa. Chúc thân tâm thường an lạc!",
                "isSystem": True
            }
            await remember_chat_message(sys_msg)
            await broadcast({"type": "chat_message", "message": sys_msg})

        if relay_task:
            relay_task.cancel()
            with suppress(asyncio.CancelledError):
                await relay_task
        if pubsub:
            with suppress(Exception):
                await pubsub.unsubscribe(EVENTS_CHANNEL)
                await pubsub.aclose()

async def broadcast(message: dict, exclude_id: str = None):
    dead_ids = []
    for pid, p in players.items():
        if exclude_id and pid == exclude_id:
            continue
        try:
            await p["ws"].send_json(message)
        except Exception:
            dead_ids.append(pid)
    for did in dead_ids:
        if did in players:
            del players[did]

    if redis_client:
        try:
            await redis_client.publish(EVENTS_CHANNEL, json.dumps({
                "instance": INSTANCE_ID,
                "exclude_id": exclude_id,
                "message": message
            }, ensure_ascii=False))
        except Exception as error:
            print(f"Error broadcasting shared event: {error}")

# Vercel serves public/ directly from its CDN; mount it only for local development.
if PUBLIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(PUBLIC_DIR), html=True), name="public")

if __name__ == "__main__":
    import uvicorn
    print("Khởi chạy máy chủ Chùa An Lạc 3D tại http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
