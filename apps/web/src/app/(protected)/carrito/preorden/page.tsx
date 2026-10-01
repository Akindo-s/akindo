import { Metadata } from "next";
import { redirect } from "next/navigation";
import { obtenerPreOrden } from "@/lib/api/pedidos";
import { crearOrden } from "@/lib/api/pedidos";
import PreOrden from "@akindo/ui/screens/preorden";
import { sesionRequerida } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Confirmar orden de compra",
  description: "Revisa y confirma tu orden de compra antes de enviarla al distribuidor.",
};

export default async function PreOrdenPage({
  searchParams,
}: {
  searchParams: Promise<{ distribuidor_id?: string }>;
}) {
  await sesionRequerida("cliente");

  const params = await searchParams;
  const distribuidorId = params.distribuidor_id;
  if (!distribuidorId) redirect("/carrito");

  const preOrden = await obtenerPreOrden(distribuidorId);
  if (!preOrden) redirect("/carrito");

  async function crearOrdenAction(data: {
    direccion_id: string;
    pre_autorizado: boolean;
  }) {
    "use server";
    return crearOrden({
      distribuidor_id: distribuidorId!,
      direccion_id: data.direccion_id,
      paquetes: (preOrden?.productos ?? []).map((p) => ({
        producto_id: p.producto_id,
        cantidad: p.cantidad,
      })),
      pre_autorizado: data.pre_autorizado,
    });
  }

  return (
    <PreOrden
      preOrden={preOrden}
      crearOrdenAction={crearOrdenAction}
    />
  );
}
