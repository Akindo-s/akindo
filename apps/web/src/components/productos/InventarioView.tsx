"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Archive, Edit3, Plus, Eye } from "lucide-react";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Buscador } from "@/components/ui/Buscador";
import { Boton } from "@/components/ui/Boton";
import { TarjetaProducto, type ProductoInventario } from "@/components/productos/TarjetaProducto";
import { VentanaEmergente } from "@/components/VentanaEmergente";
import FooterFijo from "@/components/layout/FooterFijo";
import {
    obtenerCatalogoDistribuidor,
    archivarProducto,
    type CatalogoPaginatedResponse,
} from "@/lib/api/productos";
import { useRouter } from "next/navigation";
import { ModalConfirmacion } from "../ui/ModalConfirmacion";
import { convertSegmentPathToStaticExportFilename } from "next/dist/shared/lib/segment-cache/segment-value-encoding";

interface InventarioViewProps {
    /** UUID del distribuidor autenticado. */
    distribuidorId: string;
}


function ProductoInventario({ producto, onArchivar }: { producto: ProductoInventario; onArchivar: (id: string) => void }) {
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const router = useRouter();
    return (
        <TarjetaProducto
            key={producto.producto_id}
            producto={producto}
            onArchivar={onArchivar}
        >
            <div className="flex items-center gap-1.5">
                {/* Editar */}
                <Boton
                    variante="chip"
                    Icono={Edit3}
                    iconoSize={14}
                    onClick={() => router.push(`/distribuidor/productos/${producto.producto_id}/editar`)}
                    className="p-1.5 border-transparent text-stone-500 hover:text-[#DAA520] hover:bg-[#FDF2E3]"
                />
                {/* Vista de Cliente */}
                <Boton
                    variante="chip"
                    Icono={Eye}
                    iconoSize={14}
                    onClick={() => window.open(`/mercado/productos/detalle?p=${producto.producto_id}`, '_blank')}
                    className="p-1.5 border-transparent text-stone-500 hover:text-blue-500 hover:bg-blue-50"
                    title="Ver vista de cliente"
                />
                {/* Archivar */}
                <Boton
                    variante="chip"
                    Icono={Archive}
                    iconoSize={14}
                    onClick={() => setIsArchiveModalOpen(true)}
                    className="p-1.5 border-transparent text-stone-400 hover:text-red-400 hover:bg-red-50"
                    title={!producto.disponible ? "DesArchivar" : "Archivar"}
                >
                    {!producto.disponible ? "DesArchivar" : ""}
                </Boton>

                <ModalConfirmacion
                    isOpen={isArchiveModalOpen}
                    onClose={() => setIsArchiveModalOpen(false)}
                    onConfirm={() => {
                        setIsArchiveModalOpen(false);
                        onArchivar(producto.producto_id);
                    }}
                    titulo="¿Archivar producto?"
                    mensaje="El producto se marcará como archivado y ya no aparecerá activo en el catálogo público."
                    textoConfirmar="Sí, archivar"
                />
            </div>
        </TarjetaProducto>
    );
}

/**
 * Vista de inventario del distribuidor con scroll infinito, buscador y filtros.
 * Se renderiza como Client Component ya que necesita estado interactivo y porque se me antojo como ves tienes bronca o que?!!.
 */
