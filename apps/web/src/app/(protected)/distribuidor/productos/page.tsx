import { redirect } from "next/navigation";
import { obtenerPerfilDistribuidor } from "@/lib/api/usuario";
import { archivarProducto } from "@/lib/api/productos";
import Inventario from "@akindo/ui/screens/inventario";
import { sesionRequerida } from "@/lib/sesion";

/**
 * Página de inventario del distribuidor.
 * Carga el perfil del distribuidor autenticado para obtener su ID
 * y renderiza la vista de inventario con scroll infinito.
 */
export default async function InventarioPage() {
    await sesionRequerida("distribuidor");

    const perfil = await obtenerPerfilDistribuidor();
    if (!perfil?.id) {
        redirect("/distribuidor");
    }

    async function archivarAction(productoId: string) {
        "use server";
        return archivarProducto(productoId);
    }

    return <Inventario distribuidorId={perfil.id} archivarAction={archivarAction} />;
}
