import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import type { PreOrdenResponse } from "@akindo/shared/types/pedidos";
import PreOrden from "@akindo/ui/screens/preorden";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import { useSesion } from "@/utils/session";
import { cargarPreOrden, crearOrdenCompra } from "@/utils/providers-data";

export default function PreOrdenScreen() {
  // En web viene en `searchParams` del page.tsx; acá, de los params de la ruta.
  const { distribuidor_id: distribuidorId } = useLocalSearchParams<{ distribuidor_id?: string }>();
  const { tipo } = useSesion();
  // En web el `page.tsx` pide la preorden en el servidor antes de pintar; acá
  // se pide antes de montar la pantalla, que la recibe ya cargada.
  const [preOrden, setPreOrden] = useState<PreOrdenResponse | null>(null);
  const [sinPreOrden, setSinPreOrden] = useState(false);

  useEffect(() => {
    if (!distribuidorId) return;
    let vigente = true;
    cargarPreOrden(distribuidorId).then(
      (p) => {
        if (!vigente) return;
        if (p) setPreOrden(p);
        else setSinPreOrden(true);
      },
      () => { if (vigente) setSinPreOrden(true); },
    );
    return () => { vigente = false; };
  }, [distribuidorId]);

  // Lo mismo que el page.tsx arma como server action: los paquetes salen de la preorden.
  const crearOrdenAction = useCallback(
    (data: { direccion_id: string; pre_autorizado: boolean }) =>
      crearOrdenCompra({
        distribuidor_id: distribuidorId!,
        direccion_id: data.direccion_id,
        paquetes: (preOrden?.productos ?? []).map((p) => ({ producto_id: p.producto_id, cantidad: p.cantidad })),
        pre_autorizado: data.pre_autorizado,
      }),
    [distribuidorId, preOrden],
  );

  // Los tres `redirect` del page.tsx: solo clientes, y sin distribuidor o sin
  // preorden, de vuelta al carrito.
  if (tipo && tipo !== "cliente") return <Redirect href={"/login" as never} />;
  if (!distribuidorId || sinPreOrden) return <Redirect href={"/carrito" as never} />;

  if (!preOrden) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Spinner tamano={32} />
      </View>
    );
  }

  return <PreOrden preOrden={preOrden} crearOrdenAction={crearOrdenAction} />;
}
