"""
Esquemas Pydantic para el dominio de categorías.
"""

import uuid
from pydantic import BaseModel, Field

# --- Request Schemas ---

class CategoriaCreate(BaseModel):
    nombre: str = Field(..., min_length=1, description="Nombre de la categoría")
    imagen: str | None = Field(default=None, description="URL de la imagen de la categoría")

class CategoriaUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, description="Nuevo nombre de la categoría")
    imagen: str | None = Field(default=None, description="Nueva URL de la imagen")

class CategoriaBatchCreate(BaseModel):
    categorias: list[CategoriaCreate] = Field(..., min_length=1, description="Lista de categorías a crear")

# --- Response Schemas ---

class CategoriaResponse(BaseModel):
    id: uuid.UUID
    nombre: str
    imagen: str | None

class CategoriaBatchError(BaseModel):
    nombre: str
    razon: str

class CategoriaBatchResponse(BaseModel):
    categorias: list[CategoriaResponse]
    categorias_fallidas: list[CategoriaBatchError]
