# ⑧ Schemas (Pydantic)

Modelos Pydantic para validación de request/response en la API.

## Schemas

| Archivo           | Schema(s)           | Dominio         |
|-------------------|---------------------|-----------------|
| `auth.py`         | `AuthSchema`        | Autenticación   |
| `distribuidor.py` | `DistribuidorSchema`| Distribuidores  |
| `producto.py`     | `ProductoSchema`    | Productos       |
| `cliente.py`      | `ClienteSchema`     | Clientes        |
| `direccion.py`    | `DireccionSchema`   | Direcciones     |
| `pedido.py`       | `PedidoSchema`      | Pedidos         |
| `entrega.py`      | `EntregaSchema`     | Entregas        |
| `valoracion.py`   | `ValoracionSchema`  | Valoraciones    |
| `carrito.py`      | `CarritoSchema`     | Carrito         |
| `event.py`        | `EventSchema`       | Eventos         |

## Convención

- Cada archivo puede contener múltiples schemas: `*Create`, `*Update`, `*Response`.
- Se usa `BaseModel` de Pydantic v2.
