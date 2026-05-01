"""
JWTProvider — firma y validación de tokens JWT.
"""


class JWTProvider:
    """Proveedor de tokens JWT."""

    def create_access_token(self, data: dict) -> str:
        """Genera un token de acceso firmado."""
        pass

    def create_refresh_token(self, data: dict) -> str:
        """Genera un token de refresco."""
        pass

    def verify_token(self, token: str) -> dict:
        """Valida un token y retorna su payload."""
        pass
