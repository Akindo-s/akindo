# ④ Routers HTTP

Endpoints de la API organizados por dominio.

## Routers

| Router          | Archivo             | Prefijo             | Servicio asociado      |
|-----------------|---------------------|---------------------|------------------------|
| Auth router     | `auth.py`           | `/auth`             | `AuthService`          |
| Dist. router    | `distribuidores.py` | `/distribuidores`   | `DistribuidorService`  |
| Prod. router    | `productos.py`      | `/productos`        | `ProductoService`      |
| Cli. router     | `clientes.py`       | `/clientes`         | `ClienteService`       |
| Ped. router     | `pedidos.py`        | `/pedidos`          | `PedidoService`        |

## Convención

- Cada router define sus endpoints y delega la lógica al servicio correspondiente.
- La sesión de base de datos se inyecta vía `Depends(get_db)`.
