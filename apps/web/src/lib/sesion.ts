import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { esErrorDeSesion, type Sesion, type TipoUsuario } from "@akindo/shared/sesion";

/**
 * Adaptador de sesion para Next.
 *
 * El nucleo compartido (`@akindo/shared/api/*`) no sabe nada de cookies ni del
 * router: recibe el token y lanza `TokenExpiradoError` / `SesionRequeridaError`.
 * Este modulo traduce ambas cosas al mundo de Next (`cookies()` + `redirect()`),
 * y es el unico lugar de la app web que las conoce.
 */

const TIPOS_VALIDOS: TipoUsuario[] = ["cliente", "distribuidor", "admin"];

/** Lee la sesion de las cookies sin redirigir. */
export async function sesionOpcional(): Promise<Partial<Sesion>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const tipo = cookieStore.get("tipo_usuario")?.value as TipoUsuario | undefined;
  return { token, tipo };
}

/** Token de la cookie, o `undefined` si no hay sesion. */
export async function tokenOpcional(): Promise<string | undefined> {
  return (await sesionOpcional()).token;
}

/** Token de la cookie; redirige a /login si no hay. */
export async function tokenRequerido(): Promise<string> {
  const token = await tokenOpcional();
  if (!token) redirect("/login");
  return token;
}

/** Sesion completa; redirige a /login si falta o si el tipo no coincide. */
export async function sesionRequerida(tipo?: TipoUsuario): Promise<Sesion> {
  const { token, tipo: tipoActual } = await sesionOpcional();

  if (!token || !tipoActual || !TIPOS_VALIDOS.includes(tipoActual)) {
    redirect("/login");
  }
  if (tipo && tipoActual !== tipo) {
    redirect("/login");
  }

  return { token, tipo: tipoActual };
}

/**
 * Ejecuta una llamada al nucleo compartido traduciendo los errores de sesion a
 * `redirect("/login")`. Cualquier otro error se propaga sin tocar.
 */
export async function conSesion<T>(fn: () => Promise<T>): Promise<T> {
  let resultado: T;
  try {
    resultado = await fn();
  } catch (error) {
    if (esErrorDeSesion(error)) redirect("/login");
    throw error;
  }
  return resultado;
}
