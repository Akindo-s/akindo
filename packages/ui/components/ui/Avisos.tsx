/** @jsxImportSource nativewind */
"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { VentanaEmergente } from "../VentanaEmergente";

type Avisar = (mensaje: string) => void;

const AvisoContext = createContext<Avisar | null>(null);

/**
 * Muestra una `VentanaEmergente` por encima de toda la pantalla.
 *
 * Una tarjeta dentro de una lista no puede pintar su propio aviso: en web es
 * `fixed` y da igual dónde esté, pero en nativo `absolute` es relativo al
 * padre y quedaba encerrado en la celda (y se iba con el scroll). Por eso va
 * en el layout, cuyo contenedor ocupa toda la pantalla.
 */
export function AvisosProvider({ children }: { children: React.ReactNode }) {
  const [aviso, setAviso] = useState<{ id: number; mensaje: string } | null>(null);
  const avisar = useCallback<Avisar>((mensaje) => setAviso({ id: Date.now(), mensaje }), []);

  return (
    <AvisoContext.Provider value={avisar}>
      {children}
      {/* `key`: un aviso nuevo reinicia la animación y el tiempo del anterior. */}
      {aviso ? <VentanaEmergente key={aviso.id} mensaje={aviso.mensaje} onClose={() => setAviso(null)} /> : null}
    </AvisoContext.Provider>
  );
}

export function useAviso(): Avisar {
  const avisar = useContext(AvisoContext);
  if (!avisar) throw new Error("useAviso necesita un AvisosProvider en el layout");
  return avisar;
}
