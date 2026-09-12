# Contexto de sesión actual (2026-09-11)

Migración de `apps/web` a `packages/ui` para que web (Next) y `apps/mobile` (Expo) compartan UI. Branch `mobile-dev`. **El estado completo, las reglas aprendidas y los pendientes están en [`migracion-progreso.md`](./migracion-progreso.md)**; este archivo solo resume dónde quedó la última sesión.

## Terminado (ya commiteado por el usuario)

Todo `(auth)` y todo `(public)`: home, `mercado`, sus cuatro subrutas y `mercado/distribuidor/tienda`.

## Terminado en esta tanda: el layout `(protected)` y `carrito`

- **Layout `(protected)`**: ahora usa el `Header` y el `BottomNav` compartidos, con el mismo armado que el público (solo el `<main>` scrollea; el BottomNav va en el flujo y se oculta desde `md`). Comportamiento común en `packages/shared/src/layoutsBehaviors/protected.ts`. En mobile el grupo es un Stack con `<Redirect href="/login">` cuando no hay sesión, y el `BottomNav` recibe la lista de rutas ya migradas.
- **Carrito**: `packages/ui/screens/carrito.tsx` + `components/carrito/{CarritoItemCard,QuantityStepper}.tsx`, y se movieron también `components/ui/{Tarjeta,EncabezadoPagina}.tsx` y `components/layout/FooterFijo.tsx`. Las acciones se inyectan (server actions en web, loaders en mobile) y `initialData` solo viaja en web; mobile lo pide al montar.
- `Titulo`/`SubTitulo`/`Parrafo` aceptan `peso`: en nativo el peso es otra familia y no se puede cambiar con un `font-semibold` del className.
- El `Boton` volvió a resolver sus clases como lo hacía web (el `px-6` de la variante peligro le gana al `px-2` de la base, y el `w-fit` al `w-full`).

## Para probar antes de commitear

Comparado con la vista vieja a 375 y 1280 con datos falsos, y probado en las dos plataformas: stepper con debounce, eliminar, vaciar y estado vacío. Falta verlo con un carrito real (el de la sesión del simulador está vacío).

## Siguiente

Confirmar con el usuario. Lo natural son `perfil` y `pedidos`, que son tabs del BottomNav: al migrarlas hay que agregar su href a `HREFS_MIGRADOS` en `apps/mobile/app/(protected)/_layout.tsx`.