export default function InventarioView({ distribuidorId }: InventarioViewProps) {
    const router = useRouter();
    
    const [productos, setProductos] = useState<ProductoInventario[]>([]);
    const [pagina, setPagina] = useState(1);
    const [tieneSiguiente, setTieneSiguiente] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [valorInput, setValorInput] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [error, setError] = useState<string | null>(null);

    // TODO: Conectar cuando se implemente el fetch de categorías
    const [categoriasFiltro, _setCategoriasFiltro] = useState<string[]>([]);

    const observerRef = useRef<IntersectionObserver | null>(null);
    const centinelaRef = useRef<HTMLDivElement | null>(null);

    // ── Cargar productos ──────────────────────────────────────────────────
    const cargarProductos = useCallback(
        async (pag: number, query: string, resetear: boolean = false) => {
            if (resetear) {
                setCargando(true);
            } else {
                setCargandoMas(true);
            }

            try {
                const data: CatalogoPaginatedResponse = await obtenerCatalogoDistribuidor(
                    distribuidorId,
                    pag,
                    20,
                    query,
                    categoriasFiltro.length > 0 ? categoriasFiltro : null,
                );

                const nuevosProductos: ProductoInventario[] = data.productos.map((p) => ({
                    producto_id: p.producto_id,
                    nombre: p.nombre,
                    costo: p.costo,
                    disponible: p.disponible,
                    unidad: p.unidad,
                    existencias: p.existencias,
                    imagen: p.imagen
                }));

                setProductos((prev) => (resetear ? nuevosProductos : [...prev, ...nuevosProductos]));
                setTieneSiguiente(data.tiene_siguiente);
                setPagina(pag);
            } catch (e: any) {
                setError(e.message || "Error al cargar productos");
            } finally {
                setCargando(false);
                setCargandoMas(false);
            }
        },
        [distribuidorId, categoriasFiltro]
    );

    // Carga inicial
    useEffect(() => {
        cargarProductos(1, busqueda, true);
    }, [cargarProductos]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Algoritmo de Scroll infinito ────────────────────────────────────────────────────
    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && tieneSiguiente && !cargandoMas) {
                    cargarProductos(pagina + 1, busqueda);
                }
            },
            { threshold: 0.1 }
        );

        if (centinelaRef.current) {
            observerRef.current.observe(centinelaRef.current);
        }

        return () => observerRef.current?.disconnect();
    }, [tieneSiguiente, cargandoMas, pagina, busqueda, cargarProductos]);

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleBuscar = useCallback(
        (query: string) => {
            setBusqueda(query);
            cargarProductos(1, query, true);
        },
        [cargarProductos]
    );

    const handleArchivar = useCallback(
        async (productoId: string) => {
            const ok = await archivarProducto(productoId);
            if (ok) {          
                const newProductos = productos.map((p) =>
                    p.producto_id === productoId
                        ? { ...p, disponible: !p.disponible }
                        : p
                );
                setProductos(newProductos);


            } else {
                setError("No se pudo archivar el producto");
            }
        },
        [productos]
    );

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col w-full max-w-2xl lg:max-w-6xl mx-auto pb-24 bg-[#FAF7F2] min-h-screen">
            {error && <VentanaEmergente mensaje={error} onClose={() => setError(null)} />}


            {/* Buscador */}
            <div className="px-4 mb-4 sticky top-0 z-10 bg-[#FAF7F2] shadow-md pb-2">
            <EncabezadoPagina titulo="Inventario"  className="mb-2" onClick={() => router.back()}/>
                <Buscador
                    placeholder="Buscar productos..."
                    valor={valorInput}
                    onChange={setValorInput}
                    onBuscar={handleBuscar}
                />
            </div>

            {/* TODO: Chips de filtro por categoría — conectar cuando se implementen las categorías */}
            {/* <div className="px-4 mb-6">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {categorias.map((cat) => (
                        <Boton key={cat.id} variante="chip" onClick={() => toggleCategoria(cat.id)}>
                            {cat.nombre}
                        </Boton>
                    ))}
                </div>
            </div> */}

            {/* Lista de productos */}
            <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cargando ? (
                    // Skeleton
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden animate-pulse">
                            <div className="w-full h-44 bg-stone-200" />
                            <div className="p-4 flex flex-col gap-2">
                                <div className="h-4 w-3/4 bg-stone-200 rounded" />
                                <div className="h-3 w-1/3 bg-stone-200 rounded" />
                                <div className="h-5 w-1/2 bg-stone-200 rounded" />
                            </div>
                        </div>
                    ))
                ) : productos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="text-stone-400 text-sm mb-2">No se encontraron productos</p>
                        <p className="text-stone-300 text-xs">
                            {busqueda ? "Intenta con otro término de búsqueda" : "Agrega tu primer producto desde el botón de abajo"}
                        </p>
                    </div>
                ) : (
                    productos.map((producto) => (
                        <ProductoInventario
                            key={producto.producto_id}
                            producto={producto}
                            onArchivar={handleArchivar}
                        />
                    )
                    )
                )}

                {/* Centinela de scroll infinito */}
                {tieneSiguiente && (
                    <div ref={centinelaRef} className="flex justify-center py-6">
                        {cargandoMas && (
                            <div className="w-6 h-6 border-2 border-[#DAA520] border-t-transparent rounded-full animate-spin" />
                        )}
                    </div>
                )}
            </div>

            {/* Footer: Agregar producto */}
            <FooterFijo>
                <Boton
                    variante="primario"
                    Icono={Plus}
                    onClick={() => window.location.href = "/distribuidor/productos/crear"}
                    className="flex-1 justify-center py-3 rounded-xl"
                >
                    Agregar producto
                </Boton>
            </FooterFijo>
        </div>
    );
}
