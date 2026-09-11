/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import useRouter from "@akindo/ui/router";
import { elegirImagen } from "@akindo/ui/image-picker";
// Directo al nucleo, como el original: el registro no persiste nada por
// plataforma (ver RegistroClienteForm).
import { registrarDistribuidor } from "@akindo/shared/auth";

import { Titulo, Link, Input, Checkbox, Boton, VentanaEmergente } from "@akindo/ui/components";
import { ProgressBar } from "@akindo/ui/components/ui/ProgressBar";
import { H2, Header, P, Pressable, Section, Span } from "@akindo/ui/html";
import { ArrowBackIcon } from "@akindo/ui/icons/NavigationIcons";
import { EmailIcon, PasswordIcon, AddAPhotoIcon } from "@akindo/ui/icons/AuthIcons";
import { fuente } from "@akindo/ui/fonts";

const TOTAL_STEPS = 2;
const STEP_LABELS = ["Cuenta", "Negocio"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegistroDistribuidorForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [nombreNegocio, setNombreNegocio] = useState("");
  const [rfc, setRfc] = useState("");
  const [calle, setCalle] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [estado, setEstado] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [terminos, setTerminos] = useState(false);

  // La foto es solo vista previa: igual que en el original, no se manda a la API.
  const elegirFoto = async () => {
    const uri = await elegirImagen();
    if (uri) setPreview(uri);
  };

  const validateStep1 = (): string | null => {
    if (!nombre.trim()) return "Por favor ingresa tu nombre completo";
    if (!email.trim()) return "Por favor ingresa tu correo electrónico";
    if (!EMAIL_REGEX.test(email)) return "Por favor ingresa un correo electrónico válido";
    if (!password) return "Por favor ingresa tu contraseña";
    if (!confirmPassword) return "Por favor confirma tu contraseña";
    if (password !== confirmPassword) return "Las contraseñas no coinciden";
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!nombreNegocio.trim()) return "Por favor ingresa el nombre de tu negocio";
    if (!rfc.trim()) return "Por favor ingresa tu RFC";
    if (!calle.trim()) return "Por favor ingresa tu calle";
    if (!ciudad.trim()) return "Por favor ingresa tu ciudad";
    if (!estado.trim()) return "Por favor ingresa tu estado";
    if (!codigoPostal.trim()) return "Por favor ingresa tu código postal";
    if (!terminos) return "Debes aceptar los Términos de Servicio y la Política de Privacidad";
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setStep(1);
  };

  const handleBack = () => {
    if (step === 1) { setStep(0); return; }
    // El original iba a "/registro", que no existe (daba 404). Se vuelve al
    // login, que es desde donde se llega con "¡Únetenos!".
    router.push("/login");
  };

  const handleSubmit = async () => {
    const err = validateStep2();
    if (err) { setError(err); return; }

    setLoading(true);
    setError(null);

    try {
      await registrarDistribuidor({
        nombre, email, password, telefono: telefono || null, rfc,
        nombre_negocio: nombreNegocio,
        direccion: { calle, ciudad, estado, codigo_postal: codigoPostal },
      });
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

      {/* La sombra va en un View aparte: en iOS un ScrollView recorta su propia sombra. */}
      <View className="bg-white rounded-3xl w-full max-w-md mx-auto shadow-sm select-none max-h-[90vh]">
        {/* `sticky top-0` no existe en nativo: el header fijo lo da stickyHeaderIndices
            (en web react-native-web lo resuelve con position: sticky). */}
        <ScrollView stickyHeaderIndices={[0]} className="rounded-3xl" contentContainerClassName="flex flex-col">
          <Header className="z-10 bg-white w-full flex flex-col items-center px-6 pt-6 pb-3 rounded-t-3xl">
            <View className="relative w-full flex flex-row justify-center items-center mb-3">
              {/* El original ademas traia `rounded-full w-10 h-10 p-0`, pero en web pierden
                  contra `rounded-xl w-fit h-fit px-2 py-3` del Boton (mide 34×42). En nativo
                  `fit-content` no existe y esas clases ganarian, asi que no se copian. */}
              <Boton
                variante="secundario"
                Icono={ArrowBackIcon}
                onClick={handleBack}
                accessibilityLabel="Volver"
                className="absolute left-0 items-center justify-center"
              />
              <Titulo>Akindo</Titulo>
            </View>
            <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} labels={STEP_LABELS} />
          </Header>

          <Section className="flex flex-col items-center gap-4 px-6 pb-6 w-full">
            <View className="mb-1">
              <H2 peso="semibold" className="text-base text-stone-800 text-center">
                {step === 0 ? "Crea tu cuenta" : "Datos de tu negocio"}
              </H2>
              <P className="text-xs text-stone-400 mt-0.5 text-center">
                {step === 0 ? "Únete como distribuidor en Akindo." : "Necesitamos información de tu empresa."}
              </P>
            </View>

            {step === 0 && (
              <>
                <Pressable
                  role="button"
                  accessibilityLabel="Subir foto"
                  onPress={elegirFoto}
                  className="relative flex flex-col items-center justify-center w-24 h-24 border border-dashed border-stone-300 rounded-full cursor-pointer hover:bg-stone-50 transition bg-stone-50/50"
                >
                  {preview ? (
                    <Image source={{ uri: preview }} accessibilityLabel="Avatar" resizeMode="cover" className="w-full h-full rounded-full" />
                  ) : (
                    <>
                      {/* El margen va en un View: el className de un Svg no llega en web. */}
                      <View className="mb-1">
                        <AddAPhotoIcon size={22} color="#44403C" />
                      </View>
                      {/* leading-normal: el span heredaba line-height 1.5 del body. */}
                      <Span peso="medium" className="text-[10px] leading-normal text-stone-500">Subir Foto</Span>
                    </>
                  )}
                  <View className="absolute bottom-1 right-1 w-5 h-5 bg-[#DAA520] rounded-full flex items-center justify-center border border-white">
                    <Text style={fuente("bold")} className="text-white text-xs leading-none">+</Text>
                  </View>
                </Pressable>

                <View className="flex flex-col gap-3.5 w-full">
                  <Input label="Nombre completo" name="nombre" placeholder="Juan Pérez" value={nombre} onChangeText={setNombre} required />
                  <Input label="Correo Electrónico" name="email" type="emailAddress" placeholder="tu@empresa.com" Icono={EmailIcon} value={email} onChangeText={setEmail} required />
                  <Input label="Teléfono (opcional)" name="telefono" type="telephoneNumber" placeholder="+52 55 1234 5678" value={telefono} onChangeText={setTelefono} />
                  <Input label="Contraseña" name="password" type="password" placeholder="***" Icono={PasswordIcon} value={password} onChangeText={setPassword} required />
                  <Input label="Confirmar Contraseña" name="confirmPassword" type="password" placeholder="***" Icono={PasswordIcon} value={confirmPassword} onChangeText={setConfirmPassword} required />
                </View>

                <Boton variante="primario" onClick={handleNext} className="w-full justify-center mt-2">
                  Continuar →
                </Boton>
              </>
            )}

            {step === 1 && (
              <>
                <View className="flex flex-col gap-3.5 w-full">
                  <Input label="Nombre del negocio" name="nombreNegocio" placeholder="Distribuidora El Sol S.A." value={nombreNegocio} onChangeText={setNombreNegocio} required />
                  <Input label="RFC" name="rfc" placeholder="XAXX010101000" value={rfc} onChangeText={(texto) => setRfc(texto.toUpperCase())} required />
                  <Input label="Calle" name="calle" placeholder="Av. Insurgentes 123" value={calle} onChangeText={setCalle} required />
                  {/* `grid grid-cols-2 gap-3`: RN no tiene grid, dos flex-1 en fila dan lo mismo. */}
                  <View className="flex flex-row gap-3">
                    <Input label="Ciudad" name="ciudad" placeholder="CDMX" value={ciudad} onChangeText={setCiudad} required className="flex-1" />
                    <Input label="Estado" name="estado" placeholder="Jalisco" value={estado} onChangeText={setEstado} required className="flex-1" />
                  </View>
                  <Input label="Código Postal" name="codigoPostal" placeholder="06600" value={codigoPostal} onChangeText={setCodigoPostal} required />
                </View>

                <View className="flex flex-row items-start w-full">
                  <Checkbox checked={terminos} onChange={setTerminos}>
                    <Span className="text-xs text-stone-600 leading-tight select-none shrink">
                      Acepto los{" "}
                      <Span peso="medium" className="text-[#DAA520]">Términos de Servicio</Span> y la{" "}
                      <Span peso="medium" className="text-[#DAA520]">Política de Privacidad</Span>.
                    </Span>
                  </Checkbox>
                </View>

                <Boton
                  loading={loading}
                  loadingText="Registrando..."
                  className="w-full justify-center mt-2"
                  onClick={handleSubmit}
                >
                  Registrarse
                </Boton>
              </>
            )}

            <P className="text-xs text-stone-500 select-none">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" peso="medium" className="text-[#DAA520] hover:underline transition">Inicia Sesión</Link>
            </P>
          </Section>
        </ScrollView>
      </View>
    </>
  );
}
