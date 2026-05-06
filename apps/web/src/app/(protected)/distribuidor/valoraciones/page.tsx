import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { obtenerValoracionesDistribuidor } from "@/lib/api/pedidos";
import { Suspense } from "react";
import ValoracionesDistribuidorView from "@/components/distribuidor/ValoracionesDistribuidorView";

export const metadata: Metadata = {
  title: "Mis Valoraciones",
  description: "Consulta lo que tus clientes opinan de tu servicio.",
};

async function ValoracionesContent() {
  const valoraciones = await obtenerValoracionesDistribuidor();

  return <ValoracionesDistribuidorView valoraciones={valoraciones} />;
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
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const tipo = cookieStore.get("tipo_usuario")?.value;

  if (!token || tipo !== "distribuidor") {
    redirect("/login");
  }

  return (
    <Suspense fallback={<ValoracionesSkeleton />}>
      <ValoracionesContent />
    </Suspense>
  );
}
