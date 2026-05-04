"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api/auth";
import { Titulo } from "@/components/titles";
import { EmailIcon, PasswordIcon } from "@/components/icons/AuthIcons";
import { Input } from "@/components/inputs";
import { VentanaEmergente } from "@/components/VentanaEmergente";
import { Boton } from "@/components/ui/Boton";

export default function LoginForm() {
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

    if (!email) { setError("Por favor ingresa tu correo electrónico"); setLoading(false); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Por favor ingresa un correo electrónico válido"); setLoading(false); return; }
    if (!password) { setError("Por favor ingresa tu contraseña"); setLoading(false); return; }

    try {
      await login({ email, password });
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al iniciar sesión");
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
        className="flex flex-col items-center bg-white rounded-3xl p-8 w-full max-w-md mx-auto shadow-sm select-none"
      >
        <header className="w-full flex justify-center items-center mb-6">
          <Titulo>Akindo</Titulo>
        </header>

        <section className="flex flex-col w-full gap-6">
          <div className="text-center mb-2">
            <h2 className="text-base font-semibold text-stone-800">Iniciar Sesión</h2>
            <p className="text-xs text-stone-400 mt-1">Bienvenido de vuelta a la plataforma mayorista.</p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <Input label="Correo Electrónico" name="email" type="email" placeholder="tu@empresa.com" Icono={EmailIcon} required />
            <Input label="Contraseña" name="password" type="password" placeholder="***" Icono={PasswordIcon} required />
          </div>

          <div className="text-right">
            <span className="text-xs text-[#DAA520] hover:underline cursor-pointer font-medium">¿Olvidaste tu contraseña?</span>
          </div>

          <Boton
            type="submit"
            loading={loading}
            loadingText="Iniciando sesión..."
            className="w-full justify-center"
          >
            Iniciar Sesión
          </Boton>

          <div className="text-center text-xs text-stone-500 select-none">
            ¿No tienes una cuenta?{" "}
            <Link href="/registro/cliente" className="text-[#DAA520] font-medium hover:underline transition">Regístrate</Link>
          </div>
          <div className="text-center text-xs text-stone-500 select-none">
            ¿Quieres vender con nosotros?{" "}
            <Link href="/registro/distribuidor" className="text-[#DAA520] font-medium hover:underline transition">Unetenos!</Link>
          </div>
        </section>
      </form>
    </>
  );
}
