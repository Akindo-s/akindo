/** @jsxImportSource nativewind */
"use client";

import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Archive, Edit3, Plus, Eye } from "lucide-react-native";
import { obtenerCatalogoDistribuidor } from "@akindo/shared/api/productos";
import { P } from "@akindo/ui/html";
import { Boton } from "@akindo/ui/components";
import { Buscador } from "@akindo/ui/components/ui/Buscador";
import { EncabezadoPagina } from "@akindo/ui/components/ui/EncabezadoPagina";
import { ModalConfirmacion } from "@akindo/ui/components/ui/ModalConfirmacion";
import { ContenedorPantalla, Centinela } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import FooterFijo from "@akindo/ui/components/layout/FooterFijo";
import { useAviso } from "@akindo/ui/components/ui/Avisos";
// El hook es `.ts`, no `.tsx`: el subpath `./components/*` del package.json
// solo resuelve `.tsx`, así que va por ruta relativa (como en tienda.tsx).
import { useScrollInfinito } from "../components/hooks/useScrollInfinito";
import { TarjetaProducto, type ProductoInventario } from "@akindo/ui/components/productos/TarjetaProducto";
import useRouter from "@akindo/ui/router";

interface InventarioProps {
  /** UUID del distribuidor autenticado. Web lo saca del perfil en el servidor. */
  distribuidorId: string;
  /** Archiva (o desarchiva) un producto. Necesita la sesión (regla 13). */
  archivarAction: (productoId: string) => Promise<boolean>;
}

/** Una tarjeta con sus tres acciones. */
function ProductoConAcciones({
  producto,
  onPedirArchivar,
}: {
  producto: ProductoInventario;
  onPedirArchivar: (producto: ProductoInventario) => void;
}) {
  const router = useRouter();

  return (
    <TarjetaProducto producto={producto}>
      {/* Sin el `p-1.5` de la instancia: en web el `px-4 py-2.5` de la variante
          `chip` va después en el CSS y le gana (regla 62), así que cada botón
          mide 48×36 y no 28×28. */}
      <View className="flex flex-row items-center gap-1.5">
        <Boton
          variante="chip"
          Icono={Edit3}
          iconoSize={14}
          accessibilityLabel="Editar producto"
          onClick={() => router.push(`/distribuidor/productos/${producto.producto_id}/editar` as never)}
          className="border-transparent hover:bg-[#FDF2E3]"
        />
        {/* El original abría la vista de cliente en otra pestaña (`window.open`),
            que en nativo no existe: acá navega en la misma app. */}
        <Boton
          variante="chip"
          Icono={Eye}
          iconoSize={14}
          accessibilityLabel="Ver vista de cliente"
          onClick={() => router.push(`/mercado/productos/detalle?p=${producto.producto_id}` as never)}
          className="border-transparent hover:bg-blue-50"
        />
        <Boton
          variante="chip"
          Icono={Archive}
          iconoSize={14}
          accessibilityLabel={!producto.disponible ? "DesArchivar" : "Archivar"}
          onClick={() => onPedirArchivar(producto)}
          className="border-transparent hover:bg-red-50"
        >
          {/* `undefined` y no `""`: con el string vacío el Boton igual pinta su
              Text y el `gap-2` le suma 8px de ancho. */}
          {!producto.disponible ? "DesArchivar" : undefined}
        </Boton>
      </View>
    </TarjetaProducto>
  );
}

