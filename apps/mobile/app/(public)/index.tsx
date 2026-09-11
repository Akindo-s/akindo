import { useEffect, useState } from "react";
import Home from "@akindo/ui/screens/home";
import type { CategoriaDestacada } from "@akindo/shared/api/categorias";
import { useSesion } from "@/utils/session";
import { cargarCategorias, cargarDestacadas } from "@/utils/providers-data";

const imagenHero = require("../../assets/images/fondo-inicio.png");

export default function HomeScreen() {
  const { token } = useSesion();
  const [destacadas, setDestacadas] = useState<CategoriaDestacada[] | null>(null);

  // En web las carga page.tsx en el servidor. Se vuelven a pedir si cambia la
  // sesión, como cuando web vuelve a pintar tras el login.
  useEffect(() => {
    cargarDestacadas()
      .then(setDestacadas)
      .catch(() => setDestacadas(null));
  }, [token]);

  return <Home cargarCategorias={cargarCategorias} destacadas={destacadas} imagenHero={imagenHero} />;
}
