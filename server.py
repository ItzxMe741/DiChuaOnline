import sys
import asyncio
import json
import uuid
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
from typing import Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="Chùa An Lạc 3D - Đi Chùa Online")

# Store connected players
# { connection_id: { "ws": WebSocket, "data": { "id", "name", "robe", "x", "y", "z", "rotY", "action", "last_active" } } }
players: Dict[str, dict] = {}

# Active incense sticks placed in the temple { id: { "urnId": str, "x", "y", "z", "playerName", "timestamp" } }
incense_list = []

# Chat history (last 50 messages)
chat_history = []

@app.get("/")
async def get_index():
    return FileResponse("public/index.html")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    player_id = str(uuid.uuid4())[:8]
    
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
    
    players[player_id] = {
        "ws": websocket,
        "data": player_data
    }
    
    try:
        # Send initial welcome packet with current state
        all_players_data = [p["data"] for p in players.values() if p["data"]["id"] != player_id]
        await websocket.send_json({
            "type": "welcome",
            "playerId": player_id,
            "players": all_players_data,
            "incense": incense_list[-40:],
            "chatHistory": chat_history[-30:]
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
                chat_history.append(sys_msg)
                await broadcast({"type": "chat_message", "message": sys_msg})

            elif msg_type == "move":
                player_data["x"] = float(msg.get("x", 0))
                player_data["y"] = float(msg.get("y", 0))
                player_data["z"] = float(msg.get("z", 0))
                player_data["rotY"] = float(msg.get("rotY", 0))
                player_data["action"] = msg.get("action", "idle")
                
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
                    chat_history.append(chat_item)
                    if len(chat_history) > 100:
                        chat_history.pop(0)
                    await broadcast({"type": "chat_message", "message": chat_item})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Error handling player {player_id}: {e}")
    finally:
        if player_id in players:
            name = players[player_id]["data"]["name"]
            del players[player_id]
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
            chat_history.append(sys_msg)
            await broadcast({"type": "chat_message", "message": sys_msg})

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

# Mount static folder
os.makedirs("public", exist_ok=True)
app.mount("/static", StaticFiles(directory="public"), name="static")

if __name__ == "__main__":
    import uvicorn
    print("Khởi chạy máy chủ Chùa An Lạc 3D tại http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
