/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import { View } from "react-native";
import useRouter from "@akindo/ui/router";
// Se llama al nucleo compartido directo, igual que el form original de web: el
// registro no persiste nada por plataforma (no hay sesion todavia), asi que no
// hace falta glue inyectado como en login. Ademas, pasarlo por una Server
// Action haria que en produccion Next reemplace el mensaje de error de la API
// ("el correo ya existe", ...) por uno generico.
import { registrarCliente } from "@akindo/shared/auth";

import { Titulo, SubTitulo, Parrafo, Link, Input, Checkbox, Boton, VentanaEmergente } from "@akindo/ui/components";
import { Header, P, Section, Span } from "@akindo/ui/html";
import { ArrowBackIcon } from "@akindo/ui/icons/NavigationIcons";
import { EmailIcon, PasswordIcon } from "@akindo/ui/icons/AuthIcons";

export default function RegistroClienteForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terminos, setTerminos] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

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

      <View
        className="pb-18 flex flex-col items-center bg-white rounded-3xl p-6 w-full max-w-md mx-auto shadow-sm select-none"
      >
        <Header className="w-full flex justify-center relative items-center p-2 lg:p-1 xl:p-2 mb-2 lg:mb-1 xl:mb-2">
          {/* Sin onClick, igual que en el original: todavia no vuelve a ningun lado.
              Del original se sacaron `rounded-full w-10 h-10 p-0`: en web pierden contra
              `rounded-xl w-fit h-fit px-2 py-3` del Boton, y en nativo `fit-content` no
              existe y ganarian. Los lg:/xl: si ganan en web y se dejan. */}
          <Boton
            variante="secundario"
            Icono={ArrowBackIcon}
            accessibilityLabel="Volver"
            className="absolute left-0 lg:w-8 xl:w-10 lg:h-8 xl:h-10 items-center justify-center"
          />
          <Titulo>Akindo</Titulo>
        </Header>

        <Section className="flex-1 flex flex-col items-center gap-4 lg:gap-1.5 xl:gap-2 w-full">
          <SubTitulo>Crear Cuenta</SubTitulo>
          <Parrafo className="text-center text-stone-500 max-w-[260px] leading-relaxed mb-4 lg:mb-2 xl:mb-4">
            Únete a la plataforma de comercio mayorista más exclusiva.
          </Parrafo>

          <View className="flex flex-col gap-4 lg:gap-2.5 xl:gap-3.5 w-full">
            <Input label="Correo Electrónico" name="email" type="emailAddress" placeholder="tu@empresa.com" Icono={EmailIcon} required value={email} onChangeText={setEmail} />
            <Input label="Contraseña" name="password" type="password" placeholder="***" Icono={PasswordIcon} required value={password} onChangeText={setPassword} />
            <Input label="Confirmar Contraseña" name="confirmPassword" type="password" placeholder="***" Icono={PasswordIcon} required value={confirmPassword} onChangeText={setConfirmPassword} />
          </View>

          <View className="flex flex-row items-start w-full mt-3 lg:mt-2 xl:mt-3">
            <Checkbox checked={terminos} onChange={setTerminos}>
              <Span className="text-xs text-stone-600 leading-tight select-none shrink">
                Acepto los <Span peso="medium" className="text-[#DAA520]">Términos de Servicio</Span> y la{" "}
                <Span peso="medium" className="text-[#DAA520]">Política de Privacidad</Span>.
              </Span>
            </Checkbox>
          </View>

          <Boton
            loading={loading}
            loadingText="Registrando..."
            className="w-full justify-center mt-4 lg:mt-2 xl:mt-3.5"
            onClick={handleSubmit}
          >
            Registrarse
          </Boton>

          <P className="mt-4 lg:mt-2 xl:mt-3 text-xs text-stone-500 select-none">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" peso="medium" className="text-[#DAA520] hover:underline transition">Inicia Sesión</Link>
          </P>
        </Section>
      </View>
    </>
  );
}
