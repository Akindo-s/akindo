# Contexto de sesión actual (2026-09-11)

Migración de `apps/web` a `packages/ui` para que web (Next) y `apps/mobile` (Expo) compartan UI. Branch `mobile-dev`. **El estado completo, las reglas aprendidas y los pendientes están en [`migracion-progreso.md`](./migracion-progreso.md)**; este archivo solo resume dónde quedó la última sesión. Cómo se protegen las rutas: [`RUTAS-PROTEGIDAS.md`](./RUTAS-PROTEGIDAS.md).

## Terminado (ya commiteado por el usuario)

Todo `(auth)`, todo `(public)`, y de `(protected)` el layout del grupo y `carrito`.

## Terminado antes en esta sesión: `(protected)/perfil`

- Compartido: `packages/ui/screens/perfil.tsx` (el perfil del cliente) más `components/ui/{Avatar,Badge,CampoEditable,ItemMenu}.tsx`.
- Las siete acciones con sesión se inyectan (perfil, imagen, las cuatro de direcciones y `onLogout`). En mobile, un distribuidor se redirige a su tienda desde la propia ruta, como hace el `page.tsx` en web.
- `useSWR` se reemplazó por estado propio (solo se usaba por su `mutate`) y el `confirm()` del borrado por el par de plataforma nuevo `@akindo/ui/confirmar` (`window.confirm` / `Alert.alert`).
- Si la API rechaza el token, la pantalla ya no se queda en "Cargando perfil…": muestra el aviso con "Volver a intentar" y "Cerrar sesión".
- El `BottomNav` del grupo protegido quedó sin `hrefsVisibles`, igual que el público después de tu cambio.

## Arreglo de la foto de perfil en mobile (después de tu prueba)

Eran dos cosas encadenadas:
1. **"Unsupported FormDataPart implementation"**: el `fetch` global de Expo arma el multipart en JS y no acepta el `{ uri, name, type }` del `FormData` de React Native. Ahora `archivoDeImagen` devuelve el `File` de **expo-file-system** (nueva dependencia en `packages/ui` y `apps/mobile`; Expo Go ya lo trae), que tiene `bytes()`, `name` y `type`.
2. Con eso el request ya llegaba, pero la API respondía **422: "Tipo de archivo no permitido: image/heic"**, porque la fototeca de iOS entrega HEIC. `elegirImagen` ahora pide `preferredAssetRepresentationMode: Compatible` (el selector entrega JPEG) y `quality: 0.8` (una foto de teléfono se pasa del límite de 5 MB de la API).

Probado en el simulador: la subida responde 200 con la URL de Supabase y la foto sigue ahí al recargar la pantalla. **Tu foto de perfil quedó con una de las fotos de muestra del simulador** (una cascada): la cambié al probar, cámbiala cuando quieras.

Además, si la subida falla, el `Avatar` vuelve a la foto anterior y el perfil muestra un aviso, en vez de fallar en silencio.

## Para probar antes de commitear

Comparado con la vista vieja a 375 y 1280 con datos falsos, y probado en el simulador con tu sesión real (perfil, direcciones, formulario nuevo y cancelar). **No** probé borrar una dirección ni "Cerrar sesión", para no tocar tu cuenta.

**Ojo**: con las cuatro tabs visibles, "Pedidos" todavía no existe en mobile y cae en la pantalla "Unmatched Route" de expo-router.

## Terminado antes en esta sesión: `(protected)/pedidos`

- Compartido: `packages/ui/screens/pedidos.tsx`. Web sigue cargando los datos en el servidor y los pasa en una prop `datos`; mobile pasa `null` y un `cargarDatos` (`cargarPedidos`).
- Con esto las cuatro tabs del BottomNav ya funcionan en mobile.
- Las pestañas Activos/Entregados/Cancelados tuvieron que quedar con className fijo y los colores por `style`: cambiar clases en un componente que tiene un `hover:` hacía reventar la app en nativo (regla 50). El único costo es que la pastilla activa mide 2px más de ancho que en web.
- Ojo: la lista enlaza a `/pedidos/ordenes` y a `/pedidos/<id>`, que todavía no existen en mobile (caen en "Unmatched Route"). Y un distribuidor se sigue redirigiendo a `/distribuidor/pedidos`, también sin migrar.

