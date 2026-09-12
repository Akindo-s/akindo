/** @jsxImportSource nativewind */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Platform, TextInput, View } from "react-native";
import { Truck, Settings, List, HelpCircle, Trash2, Edit3 } from "lucide-react-native";
import useRouter from "@akindo/ui/router";
import { confirmar } from "@akindo/ui/confirmar";
import { H2, H3, H4, P, Section, Span, Pressable } from "@akindo/ui/html";
import { Boton, Checkbox, Parrafo, SubTitulo } from "@akindo/ui/components";
import Avatar from "@akindo/ui/components/ui/Avatar";
import { Badge } from "@akindo/ui/components/ui/Badge";
import { CampoEditable } from "@akindo/ui/components/ui/CampoEditable";
import { EncabezadoPagina } from "@akindo/ui/components/ui/EncabezadoPagina";
import { ItemMenu } from "@akindo/ui/components/ui/ItemMenu";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { useAviso } from "@akindo/ui/components/ui/Avisos";

export interface ClientePerfil {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  imagen_perfil: string | null;
  es_verificado: boolean;
}

export interface DireccionPerfil {
  id: string;
  calle: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  es_predeterminada: boolean;
}

interface DatosDireccion {
  calle: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  es_predeterminada: boolean;
}

interface PerfilProps {
  /** Cliente ya cargado. Web lo trae del servidor; mobile pasa `null`. */
  cliente: ClientePerfil | null;
  /** Solo mobile: pide el perfil al montar, ya que no hay servidor que lo precargue. */
  cargarCliente?: () => Promise<ClientePerfil | null>;
  /** Todas necesitan la sesión: web las pasa como server actions, mobile como loaders. */
  actualizarPerfil: (datos: { email?: string; telefono?: string }) => Promise<boolean>;
  subirImagenPerfil: (archivo: Blob) => Promise<boolean>;
  cargarDirecciones: () => Promise<DireccionPerfil[]>;
  crearDireccion: (datos: DatosDireccion) => Promise<boolean>;
  actualizarDireccion: (id: string, datos: DatosDireccion) => Promise<boolean>;
  eliminarDireccion: (id: string) => Promise<boolean>;
  onLogout: () => Promise<void>;
}

// Valores fijos requeridos
const CIUDAD_DEFAULT = "Mexicali";
const ESTADO_DEFAULT = "Baja California";

/**
 * Una dirección de la lista. Los botones de editar y borrar aparecían en web
 * con el hover de la tarjeta (`opacity-0 group-hover:opacity-100`): en nativo
 * no hay hover ni `group-*`, así que ahí se ven siempre (regla 5).
 */
