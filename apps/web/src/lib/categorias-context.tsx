// lib/categorias-context.tsx
"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { obtenerCategoriasProductos, obtenerCategoriasDistribuidores } from "@/lib/api/categorias";

type CategoriaMezclada = { id: string; nombre: string; tipo: "producto" | "distribuidor" };

const CategoriasContext = createContext<CategoriaMezclada[] | null>(null);

// Singleton -  persiste entre renders
let _promise: Promise<CategoriaMezclada[]> | null = null;
let _cache: CategoriaMezclada[] | null = null;

function fetchCategorias() {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;

  _promise = Promise.all([
    obtenerCategoriasProductos(),
    obtenerCategoriasDistribuidores(),
  ]).then(([prods, dists]) => {
    _cache = [
      ...prods.map(p => ({ ...p, tipo: "producto" as const })),
      ...dists.map(d => ({ ...d, tipo: "distribuidor" as const })),
    ];
    _promise = null; // limpia la promesa para usar cache
    return _cache;
  });

  return _promise;
}

export function CategoriasProvider({ children }: { children: React.ReactNode }) {
  const [categorias, setCategorias] = useState<CategoriaMezclada[] | null>(_cache);

  useEffect(() => {
    if (_cache) {
      setCategorias(_cache);
      return;
    }
    fetchCategorias()
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, []);

  return (
    <CategoriasContext.Provider value={categorias}>
      {children}
    </CategoriasContext.Provider>
  );
}

export function useCategorias() {
  return useContext(CategoriasContext);
}