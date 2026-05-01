"""
GlobalExceptionHandler — @app.exception_handler
Captura las excepciones de dominio y las convierte en respuestas JSON.
"""

from fastapi import Request
from fastapi.responses import JSONResponse

from .base import AkindoBaseException


async def global_exception_handler(
    request: Request, exc: AkindoBaseException
) -> JSONResponse:
    """Traduce AkindoBaseException (y derivadas) a respuesta HTTP."""
    print("something")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail,'algo':'ahdgaidjhhadjkhas'},
    )
