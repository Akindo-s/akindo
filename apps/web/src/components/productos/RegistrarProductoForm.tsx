"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ImageIcon, Trash2 } from "lucide-react";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Boton } from "@/components/ui/Boton";
import { Badge } from "@/components/ui/Badge";
import { Selector } from "@/components/ui/Selector";
import { Input } from "@/components/inputs";
import { VentanaEmergente } from "@/components/VentanaEmergente";
import {
    obtenerUnidadesMedida,
    crearProducto,
    guardarBorradorProducto,
    subirImagenProducto,
    actualizarProducto,
    type UnidadMedida,
    type NivelPrecio,
    type ProductoResponse,
    obtenerCategoriasDisponibles,
} from "@/lib/api/productos";
import FooterFijo from "../layout/FooterFijo";
import useSWR from "swr";

interface ProductoFormProps {
    /** Modo del formulario: crear un nuevo producto o editar uno existente. */
    modo?: "crear" | "editar";
    /** Datos del producto a editar (solo en modo editar). */
    productoInicial?: ProductoResponse | null;
}


export default function RegistrarProductoForm({ modo = "crear", productoInicial }: ProductoFormProps) {
    const router = useRouter();
    const esEdicion = modo === "editar";

    const { data, cerror } = useSWR('categorias', () => obtenerCategoriasDisponibles());

    const [opcionesCategorias, setOpcionesCategorias] = useState([])

    useEffect(() => {
        
            if (data == undefined) return;
            setOpcionesCategorias(data.map((cat) => (
                {
                    valor: cat.id,
                    etiqueta: cat.nombre
                }
            )))
        
    }, [data])

    // ── Estado del formulario ─────────────────────────────────────────────────
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [categorias, setCategorias] = useState<string[]>([]);
    const [medidaId, setMedidaId] = useState("");
    const [existencias, setExistencias] = useState<number>(0);
    const [unidades, setUnidades] = useState<UnidadMedida[]>([]);

    // Niveles de precio por volumen
    const [niveles, setNiveles] = useState<NivelPrecio[]>([
        { cantidad_minima: 1, costo_por_medida: 0 },
    ]);

    // Imágenes
    const [imagenPrincipal, setImagenPrincipal] = useState<File | null>(null);
    const [imagenPrincipalPreview, setImagenPrincipalPreview] = useState<string | null>(null);
    const [imagenesExtra, setImagenesExtra] = useState<(File | null)[]>([null, null, null]);
    const [imagenesExtraPreview, setImagenesExtraPreview] = useState<(string | null)[]>([null, null, null]);

    // UI
    const [loading, setLoading] = useState(false);
    const [loadingBorrador, setLoadingBorrador] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const imagenPrincipalRef = useRef<HTMLInputElement>(null);
    const imagenesExtraRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];

    // ── Cargar unidades de medida ─────────────────────────────────────────────
    useEffect(() => {
        obtenerUnidadesMedida().then((data) => {
            setUnidades(data);
            if (!esEdicion && data.length > 0) setMedidaId(data[0].id);
        });
    }, [esEdicion]);

    // ── Precargar datos del producto en modo edición ─────────────────────────
    useEffect(() => {
        if (esEdicion && productoInicial) {
            setNombre(productoInicial.nombre);
            setMedidaId(productoInicial.medida);
            setExistencias(productoInicial.existencias);
            if (productoInicial.categorias){
                setCategorias(productoInicial.categorias.map(cat=>cat.id))
            }
            
            const attrs = productoInicial.atributos_extra;
            if (attrs) {
                if (attrs.descripcion) setDescripcion(String(attrs.descripcion));
                if (Array.isArray(attrs.niveles_precio)) {
                    setNiveles(attrs.niveles_precio as NivelPrecio[]);
                }
            }

            if (!attrs?.niveles_precio) {
                setNiveles([{ cantidad_minima: 1, costo_por_medida: productoInicial.costo }]);
            }

            if (productoInicial.imagen) {
                setImagenPrincipalPreview(productoInicial.imagen);
            }
        }
    }, [esEdicion, productoInicial]);

    // ── Handlers de imagen ────────────────────────────────────────────────────
    const handleImagenPrincipal = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError("La imagen no debe superar 5MB"); return; }
        setImagenPrincipal(file);
        setImagenPrincipalPreview(URL.createObjectURL(file));
    };

    const handleImagenExtra = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError("La imagen no debe superar 5MB"); return; }
        const newFiles = [...imagenesExtra];
        const newPreviews = [...imagenesExtraPreview];
        newFiles[index] = file;
        newPreviews[index] = URL.createObjectURL(file);
        setImagenesExtra(newFiles);
        setImagenesExtraPreview(newPreviews);
    };

    const eliminarImagenExtra = (index: number) => {
        const newFiles = [...imagenesExtra];
        const newPreviews = [...imagenesExtraPreview];
        newFiles[index] = null;
        newPreviews[index] = null;
        setImagenesExtra(newFiles);
        setImagenesExtraPreview(newPreviews);
    };

    // ── Handlers de niveles de precio ─────────────────────────────────────────
    const agregarNivel = () => {
        setNiveles([...niveles, { cantidad_minima: 0, costo_por_medida: 0 }]);
    };

    const eliminarNivel = (index: number) => {
        if (niveles.length === 1) return;
        setNiveles(niveles.filter((_, i) => i !== index));
    };

    const actualizarNivel = (index: number, campo: keyof NivelPrecio, valor: number) => {
        const nuevos = [...niveles];
        nuevos[index] = { ...nuevos[index], [campo]: valor };
        setNiveles(nuevos);
    };

    // ── Validación ────────────────────────────────────────────────────────────
    const validar = (): string | null => {
        if (!nombre.trim()) return "El nombre del producto es obligatorio";
        if (!medidaId) return "Selecciona una unidad de medida";
        if (existencias < 0) return "Las existencias no pueden ser negativas";
        for (const nivel of niveles) {
            if (nivel.cantidad_minima < 0) return "La cantidad mínima no puede ser negativa";
            if (nivel.costo_por_medida < 0) return "El costo no puede ser negativo";
        }
        return null;
    };

    // ── Submit handlers ───────────────────────────────────────────────────────
    const buildDatos = () => ({
        nombre: nombre.trim(),
        medida: medidaId,
        costo: niveles[0]?.costo_por_medida ?? 0,
        existencias,
        descripcion: descripcion.trim() || undefined,
        categoria: categorias.length > 0 ? categorias : undefined,
        niveles_precio: niveles,
    });

    const postSubmit = async (productoId: string) => {
        // Subir imagen principal
        if (imagenPrincipal) {
            console.log(productoId)
            await subirImagenProducto(productoId, imagenPrincipal);
        }
        /*
        for (const img of imagenesExtra) {
            if (img) {
                await subirImagenProducto(productoId, img);
            }
        }
            */
    };

    const handlePublicar = async () => {
        const err = validar();
        if (err) { setError(err); return; }
        setLoading(true);
        try {
            const producto = await crearProducto(buildDatos());
            if (!producto) throw new Error("Error al crear el producto");
            await postSubmit(producto.id);
            router.push("/distribuidor/productos");
        } catch (e: any) {
            setError(e.message || "Ocurrió un error al publicar el producto");
        } finally {
            setLoading(false);
        }
    };

    const handleGuardarBorrador = async () => {
        const err = validar();
        if (err) { setError(err); return; }
        setLoadingBorrador(true);
        try {
            const producto = await guardarBorradorProducto(buildDatos());
            if (!producto) throw new Error("Error al guardar el borrador");
            await postSubmit(producto.id);
            router.push("/distribuidor/productos");
        } catch (e: any) {
            setError(e.message || "Ocurrió un error al guardar el borrador");
        } finally {
            setLoadingBorrador(false);
        }
    };

    const handleActualizar = async () => {
        if (!productoInicial) return;
        const err = validar();
        if (err) { setError(err); return; }
        setLoading(true);
        try {
            const datosUpdate = {
                nombre: nombre.trim(),
                costo: niveles[0]?.costo_por_medida ?? 0,
                medida: medidaId,
                existencias,
                atributos_extra: {
                    ...(descripcion.trim() ? { descripcion: descripcion.trim() } : {}),
                    ...(niveles.length > 0 ? { niveles_precio: niveles } : {}),
                },
                categorias:categorias
            };
            const producto = await actualizarProducto(productoInicial.id, datosUpdate);
            if (!producto) throw new Error("Error al actualizar el producto");
            // Subir nueva imagen si se seleccionó una
            if (imagenPrincipal) {
                await subirImagenProducto(producto.id, imagenPrincipal);
            }
            router.push("/distribuidor/productos");
        } catch (e: any) {
            setError(e.message || "Ocurrió un error al actualizar el producto");
        } finally {
            setLoading(false);
        }
    };

    // ── Datos derivados ───────────────────────────────────────────────────────
    const unidadSeleccionada = unidades.find((u) => u.id === medidaId);

    const opcionesUnidades = unidades.map((u) => ({
        valor: u.id,
        etiqueta: `${u.nombre} (${u.unidad})`,
    }));





    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col w-full max-w-2xl mx-auto pb-24 bg-[#FAF7F2] min-h-screen">
            {error && <VentanaEmergente mensaje={error} onClose={() => setError(null)} />}

            <EncabezadoPagina
                titulo={esEdicion ? "Editar producto" : "Registrar producto"}
                href="/distribuidor"
                className="mb-2"
            />

            {/* Subtítulo */}
            <div className="px-4 mb-6">
                <p className="text-sm text-stone-500">
                    {esEdicion ? "Modifica la información de tu producto." : "Agrega un nuevo producto a tu catálogo al mayoreo."}
                </p>
            </div>

            {/* ── Imagen principal ──────────────────────────────────────────── */}
            <section className="px-4 mb-4">
                <input
                    ref={imagenPrincipalRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleImagenPrincipal}
                />
                <Boton
                    variante="secundario"
                    type="button"
                    onClick={() => imagenPrincipalRef.current?.click()}
                    className="w-full min-h-48 max-h-48 border-2 border-dashed border-[#E8DEC1] rounded-lg bg-[#F3EBE0] flex flex-col items-center justify-center gap-2 hover:bg-[#EBE0D0] transition overflow-hidden relative p-0"
                >
                    {imagenPrincipalPreview ? (
                        <img src={imagenPrincipalPreview} alt="Imagen principal" className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <ImageIcon size={32} className="text-stone-400" />
                            <p className="text-sm font-medium text-stone-600">Subir imagen principal</p>
                            <p className="text-xs text-stone-400">PNG, JPG hasta 5MB</p>
                        </>
                    )}
                </Boton>
            </section>

            {/* ── Galería adicional ─────────────────────────────────────────── */}
            <section className="px-4 mb-8">
                <div className="flex gap-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="relative flex-1">
                            <input
                                ref={imagenesExtraRefs[i]}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(e) => handleImagenExtra(i, e)}
                            />
                            <Boton
                                variante="secundario"
                                type="button"
                                onClick={() => imagenesExtraRefs[i].current?.click()}
                                className="w-full aspect-square border-2 border-dashed border-[#E8DEC1] rounded-xl bg-[#F3EBE0] flex items-center justify-center hover:bg-[#EBE0D0] transition overflow-hidden p-0"
                            >
                                {imagenesExtraPreview[i] ? (
                                    <img src={imagenesExtraPreview[i]!} alt={`Extra ${i + 1}`} className="w-full h-full object-cover" />
                                ) : (
                                    <Plus size={22} className="text-stone-400" />
                                )}
                            </Boton>
                            {imagenesExtraPreview[i] && (
                                <Boton
                                    variante="peligro"
                                    type="button"
                                    onClick={() => eliminarImagenExtra(i)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 min-w-0 p-0 bg-red-500 rounded-full flex items-center justify-center text-white shadow border-none hover:bg-red-600"
                                >
                                    <X size={11} />
                                </Boton>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Detalles del producto ─────────────────────────────────────── */}
            <section className="px-4 mb-6">
                <h2 className="text-xl font-bold text-stone-900 mb-4">Detalles del producto</h2>
                <Tarjeta variante="calido" className="flex flex-col gap-4">
                    {/* Nombre — usa Input component */}
                    <Input
                        label="Nombre del producto *"
                        placeholder="Ej. Granos de café artesanal"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />

                    {/* Categoría — usa Selector multi-select con chips */}
                    <Selector
                        modo="multiple"
                        label="Categorías"
                        placeholder="Seleccionar categorías"
                        opciones={opcionesCategorias}
                        valor={categorias}
                        onChange={setCategorias}
                        requerido
                    />

                    {/* Descripción */}
                    <div className="flex flex-col gap-1 w-full">
                        <label className="text-xs font-medium text-stone-600 select-none">Descripción</label>
                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Breve descripción del producto..."
                            rows={3}
                            className="w-full bg-[#FCF8F4] border border-[#E8DEC1]/60 rounded-xl px-3 py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#DAA520] transition resize-none"
                        />
                    </div>
                </Tarjeta>
            </section>

            {/* ── Existencias y Costos ──────────────────────────────────────── */}
            <section className="px-4 mb-8">
                <h2 className="text-xl font-bold text-stone-900 mb-4">Existencias y Costos por volumen</h2>
                <Tarjeta variante="calido" className="flex flex-col gap-5">
                    {/* Existencias — usa Input component */}
                    <Input
                        label="Existencias disponibles *"
                        type="number"
                        min={0}
                        value={String(existencias)}
                        onChange={(e) => setExistencias(parseInt(e.target.value) || 0)}
                    />

                    {/* Costos por volumen */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-stone-600">
                                    Costos por volumen <span className="text-red-500">*</span>
                                </label>

                                {/* Medida — usa Selector simple */}
                                <Selector
                                    modo="simple"
                                    placeholder="Seleccionar medida"
                                    opciones={opcionesUnidades}
                                    valor={medidaId}
                                    onChange={setMedidaId}
                                />
                            </div>

                            {/* Agregar nivel — usa Boton chip */}
                            <Boton
                                variante="chip"
                                Icono={Plus}
                                onClick={agregarNivel}
                                className="text-[#DAA520] border-transparent hover:bg-[#FDF2E3] text-xs"
                            >
                                Agregar nivel
                            </Boton>
                        </div>

                        {/* Cabecera de la tabla */}
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{unidadSeleccionada?.unidad} minimos </span>
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Costo por {unidadSeleccionada?.unidad ?? "medida"}</span>
                            <span className="w-6" />
                        </div>

                        {/* Filas de niveles — usa Input component */}
                        {niveles.map((nivel, i) => (
                            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                                <Input
                                    type="number"
                                    min={0}
                                    value={String(nivel.cantidad_minima)}
                                    onChange={(e) => actualizarNivel(i, "cantidad_minima", parseFloat(e.target.value) || 0)}
                                />
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium z-10">$</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={String(nivel.costo_por_medida)}
                                        onChange={(e) => actualizarNivel(i, "costo_por_medida", parseFloat(e.target.value) || 0)}
                                        className="[&_input]:pl-5"
                                    />
                                </div>
                                <Boton
                                    variante="peligro"
                                    type="button"
                                    onClick={() => eliminarNivel(i)}
                                    disabled={niveles.length === 1}
                                    className="w-6 h-6 min-w-0 p-0 flex items-center justify-center text-stone-300 hover:text-red-400 transition disabled:opacity-30 border-none"
                                >
                                    <Trash2 size={14} />
                                </Boton>
                            </div>
                        ))}
                    </div>
                </Tarjeta>
            </section>

            <FooterFijo>
                {esEdicion ? (
                    <Boton
                        variante="primario"
                        onClick={handleActualizar}
                        loading={loading}
                        loadingText="Guardando..."
                        className="flex-1 justify-center py-3 rounded-xl"
                    >
                        Guardar cambios
                    </Boton>
                ) : (
                    <>
                        <Boton
                            variante="secundario"
                            onClick={handleGuardarBorrador}
                            loading={loadingBorrador}
                            loadingText="Guardando..."
                            className="flex-1 justify-center py-3 rounded-xl border border-[#E8DEC1] font-semibold text-sm text-stone-800"
                        >
                            Guardar como borrador
                        </Boton>
                        <Boton
                            variante="primario"
                            onClick={handlePublicar}
                            loading={loading}
                            loadingText="Publicando..."
                            className="flex-1 justify-center py-3 rounded-xl"
                        >
                            Publicar producto
                        </Boton>
                    </>
                )}
            </FooterFijo>

        </div>
    );
}
