"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { obtenerIdsCarrito } from "@/lib/api/carrito"; // nuevo endpoint o adaptas el existente

const CarritoContext = createContext<Set<string>>(new Set());

let _promise: Promise<Set<string>> | null = null;
let _cache: Set<string> | null = null;

function fetchIdsCarrito() {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;
  _promise = obtenerIdsCarrito().then(ids => {
    _cache = new Set(ids);
    _promise = null;
    return _cache;
  });
  return _promise;
}

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(_cache ?? new Set());

  useEffect(() => {
    fetchIdsCarrito().then(setIds).catch(() => setIds(new Set()));
  }, []);

  return <CarritoContext.Provider value={ids}>{children}</CarritoContext.Provider>;
}

export function useIdsCarrito() {
  return useContext(CarritoContext);
}