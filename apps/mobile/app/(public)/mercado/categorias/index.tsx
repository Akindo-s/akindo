import Categorias from "@akindo/ui/screens/categorias";
import { cargarCategorias } from "@/utils/providers-data";

export default function CategoriasScreen() {
  return <Categorias cargarCategorias={cargarCategorias} />;
}
