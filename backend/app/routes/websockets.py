from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

router = APIRouter(tags=["Real-Time WebSockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass # Ignore dropped connections

manager = ConnectionManager()

@router.websocket("/ws/queue")
async def queue_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive
            data = await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(websocket)