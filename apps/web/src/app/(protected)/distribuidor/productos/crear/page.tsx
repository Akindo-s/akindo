import RegistrarProductoForm from "@akindo/ui/components/productos/RegistrarProductoForm";
import {
    actualizarProducto,
    crearProducto,
    guardarBorradorProducto,
    subirImagenProducto,
} from "@/lib/api/productos";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function CrearProductoPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const tipoUsuario = cookieStore.get("tipo_usuario")?.value;

    if (!token) redirect("/login");
    if (tipoUsuario !== "distribuidor") redirect("/");

    // Las escrituras se inyectan como server actions (el form es compartido con mobile).
    return (
        <RegistrarProductoForm
            crearAction={crearProducto}
            guardarBorradorAction={guardarBorradorProducto}
            actualizarAction={actualizarProducto}
            subirImagenAction={subirImagenProducto}
        />
    );
}
