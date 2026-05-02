"""
RequestLogger — middleware de trazabilidad.
Registra método, path, status y duración de cada request.
"""

import time
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("akindo.requests")


class RequestLogger(BaseHTTPMiddleware):
    """Loguea cada petición HTTP entrante."""

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = time.perf_counter() - start
        logger.info(
            "%s %s → %s (%.3fs)",
            request.method,
            request.url.path,
            response.status_code,
            elapsed,
        )
        return response
