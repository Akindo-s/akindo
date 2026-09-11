// archivo movido a packages/ui/components/mercado/MercadoBuscador.tsx ; ya no lo usa ninguna ruta de web (se puede borrar al final de la migracion).
"use client";

import { useState } from "react";
import { BarraBusquedaFiltros } from "./BarraBusquedaFiltros";
import { CategoriasProvider } from "@akindo/shared/categorias-context";
import { cargarCategorias } from "@/lib/providers-data";



export function MercadoBuscador() {
    
    const [valor,setValor] = useState("");

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
