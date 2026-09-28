import type { ResumenOrdenes } from "./types/pedidos";
import type { TarjetaResumen } from "./types/resumen";

/**
 * Las tarjetas del resumen de la bandeja de órdenes del distribuidor.
 *
 * No son "una por estado" como en pedidos: están armadas para contestar de un
 * vistazo las dos preguntas con las que el vendedor abre esta pantalla —qué
 * tengo pendiente y qué puedo surtir—. Las dos primeras filtran a pendientes;
 * las de aceptadas y rechazadas filtran por su estado.
 */
export function tarjetasDeOrdenes(resumen: ResumenOrdenes): TarjetaResumen[] {
  const pendientes = resumen.por_estado.pendiente ?? 0;

  return [
    {
      id: "pendientes",
      tipo: "estado",
      titulo: "Pendientes de aprobación",
      cantidad: pendientes,
      etiqueta: "Pendientes",
      detalle: pendientes === 0 ? "Nada esperando respuesta" : "Requieren tu respuesta",
      tono: "ambar",
      filtraEstado: "pendiente",
    },
    {
      id: "surtibles",
      tipo: "estado",
      titulo: "Puedo surtirlas",
      cantidad: resumen.surtibles,
      etiqueta: "Con inventario",
      detalle:
        resumen.surtibles === 0
          ? "Ninguna se cubre con tu stock"
          : "Alcanza el inventario disponible",
      tono: "verde",
      // Filtra a pendientes: es donde se ven. La pantalla no puede pedirle al
      // backend "solo las surtibles", así que la tarjeta lleva a la pestaña.
      filtraEstado: "pendiente",
    },
    {
      id: "con-faltantes",
      tipo: "estado",
      titulo: "Con faltantes de stock",
      cantidad: resumen.con_faltantes,
      etiqueta: "Revisar inventario",
      detalle:
        resumen.con_faltantes === 0
          ? "Sin faltantes"
          : "No alcanza para surtirlas completas",
      tono: "rojo",
      filtraEstado: "pendiente",
    },
    {
      id: "aceptadas",
      tipo: "estado",
      titulo: "Aceptadas",
      cantidad: resumen.por_estado.aceptada ?? 0,
      etiqueta: "Aceptadas",
      detalle: "Ya convertidas en pedidos",
      tono: "azul",
      filtraEstado: "aceptada",
    },
  ];
}
