# ⑦ Repositories

Capa de acceso a datos. Todos los repositorios concretos heredan de `BaseRepository[T]`.

## Patrón

```
BaseRepository[T]  (abstract — get, get_all, save, delete)
    ├── UsuarioRepo
    ├── ProductoRepo
    ├── PedidoRepo
    ├── CarritoRepo
    ├── DireccionRepo
    ├── ValoracionRepo
    ├── PaqueteRepo
    └── ClienteRepo
```

## Convención

- Cada repo recibe un `AsyncSession` en el constructor.
- Los métodos base están en `base.py` como abstractos.
- Los repos concretos añaden métodos específicos de dominio (ej. `get_by_email`).
