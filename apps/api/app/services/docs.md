# ⑤ Services

Capa de lógica de negocio. Cada servicio orquesta repositorios y eventos.

## Servicios

| Servicio              | Archivo           | Responsabilidad                        |
|-----------------------|-------------------|----------------------------------------|
| `AuthService`         | `auth.py`         | Login · registro · refresh token       |
| `DistribuidorService` | `distribuidor.py` | Perfil · catálogo · valoraciones       |
| `ProductoService`     | `producto.py`     | CRUD · stock · búsqueda               |
| `ClienteService`      | `cliente.py`      | Perfil · direcciones · carrito         |
| `PedidoService`       | `pedido.py`       | Crear orden · estados · rechazar       |
| `EntregaService`      | `entrega.py`      | Estado entrega · confirmación          |

## Convención

- Cada servicio recibe un `AsyncSession` en el constructor.
- Los servicios usan repositorios para acceso a datos.
- Los servicios publican eventos vía `EventBus`.
