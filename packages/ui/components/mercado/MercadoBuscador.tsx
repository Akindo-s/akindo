/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import { CategoriasProvider, type CargarCategorias } from "@akindo/shared/categorias-context";
import { BarraBusquedaFiltros } from "./BarraBusquedaFiltros";

interface MercadoBuscadorProps {
    /** Loader de categorías: en web una server action, en mobile la llamada con el token guardado. */
    cargarCategorias: CargarCategorias;
}

export function MercadoBuscador({ cargarCategorias }: MercadoBuscadorProps) {

    const [valor, setValor] = useState("");

    return (
        <CategoriasProvider cargarCategorias={cargarCategorias}>
            <BarraBusquedaFiltros
                placeholder="Buscar productos, distribuidores..."
                valorBusqueda={valor}
                onChange={setValor}
                className="rounded-2xl border-stone-200"
                mostrarVolver={false}
                desactivarAutoBusqueda
            />
        </CategoriasProvider>
    );
}
