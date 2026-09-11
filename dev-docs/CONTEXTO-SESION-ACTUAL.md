# Contexto de sesión actual (2026-09-11)

Migración de `apps/web` a `packages/ui` para que web (Next) y `apps/mobile` (Expo) compartan UI. Branch `mobile-dev`. **El estado completo, las reglas aprendidas y los pendientes están en [`migracion-progreso.md`](./migracion-progreso.md)**; este archivo solo resume dónde quedó la última sesión.

## Terminado en esta sesión

1. **Registro de distribuidor en mobile** (se quedaba en "Registrando..."): `packages/shared/src/auth.ts` llamaba a `/distribuidores` y `/clientes` sin la barra final que declara FastAPI; la API respondía 307 y el POST no seguía. Ahora usa `/distribuidores/` y `/clientes/`.
2. **Home `(public)/`** en las dos apps:
   - Compartido: `packages/ui/screens/home.tsx`, `components/home/{InfoBanner,HeroCard,FeaturedCategories}`, `components/layout/{Header,BottomNav}`, `components/mercado/{MercadoBuscador,BarraBusquedaFiltros}`, `components/ui/{Buscador,Degradado}`, `icons/CategoriesIcons`.
   - Web: `app/(public)/page.tsx` y `layout.tsx` usan lo compartido; los archivos viejos llevan el comentario "archivo movido a …".
   - Mobile: `app/(public)/_layout.tsx` (Tabs + Header + BottomNav como `tabBar`) y `app/(public)/index.tsx`. Se borraron `app/index.tsx` y `app/(app)/home.tsx`.
   - Sesión en mobile: store en `apps/mobile/utils/session.ts` (`useSesion`); loaders en `apps/mobile/utils/providers-data.ts`.
   - Lógica común del layout: `packages/shared/src/layoutsBehaviors/public.ts`.
   - Nueva dependencia: `lucide-react-native` en `packages/ui`.
   - Arreglo en web: el home ya se puede ver sin sesión (antes mandaba a `/login`).

3. **Scroll de web solo en el `<main>`** (el body ya no scrollea) y **BottomNav oculto desde `md`** con un `<div className="md:hidden">` en el layout de web: la clase `web:md:hidden` del componente no bastaba en Safari. Detalle en `migracion-progreso.md`.

## Para probar antes de commitear

- Mobile (`cd apps/mobile && npx expo start --clear`): home sin sesión → login → home con sesión (Header cambia) → cerrar sesión (distribuidor/admin), tab Inicio, buscador fijo al scrollear, badge del hero, link "Conocenos".
- Web: verificado en Chrome (ver `migracion-progreso.md`). Falta confirmar en Safari que el BottomNav se oculte con el Sidebar, y probar el scroll en un celular real (barra del navegador, `h-dvh`).

## Siguiente

Confirmar con el usuario la próxima ruta (candidata: `(public)/mercado`, que ya reusa el buscador migrado y sería la segunda tab).
