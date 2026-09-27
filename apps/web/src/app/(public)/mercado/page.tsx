import Mercado from "@akindo/ui/screens/mercado";
import { listarProductosCatalogo } from "@/lib/api/productos";
import { cargarCategorias } from "@/lib/providers-data";

// Sin `export` a propósito, igual que el original: el título de la pestaña
// sigue siendo "Akindo".
const metadata = {
    title: "Mercado",
    description: "Explora categorías, distribuidores y productos en el mercado de Akindo.",
};

export default async function MercadoPage() {
    // Recomendaciones: primeros 8 productos del catálogo global (sustituto temporal)
    const catalogo = await listarProductosCatalogo(1, 8);
    return <Mercado cargarCategorias={cargarCategorias} recomendaciones={catalogo.productos} />;
}