## Terminado en esta tanda: `(protected)/distribuidor/pedidos`

- Compartido: `packages/ui/screens/distribuidor-pedidos.tsx`, con el modal para actualizar el estado.
- El `<select>` del modal se reemplazó por un desplegable propio (React Native no tiene select), con la misma caja.
- Probado con tu sesión de distribuidor en el simulador, incluida **una actualización real**: el pedido `#9e84ca5d` de `testuser` pasó de "pendiente de envío" a "en envío" (era la transición normal hacia adelante; no toqué "Cancelar Pedido").

## Terminado en esta tanda: `(protected)/pedidos/ordenes`

- Compartido: `packages/ui/screens/ordenes.tsx` (junta el encabezado del `page.tsx` y el viejo `MisOrdenesCompra`) más `components/ui/ModalConfirmacion.tsx`, que ahora también es compartido.
- `cancelarOrden` se inyecta por prop. Al cancelar bien, en vez del `router.refresh()` del original la pantalla marca la orden como `cancelada`.
- El modal tuvo que subir al nivel de la pantalla: dentro de la tarjeta quedaba **debajo** de las tarjetas siguientes en web (cada View de react-native-web es un contexto de apilamiento) y en nativo habría tapado solo la tarjeta (regla 54).
- Dos diferencias de medida encontradas y corregidas: las alturas de una fila de tarjetas no se igualan solas como en un grid (`flex-1`, regla 55) y `tracking-wide` a 10px es 0.25px, no 0.5 (partía "Total de la orden" en dos líneas, regla 56).
- Probado en el simulador con datos falsos (tarjetas, desplegar productos, modal y error) y después con la sesión real de cliente: 9 órdenes pendientes y 4 aceptadas, con imágenes reales. No se canceló ninguna orden de verdad.
- **Arreglo que salió al probar**: la tarjeta "Órdenes de Compra" de `screens/pedidos.tsx` no respondía al toque en el teléfono y al tocarla reventaba la app. El `hover:` del original estaba en la `Tarjeta`, que es hija del `Link`: nativewind le engancha el gesto al hijo y el Link nunca lo recibe (regla 57). Ahora el hover va por el `onHoverChange` del Link. De paso se corrigieron los cuatro `tracking-*` de esa pantalla (regla 56).

## Terminado en esta tanda: `(protected)/pedidos/[pedidoId]` (solo la vista del cliente)

- Compartido: `packages/ui/screens/pedido-detalle.tsx`, más `components/pedidos/{ListaProductosPedido,HistorialActualizacionesPedido}.tsx`, que también usan las dos vistas del distribuidor.
- El `page.tsx` de web sigue eligiendo por tipo de usuario: un distribuidor ve `DetallePedidoDistView`, **todavía sin migrar**.
- El detalle de orden de compra no se hizo: en web solo existe del lado del distribuidor (`/distribuidor/ordenes/[ordenId]`, con aceptar/rechazar). Queda para la tanda del distribuidor (decisión del usuario).
- Probado en el simulador con la sesión de cliente: pedido en proceso, entregado con valoración y entregado sin valorar (el formulario y las estrellas). **No se envió ninguna valoración.**

## Sesiones para probar

Cuando una ruta necesite sesión de cliente o de distribuidor, paro y te aviso para que la cambies a mano en el simulador. No escribo contraseñas en los formularios.

## Siguiente

El lado del distribuidor: `DetallePedidoDistView` (la otra mitad de `pedidos/[pedidoId]`) y `distribuidor/ordenes` con su detalle. Después `carrito/preorden`, `admin/categorias` y el resto del distribuidor.
