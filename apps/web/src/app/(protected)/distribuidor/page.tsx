import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import DistribuidorDashboard from "@akindo/ui/screens/distribuidor-dashboard";
import { obtenerResumenMensual, obtenerPedidosActivos, obtenerProductosPocasExistencias } from "@/lib/api/distribuidor";
import { obtenerOrdenesDistribuidor } from "@/lib/api/pedidos";
import { archivarProducto } from "@/lib/api/productos";

export const metadata: Metadata = {
    title: "Panel de Distribuidor",
};

async function archivarAction(productoId: string) {
    "use server";
    return archivarProducto(productoId);
}

export default async function DistribuidorPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const tipoUsuario = cookieStore.get("tipo_usuario")?.value;

    if (!token) redirect("/login");
    if (tipoUsuario !== "distribuidor") redirect("/");

    // Sin `await`: las cuatro promesas se le pasan a la pantalla, que pinta cada
    // sección con su propio `Suspense` y su esqueleto. Next va mandando cada
    // bloque cuando su promesa resuelve (es el streaming por sección que tenía
    // el original con cuatro Server Components).
    //
    // El `catch` es obligatorio: una promesa rechazada dentro de un `Suspense`
    // rompería la página entera. `conSesion` ya redirige a /login antes de eso
    // cuando el problema es la sesión.
    const secciones = {
        resumen: obtenerResumenMensual().catch(() => null),
        // El panel solo pinta las primeras: el listado ahora viene paginado,
        // así que se le pasa `.ordenes`.
        ordenesPendientes: obtenerOrdenesDistribuidor({ estado: "pendiente" })
          .then((l) => l.ordenes)
          .catch(() => []),
        pedidosActivos: obtenerPedidosActivos().catch(() => []),
        alertas: obtenerProductosPocasExistencias().catch(() => []),
    };

    return <DistribuidorDashboard secciones={secciones} archivarAction={archivarAction} />;
}
