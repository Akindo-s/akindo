import RegistroClienteForm from "@/components/auth/RegistroClienteForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro de Cliente",
};

export default function RegistroClientePage() {
  return (
      <RegistroClienteForm />
  );
}
