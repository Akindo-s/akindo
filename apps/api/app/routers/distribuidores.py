"""
Distribuidores router — /distribuidores/*
"""

from fastapi import APIRouter

router = APIRouter(prefix="/distribuidores", tags=["Distribuidores"])


@router.get("/")
async def listar_distribuidores():
    pass


@router.get("/{distribuidor_id}")
async def get_distribuidor(distribuidor_id: str):
    pass


@router.get("/{distribuidor_id}/catalogo")
async def get_catalogo(distribuidor_id: str):
    pass


@router.get("/{distribuidor_id}/valoraciones")
async def get_valoraciones(distribuidor_id: str):
    pass
