"""
WSManager — pool de conexiones WebSocket.
Gestiona las conexiones activas para enviar notificaciones en tiempo real.
"""

from fastapi import WebSocket


class WSManager:
    """Administrador de conexiones WebSocket."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Acepta y registra una nueva conexión."""
        pass

    async def disconnect(self, websocket: WebSocket) -> None:
        """Elimina una conexión del pool."""
        pass

    async def broadcast(self, message: dict) -> None:
        """Envía un mensaje a todas las conexiones activas."""
        pass

    async def send_to(self, user_id: str, message: dict) -> None:
        """Envía un mensaje a un usuario específico."""
        pass
