"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CategoriaMezclada = {
  id: string;
  nombre: string;
  tipo: "producto" | "distribuidor";
};

/**
 * Carga las categorias de productos y de distribuidores.
 * La implementacion la inyecta cada app: en web son server actions; en Expo,
 * llamadas directas a la API.
 */
export type CargarCategorias = () => Promise<{
  productos: { id: string; nombre: string }[];
  distribuidores: { id: string; nombre: string }[];
}>;

const CategoriasContext = createContext<CategoriaMezclada[] | null>(null);

// Singleton -  persiste entre renders
let _promise: Promise<CategoriaMezclada[]> | null = null;
let _cache: CategoriaMezclada[] | null = null;

function fetchCategorias(cargarCategorias: CargarCategorias) {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;

  _promise = cargarCategorias().then(({ productos, distribuidores }) => {
    _cache = [
      ...productos.map(p => ({ ...p, tipo: "producto" as const })),
      ...distribuidores.map(d => ({ ...d, tipo: "distribuidor" as const })),
    ];
    _promise = null; // limpia la promesa para usar cache
    return _cache;
  });

  return _promise;
}

export function CategoriasProvider({
  children,
  cargarCategorias,
}: {
  children: ReactNode;
  cargarCategorias: CargarCategorias;
}) {
  const [categorias, setCategorias] = useState<CategoriaMezclada[] | null>(_cache);

  useEffect(() => {
    if (_cache) {
      setCategorias(_cache);
      return;
    }
    fetchCategorias(cargarCategorias)
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, [cargarCategorias]);

  return (
    <CategoriasContext.Provider value={categorias}>
      {children}
    </CategoriasContext.Provider>
  );
}

export function useCategorias() {
  return useContext(CategoriasContext);
}
