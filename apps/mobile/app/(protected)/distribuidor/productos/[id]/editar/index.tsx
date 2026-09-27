import { useEffect, useState } from "react";
import { View } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import type { ProductoResponse } from "@akindo/shared/api/productos";
import RegistrarProductoForm from "@akindo/ui/components/productos/RegistrarProductoForm";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import {
  actualizarProductoDistribuidor,
  cargarProducto,
  crearProductoDistribuidor,
  guardarBorradorProductoDistribuidor,
  subirImagenProductoDistribuidor,
} from "@/utils/providers-data";

export default function EditarProductoScreen() {
  // En web el id viene en `params` del page.tsx; acá, del nombre de la ruta.
  const { id } = useLocalSearchParams<{ id: string }>();
  // En web el `page.tsx` carga el producto en el servidor antes de pintar;
  // acá se pide antes de montar el formulario, que lo precarga una sola vez.
  const [producto, setProducto] = useState<ProductoResponse | null>(null);
  const [noExiste, setNoExiste] = useState(false);

  useEffect(() => {
    let vigente = true;
    cargarProducto(id).then(
      (p) => {
        if (!vigente) return;
        if (p) setProducto(p);
        else setNoExiste(true);
      },
      () => { if (vigente) setNoExiste(true); },
    );
    return () => { vigente = false; };
  }, [id]);

  // Lo mismo que el `redirect("/distribuidor/productos")` del page.tsx.
  if (noExiste) return <Redirect href={"/distribuidor/productos" as never} />;

  if (!producto) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FAF7F2]">
        <Spinner tamano={32} />
      </View>
    );
  }

  return (
    <RegistrarProductoForm
      modo="editar"
      productoInicial={producto}
      crearAction={crearProductoDistribuidor}
      guardarBorradorAction={guardarBorradorProductoDistribuidor}
      actualizarAction={actualizarProductoDistribuidor}
      subirImagenAction={subirImagenProductoDistribuidor}
    />
  );
}
