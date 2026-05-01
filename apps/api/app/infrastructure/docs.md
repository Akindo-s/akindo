# ⑨ Infrastructure adapters

Adaptadores que conectan la aplicación con sistemas externos.

## Componentes

| Componente        | Archivo        | Descripción                                  |
|-------------------|----------------|----------------------------------------------|
| `DatabaseSession` | `database.py`  | Interfaz abstracta para sesiones de BD       |
| `SupabaseDb`      | `database.py`  | Implementación async usando supabase-py      |
| `StorageAdapter`  | `storage.py`   | Cliente para Supabase Storage (imágenes)     |
| `JWTProvider`     | `jwt.py`       | Firma y validación de tokens JWT             |
| `WSManager`       | `websocket.py` | Pool de conexiones WebSocket (aun sin utilizar) 
