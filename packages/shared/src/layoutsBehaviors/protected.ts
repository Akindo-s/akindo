import type { Sesion } from "../sesion";

/**
 * Lo que el layout protegido necesita saber de la sesión. Igual que
 * `estadoLayoutPublico`, cada app la lee a su manera (web: cookies en el
 * servidor; mobile: AsyncStorage) y le pasa el resultado a este cálculo.
 */
export function estadoLayoutProtegido(sesion: Partial<Sesion>) {
  return {
    isLoggedIn: !!sesion.token,
    tipoUsuario: sesion.tipo,
    /** Sin sesión, estas rutas no se pueden ver: web redirige y mobile también. */
    requiereLogin: !sesion.token,
  };
}
