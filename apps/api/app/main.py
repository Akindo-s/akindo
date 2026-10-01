"""
① Punto de entrada — FastAPI app.
Registra routers, middleware y exception handlers.
"""

import time 

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.exceptions.base import AkindoBaseException
from app.core.exceptions.handlers import global_exception_handler
import traceback
from fastapi.responses import JSONResponse, Response
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
from app.events.pedido_suscriptores import (
    RegistrarOrdenCreada,
    NotificarOrdenAceptada,
    NotificarOrdenRechazada,
    RegistrarPedidoCreado,
    RegistrarActualizacionPedido,
    SolicitarValoracionPedido,
)
from app.infrastructure.database import DatabaseSession, get_db
from app.routers import auth, clientes, distribuidores, pedidos, productos, usuarios, categorias, carrito, entregas
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
        "https://akindo-preview.vercel.app",
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
app.include_router(categorias.router)
app.include_router(carrito.router)
app.include_router(entregas.router)

# ── Suscriptores de eventos ────────────────────────────────────────
event_bus.subscribe("cliente.registrado", EventoEnviarMensajeBienvenidaCliente())
event_bus.subscribe("cliente.inicio_sesion", RegistrarUltimoAccesoCliente())
event_bus.subscribe("cliente.perfil_consultado", RegistrarConsultaPerfil())
event_bus.subscribe("cliente.perfil_actualizado", NotificarCambioPerfilCliente())
event_bus.subscribe("cliente.imagen_perfil_subida", RegistrarCambioImagenPerfil())
event_bus.subscribe("distribuidor.registrado", EventoEnviarMensajeBienvenidaDistribuidor())
event_bus.subscribe("usuario.imagen_subida", UsuarioImagenSubidaSuscriptor())

# Órdenes y pedidos
event_bus.subscribe("orden_pedido.creada", RegistrarOrdenCreada())
event_bus.subscribe("orden_pedido.aceptada", NotificarOrdenAceptada())
event_bus.subscribe("orden_pedido.rechazada", NotificarOrdenRechazada())
event_bus.subscribe("pedido.creado", RegistrarPedidoCreado())
event_bus.subscribe("pedido.actualizado", RegistrarActualizacionPedido())
event_bus.subscribe("pedido.finalizado", SolicitarValoracionPedido())

# ── Health check ───────────────────────────────────────────────────
_last_check = 0.0
_last_ok = False
CACHE_SECONDS = 60

@app.get("/health")
async def health(response: Response, db: DatabaseSession = Depends(get_db)):
    global _last_check, _last_ok
    now = time.monotonic()
    if now - _last_check > CACHE_SECONDS:
        try:
            # una sola columna, una sola fila
            await db.select("cliente", columns="id", limit=1)
            _last_ok = True
        except Exception:
            _last_ok = False
        _last_check = now
    if not _last_ok:
        response.status_code = 503
    return {"status": "ok" if _last_ok else "db_unreachable"}