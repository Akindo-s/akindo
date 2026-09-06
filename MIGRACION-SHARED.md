# Migración `apps/web/src/lib` → `packages/shared/src`

Log de las dependencias de Next que había que quitar para que el código sirva también en Expo (React Native), y cómo se resolvió cada una.

## Regla que salió de esta migración

`packages/shared` no puede contener nada de Next. Concretamente: ni la directiva `"use server"`, ni `next/headers`, ni `next/navigation`, ni rutas relativas del tipo `/api/...`. Todo eso se quedó en `apps/web` como una capa delgada de adaptación.

El patrón es **núcleo compartido + glue por plataforma**:

```
packages/shared/src/api/pedidos.ts     núcleo: endpoints, tipos, lógica. Recibe token.
        ▲
        │
apps/web/src/lib/api/pedidos.ts        glue Next: "use server" + cookies + redirect
apps/mobile/.../pedidos.ts             glue Expo (pendiente): SecureStore + expo-router
```

## Arreglos, uno por uno

### 1. `"use server"` en los 6 módulos de `api/`

**Problema:** es una directiva del compilador de Next (Server Actions). Metro no la entiende, y además esas funciones se invocan por red desde componentes `"use client"` (`ProductoDetalle`, `TarjetaProductoCatalogo`, `InventarioView`, `MisOrdenesCompra`, `PerfilCliente`, `Avatar`, `ProductActionsMenu`). No es un detalle cosmético: es el contrato que hace que la capa de API y las cookies **no** lleguen al bundle del cliente.

**Arreglo:** el núcleo se movió a `packages/shared/src/api/*` sin la directiva. En `apps/web/src/lib/api/*` quedó un wrapper con `"use server"` que resuelve la sesión y delega. Los ~40 imports de `@/lib/api/*` no cambiaron.

```ts
// apps/web/src/lib/api/pedidos.ts
"use server";
export async function obtenerMisPedidos(estado?: EstadoPedido) {
  const token = await tokenCliente();
  return conSesion(() => core.obtenerMisPedidos(estado, token));
}
```

### 2. `cookies()` de `next/headers`

**Problema:** API exclusiva del servidor de Next. En Expo el token vive en SecureStore/AsyncStorage.

**Arreglo:** el núcleo dejó de leer cookies; ahora recibe el `token` como parámetro (siempre el último, opcional, para no romper el orden de argumentos existente). Quien lo resuelve es `apps/web/src/lib/sesion.ts`, único archivo de la app web que conoce las cookies.

### 3. `redirect()` de `next/navigation`

**Problema:** acoplado al router de Next; Expo usa `expo-router`.

**Arreglo:** el núcleo ya no navega. Lanza errores tipados desde `packages/shared/src/sesion.ts`:

- `TokenExpiradoError` — el backend respondió `498`.
- `SesionRequeridaError` — falta token o el tipo de usuario no corresponde.

El helper `conSesion()` del glue web los traduce a `redirect("/login")`. Expo hará lo propio con `router.replace("/login")`.

### 4. `next: { revalidate }` en `fetch`

**Problema:** extensión del `fetch` de Next para ISR; no existe en React Native.

**Arreglo:** se tipó como extensión opcional en `packages/shared/src/api/fetch.ts` (`RequestInitConCache`). En Next activa el ISR igual que antes; en RN la propiedad se ignora y la petición sale sin caché. Queda documentado en el JSDoc de `fetchWithAuth` y de `listarProductosCatalogo`.

### 5. `window.dispatchEvent` en `client/carrito.ts`

**Problema:** no hay `window` en React Native.

**Arreglo:** nuevo bus mínimo en `packages/shared/src/eventos.ts`. Notifica a los suscriptores registrados y, **solo si existe `window`**, reenvía el `CustomEvent` para no romper los listeners de DOM ya existentes.

### 6. URL relativa `/api/carrito` en `client/carrito.ts`

**Problema:** RN no resuelve rutas relativas; además ese endpoint es una route handler de Next que no existirá en mobile.

