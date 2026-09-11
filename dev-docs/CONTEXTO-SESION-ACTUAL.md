# Contexto de sesión actual (2026-09-11)

Migración de `apps/web` a `packages/ui` para que web (Next) y `apps/mobile` (Expo) compartan UI. Branch `mobile-dev`. **El estado completo, las reglas aprendidas y los pendientes están en [`migracion-progreso.md`](./migracion-progreso.md)**; este archivo solo resume dónde quedó la última sesión.

## Terminado (ya commiteado por el usuario)

Registro, home `(public)/`, scroll de web solo en el `<main>`, `(public)/mercado` y sus cuatro subrutas (productos, detalle, distribuidores, categorías).

## Terminado en esta tanda: `mercado/distribuidor/tienda`

Con esto queda cerrado todo el grupo `(public)`.

- Compartido: `packages/ui/screens/tienda.tsx` (perfil, aviso de no verificado, "Acerca de" editable y catálogo con scroll infinito).
- Lo público va directo al núcleo; las cuatro acciones con sesión entran por prop: `esDistribuidorDueno`, `actualizarImagenNegocio`, `actualizarImagenPerfil` y `actualizarPerfilDistribuidor` (web: server actions; mobile: loaders nuevos en `utils/providers-data.ts`).
- `@akindo/ui/image-picker` ahora también exporta `archivoDeImagen(uri)`: `File` en web, `{ uri, name, type }` en nativo.
- En vez de `window.location.reload()`, después de subir una imagen o guardar la descripción se vuelve a pedir el perfil.
- Arreglos en piezas compartidas: el `Boton` resuelve sus clases con twMerge (antes el mismo botón salía de ancho completo en nativo) y la variante `secundario` recupera los 16px del original; el botón de volver del `HeaderSticky` lleva `z-10` (en nativo no recibía el toque, también en el detalle de producto).

## Para probar antes de commitear

Probada en web (medidas a 375 y 1280 contra una copia de la página vieja, incluido el modo dueño forzado) y en el simulador de iOS. Lo único sin disparar es el scroll infinito del catálogo: ningún distribuidor de la base local pasa de 12 productos. Sigue pendiente agregar al carrito con una sesión real.

## Siguiente

`(protected)`: carrito, pedidos, perfil y el lado del distribuidor. Confirmar con el usuario por dónde empezar.
