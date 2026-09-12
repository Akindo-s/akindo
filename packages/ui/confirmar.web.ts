// web version: el mismo `window.confirm` que usaba la app original.

export function confirmar(mensaje: string, _titulo?: string): Promise<boolean> {
  return Promise.resolve(window.confirm(mensaje));
}
