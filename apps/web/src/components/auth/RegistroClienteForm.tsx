"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registrarCliente } from "@/lib/api/auth";
import "@/components/auth/registroCliente.css";
import { Parrafo, SubTitulo, Titulo } from "@/components/titles";
import { Boton } from "@/components/ui/Boton";
import { ArrowBackIcon } from "@/components/icons/NavigationIcons";
import { EmailIcon, PasswordIcon } from "@/components/icons/AuthIcons";
import { Input } from "@/components/inputs";
import { VentanaEmergente } from "@/components/VentanaEmergente";

export default function RegistroClienteForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const terminos = formData.get("terminos") as string;

    if (!email) { setError("Por favor ingresa tu correo electrónico"); setLoading(false); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Por favor ingresa un correo electrónico válido"); setLoading(false); return; }
    if (!password) { setError("Por favor ingresa tu contraseña"); setLoading(false); return; }
    if (!confirmPassword) { setError("Por favor confirma tu contraseña"); setLoading(false); return; }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden"); setLoading(false); return; }
    if (!terminos) { setError("Debes aceptar los Términos de Servicio y la Política de Privacidad"); setLoading(false); return; }

    try {
      await registrarCliente({ nombre: email.split("@")[0], email, password, telefono: "" });
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error en el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && <VentanaEmergente mensaje={error} onClose={() => setError(null)} />}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="pb-18 flex flex-col items-center bg-white rounded-3xl p-6 w-full max-w-md mx-auto shadow-sm select-none"
      >
        <header className="w-full flex justify-center relative items-center p-2 lg:p-1 xl:p-2 mb-2 lg:mb-1 xl:mb-2">
          <Boton
            variante="secundario"
            Icono={ArrowBackIcon}
            className="absolute left-0 rounded-full w-10 lg:w-8 xl:w-10 h-10 lg:h-8 xl:h-10 p-0 items-center justify-center"
          />
          <Titulo>Akindo</Titulo>
        </header>

        <section className="flex-1 flex flex-col items-center gap-4 lg:gap-1.5 xl:gap-2 w-full">
          <SubTitulo>Crear Cuenta</SubTitulo>
          <Parrafo className="text-center text-stone-500 max-w-[260px] leading-relaxed mb-4 lg:mb-2 xl:mb-4">
            Únete a la plataforma de comercio mayorista más exclusiva.
          </Parrafo>

          <div className="flex flex-col gap-4 lg:gap-2.5 xl:gap-3.5 w-full">
            <Input label="Correo Electrónico" name="email" type="email" placeholder="tu@empresa.com" Icono={EmailIcon} required />
            <Input label="Contraseña" name="password" type="password" placeholder="***" Icono={PasswordIcon} required />
            <Input label="Confirmar Contraseña" name="confirmPassword" type="password" placeholder="***" Icono={PasswordIcon} required />
          </div>

          <div className="flex flex-row items-start gap-2 w-full mt-3 lg:mt-2 xl:mt-3 text-left">
            <input type="checkbox" name="terminos" id="terminos" className="mt-1 accent-[#DAA520] cursor-pointer" required />
            <label htmlFor="terminos" className="text-xs text-stone-600 leading-tight select-none cursor-pointer">
              Acepto los <span className="text-[#DAA520] font-medium cursor-pointer">Términos de Servicio</span> y la{" "}
              <span className="text-[#DAA520] font-medium cursor-pointer">Política de Privacidad</span>.
            </label>
          </div>

          <Boton
            type="submit"
            loading={loading}
            loadingText="Registrando..."
            className="w-full justify-center mt-4 lg:mt-2 xl:mt-3.5"
          >
            Registrarse
          </Boton>

          <div className="mt-4 lg:mt-2 xl:mt-3 text-xs text-stone-500 select-none">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-[#DAA520] font-medium hover:underline transition">Inicia Sesión</Link>
          </div>
        </section>
      </form>
    </>
  );
}
