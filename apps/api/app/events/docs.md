# ⑥ Event-driven layer

Sistema de eventos in-process con patrón pub/sub.

## Arquitectura

- **Evento (ABC)** — interfaz genérica que todo evento debe implementar (`base.py`)
- **Suscriptor (ABC)** — interfaz genérica que todo handler de evento debe implementar (`base.py`)
- **EventBus** — publica eventos y despacha a los suscriptores registrados (`bus.py`)

## Eventos

Cada archivo `.py` (excepto `base.py` y `bus.py`) representa **un tipo de evento**
junto con sus suscriptores.

| Archivo                  | Evento              | Suscriptores                              |
|--------------------------|---------------------|-------------------------------------------|
| `cliente_registrado.py`  | `ClienteRegistrado` | `EventoEnviarMensajeBienvenidaCliente`    |
| `pedido_creado.py`       | `PedidoCreado`      | _(stub)_                                  |
| `pedido_confirmado.py`   | `PedidoConfirmado`  | _(stub)_                                  |
