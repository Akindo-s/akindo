import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import DistribuidorOrdenDetalle from "@akindo/ui/screens/distribuidor-orden-detalle";
import { aceptarOrdenCompra, cargarDetalleOrden, rechazarOrdenCompra } from "@/utils/providers-data";

export default function OrdenDetalleScreen() {
  // En web el id viene en `params` del page.tsx; acá, del nombre de la ruta.
  const { ordenId } = useLocalSearchParams<{ ordenId: string }>();

  const cargar = useCallback(() => cargarDetalleOrden(ordenId), [ordenId]);

  // `orden` null: web la trae del servidor y acá la pide la pantalla.
  return (
    <DistribuidorOrdenDetalle
      orden={null}
      cargarOrden={cargar}
      aceptarAction={aceptarOrdenCompra}
      rechazarAction={rechazarOrdenCompra}
    />
  );
}
