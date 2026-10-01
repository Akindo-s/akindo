import { Metadata } from "next";
import Soporte from "@akindo/ui/screens/soporte";
import { sesionRequerida } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Soporte",
  description: "Elige cómo quieres que el equipo de Akindo te contacte.",
};

export default async function SoportePage() {
  // Sirve a cliente y distribuidor: basta con tener sesión.
  await sesionRequerida();

  return <Soporte />;
}
