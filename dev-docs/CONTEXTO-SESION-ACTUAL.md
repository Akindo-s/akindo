# Contexto de sesión actual (2026-09-11)

Migración de `apps/web` a `packages/ui` para que web (Next) y `apps/mobile` (Expo) compartan UI. Branch `mobile-dev`. **El estado completo, las reglas aprendidas y los pendientes están en [`migracion-progreso.md`](./migracion-progreso.md)**; este archivo solo resume dónde quedó la última sesión.

## Terminado (ya commiteado por el usuario)

Registro (barra final en `/distribuidores/` y `/clientes/`), home `(public)/`, scroll de web solo en el `<main>` y BottomNav oculto desde `md` por el layout.

## Terminado en esta tanda: `(public)/mercado`

- Compartido: `packages/ui/screens/mercado.tsx`, `components/mercado/TarjetaProductoCatalogo.tsx`, `components/ui/ContenedorPantalla.tsx` (home pasó a usarlo), `components/ui/Avisos.tsx` (`AvisosProvider` en los dos layouts `(public)`).
- `CarritoProvider` ahora también inyecta `agregar` (`useAgregarAlCarrito()`); mobile pasa `agregarAlCarrito` (`apps/mobile/utils/providers-data.ts`).
- Web: `app/(public)/mercado/page.tsx` usa la pantalla compartida; `app/api/carrito/route.ts` responde 401 "Inicia sesión para agregar productos al carrito" (antes el aviso decía "NEXT_REDIRECT").
- Mobile: `app/(public)/mercado/index.tsx` → aparece la tab Mercado.
- Arreglo general: `ExpoLink` registrado en nativewind (los `Link` en línea ignoraban su `className` en nativo); `Link bloque` en web lleva `relative`.

## Para probar antes de commitear

- Agregar al carrito con una sesión real, en web y en mobile (aviso "Producto agregado", ícono verde).
- Mobile ya verificado en el simulador: pantalla, buscador fijo, cambio de tab.

## Siguiente

Confirmar con el usuario: `mercado/productos` o `mercado/productos/detalle` (ver `migracion-progreso.md`).
