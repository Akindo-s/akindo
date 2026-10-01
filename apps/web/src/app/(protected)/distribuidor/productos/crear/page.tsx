import RegistrarProductoForm from "@akindo/ui/components/productos/RegistrarProductoForm";
import {
    actualizarProducto,
    crearProducto,
    guardarBorradorProducto,
    subirImagenProducto,
} from "@/lib/api/productos";
import { redirect } from "next/navigation";
import { sesionRequerida } from "@/lib/sesion";

export default async function CrearProductoPage() {
    const { tipo: tipoUsuario } = await sesionRequerida();

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
