import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { obtenerPreOrden } from "@/lib/api/pedidos";
import { crearOrden } from "@/lib/api/pedidos";
import PreOrdenView from "@/components/pedidos/PreOrdenView";

export const metadata: Metadata = {
  title: "Confirmar orden de compra",
  description: "Revisa y confirma tu orden de compra antes de enviarla al distribuidor.",
};

export default async function PreOrdenPage({
  searchParams,
}: {
  searchParams: Promise<{ distribuidor_id?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const tipo = cookieStore.get("tipo_usuario")?.value;

  if (!token || tipo !== "cliente") redirect("/login");

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
    <PreOrdenView
      preOrden={preOrden}
      crearOrdenAction={crearOrdenAction}
    />
  );
}
