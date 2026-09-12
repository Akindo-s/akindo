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

## Sesiones para probar

Cuando una ruta necesite sesión de cliente o de distribuidor, paro y te aviso para que la cambies a mano en el simulador. No escribo contraseñas en los formularios.

## Siguiente

Las dos subrutas de pedidos (`ordenes` y el detalle), que son los links que hoy no llevan a ninguna parte en mobile — y que sirven para las dos sesiones. Después `carrito/preorden`, `admin/categorias` y el resto del lado del distribuidor.
