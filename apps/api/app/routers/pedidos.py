"""
Pedidos router — /pedidos/*
"""

from fastapi import APIRouter

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


@router.post("/")
async def crear_orden():
    pass


@router.get("/{pedido_id}")
async def get_pedido(pedido_id: str):
    pass


@router.patch("/{pedido_id}/aceptar")
async def aceptar_orden(pedido_id: str):
    pass


@router.patch("/{pedido_id}/rechazar")
async def rechazar_orden(pedido_id: str):
    pass


@router.patch("/{pedido_id}/estado")
async def actualizar_estado(pedido_id: str):
    pass
