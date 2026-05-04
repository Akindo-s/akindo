import { redirect } from "next/navigation";

/**
 * /distribuidor/productos redirige al listado de productos.
 * Por ahora apunta al dashboard del distribuidor hasta que exista una vista de listado.
 */
export default function ProductosDistribuidorPage() {
    redirect("/distribuidor");
}
