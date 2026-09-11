/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import useRouter from "@akindo/ui/router";
import { View } from "react-native";

import { Titulo, Link, Input, Boton, VentanaEmergente } from "@akindo/ui/components";
import { H2, Header, P, Section, Span } from "@akindo/ui/html";
import { EmailIcon, PasswordIcon } from "@akindo/ui/icons/AuthIcons";

type LoginFormProps = {
  login: (email: string, password: string) => Promise<void>;
};

export default function LoginForm({ login }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {

    setError(null);
    setLoading(true);

    if (!email) { setError("Por favor ingresa tu correo electrónico"); setLoading(false); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Por favor ingresa un correo electrónico válido"); setLoading(false); return; }
    if (!password) { setError("Por favor ingresa tu contraseña"); setLoading(false); return; }

    try {
      await login(email, password);
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

      <View
        className="flex flex-col items-center bg-white rounded-3xl p-8 w-full max-w-md mx-auto shadow-sm select-none"
      >
        <Header className="w-full flex justify-center items-center mb-6">
          <Titulo>Akindo</Titulo>
        </Header>

        <Section className="flex flex-col w-full gap-6">
          {/* En RN el text-align no se hereda del View: va en cada texto. */}
          <View className="mb-2">
            <H2 peso="semibold" className="text-base text-stone-800 text-center">Iniciar Sesión</H2>
            <P className="text-xs text-stone-400 mt-1 text-center">Bienvenido de vuelta a la plataforma mayorista.</P>
          </View>

          <View className="flex flex-col gap-4 w-full">
            <Input label="Correo Electrónico" name="email" type="emailAddress" placeholder="tu@empresa.com" Icono={EmailIcon} required value={email} onChangeText={(text) => setEmail(text)} />
            <Input label="Contraseña" name="password" type="password" placeholder="***" Icono={PasswordIcon} required value={password} onChangeText={(text) => setPassword(text)} />
          </View>

          {/* items-end en vez de text-right: deja el texto del ancho de su
              contenido, como el <span> inline del original. h-6 es la altura
              de linea que ese <div> heredaba del body (16px * 1.5). */}
          <View className="items-end justify-center h-6">
            <Span peso="medium" className="text-xs text-[#DAA520] hover:underline cursor-pointer">¿Olvidaste tu contraseña?</Span>
          </View>

          <Boton
            loading={loading}
            loadingText="Iniciando sesión..."
            className="w-full justify-center"
            onClick={handleSubmit}
          >
            Iniciar Sesión
          </Boton>

          <P className="text-center text-xs text-stone-500 select-none">
            ¿No tienes una cuenta?{" "}
            <Link href="/registro/cliente" peso="medium" className="text-[#DAA520] hover:underline transition">Regístrate</Link>
          </P>
          <P className="text-center text-xs text-stone-500 select-none">
            ¿Quieres vender con nosotros?{" "}
            <Link href="/registro/distribuidor" peso="medium" className="text-[#DAA520] hover:underline transition">¡Únetenos!</Link>
          </P>
        </Section>
      </View>
    </>
  );
}
