import logging
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from typing import Dict, List, Any
import asyncio

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Dictionary mapping channel to a list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {
            "dashboard": [],
            "alerts": [],
            "signals": []
        }
    
    async def connect(self, client_id: str, channel: str, websocket: WebSocket):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
        logger.info(f"Client {client_id} connected to {channel}")

    async def disconnect(self, client_id: str, channel: str, websocket: WebSocket):
        if channel in self.active_connections and websocket in self.active_connections[channel]:
            self.active_connections[channel].remove(websocket)
            logger.info(f"Client {client_id} disconnected from {channel}")

    async def broadcast(self, channel: str, message: dict):
        if channel in self.active_connections:
            # Create a copy to avoid issues if connections drop during iteration
            for connection in list(self.active_connections[channel]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {channel}: {e}")
                    # In a real app we might remove the dead connection here

    async def send_personal(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

manager = ConnectionManager()
router = APIRouter()

async def validate_ws_token(token: str):
    """Stub for JWT token validation."""
    if not token or token == "invalid":
        return None
    return "user_id_123"

@router.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket, token: str = Query(...)):
    user_id = await validate_ws_token(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    await manager.connect(user_id, "dashboard", websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await manager.disconnect(user_id, "dashboard", websocket)

@router.websocket("/ws/camera/{camera_id}")
async def websocket_camera(websocket: WebSocket, camera_id: int, token: str = Query(...)):
    user_id = await validate_ws_token(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    channel = f"camera:{camera_id}"
    await manager.connect(user_id, channel, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await manager.disconnect(user_id, channel, websocket)

@router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket, token: str = Query(...)):
    user_id = await validate_ws_token(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    await manager.connect(user_id, "alerts", websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await manager.disconnect(user_id, "alerts", websocket)

@router.websocket("/ws/signals")
async def websocket_signals(websocket: WebSocket, token: str = Query(...)):
    user_id = await validate_ws_token(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    await manager.connect(user_id, "signals", websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await manager.disconnect(user_id, "signals", websocket)
