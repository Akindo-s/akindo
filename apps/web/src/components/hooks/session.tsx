import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function UseSession(){
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const tipoUsuario = cookieStore.get("tipo_usuario")?.value;
    const isLoggedIn = !!token;
    if (!isLoggedIn) redirect('/login');

    return [token, isLoggedIn, tipoUsuario]
}