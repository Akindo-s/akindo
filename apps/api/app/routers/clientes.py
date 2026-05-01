"""
Clientes router — /clientes/*
"""

from fastapi import APIRouter

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("/{cliente_id}")
async def get_perfil(cliente_id: str):
    pass


@router.put("/{cliente_id}")
async def actualizar_perfil(cliente_id: str):
    pass


@router.get("/{cliente_id}/direcciones")
async def get_direcciones(cliente_id: str):
    pass


@router.post("/{cliente_id}/direcciones")
async def agregar_direccion(cliente_id: str):
    pass


@router.get("/{cliente_id}/carrito")
async def get_carrito(cliente_id: str):
    pass
