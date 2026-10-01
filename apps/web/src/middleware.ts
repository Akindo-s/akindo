import { NextRequest, NextResponse } from "next/server";

/**
 * Corta el acceso a `(protected)/*` antes de que React empiece a renderizar.
 *
 * Antes este chequeo vivia solo en `sesionRequerida()` (lib/sesion.ts), que
 * hace `redirect()` desde el Server Component de la pagina. Next tiene un bug
 * conocido (vercel/next.js#61341) donde un `redirect()` lanzado durante el
 * render hacia una ruta interceptada (nuestro `@modal/(.)nosession`) nunca
 * resuelve el arbol de rutas paralelas y entra en loop infinito de fetchs
 * `_rsc` entre el origen y el destino. Resolviendolo aqui, en el middleware,
 * el redirect ocurre a nivel HTTP antes de que exista ese arbol, asi que la
 * ruta interceptada nunca se ve involucrada en el render que redirige.
 */

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/nosession", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/carrito/:path*",
    "/distribuidor/:path*",
    "/pedidos/:path*",
    "/perfil/:path*",
  ],

};
