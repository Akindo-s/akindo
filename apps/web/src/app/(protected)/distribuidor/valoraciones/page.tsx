import { Metadata } from "next";
import { obtenerValoracionesDistribuidor } from "@/lib/api/pedidos";
import { Suspense } from "react";
import DistribuidorValoraciones from "@akindo/ui/screens/distribuidor-valoraciones";
import { sesionRequerida } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Mis Valoraciones",
  description: "Consulta lo que tus clientes opinan de tu servicio.",
};

async function ValoracionesContent() {
  const valoraciones = await obtenerValoracionesDistribuidor();

  return <DistribuidorValoraciones valoraciones={valoraciones} />;
}

function ValoracionesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-8 animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-stone-200 rounded" />
        <div className="h-4 w-64 bg-stone-100 rounded" />
      </div>
      <div className="h-24 w-full bg-amber-50 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 bg-stone-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default async function ValoracionesDistribuidorPage() {
  await sesionRequerida("distribuidor");

  return (
    <Suspense fallback={<ValoracionesSkeleton />}>
      <ValoracionesContent />
    </Suspense>
  );
}
