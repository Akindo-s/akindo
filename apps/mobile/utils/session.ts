import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import type { Sesion, TipoUsuario } from '@akindo/shared/sesion';

const storage = AsyncStorage;

export default storage;

/**
 * Sesión en memoria, sincronizada con AsyncStorage. Es el equivalente de leer
 * las cookies en el layout de web: allá Next vuelve a pintar el layout cuando
 * una server action toca las cookies; acá los componentes se suscriben a este
 * store y se actualizan al guardar o borrar la sesión.
 */
export type EstadoSesion = Partial<Sesion> & { cargada: boolean };

let estado: EstadoSesion = { cargada: false };
const oyentes = new Set<() => void>();

function publicar(nuevo: EstadoSesion) {
  estado = nuevo;
  oyentes.forEach((oyente) => oyente());
}

let carga: Promise<void> | null = null;

function cargarSesion(): Promise<void> {
  carga ??= storage.multiGet(['token', 'tipo_usuario']).then(([[, token], [, tipo]]) => {
    // Si ya se guardó o borró la sesión mientras se leía, eso es lo vigente.
    if (estado.cargada) return;
    publicar({ cargada: true, token: token ?? undefined, tipo: (tipo ?? undefined) as TipoUsuario | undefined });
  });
  return carga;
}

export async function guardarSesion(token: string, tipo: TipoUsuario): Promise<void> {
  await storage.multiSet([['token', token], ['tipo_usuario', tipo]]);
  publicar({ cargada: true, token, tipo });
}

export async function borrarSesion(): Promise<void> {
  await storage.multiRemove(['token', 'tipo_usuario']);
  publicar({ cargada: true });
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => { oyentes.delete(oyente); };
}

export function useSesion(): EstadoSesion {
  const actual = useSyncExternalStore(suscribir, () => estado);
  useEffect(() => { cargarSesion(); }, []);
  return actual;
}

/** Para los loaders que corren fuera de React (carrito, categorías). */
export async function sesionActual(): Promise<Partial<Sesion>> {
  await cargarSesion();
  return estado;
}
