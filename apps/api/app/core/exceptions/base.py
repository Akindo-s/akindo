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


class ValidationException(AkindoBaseException):
    """Datos de entrada inválidos por lógica de dominio — HTTP 422."""

    def __init__(self, detail: str = "Datos inválidos"):
        super().__init__(detail=detail, status_code=422)


class ForbiddenException(AkindoBaseException):
    """El usuario autenticado no tiene permisos — HTTP 403."""

    def __init__(self, detail: str = "Acceso denegado"):
        super().__init__(detail=detail, status_code=403)


class TokenExpiredException(AkindoBaseException):
    """El JWT ha expirado — HTTP 401."""

    def __init__(self, detail: str = "Token expirado"):
        super().__init__(detail=detail, status_code=401)


class InvalidTokenException(AkindoBaseException):
    """El JWT es inválido, malformado o la firma no coincide — HTTP 401."""

    def __init__(self, detail: str = "Token inválido"):
        super().__init__(detail=detail, status_code=401)


class StorageException(AkindoBaseException):
    """Error al interactuar con Supabase Storage — HTTP 502."""

    def __init__(self, detail: str = "Error en el servicio de almacenamiento"):
        super().__init__(detail=detail, status_code=502)


class DatabaseException(AkindoBaseException):
    """Error de comunicación con la base de datos — HTTP 503."""

    def __init__(self, detail: str = "Error en el servicio de base de datos"):
        super().__init__(detail=detail, status_code=503)