export default function Inventario({ distribuidorId, archivarAction }: InventarioProps) {
  const avisar = useAviso();
  const router = useRouter();
  const [valorInput, setValorInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  // La confirmación vive acá y no en la tarjeta: adentro, en nativo taparía
  // solo la tarjeta (regla 54).
  const [productoAArchivar, setProductoAArchivar] = useState<ProductoInventario | null>(null);
  const [disponibles, setDisponibles] = useState<Record<string, boolean>>({});

  const fetchFn = useCallback(
    async (pagina: number) => {
      const data = await obtenerCatalogoDistribuidor(distribuidorId, pagina, 20, busqueda, null);
      const items: ProductoInventario[] = data.productos.map((p) => ({
        producto_id: p.producto_id,
        nombre: p.nombre,
        costo: p.costo,
        disponible: p.disponible,
        unidad: p.unidad,
        existencias: p.existencias,
        imagen: p.imagen,
      }));
      return { items, tieneSiguiente: data.tiene_siguiente };
    },
    [distribuidorId, busqueda],
  );

  const { items: productos, cargando, cargandoMas, error, cargarSiguiente, tieneSiguiente } =
    useScrollInfinito<ProductoInventario>({ fetchFn, resetKey: busqueda });

  // El aviso va en un efecto y no en el render: si no, avisa en cada pintado.
  useEffect(() => {
    if (error) avisar(error);
  }, [error]);

  const confirmarArchivar = async () => {
    if (!productoAArchivar) return;
    const { producto_id } = productoAArchivar;
    setProductoAArchivar(null);
    const ok = await archivarAction(producto_id);
    if (!ok) {
      avisar("No se pudo archivar el producto");
      return;
    }
    // El original daba vuelta el `disponible` del producto en su lista; acá el
    // hook es el dueño de los items, así que el cambio va aparte.
    setDisponibles((previos) => ({
      ...previos,
      [producto_id]: !(previos[producto_id] ?? productoAArchivar.disponible),
    }));
  };

  return (
    <>
      {/* indiceFijo 0: el bloque del encabezado y el buscador, que en el
          original es `sticky top-0`. */}
      <ContenedorPantalla key="inventario" indiceFijo={0} className="flex flex-col w-full max-w-2xl lg:max-w-6xl mx-auto pb-24 bg-[#FAF7F2] min-h-screen">
        <View className="px-4 mb-4 web:sticky top-0 z-10 bg-[#FAF7F2] shadow-md pb-2">
          <EncabezadoPagina titulo="Inventario" className="mb-2" onPress={() => router.back()} />
          <Buscador
            placeholder="Buscar productos..."
            valor={valorInput}
            onChange={setValorInput}
            onBuscar={setBusqueda}
          />
        </View>

        {/* El grid responsive es una fila que envuelve (regla 26). */}
        <View className="px-4 flex flex-row flex-wrap -m-2">
          {cargando ? (
            [0, 1, 2].map((i) => (
              <View key={i} className="w-full md:w-1/2 lg:w-1/3 p-2">
                <View className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                  <View className="w-full h-44 bg-stone-200" />
                  <View className="p-4 flex flex-col gap-2">
                    <View className="h-4 w-3/4 bg-stone-200 rounded" />
                    <View className="h-3 w-1/3 bg-stone-200 rounded" />
                    <View className="h-5 w-1/2 bg-stone-200 rounded" />
                  </View>
                </View>
              </View>
            ))
          ) : productos.length === 0 ? (
            <View className="w-full p-2">
              <View className="flex flex-col items-center justify-center py-16">
                <P className="text-stone-400 text-sm mb-2 text-center">No se encontraron productos</P>
                <P className="text-stone-300 text-xs text-center">
                  {busqueda ? "Intenta con otro término de búsqueda" : "Agrega tu primer producto desde el botón de abajo"}
                </P>
              </View>
            </View>
          ) : (
            productos.map((producto: ProductoInventario) => (
              <View key={producto.producto_id} className="w-full md:w-1/2 lg:w-1/3 p-2">
                <ProductoConAcciones
                  producto={{ ...producto, disponible: disponibles[producto.producto_id] ?? producto.disponible }}
                  onPedirArchivar={setProductoAArchivar}
                />
              </View>
            ))
          )}

          {tieneSiguiente && (
            <Centinela onVisible={cargarSiguiente} className="w-full flex items-center justify-center py-6">
              {cargandoMas && <Spinner tamano={24} />}
            </Centinela>
          )}
        </View>
      </ContenedorPantalla>

      <FooterFijo>
        <Boton variante="primario" Icono={Plus} href="/distribuidor/productos/crear" className="flex-1 justify-center py-3 rounded-xl">
          Agregar producto
        </Boton>
      </FooterFijo>

      {/* El modal, fuera del ContenedorPantalla (regla 54). */}
      <ModalConfirmacion
        isOpen={productoAArchivar !== null}
        onClose={() => setProductoAArchivar(null)}
        onConfirm={confirmarArchivar}
        titulo="¿Archivar producto?"
        mensaje="El producto se marcará como archivado y ya no aparecerá activo en el catálogo público."
        textoConfirmar="Sí, archivar"
      />
    </>
  );
}
