import { notFound } from "next/navigation";
import { obtenerDetalleOrden, aceptarOrden, rechazarOrden } from "@/lib/api/pedidos";
import DetalleOrdenCompraDistView from "@/components/distribuidor/DetalleOrdenCompraDistView";

interface PageProps {
  params: Promise<{
    ordenId: string;
  }>;
}

export default async function DetalleOrdenPage({ params }: PageProps) {
  const { ordenId } = await params;
  const orden = await obtenerDetalleOrden(ordenId);

  if (!orden) {
    notFound();
  }

  // Action wrappers for client components
  async function handleAceptar(id: string) {
    "use server";
    return await aceptarOrden(id);
  }

  async function handleRechazar(id: string, motivo?: string) {
    "use server";
    return await rechazarOrden(id, motivo);
  }

  return (
    <DetalleOrdenCompraDistView 
      orden={orden} 
      aceptarAction={handleAceptar}
      rechazarAction={handleRechazar}
    />
  );
}
