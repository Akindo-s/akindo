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

/**
 * Aviso de "la sesión ya no sirve" para las plataformas que no pueden redirigir
 * desde donde se lanza el error.
 *
 * Web no lo usa: sus llamadas pasan por `conSesion`, que traduce el error a
 * `redirect("/login")` del lado del servidor. Mobile sí: los loaders corren en
 * la pantalla y el error se pierde en un `catch` que solo apaga una sección, así
 * que el layout raíz registra un manejador que borra la sesión y manda a
 * `/login`.
 */
type ManejadorSesionInvalida = (error: Error) => void;

let manejadorSesionInvalida: ManejadorSesionInvalida | null = null;

/** Devuelve la función para darse de baja. */
export function registrarManejadorSesionInvalida(manejador: ManejadorSesionInvalida): () => void {
  manejadorSesionInvalida = manejador;
  return () => {
    if (manejadorSesionInvalida === manejador) manejadorSesionInvalida = null;
  };
}

/** La llama el núcleo al detectar un token rechazado. Sin manejador no hace nada. */
export function notificarSesionInvalida(error: Error): void {
  manejadorSesionInvalida?.(error);
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
