# Models (Aggregates)

Aggregates del dominio representados como dataclasses puros.
Usan herencia class table para reflejar el esquema de Supabase PostgreSQL.

## Aggregates

| Aggregate  | Archivo       | Tablas              | Descripción                                  |
|------------|---------------|---------------------|----------------------------------------------|
| `Cliente`  | `cliente.py`  | `usuario` + `cliente`| Aggregate root — registro y perfil de cliente |

## Entidades base

| Entidad    | Archivo       | Tabla         | Descripción                          |
|------------|---------------|---------------|--------------------------------------|
| `Usuario`  | `usuario.py`  | `usuario`     | Entidad base — nombre, email, tipo   |

## Notas

- `Aggregate` ABC se define en `base.py` con factory method `crear()` y `to_dict()`
- El enum `TipoUsuario` refleja el tipo PostgreSQL `tipo_usuario`
- `Usuario` es abstracto — se usa vía herencia (Cliente, Distribuidor)
