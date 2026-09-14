/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { Image, TextInput, View } from "react-native";
import { Image as ImageIcon, Plus, Trash2, X } from "lucide-react-native";
import {
  obtenerCategoriasDisponibles,
  obtenerUnidadesMedida,
  type DatosActualizarProducto,
  type DatosCrearProducto,
  type NivelPrecio,
  type ProductoResponse,
  type UnidadMedida,
} from "@akindo/shared/api/productos";
import { H2, P, Pressable, Section, Span } from "@akindo/ui/html";
import { Boton } from "@akindo/ui/components";
import { Input } from "@akindo/ui/components/inputs";
import { EncabezadoPagina } from "@akindo/ui/components/ui/EncabezadoPagina";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { Selector } from "@akindo/ui/components/ui/Selector";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { useAviso } from "@akindo/ui/components/ui/Avisos";
import FooterFijo from "@akindo/ui/components/layout/FooterFijo";
import { elegirImagen, archivoDeImagen } from "@akindo/ui/image-picker";
import { fuente } from "@akindo/ui/fonts";
import useRouter from "@akindo/ui/router";

const LIMITE_IMAGEN = 5 * 1024 * 1024;

interface ProductoFormProps {
  /** Modo del formulario: crear un nuevo producto o editar uno existente. */
  modo?: "crear" | "editar";
  /** Datos del producto a editar (solo en modo editar). */
  productoInicial?: ProductoResponse | null;
  // Las cuatro escrituras necesitan la sesión, así que se inyectan (regla 13):
  // en web son las server actions de `lib/api/productos.ts`; en mobile, los
  // loaders de `utils/providers-data.ts`.
  crearAction: (datos: DatosCrearProducto) => Promise<ProductoResponse | null>;
  guardarBorradorAction: (datos: DatosCrearProducto) => Promise<ProductoResponse | null>;
  actualizarAction: (productoId: string, datos: DatosActualizarProducto) => Promise<ProductoResponse | null>;
  subirImagenAction: (productoId: string, archivo: Blob) => Promise<string | null>;
}

/**
 * Campo numérico. El `<input type="number">` original dejaba escribir "12."
 * mientras se tipeaba el decimal; con un `TextInput` controlado por el número,
 * `String(parseFloat("12."))` borraba el punto y no se podían escribir
 * decimales. Por eso guarda su propio texto y solo lo reescribe cuando el
 * número cambia desde afuera (por ejemplo, al precargar o al quitar un nivel).
 */
function CampoNumero({
  valor,
  onCambiar,
  decimal = false,
  label,
  claseInput,
}: {
  valor: number;
  onCambiar: (valor: number) => void;
  decimal?: boolean;
  label?: string;
  claseInput?: string;
}) {
  const [texto, setTexto] = useState(String(valor));
  const convertir = (t: string) => (decimal ? parseFloat(t) : parseInt(t)) || 0;

  useEffect(() => {
    if (convertir(texto) !== valor) setTexto(String(valor));
  }, [valor]);

  return (
    <Input
      label={label}
      teclado={decimal ? "decimal" : "entero"}
      value={texto}
      claseInput={claseInput}
      onChangeText={(t) => {
        setTexto(t);
        onCambiar(convertir(t));
      }}
    />
  );
}

/**
 * La papelera de un nivel. En web el `px-6 py-2` y el `rounded-full` de la
 * variante `peligro` le ganaban al `w-6 h-6 p-0` de la instancia (regla 62), y
 * el `text-stone-300` de la instancia sí le ganaba al rojo: mide 62×30.
 */
function BotonQuitarNivel({ deshabilitado, onPress }: { deshabilitado: boolean; onPress: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      role="button"
      accessibilityLabel="Quitar nivel"
      disabled={deshabilitado}
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      // `disabled:opacity-30` es una variante: va por style (regla 50).
      style={{ opacity: deshabilitado ? 0.3 : 1 }}
      className="flex flex-row items-center justify-center px-6 py-2 rounded-full hover:bg-red-50 cursor-pointer"
    >
      {/* text-stone-300, y text-red-400 en hover. */}
      <Trash2 size={14} color={hover && !deshabilitado ? "#F87171" : "#D6D3D1"} />
    </Pressable>
  );
}

