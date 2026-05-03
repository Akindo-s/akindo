"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registrarCliente } from "@/lib/api/auth";
import "@/components/auth/registroCliente.css";
import { Parrafo, SubTitulo, Titulo } from "../titles";
import { Boton } from "../buttons";
import { ArrowBackIcon } from "../icons/NavigationIcons";
import { EmailIcon, PasswordIcon, AddAPhotoIcon } from "../icons/AuthIcons";
import { Input } from "../inputs";
import { VentanaEmergente } from "../VentanaEmergente";

export default function RegistroClienteForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const terminos = formData.get("terminos") as string;

    if (!email) {
      setError("Por favor ingresa tu correo electrónico");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor ingresa un correo electrónico válido");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Por favor ingresa tu contraseña");
      setLoading(false);
      return;
    }

    if (!confirmPassword) {
      setError("Por favor confirma tu contraseña");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (!terminos) {
      setError("Debes aceptar los Términos de Servicio y la Política de Privacidad");
      setLoading(false);
      return;
    }

    const nombre = email.split("@")[0];

    try {
      await registrarCliente({ nombre, email, password, telefono: "" });
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error en el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <VentanaEmergente
          mensaje={error}
          onClose={() => setError(null)}
        />
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="pb-18 flex flex-col items-center bg-white rounded-3xl p-6  w-full max-w-md mx-auto shadow-sm select-none"
      >
        <header className="w-full flex justify-center relative items-center p-2 lg:p-1 xl:p-2 mb-2 lg:mb-1 xl:mb-2">
          <Boton
            Icono={ArrowBackIcon}
            secundario
            className="absolute left-0 rounded-full w-10 lg:w-8 xl:w-10 h-10 lg:h-8 xl:h-10 p-0 items-center justify-center bg-[#FDF2E3] hover:bg-[#FCEAD2] transition border-none flex shadow-none cursor-pointer"
          />
          <Titulo>Akindo</Titulo>
        </header>

        <section className="flex-1 flex flex-col items-center gap-4 lg:gap-1.5 xl:gap-2 w-full">
          <SubTitulo>Crear Cuenta</SubTitulo>
          <Parrafo className="text-center text-stone-500 max-w-[260px] leading-relaxed mb-4 lg:mb-2 xl:mb-4">
            Únete a la plataforma de comercio mayorista más exclusiva.
          </Parrafo>

          {/* Imagen / Foto de perfil */}
          {/* 
          
          <label className="relative flex flex-col items-center justify-center w-28 lg:w-20 xl:w-24 h-28 lg:h-20 xl:h-24 border border-dashed border-stone-300 rounded-full cursor-pointer hover:bg-stone-50 transition bg-stone-50/50 mb-4 lg:mb-2 xl:mb-4">
            <input
              type="file"
              name="foto"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {preview ? (
              <img
                src={preview}
                alt="Avatar"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <>
                <AddAPhotoIcon className="text-stone-700 mb-1 lg:mb-0 xl:mb-1" size={24} />
                <span className="text-xs text-stone-500 font-medium">Subir Foto</span>
              </>
            )}
            <div className="absolute bottom-1 right-1 w-6 lg:w-5 xl:w-6 h-6 lg:h-5 xl:h-6 bg-[#DAA520] rounded-full flex items-center justify-center border border-white text-white font-bold text-sm lg:text-xs leading-none select-none">
              +
            </div>
          </label>
          */}

          {/* Inputs del Formulario */}
          <div className="flex flex-col gap-4 lg:gap-2.5 xl:gap-3.5 w-full">
            <Input
              label="Correo Electrónico"
              name="email"
              type="email"
              placeholder="tu@empresa.com"
              Icono={EmailIcon}
              required
            />

            <Input
              label="Contraseña"
              name="password"
              type="password"
              placeholder="***"
              Icono={PasswordIcon}
              required
            />

            <Input
              label="Confirmar Contraseña"
              name="confirmPassword"
              type="password"
              placeholder="***"
              Icono={PasswordIcon}
              required
            />
          </div>

          {/* Checkbox de términos */}
          <div className="flex flex-row items-start gap-2 w-full mt-3 lg:mt-2 xl:mt-3 text-left">
            <input
              type="checkbox"
              name="terminos"
              id="terminos"
              className="mt-1 accent-[#DAA520] cursor-pointer"
              required
            />
            <label htmlFor="terminos" className="text-xs text-stone-600 leading-tight select-none cursor-pointer">
              Acepto los <span className="text-[#DAA520] font-medium cursor-pointer">Términos de Servicio</span> y la{" "}
              <span className="text-[#DAA520] font-medium cursor-pointer">Política de Privacidad</span>.
            </label>
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#DAA520] hover:bg-[#C2931D] text-white w-full py-3 lg:py-2 xl:py-3 justify-center rounded-xl font-medium shadow-md hover:shadow-lg transition mt-4 lg:mt-2 xl:mt-3.5 cursor-pointer uppercase text-sm tracking-wide disabled:opacity-75"
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>

          {/* Footer link */}
          <div className="mt-4 lg:mt-2 xl:mt-3 text-xs text-stone-500 select-none">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-[#DAA520] font-medium hover:underline transition">
              Inicia Sesión
            </Link>
          </div>
        </section>
      </form>
    </>
  );
}
