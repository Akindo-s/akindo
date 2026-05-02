"""
AuthMiddleware — ASGI middleware que extrae el JWT del header Authorization
y lo convierte en contexto de usuario disponible en request.state.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class AuthMiddleware(BaseHTTPMiddleware):
    """Intercepta cada request, valida el token JWT y adjunta el usuario."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # TODO: extraer token de Authorization header
        # TODO: validar con JWTProvider
        # TODO: adjuntar usuario a request.state.user
        response = await call_next(request)
        return response
