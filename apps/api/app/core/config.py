"""
Configuración centralizada de la aplicación.
Lee variables de entorno desde .env usando pydantic-settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Supabase ───────────────────────────────────────────────────
    SUPABASE_URL: str   # https://<project-ref>.supabase.co
    SUPABASE_KEY: str   # service-role key

    # ── Seguridad ──────────────────────────────────────────────────
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
