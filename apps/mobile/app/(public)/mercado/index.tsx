import { useEffect, useState } from "react";
import Mercado from "@akindo/ui/screens/mercado";
import type { ProductoCatalogoResponse } from "@akindo/shared/api/productos";
import { cargarCategorias, cargarRecomendaciones } from "@/utils/providers-data";

export default function MercadoScreen() {
  const [recomendaciones, setRecomendaciones] = useState<ProductoCatalogoResponse[]>([]);

  // En web las carga page.tsx en el servidor. El catálogo es público: no
  // depende de la sesión.
  useEffect(() => {
    cargarRecomendaciones()
      .then(setRecomendaciones)
      .catch(() => setRecomendaciones([]));
  }, []);

  return <Mercado cargarCategorias={cargarCategorias} recomendaciones={recomendaciones} />;
}
