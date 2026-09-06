/**
 * Bus de eventos minimo y agnostico de plataforma.
 *
 * En web tambien reenvia el evento a `window` como `CustomEvent`, para que los
 * listeners de DOM ya existentes (`window.addEventListener("carrito:updated")`)
 * sigan funcionando. En React Native, donde no hay `window`, solo se notifica a
 * los suscriptores registrados con `suscribir`.
 */

export type EventoApp = "carrito:updated";

type Listener = () => void;

const listeners = new Map<EventoApp, Set<Listener>>();

export function suscribir(evento: EventoApp, listener: Listener): () => void {
  const actuales = listeners.get(evento) ?? new Set<Listener>();
  actuales.add(listener);
  listeners.set(evento, actuales);
  return () => {
    actuales.delete(listener);
  };
}

export function emitir(evento: EventoApp): void {
  listeners.get(evento)?.forEach((listener) => listener());

  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent(evento));
  }
}