function TarjetaDireccion({
  dir,
  onEditar,
  onEliminar,
}: {
  dir: DireccionPerfil;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const [acciones, setAcciones] = useState(Platform.OS !== "web");

  return (
    // `Pressable` y no `View`: el hover se lee con onHoverIn/onHoverOut, que es
    // lo único que funciona en las dos plataformas (regla 5). Sin `onPress` no
    // hace nada al tocarla.
    <Pressable
      onHoverIn={() => setAcciones(true)}
      onHoverOut={() => setAcciones(false)}
      className={`border ${dir.es_predeterminada ? "border-yellow-400 bg-yellow-50" : "border-stone-200 bg-white"} p-4 rounded-xl shadow-sm transition-all hover:border-yellow-300 relative`}
    >
      <View className="flex flex-row justify-between items-start mb-1">
        <View className="flex flex-row items-center gap-2">
          <H4 peso="bold" className="text-stone-900 text-sm">Dirección</H4>
          {/* De las clases de la instancia (`text-[9px] px-2 py-0.5 rounded
              font-bold uppercase`) en web solo pesaban las dos últimas: el resto
              perdía contra `text-xs px-3 py-1 rounded-full` del Badge (regla 41).
              `leading-normal` es el interlineado que heredaba del body. */}
          {dir.es_predeterminada && (
            <Badge variante="oro" peso="bold" claseTexto="uppercase leading-normal">Predeterminada</Badge>
          )}
        </View>
        {/* Siguen ocupando su lugar cuando no se ven, como el `opacity-0` de web. */}
        <View className="flex flex-row gap-1" style={{ opacity: acciones ? 1 : 0 }}>
          <Pressable
            role="button"
            accessibilityLabel="Editar dirección"
            onPress={onEditar}
            className="p-1.5 hover:bg-yellow-50 rounded-lg transition"
          >
            <Edit3 size={14} color="#A8A29E" />
          </Pressable>
          <Pressable
            role="button"
            accessibilityLabel="Eliminar dirección"
            onPress={onEliminar}
            className="p-1.5 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={14} color="#A8A29E" />
          </Pressable>
        </View>
      </View>
      <P className="text-xs text-stone-600 leading-relaxed max-w-[85%]">
        {dir.calle}{"\n"}
        {dir.ciudad}, {dir.estado} {dir.codigo_postal}
      </P>
    </Pressable>
  );
}

export default function Perfil({
  cliente: clienteInicial,
  cargarCliente,
  actualizarPerfil,
  subirImagenPerfil,
  cargarDirecciones,
  crearDireccion,
  actualizarDireccion,
  eliminarDireccion,
  onLogout,
}: PerfilProps) {
  const router = useRouter();
  const avisar = useAviso();
  const [cliente, setCliente] = useState<ClientePerfil | null>(clienteInicial);
  const [email, setEmail] = useState(clienteInicial?.email || "");
  const [phone, setPhone] = useState(clienteInicial?.telefono || "");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [mostrarFormDireccion, setMostrarFormDireccion] = useState(false);
  const [direccionAEditar, setDireccionAEditar] = useState<DireccionPerfil | null>(null);

  // Formulario dirección
  const [nuevaCalle, setNuevaCalle] = useState("");
  const [nuevoCP, setNuevoCP] = useState("");
  const [esPredeterminada, setEsPredeterminada] = useState(false);
  const [creandoDireccion, setCreandoDireccion] = useState(false);

  const [direcciones, setDirecciones] = useState<DireccionPerfil[] | undefined>(undefined);
  // El original usaba SWR solo por su `mutate`; acá alcanza con recargar.
  const mutate = useCallback(() => {
    cargarDirecciones().then(setDirecciones, () => setDirecciones([]));
  }, [cargarDirecciones]);

  useEffect(() => { mutate(); }, []);

  const handleLogout = async () => {
    await onLogout();
    // `replace` y no `push`: en expo-router push apilaría otro home (regla 29).
    router.replace("/");
  };

  // Mobile entra sin cliente: lo pide al montar (en web ya vino del servidor).
  const [errorCarga, setErrorCarga] = useState(false);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    if (clienteInicial || !cargarCliente) return;
    let vigente = true;
    setErrorCarga(false);
    const recibir = (datos: ClientePerfil | null) => {
      if (!vigente) return;
      // La API devuelve `null` cuando rechaza el token; sin esto la pantalla se
      // quedaba en "Cargando perfil..." para siempre.
      if (!datos) { setErrorCarga(true); return; }
      setCliente(datos);
      setEmail(datos.email || "");
      setPhone(datos.telefono || "");
    };
    cargarCliente().then(recibir, () => { if (vigente) setErrorCarga(true); });
    return () => { vigente = false; };
  }, [intento]);

  if (!cliente) {
    if (!errorCarga) return <P className="p-4 text-center text-sm text-stone-500">Cargando perfil...</P>;
    return (
      <View className="px-4 pt-4">
        <Tarjeta>
          <P className="text-sm text-stone-500 text-center">No se pudo cargar tu perfil. Puede que tu sesión haya expirado.</P>
          <Boton variante="secundario" className="mt-3 w-full" onClick={() => setIntento((n) => n + 1)}>
            Volver a intentar
          </Boton>
          <Boton variante="peligro" className="mt-3 w-full" onClick={handleLogout}>
            Cerrar sesión
          </Boton>
        </Tarjeta>
      </View>
    );
  }

  const subirFoto = async (archivo: Blob) => {
    const ok = await subirImagenPerfil(archivo);
    if (!ok) avisar("No se pudo actualizar tu foto de perfil");
    return ok;
  };

  const handleSavePhone = async () => {
    setIsSavingPhone(true);
    await actualizarPerfil({ telefono: phone });
    setIsSavingPhone(false);
  };

  const handleCrearOEditarDireccion = async () => {
    setCreandoDireccion(true);

    const payload = {
      calle: nuevaCalle,
      ciudad: CIUDAD_DEFAULT,
      estado: ESTADO_DEFAULT,
      codigo_postal: nuevoCP,
      es_predeterminada: esPredeterminada
    };

    let exito = false;
    if (direccionAEditar) {
      exito = await actualizarDireccion(direccionAEditar.id, payload);
    } else {
      exito = await crearDireccion(payload);
    }

    if (exito) {
      mutate();
      setMostrarFormDireccion(false);
      setDireccionAEditar(null);
      setNuevaCalle("");
      setNuevoCP("");
      setEsPredeterminada(false);
    }
    setCreandoDireccion(false);
  };

  const handleEliminarDireccion = async (id: string) => {
    if (await confirmar("¿Estás seguro de eliminar esta dirección?", "Eliminar dirección")) {
      const exito = await eliminarDireccion(id);
      if (exito) mutate();
    }
  };

  const iniciarEdicion = (dir: DireccionPerfil) => {
    setDireccionAEditar(dir);
    setNuevaCalle(dir.calle);
    setNuevoCP(dir.codigo_postal);
    setEsPredeterminada(dir.es_predeterminada);
    setMostrarFormDireccion(true);
  };

  const cancelarEdicion = () => {
    setMostrarFormDireccion(false);
    setDireccionAEditar(null);
    setNuevaCalle("");
    setNuevoCP("");
    setEsPredeterminada(false);
  };

  return (
    // indiceFijo 0: el encabezado, que en web es `sticky`.
    <ContenedorPantalla key="perfil" indiceFijo={0} className="flex flex-col w-full max-w-2xl mx-auto pb-10">
      <EncabezadoPagina titulo="Perfil" href="/" className="mb-6" />

      {/* Avatar & Name */}
      <Section className="flex flex-col items-center px-4 mb-8">
        <Avatar editable urlPreview={cliente.imagen_perfil} onSubir={subirFoto} />
        <H2 peso="semibold" className="text-xl text-stone-900 mt-2">{cliente.nombre || "Usuario"}</H2>
        <Span className="text-sm text-stone-500 mb-3">
          {cliente.es_verificado ? "Cliente verificado" : "Cliente"}
        </Span>
        <View className="flex flex-row gap-2" />
      </Section>

      {/* Información de contacto */}
      <Section className="px-4 mb-6">
        <Tarjeta>
          <View className="flex flex-row items-center gap-2 mb-4">
            <Settings size={20} color="#CA8A04" />
            <H3 peso="semibold" className="text-lg text-stone-900">Información de contacto</H3>
          </View>
          <View className="flex flex-col gap-4">
            <View>
              {/* `text-md` no existe: en web quedaban los 16px/24 heredados del body. */}
              <SubTitulo peso="bold" className="text-base leading-6 text-stone-500 uppercase tracking-wider mb-1">Correo electrónico</SubTitulo>
              <Parrafo className="text-base leading-6 text-stone-900">{email}</Parrafo>
            </View>
            <CampoEditable
              label="Teléfono"
              value={phone}
              onChange={setPhone}
              onSave={handleSavePhone}
              onCancel={() => setPhone(cliente.telefono || "")}
              isSaving={isSavingPhone}
              type="tel"
              placeholder="No especificado"
            />
          </View>
        </Tarjeta>
      </Section>

      {/* Direcciones de entrega */}
      <Section className="px-4 mb-6">
        <View className="flex flex-row items-center justify-between mb-4 px-1">
          {/* `shrink`: en web el h3 ocupa el ancho que sobra y parte el título en
              dos líneas; en RN nada se encoge (regla 24). */}
          <View className="flex flex-row items-center gap-2 shrink">
            <Truck size={20} color="#CA8A04" />
            <H3 peso="semibold" className="text-lg text-stone-900 shrink">Direcciones de entrega</H3>
          </View>
          <Pressable
            role="button"
            onPress={() => mostrarFormDireccion ? cancelarEdicion() : setMostrarFormDireccion(true)}
          >
            <Span peso="medium" className="text-sm text-yellow-600">
              {mostrarFormDireccion ? "Cancelar" : "+ Agregar nueva"}
            </Span>
          </Pressable>
        </View>

        {mostrarFormDireccion && (
          <Tarjeta className="mb-4 border border-yellow-200">
            {/* Era un <form onSubmit>: en nativo no hay forms, así que envía el Boton. */}
            <View className="flex flex-col gap-3">
              <H4 peso="bold" className="text-sm text-stone-900 mb-1">
                {direccionAEditar ? "Editar dirección" : "Nueva dirección"}
              </H4>

              <View className="flex flex-col gap-1">
                <Span peso="bold" className="text-[10px] leading-normal text-stone-500 uppercase">Calle y número</Span>
                <TextInput
                  placeholder="Ej. Av. Reforma 123"
                  placeholderTextColor="#A8A29E"
                  value={nuevaCalle}
                  onChangeText={setNuevaCalle}
                  className="text-xs p-2.5 border border-stone-200 rounded-lg bg-white"
                />
              </View>

              {/* `grid grid-cols-2 gap-3`: fila con dos flex-1 (regla 26). */}
              <View className="flex flex-row gap-3">
                <View className="flex flex-col gap-1 flex-1">
                  <Span peso="bold" className="text-[10px] leading-normal text-stone-500 uppercase">Ciudad</Span>
                  <TextInput
                    value={CIUDAD_DEFAULT}
                    editable={false}
                    className="text-xs p-2.5 border border-stone-100 rounded-lg bg-stone-50 text-stone-500 cursor-not-allowed"
                  />
                </View>
                <View className="flex flex-col gap-1 flex-1">
                  <Span peso="bold" className="text-[10px] leading-normal text-stone-500 uppercase">Estado</Span>
                  <TextInput
                    value={ESTADO_DEFAULT}
                    editable={false}
                    className="text-xs p-2.5 border border-stone-100 rounded-lg bg-stone-50 text-stone-500 cursor-not-allowed"
                  />
                </View>
              </View>

              <View className="flex flex-col gap-1">
                <Span peso="bold" className="text-[10px] leading-normal text-stone-500 uppercase">Código Postal</Span>
                <TextInput
                  placeholder="21000"
                  placeholderTextColor="#A8A29E"
                  value={nuevoCP}
                  onChangeText={setNuevoCP}
                  keyboardType="number-pad"
                  className="text-xs p-2.5 border border-stone-200 rounded-lg bg-white"
                />
              </View>

              <View className="mt-1 px-1">
                <Checkbox checked={esPredeterminada} onChange={setEsPredeterminada}>
                  <Span peso="medium" className="text-xs text-stone-700 select-none shrink">
                    Establecer como dirección predeterminada
                  </Span>
                </Checkbox>
              </View>

              <View className="flex flex-row gap-2 mt-2">
                <Boton onClick={handleCrearOEditarDireccion} disabled={creandoDireccion} className="flex-1">
                  {creandoDireccion ? "Guardando..." : direccionAEditar ? "Guardar cambios" : "Guardar dirección"}
                </Boton>
              </View>
            </View>
          </Tarjeta>
        )}

        <View className="flex flex-col gap-3">
          {direcciones && direcciones.length > 0 ? (
            direcciones.map((dir) => (
              <TarjetaDireccion
                key={dir.id}
                dir={dir}
                onEditar={() => iniciarEdicion(dir)}
                onEliminar={() => handleEliminarDireccion(dir.id)}
              />
            ))
          ) : (
            <View className="flex flex-col items-center justify-center py-10 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 gap-2">
              <View style={{ opacity: 0.2 }}>
                <Truck size={32} color="#A8A29E" />
              </View>
              <P peso="medium" className="text-xs text-stone-400">No tienes direcciones registradas</P>
            </View>
          )}
        </View>
      </Section>

      {/* Menú de Ajustes */}
      <Section className="px-4 mb-8">
        <Tarjeta conPadding={false} className="overflow-hidden flex flex-col">
          <ItemMenu Icono={List} label="Mis pedidos" href="/pedidos" borde />
          <ItemMenu Icono={Settings} label="Ajustes" href="/ajustes" borde />
          <ItemMenu Icono={HelpCircle} label="Centro de ayuda" href="/ayuda" />
        </Tarjeta>
      </Section>

      {/* Cerrar sesión */}
      <View className="px-4 flex flex-row justify-center mb-8">
        <Boton variante="peligro" onClick={handleLogout}>
          Cerrar sesión
        </Boton>
      </View>
    </ContenedorPantalla>
  );
}
