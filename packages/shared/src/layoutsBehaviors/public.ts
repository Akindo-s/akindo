import type { Sesion } from "../sesion";

/**
 * Lo que el layout público necesita saber de la sesión. Cada app la lee a su
 * manera (web: cookies en el servidor; mobile: AsyncStorage) y le pasa el
 * resultado a este mismo cálculo.
 */
export function estadoLayoutPublico(sesion: Partial<Sesion>) {
  return {
    isLoggedIn: !!sesion.token,
    tipoUsuario: sesion.tipo,
    // El carrito solo existe para clientes: sin esto el loader pedía sesión y
    // mandaba a /login a quien entraba al home sin cuenta.
    tieneCarrito: !!sesion.token && sesion.tipo === "cliente",
  };
}
