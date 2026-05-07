"use client";

import { useState } from "react";
import { BarraBusquedaFiltros } from "./BarraBusquedaFiltros";
import { CategoriasProvider } from "@/lib/categorias-context";



export function MercadoBuscador() {
    
    const [valor,setValor] = useState("");

    return (
        <CategoriasProvider>

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
