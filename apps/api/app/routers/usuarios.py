"""
Usuarios router — /usuarios/*

Endpoints:
  PUT /usuarios/me/imagen-perfil  → Subir imagen de perfil (autenticado)
"""

from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File

from app.core.dependencies import get_current_user
from app.infrastructure.database import DatabaseSession, get_db
from app.infrastructure.storage import StorageAdapter, get_storage
from app.models.usuario import Usuario
from app.schemas.cliente import ImagenPerfilResponse
from app.services.usuario import UsuarioService

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.put(
    "/me/imagen-perfil",
    response_model=ImagenPerfilResponse,
    summary="Subir imagen de perfil",
)
async def subir_imagen_perfil(
    file: UploadFile = File(...),
    user: Usuario = Depends(get_current_user),
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage),
):
    """
    Sube o reemplaza la imagen de perfil del usuario autenticado.

    - Para clientes: sube a 'avatars' y actualiza imagen_perfil.
    - Para distribuidores: sube a 'negocios' y actualiza imagen_fondo.
    - Acepta: JPEG, PNG, WebP.
    - Tamaño máximo: 5 MB.
    """
    file_data = await file.read()
    service = UsuarioService(db, storage)
    return await service.subir_imagen_perfil(
        usuario_id=user.id,
        file_data=file_data,
        content_type=file.content_type or "image/jpeg",
        filename=file.filename or "avatar",
    )