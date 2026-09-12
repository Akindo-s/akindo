# Contexto de sesión actual (2026-09-11)

Migración de `apps/web` a `packages/ui` para que web (Next) y `apps/mobile` (Expo) compartan UI. Branch `mobile-dev`. **El estado completo, las reglas aprendidas y los pendientes están en [`migracion-progreso.md`](./migracion-progreso.md)**; este archivo solo resume dónde quedó la última sesión. Cómo se protegen las rutas: [`RUTAS-PROTEGIDAS.md`](./RUTAS-PROTEGIDAS.md).

## Terminado (ya commiteado por el usuario)

Todo `(auth)`, todo `(public)`, y de `(protected)` el layout del grupo y `carrito`.

## Terminado en esta tanda: `(protected)/perfil`

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

## Siguiente

`pedidos`, por lo de la tab. Después quedan `carrito/preorden`, `admin/categorias` y el lado del distribuidor.
