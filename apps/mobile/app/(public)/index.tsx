import { useEffect, useState } from "react";
import Home from "@akindo/ui/screens/home";
import type { CategoriaDestacada } from "@akindo/shared/api/categorias";
import { useSesion } from "@/utils/session";
import { cargarCategorias, cargarDestacadas, cargarRecomendaciones } from "@/utils/providers-data";
import { anuncioBeta } from "@akindo/shared/types/anuncios";
import { ProductoCatalogoResponse } from "@akindo/shared/api/productos";

const imagenHero = require("../../assets/images/fondo-inicio.png");
const imagenBetaAnuncio = require("../../assets/images/anuncios/anuncioBeta.png");


export default function HomeScreen() {
  const { token } = useSesion();
  const [destacadas, setDestacadas] = useState<CategoriaDestacada[] | null>(null);
  const anuncioBetaMod = anuncioBeta;
  anuncioBetaMod.internalCover = imagenBetaAnuncio;
  // En web las carga page.tsx en el servidor. Se vuelven a pedir si cambia la
  // sesión, como cuando web vuelve a pintar tras el login.
  useEffect(() => {
    cargarDestacadas()
      .then(setDestacadas)
      .catch(() => setDestacadas(null));
  }, [token]);

  const [recomendaciones, setRecomendaciones] = useState<ProductoCatalogoResponse[]>([]);
  
    // En web las carga page.tsx en el servidor. El catálogo es público: no
    // depende de la sesión.
    useEffect(() => {
      cargarRecomendaciones()
        .then(setRecomendaciones)
        .catch(() => setRecomendaciones([]));
    }, []);

  return <Home cargarCategorias={cargarCategorias} destacadas={destacadas} imagenHero={imagenHero} anuncios={[anuncioBetaMod]} recomendaciones={recomendaciones} />;
}
