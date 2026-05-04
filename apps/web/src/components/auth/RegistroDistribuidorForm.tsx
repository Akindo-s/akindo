"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registrarDistribuidor } from "@/lib/api/auth";
import { Titulo } from "@/components/titles";
import { Boton } from "@/components/ui/Boton";
import { ArrowBackIcon } from "@/components/icons/NavigationIcons";
import { EmailIcon, PasswordIcon, AddAPhotoIcon } from "@/components/icons/AuthIcons";
import { Input } from "@/components/inputs";
import { VentanaEmergente } from "@/components/VentanaEmergente";
import { ProgressBar } from "@/components/ui/ProgressBar";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
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
    router.push("/registro");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col bg-white rounded-3xl w-full max-w-md mx-auto shadow-sm select-none max-h-[90vh] overflow-y-auto"
      >
        <header className="sticky top-0 z-10 bg-white w-full flex flex-col items-center px-6 pt-6 pb-3 rounded-t-3xl">
          <div className="relative w-full flex justify-center items-center mb-3">
            <Boton
              variante="secundario"
              Icono={ArrowBackIcon}
              onClick={handleBack}
              type="button"
              className="absolute left-0 rounded-full w-10 h-10 p-0 items-center justify-center"
            />
            <Titulo>Akindo</Titulo>
          </div>
          <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} labels={STEP_LABELS} />
        </header>

        <section className="flex flex-col items-center gap-4 px-6 pb-6 w-full">
          <div className="text-center mb-1">
            <h2 className="text-base font-semibold text-stone-800">
              {step === 0 ? "Crea tu cuenta" : "Datos de tu negocio"}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {step === 0 ? "Únete como distribuidor en Akindo." : "Necesitamos información de tu empresa."}
            </p>
          </div>

          {step === 0 && (
            <>
              <label className="relative flex flex-col items-center justify-center w-24 h-24 border border-dashed border-stone-300 rounded-full cursor-pointer hover:bg-stone-50 transition bg-stone-50/50">
                <input type="file" name="foto" accept="image/*" onChange={handleFileChange} className="hidden" />
                {preview ? (
                  <img src={preview} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <>
                    <AddAPhotoIcon className="text-stone-700 mb-1" size={22} />
                    <span className="text-[10px] text-stone-500 font-medium">Subir Foto</span>
                  </>
                )}
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#DAA520] rounded-full flex items-center justify-center border border-white text-white font-bold text-xs leading-none">+</div>
              </label>

              <div className="flex flex-col gap-3.5 w-full">
                <Input label="Nombre completo" name="nombre" type="text" placeholder="Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                <Input label="Correo Electrónico" name="email" type="email" placeholder="tu@empresa.com" Icono={EmailIcon} value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Input label="Teléfono (opcional)" name="telefono" type="tel" placeholder="+52 55 1234 5678" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                <Input label="Contraseña" name="password" type="password" placeholder="***" Icono={PasswordIcon} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Input label="Confirmar Contraseña" name="confirmPassword" type="password" placeholder="***" Icono={PasswordIcon} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>

              <Boton variante="primario" type="button" onClick={handleNext} className="w-full justify-center mt-2">
                Continuar →
              </Boton>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex flex-col gap-3.5 w-full">
                <Input label="Nombre del negocio" name="nombreNegocio" type="text" placeholder="Distribuidora El Sol S.A." value={nombreNegocio} onChange={(e) => setNombreNegocio(e.target.value)} required />
                <Input label="RFC" name="rfc" type="text" placeholder="XAXX010101000" value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} required />
                <Input label="Calle" name="calle" type="text" placeholder="Av. Insurgentes 123" value={calle} onChange={(e) => setCalle(e.target.value)} required />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Ciudad" name="ciudad" type="text" placeholder="CDMX" value={ciudad} onChange={(e) => setCiudad(e.target.value)} required />
                  <Input label="Estado" name="estado" type="text" placeholder="Jalisco" value={estado} onChange={(e) => setEstado(e.target.value)} required />
                </div>
                <Input label="Código Postal" name="codigoPostal" type="text" placeholder="06600" value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} required />
              </div>

              <div className="flex flex-row items-start gap-2 w-full text-left">
                <input type="checkbox" id="terminos" checked={terminos} onChange={(e) => setTerminos(e.target.checked)} className="mt-1 accent-[#DAA520] cursor-pointer" />
                <label htmlFor="terminos" className="text-xs text-stone-600 leading-tight select-none cursor-pointer">
                  Acepto los{" "}
                  <span className="text-[#DAA520] font-medium">Términos de Servicio</span> y la{" "}
                  <span className="text-[#DAA520] font-medium">Política de Privacidad</span>.
                </label>
              </div>

              <Boton
                type="submit"
                loading={loading}
                loadingText="Registrando..."
                className="w-full justify-center mt-2"
              >
                Registrarse
              </Boton>
            </>
          )}

          <div className="text-xs text-stone-500 select-none">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-[#DAA520] font-medium hover:underline transition">Inicia Sesión</Link>
          </div>
        </section>
      </form>
    </>
  );
}