export default function RegistrarProductoForm({
  modo = "crear",
  productoInicial,
  crearAction,
  guardarBorradorAction,
  actualizarAction,
  subirImagenAction,
}: ProductoFormProps) {
  const router = useRouter();
  const avisar = useAviso();
  const esEdicion = modo === "editar";

  // ── Catálogos públicos: van directo al núcleo (regla 13) ──────────────────
  // El original usaba `useSWR("categorias")`; SWR no está en packages/ui.
  const [opcionesCategorias, setOpcionesCategorias] = useState<{ valor: string; etiqueta: string }[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);

  // ── Estado del formulario ─────────────────────────────────────────────────
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [medidaId, setMedidaId] = useState("");
  const [existencias, setExistencias] = useState<number>(0);

  // Niveles de precio por volumen
  const [niveles, setNiveles] = useState<NivelPrecio[]>([{ cantidad_minima: 1, costo_por_medida: 0 }]);

  // Imágenes: el archivo listo para mandar (Blob en las dos plataformas) y su URI de vista previa.
  const [imagenPrincipal, setImagenPrincipal] = useState<Blob | null>(null);
  const [imagenPrincipalPreview, setImagenPrincipalPreview] = useState<string | null>(null);
  const [imagenesExtraPreview, setImagenesExtraPreview] = useState<(string | null)[]>([null, null, null]);

  // UI
  const [loading, setLoading] = useState(false);
  const [loadingBorrador, setLoadingBorrador] = useState(false);
  const [descripcionEnfocada, setDescripcionEnfocada] = useState(false);

  useEffect(() => {
    obtenerCategoriasDisponibles().then((data) =>
      setOpcionesCategorias(data.map((cat) => ({ valor: cat.id, etiqueta: cat.nombre }))),
    );
  }, []);

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
      setMedidaId(productoInicial.medida.id);
      setExistencias(productoInicial.existencias);
      if (productoInicial.categorias) {
        setCategorias(productoInicial.categorias.map((cat) => cat.id));
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
  // El `<input type="file">` oculto + `ref.click()` del original pasa al par de
  // plataforma `@akindo/ui/image-picker`, como en la tienda.
  const elegir = async (): Promise<{ uri: string; archivo: Blob } | null> => {
    const uri = await elegirImagen();
    if (!uri) return null;
    const archivo = await archivoDeImagen(uri);
    if (archivo.size > LIMITE_IMAGEN) {
      avisar("La imagen no debe superar 5MB");
      return null;
    }
    return { uri, archivo };
  };

  const handleImagenPrincipal = async () => {
    const elegida = await elegir();
    if (!elegida) return;
    setImagenPrincipal(elegida.archivo);
    setImagenPrincipalPreview(elegida.uri);
  };

  // Las imágenes extra solo se previsualizan: el original tenía su subida
  // comentada, así que nunca llegaban a la API.
  const handleImagenExtra = async (index: number) => {
    const elegida = await elegir();
    if (!elegida) return;
    setImagenesExtraPreview((previas) => previas.map((p, i) => (i === index ? elegida.uri : p)));
  };

  const eliminarImagenExtra = (index: number) => {
    setImagenesExtraPreview((previas) => previas.map((p, i) => (i === index ? null : p)));
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
    setNiveles((previos) => previos.map((n, i) => (i === index ? { ...n, [campo]: valor } : n)));
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
  const buildDatos = (): DatosCrearProducto => ({
    nombre: nombre.trim(),
    medida: medidaId,
    costo: niveles[0]?.costo_por_medida ?? 0,
    existencias,
    descripcion: descripcion.trim() || undefined,
    categorias: categorias.length > 0 ? categorias : undefined,
    niveles_precio: niveles,
  });

  const postSubmit = async (productoId: string) => {
    if (imagenPrincipal) {
      await subirImagenAction(productoId, imagenPrincipal);
    }
  };

  // `replace` y no el `push` del original: en nativo `push` apila otro
  // inventario encima del formulario, y "volver" regresaba al formulario ya
  // enviado (regla 29).
  const irAlInventario = () => router.replace("/distribuidor/productos" as never);

  const handlePublicar = async () => {
    const err = validar();
    if (err) { avisar(err); return; }
    setLoading(true);
    try {
      const producto = await crearAction(buildDatos());
      if (!producto) throw new Error("Error al crear el producto");
      await postSubmit(producto.id);
      irAlInventario();
    } catch (e: any) {
      avisar(e.message || "Ocurrió un error al publicar el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarBorrador = async () => {
    const err = validar();
    if (err) { avisar(err); return; }
    setLoadingBorrador(true);
    try {
      const producto = await guardarBorradorAction(buildDatos());
      if (!producto) throw new Error("Error al guardar el borrador");
      await postSubmit(producto.id);
      irAlInventario();
    } catch (e: any) {
      avisar(e.message || "Ocurrió un error al guardar el borrador");
    } finally {
      setLoadingBorrador(false);
    }
  };

  const handleActualizar = async () => {
    if (!productoInicial) return;
    const err = validar();
    if (err) { avisar(err); return; }
    setLoading(true);
    try {
      const datosUpdate: DatosActualizarProducto = {
        nombre: nombre.trim(),
        costo: niveles[0]?.costo_por_medida ?? 0,
        medida: medidaId,
        existencias,
        atributos_extra: {
          ...(descripcion.trim() ? { descripcion: descripcion.trim() } : {}),
          ...(niveles.length > 0 ? { niveles_precio: niveles } : {}),
        },
        categorias: categorias,
      };
      const producto = await actualizarAction(productoInicial.id, datosUpdate);
      if (!producto) throw new Error("Error al actualizar el producto");
      // Subir nueva imagen si se seleccionó una
      if (imagenPrincipal) {
        await subirImagenAction(producto.id, imagenPrincipal);
      }
      irAlInventario();
    } catch (e: any) {
      avisar(e.message || "Ocurrió un error al actualizar el producto");
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
    <>
      {/* indiceFijo 0: el encabezado, que en web es `sticky`. */}
      <ContenedorPantalla
        indiceFijo={0}
        className="flex flex-col w-full max-w-2xl mx-auto pb-24 bg-[#FAF7F2] min-h-screen xl:bg-transparent"
      >
        <EncabezadoPagina
          titulo={esEdicion ? "Editar producto" : "Registrar producto"}
          href="/distribuidor"
          className="mb-2"
        />

        {/* Subtítulo */}
        <View className="px-4 mb-6">
          <P className="text-sm leading-5 text-stone-500 text-center">
            {esEdicion ? "Modifica la información de tu producto." : "Agrega un nuevo producto a tu catálogo al mayoreo."}
          </P>
        </View>

        {/* ── Imagen principal ──────────────────────────────────────────── */}
        {/* No es un `Boton`: su `Text` no puede envolver una imagen. Las clases
            son las que ganaban en web (regla 62): el fondo, el borde punteado y
            el `p-0` de la instancia perdían contra la variante `secundario`, así
            que el recuadro es transparente, sin borde y con `px-2 py-3`. El
            texto va en `medium`, que heredaba del botón. */}
        <Section className="px-4 mb-4">
          <Pressable
            role="button"
            accessibilityLabel="Subir imagen principal"
            onPress={handleImagenPrincipal}
            className="w-full h-48 rounded-xl flex flex-col items-center justify-center gap-2 overflow-hidden px-2 py-3 hover:bg-[#FCEAD2] cursor-pointer"
          >
            {imagenPrincipalPreview ? (
              // En web el `<img className="w-full h-full">` no tenía alto
              // definido: tomaba el alto natural de la foto (327×218 con una
              // apaisada) y el `overflow-hidden` del botón lo recortaba, así que
              // cubría todo el alto y solo el `px-2` a los costados. Absoluta
              // reproduce eso con cualquier proporción.
              <Image
                source={{ uri: imagenPrincipalPreview }}
                accessibilityLabel="Imagen principal"
                resizeMode="cover"
                className="absolute top-0 bottom-0 left-2 right-2"
              />
            ) : (
              <>
                <ImageIcon size={32} color="#A8A29E" />
                <P peso="medium" className="text-sm leading-5 text-stone-600">Subir imagen principal</P>
                <P peso="medium" className="text-xs leading-4 text-stone-400">PNG, JPG hasta 5MB</P>
              </>
            )}
          </Pressable>
        </Section>

        {/* ── Galería adicional ─────────────────────────────────────────── */}
        <Section className="px-4 mb-8">
          <View className="flex flex-row gap-3">
            {[0, 1, 2].map((i) => (
              <View key={i} className="relative flex-1">
                <Pressable
                  role="button"
                  accessibilityLabel={`Imagen extra ${i + 1}`}
                  onPress={() => handleImagenExtra(i)}
                  className="w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden px-2 py-3 hover:bg-[#FCEAD2] cursor-pointer"
                >
                  {imagenesExtraPreview[i] ? (
                    <Image
                      source={{ uri: imagenesExtraPreview[i]! }}
                      accessibilityLabel={`Extra ${i + 1}`}
                      resizeMode="cover"
                      className="w-full h-full"
                    />
                  ) : (
                    <Plus size={22} color="#A8A29E" />
                  )}
                </Pressable>
                {imagenesExtraPreview[i] && (
                  // z-10: en nativo el hermano anterior no le puede robar el toque (regla 43).
                  <Pressable
                    role="button"
                    accessibilityLabel="Quitar imagen"
                    onPress={() => eliminarImagenExtra(i)}
                    className="absolute -top-1.5 -right-1.5 z-10 flex flex-row items-center justify-center px-6 py-2 bg-red-500 rounded-full shadow hover:bg-red-600 cursor-pointer"
                  >
                    <X size={11} color="#FFFFFF" />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </Section>

        {/* ── Detalles del producto ─────────────────────────────────────── */}
        {/* z-20: el desplegable de categorías puede salirse de la tarjeta, y en
            web cada View es un contexto de apilamiento (regla 54). */}
        <Section className="px-4 mb-6 z-20">
          <H2 peso="bold" className="text-xl leading-7 text-stone-900 mb-4">Detalles del producto</H2>
          <Tarjeta variante="calido" className="flex flex-col gap-4">
            <Input
              label="Nombre del producto *"
              placeholder="Ej. Granos de café artesanal"
              value={nombre}
              onChangeText={setNombre}
            />

            <Selector
              modo="multiple"
              label="Categorías"
              placeholder="Seleccionar categorías"
              opciones={opcionesCategorias}
              valor={categorias}
              onChange={setCategorias}
              requerido
            />

            {/* Descripción: el `<textarea rows={3}>` es un TextInput multilínea
                con el mismo alto (3 renglones de 16px + padding + borde = 70). */}
            <View className="flex flex-col gap-1 w-full">
              <Span peso="medium" className="text-xs leading-4 text-stone-600 select-none">Descripción</Span>
              <TextInput
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Breve descripción del producto..."
                placeholderTextColor="#A8A29E"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onFocus={() => setDescripcionEnfocada(true)}
                onBlur={() => setDescripcionEnfocada(false)}
                style={fuente()}
                className={`w-full h-[70px] bg-[#FCF8F4] border ${descripcionEnfocada ? "border-[#DAA520]" : "border-[#E8DEC1]/60"} rounded-xl px-3 py-2.5 text-xs leading-4 text-stone-800 outline-none`}
              />
            </View>
          </Tarjeta>
        </Section>

        {/* ── Existencias y Costos ──────────────────────────────────────── */}
        <Section className="px-4 mb-8 z-10">
          <H2 peso="bold" className="text-xl leading-7 text-stone-900 mb-4">Existencias y Costos por volumen</H2>
          <Tarjeta variante="calido" className="flex flex-col gap-5">
            <CampoNumero label="Existencias disponibles *" valor={existencias} onCambiar={setExistencias} />

            {/* Costos por volumen */}
            <View className="flex flex-col gap-3">
              {/* z-10: el desplegable de medidas pasa por encima de las filas de niveles. */}
              <View className="flex flex-row items-center justify-between z-10">
                <View className="flex flex-col gap-1 shrink">
                  <Span peso="medium" className="text-xs leading-4 text-stone-600">
                    Costos por volumen <Span className="text-xs text-red-500">*</Span>
                  </Span>
                  {/* `w-auto` en la raíz y en la caja: la columna no tiene ancho y
                      en nativo el `w-full` se medía contra toda la fila, así que
                      el selector la llenaba y empujaba "Agregar nivel" fuera de
                      la pantalla. En web la columna mide lo que su contenido y la
                      caja se estira igual (align-items: stretch). */}
                  <Selector
                    modo="simple"
                    placeholder="Seleccionar medida"
                    opciones={opcionesUnidades}
                    valor={medidaId}
                    onChange={setMedidaId}
                    className="w-auto"
                    claseCaja="w-auto"
                  />
                </View>

                {/* El `text-[#DAA520]` de la instancia pierde contra el
                    `text-stone-800` de la variante `chip` (regla 62). */}
                <Boton variante="chip" Icono={Plus} onClick={agregarNivel} className="border-transparent hover:bg-[#FDF2E3]">
                  Agregar nivel
                </Boton>
              </View>

              {/* Cabecera: el `grid-cols-[1fr_1fr_auto]` es una fila con dos flex-1. */}
              <View className="flex flex-row gap-2 px-1">
                <Span peso="bold" className="flex-1 text-[10px] leading-[15px] text-stone-500 uppercase tracking-[0.5px]">
                  {unidadSeleccionada?.unidad} minimos{" "}
                </Span>
                <Span peso="bold" className="flex-1 text-[10px] leading-[15px] text-stone-500 uppercase tracking-[0.5px]">
                  Costo por {unidadSeleccionada?.unidad ?? "medida"}
                </Span>
                <View className="w-6" />
              </View>

              {/* Filas de niveles */}
              {niveles.map((nivel, i) => (
                <View key={i} className="flex flex-row gap-2 items-center">
                  <View className="flex-1">
                    <CampoNumero
                      decimal
                      valor={nivel.cantidad_minima}
                      onCambiar={(v) => actualizarNivel(i, "cantidad_minima", v)}
                    />
                  </View>
                  <View className="flex-1 relative">
                    {/* `top-[3px]` y no `top-1/2 -translate-y-1/2`: en nativo el
                        translate no acepta porcentajes. El campo mide 26 y el $ 20. */}
                    <View style={{ pointerEvents: "none" }} className="absolute left-3 top-[3px] z-10">
                      <Span peso="medium" className="text-sm leading-5 text-stone-400">$</Span>
                    </View>
                    <CampoNumero
                      decimal
                      valor={nivel.costo_por_medida}
                      onCambiar={(v) => actualizarNivel(i, "costo_por_medida", v)}
                      claseInput="pl-5"
                    />
                  </View>
                  <BotonQuitarNivel deshabilitado={niveles.length === 1} onPress={() => eliminarNivel(i)} />
                </View>
              ))}
            </View>
          </Tarjeta>
        </Section>
      </ContenedorPantalla>

      {/* Fuera del ContenedorPantalla, como en el inventario y el carrito. */}
      <FooterFijo>
        {esEdicion ? (
          <Boton
            variante="primario"
            onClick={handleActualizar}
            loading={loading}
            loadingText="Guardando..."
            className="flex-1 justify-center py-3 rounded-xl"
            claseTexto="leading-5"
          >
            Guardar cambios
          </Boton>
        ) : (
          <>
            {/* El `border` de la instancia pierde contra el `border-none` de la
                variante, y el `font-semibold` sí gana (regla 62). */}
            <Boton
              variante="secundario"
              onClick={handleGuardarBorrador}
              loading={loadingBorrador}
              loadingText="Guardando..."
              className="flex-1 justify-center py-3 rounded-xl"
              claseTexto="text-sm leading-5 text-stone-800 text-center"
              pesoTexto="semibold"
            >
              Guardar como borrador
            </Boton>
            <Boton
              variante="primario"
              onClick={handlePublicar}
              loading={loading}
              loadingText="Publicando..."
              className="flex-1 justify-center py-3 rounded-xl"
              claseTexto="leading-5 text-center"
            >
              Publicar producto
            </Boton>
          </>
        )}
      </FooterFijo>
    </>
  );
}
