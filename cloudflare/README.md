# Cloudflare realtime Worker

This Worker hosts one Durable Object per room and relays live player positions over a hibernatable WebSocket. The Vercel app continues to serve the game, chat, and other temple actions.

## Deploy

1. Install Node.js if it is not already installed.
2. Open a terminal in this `cloudflare` folder and run `npx wrangler login`.
3. Deploy with `npx wrangler deploy`.
4. Copy the Worker URL printed by Wrangler, adding `/ws` to the end. It should look like `https://di-chua-online-realtime.<your-subdomain>.workers.dev/ws`.
5. In Vercel, add `CLOUDFLARE_REALTIME_URL` with that full URL for Production (and Preview if needed), then redeploy.

The room is named `default`. The Worker handles live movement and connected-room presence; the Vercel server remains the fallback while the Cloudflare URL is unset or disconnected.

## Local development

Run `npx wrangler dev` in this folder. Wrangler prints the local Worker URL. Set that URL with `/ws` as `CLOUDFLARE_REALTIME_URL` in the local environment before starting the Python server.
