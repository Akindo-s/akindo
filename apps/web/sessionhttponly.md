# Manejo de Sesión con Cookie httpOnly en Next.js

## Arquitectura

El JWT no se guarda directamente en el cliente (`localStorage` o `sessionStorage`), ya que eso lo expone a ataques XSS. En su lugar usamos una **API Route de Next.js** como proxy seguro.

```
Browser → Next.js API Route (/api/auth/login) → FastAPI backend → JWT
                    ↓
         Set-Cookie: token=...; HttpOnly; Path=/
```

## Flujo completo

### 1. Login (POST /api/auth/login)

El cliente envía email/password a la API Route de Next.js (no al backend directamente).

```
POST /api/auth/login
Body: { email, password }
```

La API Route:
1. Llama a `POST /auth/token` del backend de FastAPI
2. Recibe el JWT en la respuesta
3. Lo establece como cookie httpOnly en la respuesta del navegador

```ts
// src/app/api/auth/login/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const res = await fetch(`${process.env.API_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.detail || "Credenciales inválidas" }, { status: res.status });
  }

  const { access_token } = await res.json();

  const response = NextResponse.json({ ok: true });
  response.cookies.set("token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 horas
  });

  return response;
}
```

### 2. Cerrar sesión (POST /api/auth/logout)

```ts
// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("token");
  return response;
}
```

### 3. Proteger rutas con Middleware

El middleware de Next.js corre en el Edge antes de que se renderice la página. Verifica si la cookie existe y redirige si no hay sesión.

```ts
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/carrito", "/pedidos", "/perfil", "/distribuidor"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/carrito/:path*", "/pedidos/:path*", "/perfil/:path*", "/distribuidor/:path*"],
};
```

### 4. Leer el token en el servidor (Server Components)

```ts
import { cookies } from "next/headers";

export default async function ProfilePage() {
  const token = (await cookies()).get("token")?.value;

  const data = await fetch(`${process.env.API_URL}/perfil`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // ...
}
```

### 5. lib/api/auth.js — lado del cliente

El `LoginForm` en el cliente llama a `/api/auth/login` (la API Route de Next), **no** al backend directamente:

```js
export async function login(datos) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Error al iniciar sesión");
  }

  return response.json();
}
```

## Resumen de archivos

| Archivo | Rol |
|---------|-----|
| `src/app/api/auth/login/route.ts` | Recibe credenciales, llama al backend, setea cookie |
| `src/app/api/auth/logout/route.ts` | Elimina la cookie |
| `src/middleware.ts` | Protege rutas en el Edge |
| `src/lib/api/auth.js` | Función `login()` que llama a la API Route |

## Variables de entorno requeridas

```env
# .env.local
API_URL=http://127.0.0.1:8000
```
