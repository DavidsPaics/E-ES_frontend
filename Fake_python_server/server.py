import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow your front-end origin to connect:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # adjust as needed
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your sample data
SAMPLE = [
  {
    "key": "69", "ID": 69, "username": "Alice",
    "avatar": "https://m.media-amazon.com/images/...jpg",
    "CategoryNames": ["CategoryA","CategoryB","CategoryC","CategoryD"],
    "CategoryPoints": [10,15,8,1],
    "status": "online", "position": 1,
    "lat": 56.660211339105715, "lon": 23.744293111677134,
    "spd": 12.3, "power": 98, "acceleration": 0.2,
    "updatedAt": "12:05:23 PM"
  },
  # … the rest of your objects …
]

@app.websocket("/live-data")
async def live_data(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            # (Optionally) update timestamps or any dynamic fields here
            for item in SAMPLE:
                # e.g. bump seconds in updatedAt, or recalc position
                pass

            await ws.send_text(json.dumps(SAMPLE))
            await asyncio.sleep(1)   # push every second
    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
