"""
① Punto de entrada — FastAPI app.
Registra routers, middleware y exception handlers.
"""

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.exceptions.base import AkindoBaseException
from app.core.exceptions.handlers import global_exception_handler
import traceback
from fastapi.responses import JSONResponse
from fastapi import Request
from app.core.middleware.auth import AuthMiddleware
from app.core.middleware.logging import RequestLogger
from app.events.bus import event_bus
from app.events.cliente_registrado import EventoEnviarMensajeBienvenidaCliente
from app.events.cliente_sesion import RegistrarUltimoAccesoCliente
from app.events.cliente_perfil import (
    RegistrarConsultaPerfil,
    NotificarCambioPerfilCliente,
    RegistrarCambioImagenPerfil,
)
from app.events.distribuidor_registrado import EventoEnviarMensajeBienvenidaDistribuidor
from app.events.usuario_imagen import UsuarioImagenSubidaSuscriptor
from app.infrastructure.database import DatabaseSession, get_db
from app.routers import auth, clientes, distribuidores, pedidos, productos, usuarios
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s  %(name)s — %(message)s"
)
# ── App ────────────────────────────────────────────────────────────
app = FastAPI(title="Akindo API")

@app.exception_handler(Exception)
async def catch_all(request: Request, exc: Exception):
    print("UNHANDLED EXCEPTION:")
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": 'error del sistema, intente de nuevo'}) 

# ── CORS ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://akindo.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Middleware (cross-cutting) ─────────────────────────────────────
app.add_middleware(RequestLogger)
app.add_middleware(AuthMiddleware)

# ── Exception handlers ─────────────────────────────────────────────
app.add_exception_handler(AkindoBaseException, global_exception_handler)

# ── Routers ────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(distribuidores.router)
app.include_router(productos.router)
app.include_router(clientes.router)
app.include_router(pedidos.router)
app.include_router(usuarios.router)

# ── Suscriptores de eventos ────────────────────────────────────────
event_bus.subscribe("cliente.registrado", EventoEnviarMensajeBienvenidaCliente())
event_bus.subscribe("cliente.inicio_sesion", RegistrarUltimoAccesoCliente())
event_bus.subscribe("cliente.perfil_consultado", RegistrarConsultaPerfil())
event_bus.subscribe("cliente.perfil_actualizado", NotificarCambioPerfilCliente())
event_bus.subscribe("cliente.imagen_perfil_subida", RegistrarCambioImagenPerfil())
event_bus.subscribe("distribuidor.registrado", EventoEnviarMensajeBienvenidaDistribuidor())
event_bus.subscribe("usuario.imagen_subida", UsuarioImagenSubidaSuscriptor())

# ── Health check ───────────────────────────────────────────────────
@app.get("/health")
async def health_check(db: DatabaseSession = Depends(get_db)):
    """Verifica que la API y la conexión a Supabase funcionan correctamente."""
    try:
        clientes = await db.select("cliente")
        return {
            "status": "ok",
            "db_connection": "ok",
            "clientes_count": len(clientes),
        }
    except Exception as e:
        return {
            "status": "error",
            "db_connection": "error",
            "detail": str(e),
        }