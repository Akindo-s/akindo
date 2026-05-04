import RegistrarProductoForm from "@/components/productos/RegistrarProductoForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function CrearProductoPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const tipoUsuario = cookieStore.get("tipo_usuario")?.value;

    if (!token) redirect("/login");
    if (tipoUsuario !== "distribuidor") redirect("/");

    return <RegistrarProductoForm />;
}