**Arreglo:** `agregarProductoCliente(input, opciones)` recibe ahora un segundo parámetro opcional con `endpoint` y `token`. El default sigue siendo `/api/carrito`, así que las llamadas de web quedaron intactas.

### 7. Los contexts importaban server actions de web

**Problema:** `carrito-context` y `categorias-context` son React puro, pero importaban `@/lib/api/*`, lo que arrastraba Next entero al provider.

**Arreglo:** el fetcher se inyecta por prop (`cargarIds` / `cargarCategorias`). Web los pasa desde `apps/web/src/lib/providers-data.ts`; Expo pasará los suyos.

```tsx
<CarritoProvider cargarIds={cargarIdsCarrito}>
<CategoriasProvider cargarCategorias={cargarCategorias}>
```

### 8. Alias `@/lib/*` dentro del código movido

**Problema:** `@/*` solo resuelve dentro de `apps/web`.

**Arreglo:** dentro de `shared` todo pasó a rutas relativas (`../types/pedidos`, `./fetch`). También se quitó el self-import `@akindo/shared/constants` de `auth.ts`, que ahora es `./constants`.

## Qué quedó dónde

| Archivo original | Destino | Nota |
|---|---|---|
| `lib/types/carrito.ts` | `shared/src/types/carrito.ts` | sin cambios |
| `lib/types/pedidos.ts` | `shared/src/types/pedidos.ts` | sin cambios |
| `lib/client/carrito.ts` | `shared/src/client/carrito.ts` | endpoint y token configurables |
| `lib/carrito-context.tsx` | `shared/src/carrito-context.tsx` | loader por prop |
| `lib/categorias-context.tsx` | `shared/src/categorias-context.tsx` | loader por prop |
| `lib/api/fetch.ts` | `shared/src/api/fetch.ts` | eliminado de web; sin cookies ni redirect |
| `lib/api/{carrito,categorias,distribuidor,pedidos,productos,usuario}.ts` | `shared/src/api/…` + wrapper en web | núcleo / glue |

Archivos nuevos: `shared/src/sesion.ts`, `shared/src/eventos.ts`, `shared/src/index.ts`, `shared/tsconfig.json`, `apps/web/src/lib/sesion.ts`, `apps/web/src/lib/providers-data.ts`.

## Imports actualizados

- `@/lib/types/*` → `@akindo/shared/types/*`
- `@/lib/client/carrito` → `@akindo/shared/client/carrito`
- `@/lib/{carrito,categorias}-context` → `@akindo/shared/{carrito,categorias}-context`
- `@/lib/api/*` → **sin cambios** (siguen apuntando al wrapper de web)

Se quitaron dos imports muertos de `CategoriasProvider` (`app/(public)/layout.tsx` y `app/(public)/mercado/productos/detalle/page.tsx`).

## `packages/shared/package.json`

Se reemplazó el wildcard `"./*": "./src/*.ts"` por un mapa explícito de 17 subpaths. El wildcard no podía resolver los `.tsx` de los contexts.

También se agregó `react` como `peerDependency` opcional: shared es mayormente código sin React, y marcarla opcional evita que un consumidor sin React (por ejemplo un script de Node) falle al instalar.

## Verificación

```
tsc --noEmit  packages/shared   ✓ limpio
tsc --noEmit  apps/web          ✓ limpio
pnpm build    (turbo → next)    ✓ 35/35 rutas
```

## Pendiente / ojo con esto

- **`CarritoProvider` en el layout público redirige a `/login` a usuarios anónimos.** Es un comportamiento que ya venía de antes (`getToken()` en el `carrito.ts` original hacía `redirect("/login")` sin token) y se preservó tal cual para no cambiar funcionalidad en esta migración. Vale la pena revisarlo aparte: en un layout público lo esperable sería devolver lista vacía.
- Para Expo falta escribir el glue equivalente a `apps/web/src/lib/sesion.ts` (token desde SecureStore, `router.replace` en vez de `redirect`) y un `providers-data` propio.
