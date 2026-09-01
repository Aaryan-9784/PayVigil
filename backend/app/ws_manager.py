import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("revenue_recovery.ws_manager")

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, data: Dict[str, Any]):
        """
        Broadcast an event to all connected WebSocket clients.
        Payload structure:
        {
            "type": event_type,
            "data": data,
            "timestamp": ISO-string
        }
        """
        if not self.active_connections:
            return

        import datetime
        message = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        # Convert to JSON string
        try:
            payload = json.dumps(message)
        except Exception as e:
            logger.error(f"Failed to serialize WebSocket message: {e}")
            return

        disconnected_clients = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception as exc:
                logger.warning(f"Error sending message to WebSocket client: {exc}")
                disconnected_clients.append(connection)

        for dead_conn in disconnected_clients:
            self.disconnect(dead_conn)

ws_manager = WebSocketManager()
