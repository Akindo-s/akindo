"""
Módulo de hashing — encapsula la lógica de hash de contraseñas.
Usa bcrypt como algoritmo de hashing.
"""

import bcrypt


class Hasher:
    """Utilidad para hashear y verificar contraseñas con bcrypt."""

    @staticmethod
    def hash(password: str) -> str:
        """Genera un hash bcrypt a partir de una contraseña en texto plano."""
        return bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    @staticmethod
    def verificar(password: str, hashed: str) -> bool:
        """Verifica que una contraseña coincida con su hash."""
        return bcrypt.checkpw(
            password.encode("utf-8"), hashed.encode("utf-8")
        )
