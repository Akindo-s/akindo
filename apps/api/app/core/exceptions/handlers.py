"""
GlobalExceptionHandler — @app.exception_handler
Captura las excepciones de dominio y las convierte en respuestas JSON.
"""

import logging

from fastapi import Request
from fastapi.responses import JSONResponse

from .base import AkindoBaseException

logger = logging.getLogger("akindo.exceptions")


async def global_exception_handler(
    request: Request, exc: AkindoBaseException
) -> JSONResponse:
    """Traduce AkindoBaseException (y derivadas) a respuesta HTTP."""
    logger.warning(
        "%s %s → %d: %s",
        request.method,
        request.url.path,
        exc.status_code,
        exc.detail,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
