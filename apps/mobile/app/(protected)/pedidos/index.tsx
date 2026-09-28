import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import Pedidos from "@akindo/ui/screens/pedidos";
import { useSesion } from "@/utils/session";
import {
  cargarEntregasPedidos,
  cargarPedidos,
  contarOrdenesPendientes,
  cargarEntregasPorDia,
  cargarResumenPedidos,
  exportarPedidosCliente,
} from "@/utils/providers-data";

export default function PedidosScreen() {
  const { tipo } = useSesion();
  // Solo alimenta la insignia del acceso a órdenes. En web lo resuelve el
  // servidor junto con la primera página; acá va aparte para no demorar el
  // listado, que es lo que el usuario vino a ver.
  const [ordenesPendientes, setOrdenesPendientes] = useState(0);

  useEffect(() => {
    if (tipo === "distribuidor") return;
    let vigente = true;
    contarOrdenesPendientes()
      .then((n) => { if (vigente) setOrdenesPendientes(n); })
      .catch(() => {});
    return () => { vigente = false; };
  }, [tipo]);

  // Igual que el `page.tsx` de web: los pedidos de un distribuidor viven en su
  // propia ruta.
  if (tipo === "distribuidor") return <Redirect href={"/distribuidor/pedidos" as never} />;

  // `listado` null: web lo trae del servidor y acá lo pide la pantalla.
  return (
    <Pedidos
      listado={null}
      cargarPedidos={cargarPedidos}
      exportarAction={exportarPedidosCliente}
      cargarEntregas={cargarEntregasPedidos}
      cargarResumen={cargarResumenPedidos}
      cargarEntregasPorDia={cargarEntregasPorDia}
      ordenesPendientes={ordenesPendientes}
    />
  );
}
