
import asyncio
import json
import websockets

# Your full data array goes here
SAMPLE = [
  {
    "key": "69",
    "ID": 69,
    "username": "Alice",
    "avatar": "https://m.media-amazon.com/images/S/pv-target-images/16627900db04b76fae3b64266ca161511422059cd24062fb5d900971003a0b70.jpg",
    "CategoryNames": ["CategoryA","CategoryB","CategoryC","CategoryD"],
    "CategoryPoints": [10,15,8,1],
    "status": "online",
    "position": 1,
    "lat": 56.660211339105715,
    "lon": 23.744293111677134,
    "spd": 12.3,
    "power": 98,
    "acceleration": 0.2,
    "voltage": 62,
    "updatedAt": "12:05:23 PM"
  },
  {
    "key": "42",
    "ID": 42,
    "username": "Petr Gabuniia",
    "avatar": "https://media.licdn.com/dms/image/v2/D4D03AQFRdDx6q6OULw/profile-displayphoto-shrink_400_400/B4DZOwNG6eHMAg-/0/1733828047048?e=1752710400&v=beta&t=7MdigVGwqz7T6nR2qUhJoJ3Ll0FllfBoybNbZkp9YDY",
    "CategoryNames": ["CategoryA","CategoryB","CategoryC","CategoryD"],
    "CategoryPoints": [5,12,20,2],
    "status": "ping",
    "position": 2,
    "lat": 56.66069176552587,
    "lon": 23.7447387511283,
    "spd": 10.8,
    "power": 102,
    "acceleration": 0.1,
    "voltage": 58.4,
    "updatedAt": "12:05:24 PM"
  },
  {
    "key": "17",
    "ID": 17,
    "username": "Edgars Bitenieks",
    "avatar": "https://scontent.frix6-1.fna.fbcdn.net/v/t39.30808-6/463380875_8182261778540823_2540909665648911058_n.jpg?stp=dst-jpg_p526x395_tt6&_nc_cat=107&ccb=1-7&_nc_sid=127cfc&_nc_ohc=8qhGIe39BA4Q7kNvwE1-8uL&_nc_oc=AdnR8sp7z081nWGA9AU0qOJlnqW1NXbU9-pX75ZtOnLr-p4jLzzoxcybbUIp5GuWn8pe4CfuoT9smSIzC7_973xi&_nc_zt=23&_nc_ht=scontent.frix6-1.fna&_nc_gid=MK_rCusegEWERiLP27Yolg&oh=00_AfJIIO2vDh7_QCkfDlRMY8nkQeN5FOLNwcT22aVB2Qrk5Q&oe=6826E88C",
    "CategoryNames": ["CategoryA","CategoryB","CategoryC","CategoryD"],
    "CategoryPoints": [14,9,7,5],
    "status": "offline",
    "position": 3,
    "lat": 56.66160550084238,
    "lon": 23.74246484727979,
    "spd": 11.2,
    "power": 95,
    "acceleration": 0.3,
    "voltage": 42.7,
    "updatedAt": "12:05:25 PM"
  },
  {
    "key": "18",
    "ID": 18,
    "username": "Default avatar",
    "avatar": "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg",
    "CategoryNames": ["CategoryA","CategoryB","CategoryC","CategoryD"],
    "CategoryPoints": [14,9,9,12],
    "status": "online",
    "position": 4,
    "lat": 56.66025529995206,
    "lon": 23.743024753256893,
    "spd": 13.0,
    "power": 88,
    "acceleration": 0.4,
    "voltage": 59.4,
    "updatedAt": "12:05:26 PM"
  },
  {
    "key": "1",
    "ID": 1,
    "username": "Team Alpha",
    "avatar": "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg",
    "CategoryNames": ["CategoryA","CategoryB","CategoryC","CategoryD"],
    "CategoryPoints": [11,8,10,5],
    "status": "ping",
    "position": 5,
    "lat": 56.66106542629023,
    "lon": 23.743790338980684,
    "spd": 9.7,
    "power": 105,
    "acceleration": 0.2,
    "voltage": 54.2,
    "updatedAt": "12:05:27 PM"
  },
  {
    "key": "2",
    "ID": 2,
    "username": "Green Flash",
    "avatar": "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg",
    "CategoryNames": ["CategoryA","CategoryB","CategoryC","CategoryD"],
    "CategoryPoints": [13,14,7,6],
    "status": "offline",
    "position": 6,
    "lat": 56.66044056293711,
    "lon": 23.744681617883007,
    "spd": 12.8,
    "power": 99,
    "acceleration": 0.5,
    "voltage": 55.8,
    "updatedAt": "12:05:28 PM"
  },
  {
    "key": "3",
    "ID": 3,
    "username": "Blue Rocket",
    "avatar": "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg",
    "CategoryNames": ["CategoryA","CategoryB","CategoryC","CategoryD"],
    "CategoryPoints": [6,12,14,9],
    "status": "online",
    "position": 7,
    "lat": 56.66092098643566,
    "lon": 23.742984759972813,
    "spd": 11.9,
    "power": 96,
    "acceleration": 0.3,
    "voltage": 61.7,
    "updatedAt": "12:05:29 PM"
  }
]


async def handler(ws: websockets.WebSocketServerProtocol):
    print("Client connected")
    try:
        while True:
            # If you want to tweak SAMPLE each tick, do it here
            await ws.send(json.dumps(SAMPLE))
            await asyncio.sleep(1)
    except websockets.exceptions.ConnectionClosedOK:
        print("Client cleanly disconnected")
    except Exception as e:
        print("Client disconnected with error:", e)

async def main():
    async with websockets.serve(
        handler,
        "127.0.0.1",
        8765,
        ping_interval=20,
        ping_timeout=20,
    ):
        print("🚀 WebSocket server listening on ws://127.0.0.1:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
