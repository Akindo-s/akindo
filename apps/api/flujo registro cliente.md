# Flujo de ejecución: `POST /auth/registro/cliente`

Traza completa de lo que pasa desde que llega el request HTTP hasta que sale la respuesta.

---

## El request

```http
POST /auth/registro/cliente
Content-Type: application/json

{
  "nombre": "Carlos López",
  "email": "carlos@mail.com",
  "password": "miPassword123",
  "telefono": "8112345678"
}
```

---

## Paso a paso

### 1. Uvicorn recibe el request

Uvicorn (el servidor ASGI) recibe la conexión TCP y la pasa a la app FastAPI.

---

### 2. Middleware chain (de afuera hacia adentro)

Los middleware se ejecutan como capas de cebolla. Se registraron en [main.py:33-34](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/main.py#L33-L34):

```
Request → AuthMiddleware → RequestLogger → [Router] → RequestLogger → AuthMiddleware → Response
```

> [!NOTE]
> FastAPI ejecuta los middleware en **orden inverso** al que se registran. `AuthMiddleware` se registró último, así que se ejecuta primero.

**2a.** [AuthMiddleware.dispatch](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/core/middleware/auth.py#L15-L20) — por ahora es un stub (solo pasa al siguiente). Eventualmente extraerá el JWT del header `Authorization`.

**2b.** [RequestLogger.dispatch](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/core/middleware/logging.py#L19-L30) — arranca un timer, pasa al siguiente, y al volver loguea:
```
POST /auth/registro/cliente → 201 (0.045s)
```

---

### 3. FastAPI routing

FastAPI matchea `POST /auth/registro/cliente` con el router registrado en [main.py:40](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/main.py#L40) → llega a la función en [routers/auth.py:22](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/routers/auth.py#L22-L34).

---

### 4. Validación del body (Pydantic)

**Antes** de ejecutar la función, FastAPI toma el JSON del body y lo valida contra [RegistroClienteRequest](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/schemas/auth.py#L12-L17):

```python
class RegistroClienteRequest(BaseModel):
    nombre: str        # ← obligatorio
    email: str         # ← obligatorio
    password: str      # ← obligatorio
    telefono: str | None = None  # ← opcional
```

Si falta `nombre`, `email` o `password` → FastAPI responde automáticamente **422 Unprocessable Entity** sin entrar a tu código.

---

### 5. Dependency Injection — `get_db()`

FastAPI ve `db: AsyncSession = Depends(get_db)` y ejecuta [get_db()](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/infrastructure/database.py#L31-L39):

```python
async def get_db() -> AsyncSession:
    async with async_session() as session:  # ← abre una sesión nueva
        try:
            yield session       # ← la entrega al endpoint
            await session.commit()   # ← si todo sale bien, hace commit
        except Exception:
            await session.rollback()  # ← si hay error, hace rollback
            raise
```

Esto es un **generator dependency**. El `yield` divide la función en dos partes:
- **Antes del yield**: crea la sesión → se la pasa al endpoint
- **Después del yield**: según el resultado, commit o rollback

La sesión viaja por una conexión del **pool** (5 conexiones, máximo 15) al PostgreSQL de Supabase:

```
App ──TCP:6543──▶ aws-0-us-east-1.pooler.supabase.com ──▶ PostgreSQL
```

---

### 6. Se ejecuta el endpoint

[routers/auth.py:33-34](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/routers/auth.py#L33-L34):

```python
service = AuthService(db)                    # crea el servicio con la sesión
return await service.registrar_cliente(data)  # delega toda la lógica
```

---

### 7. AuthService.registrar_cliente()

[services/auth.py:31-83](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/services/auth.py#L31-L83) — aquí está la lógica de negocio:

#### 7a. Constructor — instancia los repos

```python
def __init__(self, db):
    self.usuario_repo = UsuarioRepo(db)  # comparten la misma sesión
    self.cliente_repo = ClienteRepo(db)  # ← misma sesión = misma transacción
```

#### 7b. Verificar email duplicado

```python
existente = await self.usuario_repo.get_by_email(data.email)
```

Esto llama a [UsuarioRepo.get_by_email](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/repositories/usuario.py#L16-L20):

```python
async def get_by_email(self, email: str) -> Usuario | None:
    stmt = select(Usuario).where(Usuario.email == email)
    result = await self.db.execute(stmt)     # ← SQL: SELECT * FROM usuario WHERE email = '...'
    return result.scalar_one_or_none()       # ← retorna Usuario o None
```

````carousel
### ✅ Happy path — email no existe

`get_by_email` retorna `None` → continúa al paso 7c.
<!-- slide -->
### ❌ Error path — email ya existe

`get_by_email` retorna un `Usuario` → lanza excepción:

```python
raise ConflictException("El email ya está registrado")
```

Esto salta directo al [GlobalExceptionHandler](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/core/exceptions/handlers.py#L12-L19) registrado en main.py:37, que responde:

```json
HTTP 409 Conflict
{"detail": "El email ya está registrado"}
```

Y en `get_db()` se ejecuta `session.rollback()` → no se guarda nada.
````

#### 7c. Hashear password (bcrypt)

```python
password_hash = bcrypt.hashpw(
    data.password.encode("utf-8"),  # "miPassword123" → bytes
    bcrypt.gensalt()                # genera un salt aleatorio
).decode("utf-8")                   # → "$2b$12$xKz..." (string de 60 chars)
```

> [!IMPORTANT]
> El password original **nunca** se guarda. Solo el hash. Ni siquiera tú podrías recuperarlo.

#### 7d. Crear registro `usuario`

```python
usuario = Usuario(
    nombre="Carlos López",
    email="carlos@mail.com",
    password_hash="$2b$12$xKz...",
    telefono="8112345678",
    tipo=TipoUsuario.CLIENTE,
)
usuario = await self.usuario_repo.save(usuario)
```

[BaseRepository.save](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/repositories/base.py#L34-L39) hace:

```python
async def save(self, entity):
    self.db.add(entity)       # ← lo marca para insertar
    await self.db.flush()     # ← ejecuta el INSERT ahora (pero NO commit)
    await self.db.refresh(entity)  # ← recarga los campos generados por la DB (id, fecha_creacion)
    return entity
```

SQL que se ejecuta:
```sql
INSERT INTO usuario (nombre, email, password_hash, telefono, tipo)
VALUES ('Carlos López', 'carlos@mail.com', '$2b$12$xKz...', '8112345678', 'cliente')
RETURNING id, es_verificado, fecha_creacion;
```

> [!NOTE]
> `flush()` ejecuta el SQL pero **no hace commit**. Si algo falla después, todo se revierte.

#### 7e. Crear registro `cliente`

```python
cliente = Cliente(usuario_id=usuario.id)  # ← FK apuntando al usuario recién creado
await self.cliente_repo.save(cliente)
```

```sql
INSERT INTO cliente (usuario_id) VALUES ('uuid-del-usuario');
```

#### 7f. Publicar evento

```python
await event_bus.publish(
    ClienteRegistrado(
        usuario_id=usuario.id,
        email="carlos@mail.com",
        nombre_cliente="Carlos López",
    )
)
```

Esto llega al [EventBus.publish](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/events/bus.py#L30-L44):

1. Busca `evento.nombre` → `"cliente.registrado"`
2. Encuentra 1 suscriptor (registrado en [main.py:47](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/main.py#L47))
3. Llama a [EventoEnviarMensajeBienvenidaCliente.handle()](file:///Users/sergiomorquecho/Documents/universidad/3ersemestre/innovatec/akindo/apps/api/app/events/cliente_registrado.py#L33-L35) → `pass` (por ahora)

#### 7g. Retornar respuesta

```python
return RegistroClienteResponse(
    id=usuario.id,
    nombre="Carlos López",
    email="carlos@mail.com",
    telefono="8112345678",
    es_verificado=False,
    fecha_creacion=datetime(2026, 4, 30, ...),
)
```

---

### 8. De regreso — `get_db()` hace commit

Como no hubo excepción, la segunda parte de `get_db()` ejecuta:

```python
await session.commit()  # ← AHORA sí se persisten ambos INSERTs en Supabase
```

Hasta este momento, los datos **no existían** en la base de datos de forma permanente.

---

### 9. FastAPI serializa la respuesta

FastAPI toma el `RegistroClienteResponse` y lo convierte a JSON:

```json
HTTP 201 Created
{
  "id": "a1b2c3d4-...",
  "nombre": "Carlos López",
  "email": "carlos@mail.com",
  "telefono": "8112345678",
  "es_verificado": false,
  "fecha_creacion": "2026-04-30T18:40:00Z"
}
```

---

### 10. Middleware de salida

La respuesta viaja de regreso por los middleware (en orden inverso):

- **RequestLogger** loguea: `POST /auth/registro/cliente → 201 (0.045s)`
- **AuthMiddleware** — pass-through
- **CORS** — agrega headers `Access-Control-Allow-*`

---

## Diagrama resumen

```
                    REQUEST
                       │
                       ▼
              ┌─────────────────┐
              │  AuthMiddleware  │ ← valida JWT (stub por ahora)
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │  RequestLogger   │ ← start timer
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │  Pydantic valid. │ ← valida body → 422 si falla
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │    get_db()      │ ← abre sesión async
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │  AuthService     │
              │  .registrar()    │
              │                  │
              │  ┌─────────────┐ │
              │  │UsuarioRepo  │ │ ← SELECT (email check)
              │  │  .get_email()│ │
              │  └─────────────┘ │
              │        │         │
              │        ▼         │
              │  bcrypt.hashpw() │ ← hashea password
              │        │         │
              │        ▼         │
              │  ┌─────────────┐ │
              │  │UsuarioRepo  │ │ ← INSERT usuario
              │  │  .save()    │ │
              │  └─────────────┘ │
              │        │         │
              │  ┌─────────────┐ │
              │  │ ClienteRepo │ │ ← INSERT cliente
              │  │  .save()    │ │
              │  └─────────────┘ │
              │        │         │
              │  ┌─────────────┐ │
              │  │  EventBus   │ │ ← publish ClienteRegistrado
              │  │  .publish() │ │
              │  └──────┬──────┘ │
              │         ▼        │
              │  ┌─────────────┐ │
              │  │ Bienvenida  │ │ ← handle → pass
              │  │  Handler    │ │
              │  └─────────────┘ │
              └────────┬─────────┘
                       ▼
              ┌─────────────────┐
              │  get_db()        │ ← session.commit()
              │  (after yield)   │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │  RequestLogger   │ ← log: POST → 201 (0.045s)
              └────────┬────────┘
                       ▼
                   RESPONSE
                 201 Created
```
