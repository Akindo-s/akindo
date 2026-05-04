import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { obtenerPerfilDistribuidor } from "@/lib/api/usuario";
import InventarioView from "@/components/productos/InventarioView";

/**
 * Página de inventario del distribuidor.
 * Carga el perfil del distribuidor autenticado para obtener su ID
 * y renderiza la vista de inventario con scroll infinito.
 */
export default async function InventarioPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const tipoUsuario = cookieStore.get("tipo_usuario")?.value;

    if (!token || tipoUsuario !== "distribuidor") {
        redirect("/login");
    }

    const perfil = await obtenerPerfilDistribuidor();
    if (!perfil?.id) {
        redirect("/distribuidor");
    }

    return <InventarioView distribuidorId={perfil.id} />;
}
