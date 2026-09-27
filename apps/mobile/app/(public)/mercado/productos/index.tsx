import Productos from "@akindo/ui/screens/productos";
import { CategoriasProvider } from "@akindo/shared/categorias-context";
import { cargarCategorias } from "@/utils/providers-data";

// En web el CategoriasProvider lo pone mercado/productos/layout.tsx.
export default function ProductosScreen() {
  return (
    <CategoriasProvider cargarCategorias={cargarCategorias}>
      <Productos />
    </CategoriasProvider>
  );
}
