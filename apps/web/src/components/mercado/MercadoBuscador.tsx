"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { BarraBusquedaFiltros } from "./BarraBusquedaFiltros";
import { CategoriasProvider } from "@/lib/categorias-context";



export function MercadoBuscador() {
    



    return (
        <CategoriasProvider>

            <BarraBusquedaFiltros
                placeholder="Buscar productos, distribuidores..."
                



                className="rounded-2xl border-stone-200"
                mostrarVolver={false}
                desactivarAutoBusqueda

            />
        </CategoriasProvider>
    );
}
