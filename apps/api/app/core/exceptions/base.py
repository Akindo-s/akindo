"""
③ Excepciones de dominio — domain/exceptions.py

Jerarquía de excepciones propias de Akindo.
El GlobalExceptionHandler las captura y las traduce a respuestas HTTP.
"""


class AkindoBaseException(Exception):
    """Excepción base de la aplicación."""

    def __init__(self, detail: str = "Error interno", status_code: int = 500):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class NotFoundException(AkindoBaseException):
    """Recurso no encontrado — HTTP 404."""

    def __init__(self, detail: str = "Recurso no encontrado"):
        super().__init__(detail=detail, status_code=404)


class UnauthorizedException(AkindoBaseException):
    """No autorizado — HTTP 401."""

    def __init__(self, detail: str = "No autorizado"):
        super().__init__(detail=detail, status_code=401)


class ConflictException(AkindoBaseException):
    """Conflicto de datos — HTTP 409."""

    def __init__(self, detail: str = "Conflicto"):
        super().__init__(detail=detail, status_code=409)
