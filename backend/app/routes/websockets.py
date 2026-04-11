import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from typing import List

# Import your security keys so we can verify the token
from app.core.security import SECRET_KEY, ALGORITHM

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
            except Exception:
                pass # Ignore dropped connections

manager = ConnectionManager()

@router.websocket("/ws/queue")
async def queue_endpoint(websocket: WebSocket):
    # --- 🚨 SECURITY CHECK: INTERCEPT HANDSHAKE 🚨 ---
    
    # 1. Look for the HttpOnly secure cookie
    token = websocket.cookies.get("access_token")
    
    if not token:
        # Reject: Unauthenticated
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    # 2. Strip the "Bearer " prefix
    scheme, _, param = token.partition(" ")
    if scheme.lower() != "bearer":
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    # 3. Cryptographically verify the JWT token
    try:
        payload = jwt.decode(param, SECRET_KEY, algorithms=[ALGORITHM])
        # We now securely know who this is! 
        # user_email = payload.get("sub")
        # user_role = payload.get("role")
    except jwt.ExpiredSignatureError:
        # Reject: Session expired
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    except jwt.PyJWTError:
        # Reject: Token was tampered with
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # --- ✅ CONNECTION APPROVED ✅ ---
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive
            data = await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(websocket)