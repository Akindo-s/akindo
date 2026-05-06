import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { obtenerMisOrdenes } from "@/lib/api/pedidos";
import { Suspense } from "react";
import MisOrdenesCompra from "@/components/pedidos/MisOrdenesCompra";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";

export const metadata: Metadata = {
  title: "Mis Órdenes de Compra",
  description: "Da seguimiento a tus órdenes de compra pendientes de aprobación.",
};

async function OrdenesContent() {
  const ordenes = await obtenerMisOrdenes();

  return (
    <div className="mx-auto w-full max-w-6xl pb-24">
      <EncabezadoPagina titulo="Órdenes de Compra" href="/pedidos" />
      <div className="pt-4">
        <MisOrdenesCompra ordenes={ordenes} />
      </div>
    </div>
  );
}

function OrdenesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 animate-pulse space-y-4">
      <div className="h-7 w-40 bg-stone-200 rounded" />
      <div className="h-4 w-64 bg-stone-100 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-44 bg-stone-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default async function OrdenesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const tipo = cookieStore.get("tipo_usuario")?.value;
  
  if (!token || tipo !== "cliente") redirect("/login");

  return (
    <Suspense fallback={<OrdenesSkeleton />}>
      <OrdenesContent />
    </Suspense>
  );
}
