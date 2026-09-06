/**
 * Primitivas de sesion compartidas entre web (Next) y mobile (Expo).
 *
 * El nucleo compartido nunca lee cookies ni redirige: recibe la sesion ya
 * resuelta y, cuando el backend rechaza el token, lanza un error tipado.
 * Cada app decide como reaccionar (Next -> `redirect("/login")`,
 * Expo -> `router.replace("/login")`).
 */

export type TipoUsuario = "cliente" | "distribuidor" | "admin";

export interface Sesion {
  token: string;
  tipo: TipoUsuario;
}

/** Se lanza cuando el backend responde 498 (token expirado). */
export class TokenExpiradoError extends Error {
  constructor(mensaje = "La sesion expiro") {
    super(mensaje);
    this.name = "TokenExpiradoError";
  }
}

/** Se lanza cuando no hay token o el tipo de usuario no es el esperado. */
export class SesionRequeridaError extends Error {
  constructor(mensaje = "Se requiere iniciar sesion") {
    super(mensaje);
    this.name = "SesionRequeridaError";
  }
}

export function esErrorDeSesion(error: unknown): boolean {
  return error instanceof TokenExpiradoError || error instanceof SesionRequeridaError;
}

/** Valida que la sesion exista y, opcionalmente, que sea de cierto tipo. */
export function requerirSesion(sesion: Sesion | null | undefined, tipo?: TipoUsuario): Sesion {
  if (!sesion?.token) throw new SesionRequeridaError();
  if (tipo && sesion.tipo !== tipo) throw new SesionRequeridaError();
  return sesion;
}
