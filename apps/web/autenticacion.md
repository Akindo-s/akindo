# Detección de Autenticación en el Frontend

## Estrategia

La autenticación se detecta leyendo la cookie httpOnly `token` que se establece al hacer login vía la API Route `/api/auth/login`.

## ¿Cómo se lee la sesión?

### En Server Components (layouts, pages)

Usamos `cookies()` de `next/headers` para leer la cookie directamente en el servidor:

```ts
import { cookies } from "next/headers";

export default async function Layout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const isLoggedIn = !!token;

  return (
    <>
      <Header isLoggedIn={isLoggedIn} />
      {children}
    </>
  );
}
```

### En Client Components

Los Client Components **no pueden leer cookies httpOnly** directamente. Hay dos opciones:

1. **Recibir `isLoggedIn` como prop** desde un Server Component padre (recomendado).
2. Llamar a un endpoint `/api/auth/me` que verifique el token y devuelva el estado.

### En Middleware (protección de rutas)

El middleware de Next.js corre en el Edge y puede leer cookies:

```ts
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  // redirigir si no hay token en rutas protegidas
}
```

## Flujo completo

```
1. Usuario hace login → POST /api/auth/login
2. API Route llama al backend → recibe JWT
3. API Route setea cookie httpOnly "token"
4. En cada request, Next.js lee la cookie:
   - Middleware: protege rutas
   - Server Component: detecta sesión para UI
   - Client Component: recibe `isLoggedIn` como prop
5. Logout → POST /api/auth/logout → borra la cookie
```

## Dónde se usa

| Lugar | Cómo detecta sesión | Para qué |
|-------|---------------------|----------|
| `middleware.ts` | `req.cookies.get("token")` | Redirigir a `/login` si no hay sesión |
| `(public)/layout.tsx` | `cookies().get("token")` | Mostrar header con/sin sesión |
| `(protected)/layout.tsx` | `cookies().get("token")` | Mostrar header autenticado |
| `Header.tsx` | Prop `isLoggedIn` | Cambiar íconos/botones |
| Cualquier Server Component | `cookies().get("token")` | Fetch con `Authorization: Bearer` |
