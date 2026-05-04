import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { obtenerProducto } from "@/lib/api/productos";
import RegistrarProductoForm from "@/components/productos/RegistrarProductoForm";

/**
 * Página de edición de producto.
 * Carga los datos completos del producto por ID y renderiza
 * el formulario en modo "editar" con los datos precargados.
 */
export default async function EditarProductoPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const tipoUsuario = cookieStore.get("tipo_usuario")?.value;

    if (!token || tipoUsuario !== "distribuidor") {
        redirect("/login");
    }

    const { id } = await params;
    const producto = await obtenerProducto(id);

    if (!producto) {
        // TODO: Mostrar página de error 404 personalizada porque pos esa de next y vercel bad bad not gud
        
        redirect("/distribuidor/productos");
    }

    return <RegistrarProductoForm modo="editar" productoInicial={producto} />;
}
