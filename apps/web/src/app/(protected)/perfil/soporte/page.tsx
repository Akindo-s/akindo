import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Soporte from "@akindo/ui/screens/soporte";

export const metadata: Metadata = {
  title: "Soporte",
  description: "Elige cómo quieres que el equipo de Akindo te contacte.",
};

export default async function SoportePage() {
  const cookieStore = await cookies();
  // Sirve a cliente y distribuidor: basta con tener sesión.
  if (!cookieStore.get("token")?.value) redirect("/login");

  return <Soporte />;
}
