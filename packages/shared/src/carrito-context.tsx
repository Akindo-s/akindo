"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { agregarProductoCliente, type AddToCartInput, type AddToCartResult } from "./client/carrito";

const CarritoContext = createContext<Set<string>>(new Set());

/**
 * Carga los ids de producto que ya estan en el carrito.
 * La implementacion la inyecta cada app: en web es una server action que lee la
 * cookie de sesion; en Expo, una llamada directa a la API con el token guardado.
 */
export type CargarIdsCarrito = () => Promise<string[]>;

/**
 * Agrega un producto al carrito. Por defecto es la de web (`fetch` a la route
 * handler `/api/carrito`, que lee la cookie); Expo inyecta la suya, que llama a
 * la API con el token guardado.
 */
export type AgregarAlCarrito = (input: AddToCartInput) => Promise<AddToCartResult>;

const agregarWeb: AgregarAlCarrito = (input) => agregarProductoCliente(input);

const AgregarContext = createContext<AgregarAlCarrito>(agregarWeb);

let _promise: Promise<Set<string>> | null = null;
let _cache: Set<string> | null = null;

function fetchIdsCarrito(cargarIds: CargarIdsCarrito) {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;
  _promise = cargarIds().then(ids => {
    _cache = new Set(ids);
    _promise = null;
    return _cache;
  });
  return _promise;
}

export function CarritoProvider({
  children,
  cargarIds,
  agregar = agregarWeb,
}: {
  children: ReactNode;
  cargarIds: CargarIdsCarrito;
  agregar?: AgregarAlCarrito;
}) {
  const [ids, setIds] = useState<Set<string>>(_cache ?? new Set());

  useEffect(() => {
    fetchIdsCarrito(cargarIds)
      .then(setIds)
      .catch(() => setIds(new Set()));
  }, [cargarIds]);

  return (
    <CarritoContext.Provider value={ids}>
      <AgregarContext.Provider value={agregar}>{children}</AgregarContext.Provider>
    </CarritoContext.Provider>
  );
}

export function useIdsCarrito() {
  return useContext(CarritoContext);
}

export function useAgregarAlCarrito() {
  return useContext(AgregarContext);
}
