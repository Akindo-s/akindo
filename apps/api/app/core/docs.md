# ② Cross-cutting concerns

Componentes transversales que aplican a todas las peticiones HTTP.

## Componentes

| Componente              | Archivo                  | Descripción                                      |
|-------------------------|--------------------------|--------------------------------------------------|
| `AuthMiddleware`        | `middleware/auth.py`     | ASGI middleware — extrae JWT y lo convierte en contexto de usuario |
| `RequestLogger`         | `middleware/logging.py`  | Trazabilidad de cada request (método, path, duración) |
| `GlobalExceptionHandler`| `exceptions/handlers.py` | Captura excepciones de dominio y las traduce a respuestas HTTP |
| Excepciones de dominio  | `exceptions/base.py`     | Jerarquía: `AkindoBaseException` → `NotFoundException`, `UnauthorizedException`, `ConflictException` |
| `Config`                | `config.py`              | Settings centralizados con pydantic-settings |
