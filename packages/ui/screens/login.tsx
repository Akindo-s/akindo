/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import useRouter from "@akindo/ui/router";
import { View } from "react-native";





import { Titulo, Link } from "@akindo/ui/components";
import { Footer, H2, Header, P, Section } from "@akindo/ui/html";
import { EmailIcon, PasswordIcon } from "@akindo/ui/icons/AuthIcons";
import { Input } from "@akindo/ui/components";
// import { VentanaEmergente } from "@/components/VentanaEmergente"; TODO : falta convertirla
import { Boton } from "@akindo/ui/components";

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
      {/* {error && <VentanaEmergente mensaje={error} onClose={() => setError(null)} />} */}

      <View
        className="flex flex-col items-center rounded-3xl p-6 w-full max-w-md mx-auto shadow-sm select-none bg-white"
      >
        <Header className="w-full flex justify-center items-center mb-6">
          <Titulo className="text-center">Akindo</Titulo>
        </Header>

        <Section className="flex flex-col w-full gap-6">
          <View className="text-center mb-2 items-center">
            <H2 peso="semibold" className="text-base text-stone-800">Iniciar Sesión</H2>
            <P className="text-xs text-stone-400 mt-1">Bienvenido de vuelta a la plataforma mayorista.</P>
          </View>

          <View className="flex flex-col gap-4 w-full">
            <Input label="Correo Electrónico" name="email" type="emailAddress" placeholder="tu@correo.com" Icono={EmailIcon} required value={email} onChangeText={(text) => setEmail(text)} />
            <Input label="Contraseña" name="password" type="password" placeholder="tu contrasena" Icono={PasswordIcon} required value={password} onChangeText={(text) => setPassword(text)} />
          </View>

          <View className="text-right">
            <P className="text-xs text-[#DAA520] hover:underline cursor-pointer font-medium">¿Olvidaste tu contraseña?</P>
          </View>

          <Boton
            loading={loading}
            loadingText="Iniciando sesión..."
            className="w-full justify-center"
            onClick={handleSubmit}
          >
            Iniciar Sesión
          </Boton>
          <View className="w-full bg-blue-200 gap-0 h-fit">

            <P className="text-center text-xs text-stone-500 select-none my-0">
              ¿No tienes una cuenta?{" "}
              <Link href="/registro/cliente" className="text-[#DAA520] font-medium hover:underline transition">Regístrate</Link>
            </P>
            <P className="text-center text-xs text-stone-500 select-none my-0">
              ¿Quieres vender con nosotros?{" "}
              <Link href="/registro/distribuidor" className="text-[#DAA520] font-medium hover:underline transition">¡Únetenos!</Link>
            </P>
          </View>
        </Section>
      </View>
    </>
  );
}
