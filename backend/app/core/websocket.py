from fastapi import WebSocket
from typing import Dict

class ConnectionManager:
    def __init__(self):
        # Maps user_id to their active WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def broadcast_to_role(self, role: str, message: dict, db):
        """Notifies all online users of a specific role to refresh permissions."""
        from app.models.user import User
        # Find all user IDs belonging to this role
        target_user_ids = db.query(User.user_id).filter(User.role == role).all()
        ids = [u[0] for u in target_user_ids]

        for uid in ids:
            if uid in self.active_connections:
                await self.active_connections[uid].send_json(message)

manager = ConnectionManager()