import { useEffect, useState } from "react";
import PedidosDistribuidor from "@akindo/ui/screens/distribuidor-pedidos";
import {
  actualizarEstadoPedido,
  cargarEntregasPedidos,
  cargarEntregasPorDia,
  cargarPedidosDistribuidor,
  cargarResumenPedidosDistribuidor,
  contarOrdenesPendientesDistribuidor,
  exportarPedidosDistribuidorApp,
} from "@/utils/providers-data";

export default function PedidosDistribuidorScreen() {
  // Solo alimenta la insignia del acceso a órdenes. En web lo resuelve el
  // servidor junto con la primera página; acá va aparte para no demorar el
  // listado, que es lo que el distribuidor vino a ver.
  const [ordenesPendientes, setOrdenesPendientes] = useState(0);

  useEffect(() => {
    let vigente = true;
    contarOrdenesPendientesDistribuidor()
      .then((n) => { if (vigente) setOrdenesPendientes(n); })
      .catch(() => {});
    return () => { vigente = false; };
  }, []);

  // `listado` null: web lo trae del servidor y acá lo pide la pantalla.
  return (
    <PedidosDistribuidor
      listado={null}
      cargarPedidos={cargarPedidosDistribuidor}
      cargarResumen={cargarResumenPedidosDistribuidor}
      cargarEntregas={cargarEntregasPedidos}
      cargarEntregasPorDia={cargarEntregasPorDia}
      exportarAction={exportarPedidosDistribuidorApp}
      actualizarAction={actualizarEstadoPedido}
      ordenesPendientes={ordenesPendientes}
    />
  );
}
