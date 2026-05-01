"""
Productos router — /productos/*
"""

from fastapi import APIRouter

router = APIRouter(prefix="/productos", tags=["Productos"])


@router.get("/")
async def listar_productos():
    pass


@router.get("/{producto_id}")
async def get_producto(producto_id: str):
    pass


@router.post("/")
async def crear_producto():
    pass


@router.put("/{producto_id}")
async def actualizar_producto(producto_id: str):
    pass


@router.delete("/{producto_id}")
async def eliminar_producto(producto_id: str):
    pass
