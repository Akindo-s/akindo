import type { EstadoPedido, ResumenPedidos } from "./types/pedidos";
import type { TarjetaResumen, TonoTarjeta } from "./types/resumen";

/**
 * Las tarjetas del resumen de pedidos, armadas con los conteos reales de
 * `GET /pedidos/resumen`.
 *
 * Antes esto era un provider con datos de muestra. Dejó de serlo cuando los
 * conteos se volvieron reales: la pantalla ya los pide para los contadores de
 * las pestañas, así que las tarjetas salen de ahí mismo y no de una segunda
 * carga que podría contradecirla. Lo único que queda acá es cómo se ve cada
 * estado.
 */

/** Cómo se presenta cada estado: el orden de esta lista es el de las tarjetas. */
const PRESENTACION: {
  estado: EstadoPedido;
  titulo: string;
  etiqueta: string;
  tono: TonoTarjeta;
  /** El pie de la tarjeta. Recibe el conteo por si cambia en singular. */
  detalle: (n: number) => string | null;
}[] = [
  {
    estado: "en envio",
    titulo: "En camino",
    etiqueta: "En camino",
    tono: "ambar",
    detalle: (n) => (n === 0 ? "Sin envíos en ruta" : n === 1 ? "1 envío en ruta" : `${n} envíos en ruta`),
  },
  {
    estado: "pendiente de envio",
    titulo: "En preparación / empaque",
    etiqueta: "En preparación",
    tono: "azul",
    detalle: (n) => (n === 0 ? "Nada en preparación" : "En almacén, pendiente de salida"),
  },
  {
    estado: "entregado",
    titulo: "Entregados",
    etiqueta: "Entregados",
    tono: "verde",
    detalle: (n) => (n === 0 ? "Todavía sin entregas" : "Entregas completadas"),
  },
  {
    estado: "cancelado",
    titulo: "Cancelados",
    etiqueta: "Cancelados",
    tono: "rojo",
    detalle: (n) => (n === 0 ? "Sin cancelaciones" : n === 1 ? "1 pedido cancelado" : `${n} pedidos cancelados`),
  },
];

/**
 * Pasa los conteos a las tarjetas que pinta `TarjetasResumen`.
 *
 * Todas traen `filtraEstado`, así que tocarlas filtra el listado por ese
 * estado: la tarjeta y la pestaña dicen el mismo número y hacen lo mismo.
 */
export function tarjetasDeConteos(resumen: ResumenPedidos): TarjetaResumen[] {
  return PRESENTACION.map((p) => {
    const cantidad = resumen.por_estado[p.estado] ?? 0;
    return {
      id: p.estado,
      tipo: "estado",
      titulo: p.titulo,
      cantidad,
      etiqueta: p.etiqueta,
      detalle: p.detalle(cantidad),
      tono: p.tono,
      filtraEstado: p.estado,
    };
  });
}
