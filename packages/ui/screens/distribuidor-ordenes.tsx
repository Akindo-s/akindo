/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { Check, X, Inbox, FileText } from "lucide-react-native";
import type { OrdenPedidoListItem, PedidoActionResult, OrdenPedidoResponse } from "@akindo/shared/types/pedidos";
import { H3, P, Pressable, Section, Span } from "@akindo/ui/html";
import { Boton } from "@akindo/ui/components";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { HeaderSticky } from "@akindo/ui/components/ui/HeaderSticky";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import { useAviso } from "@akindo/ui/components/ui/Avisos";

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function RechazarModal({
  orden,
  onClose,
  onConfirm,
  loading,
}: {
  orden: OrdenPedidoListItem;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  loading: boolean;
}) {
  const [motivo, setMotivo] = useState("");

  return (
    // `fixed` no existe en nativo: ahí `absolute` cubre el área de la pantalla.
    <View className="absolute web:fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 elevation-[50]">
      <Tarjeta className="w-full max-w-md shadow-2xl">
        <H3 peso="bold" className="text-lg text-stone-900 mb-2">Rechazar orden de compra</H3>
        <P className="text-sm text-stone-500 mb-4">
          Estás a punto de rechazar la orden de <Span peso="bold" className="text-sm text-stone-500">{orden.cliente_nombre}</Span>.
          Por favor, indica un motivo (opcional pero recomendado):
        </P>

        <TextInput
          value={motivo}
          onChangeText={setMotivo}
          multiline
          placeholder="Ej: Sin stock suficiente..."
          placeholderTextColor="#A8A29E"
          className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm mb-6 min-h-[100px]"
        />

        <View className="flex flex-row gap-3">
          {/* `w-full shrink`: el original es `w-full` y lo achica el
              `flex-shrink: 1` que CSS trae por defecto y RN no (regla 24). Con
              `flex-1` el reparto sale distinto (128/162 en vez de 135/154). */}
          <Boton variante="secundario" onClick={onClose} className="w-full shrink">
            Cancelar
          </Boton>
          {/* En el original las clases de la instancia pintaban el botón rojo
              relleno (la variante peligro es de borde); el texto va por
              `claseTexto` (regla 25). */}
          <Boton
            variante="peligro"
            onClick={() => onConfirm(motivo)}
            loading={loading}
            // `border-0` y no `border-transparent`: el `border-none` del original
            // quita el borde, no lo pinta transparente (son 2px de alto).
            className="w-full shrink border-0 bg-red-600 hover:bg-red-700"
            claseTexto="text-white"
          >
            Confirmar rechazo
          </Boton>
        </View>
      </Tarjeta>
    </View>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = ["Pendientes", "Aceptadas", "Rechazadas"] as const;
type Tab = (typeof TABS)[number];

export interface DatosOrdenesDistribuidor {
  pendientes: OrdenPedidoListItem[];
  aceptadas: OrdenPedidoListItem[];
  rechazadas: OrdenPedidoListItem[];
}

interface DistribuidorOrdenesProps {
  /** Datos ya cargados. Web los trae del servidor; mobile pasa `null`. */
  datos: DatosOrdenesDistribuidor | null;
  /** Solo mobile: los pide al montar, porque no hay servidor que los precargue. */
  cargarDatos?: () => Promise<DatosOrdenesDistribuidor>;
  aceptarAction: (id: string) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
  rechazarAction: (id: string, motivo?: string) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
}

export default function DistribuidorOrdenes({
  datos: datosIniciales,
  cargarDatos,
  aceptarAction,
  rechazarAction,
}: DistribuidorOrdenesProps) {
  const avisar = useAviso();
  const [tab, setTab] = useState<Tab>("Pendientes");

  const [pendientes, setPendientes] = useState(datosIniciales?.pendientes ?? []);
  const [aceptadas, setAceptadas] = useState(datosIniciales?.aceptadas ?? []);
  const [rechazadas, setRechazadas] = useState(datosIniciales?.rechazadas ?? []);
  const [cargado, setCargado] = useState(datosIniciales !== null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [intento, setIntento] = useState(0);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [ordenARechazar, setOrdenARechazar] = useState<OrdenPedidoListItem | null>(null);

  useEffect(() => {
    if (datosIniciales || !cargarDatos) return;
    let vigente = true;
    setErrorCarga(false);
    cargarDatos().then(
      (recibidos) => {
        if (!vigente) return;
        setPendientes(recibidos.pendientes);
        setAceptadas(recibidos.aceptadas);
        setRechazadas(recibidos.rechazadas);
        setCargado(true);
      },
      () => { if (vigente) setErrorCarga(true); },
    );
    return () => { vigente = false; };
  }, [intento]);

  const mostradas = tab === "Pendientes" ? pendientes : tab === "Aceptadas" ? aceptadas : rechazadas;

  const handleAceptar = async (orden: OrdenPedidoListItem) => {
    setLoadingId(orden.id);
    const res = await aceptarAction(orden.id);
    setLoadingId(null);
    if (!res.ok) {
      avisar(res.error ?? "No se pudo aceptar la orden");
      return;
    }
    setPendientes((p) => p.filter((x) => x.id !== orden.id));
    setAceptadas((a) => [{ ...orden, estado: "aceptada" }, ...a]);
  };

  const handleRechazar = async (motivo: string) => {
    if (!ordenARechazar) return;
    const orden = ordenARechazar;
    setLoadingId(orden.id);
    const res = await rechazarAction(orden.id, motivo);
    setLoadingId(null);
    setOrdenARechazar(null);

    if (!res.ok) {
      avisar(res.error ?? "No se pudo rechazar la orden");
      return;
    }
    setPendientes((p) => p.filter((x) => x.id !== orden.id));
    setRechazadas((r) => [{ ...orden, estado: "rechazada" }, ...r]);
  };

  if (!cargado) {
    return (
      <Section className="mx-auto w-full max-w-5xl px-4 pt-6">
        {errorCarga ? (
          <Tarjeta>
            <P className="text-sm text-stone-500 text-center">No se pudieron cargar las órdenes.</P>
            <Boton variante="secundario" className="mt-3 w-full" onClick={() => setIntento((n) => n + 1)}>
              Volver a intentar
            </Boton>
          </Tarjeta>
        ) : (
          <View className="flex items-center justify-center py-20">
            <Spinner tamano={32} />
          </View>
        )}
      </Section>
    );
  }

  return (
    <>
      {/* indiceFijo 0: el HeaderSticky. */}
      <ContenedorPantalla key="distribuidor-ordenes" indiceFijo={0} className="mx-auto w-full max-w-5xl pb-20">
        <HeaderSticky titulo="Órdenes de Compra" />

        <View className="px-4 pt-8">
          <P className="text-sm text-stone-500 mt-1">
            Las órdenes son propuestas de clientes. Al aceptarlas, se confirma el pago y se convierten en Pedidos.
          </P>
        </View>

        <View className="flex flex-row gap-2 mb-6 border-b border-stone-200 pb-2">
          {TABS.map((t) => {
            const activa = tab === t;
            return (
              <Pressable
                key={t}
                role="button"
                onPress={() => setTab(t)}
                // className fijo y los colores por `style`: este Pressable tiene
                // un `hover:` y cambiarle las clases con el estado hace que
                // nativewind lo "mejore" y en nativo reviente (regla 50).
                className="flex flex-row items-center px-5 py-2.5 rounded-full transition-all hover:bg-stone-100"
                style={{ backgroundColor: activa ? "#1C1917" : "#FFFFFF" }}
              >
                <Span peso="semibold" className={`text-sm ${activa ? "text-white" : "text-stone-500"}`}>{t}</Span>
                {t === "Pendientes" && pendientes.length > 0 && (
                  <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: activa ? "#EF4444" : "#FEE2E2" }}>
                    <Span peso="bold" className={`text-xs ${activa ? "text-white" : "text-red-600"}`}>
                      {pendientes.length}
                    </Span>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* El grid responsive es una fila que envuelve (regla 26). */}
        <View className="flex flex-row flex-wrap -m-2">
          {mostradas.length === 0 ? (
            <View className="w-full p-2">
              <View className="py-16 items-center">
                <View className="mb-4">
                  <Inbox size={48} color="#D6D3D1" />
                </View>
                {/* `text-base leading-6`: el `<p>` del original no traía tamaño y
                    heredaba los 16px/24 del body; un `P` de RN mide 14 (regla 53). */}
                <P peso="medium" className="text-base leading-6 text-stone-500 text-center">No hay órdenes {tab.toLowerCase()}</P>
              </View>
            </View>
          ) : (
            mostradas.map((orden) => (
              <View key={orden.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
                {/* `flex-1` (el `h-full` del original): todas las tarjetas de una
                    fila quedan del alto de la más alta (regla 55). */}
                <Tarjeta className="flex flex-col flex-1">
                  <View className="flex-1">
                    <View className="flex flex-row justify-between items-start mb-3">
                      <View className="shrink">
                        <P peso="bold" className="text-[10px] leading-normal text-stone-400 tracking-[1px] uppercase">
                          Orden #{orden.id.slice(0, 8)}
                        </P>
                        <P peso="bold" className="text-sm text-stone-900 mt-0.5">{orden.cliente_nombre}</P>
                      </View>
                      {orden.pre_autorizado && tab === "Pendientes" && (
                        <View className="bg-green-100 px-2 py-1 rounded-md shrink-0">
                          <Span peso="bold" className="text-[10px] leading-normal text-green-700 uppercase tracking-[0.5px]">
                            Pre-pago
                          </Span>
                        </View>
                      )}
                    </View>

                    {/* `space-y-1.5` → `gap-1.5` (regla 44). */}
                    <View className="flex flex-col gap-1.5 mb-4">
                      <View className="flex flex-row justify-between">
                        <Span className="text-xs text-stone-500">Fecha:</Span>
                        <Span peso="medium" className="text-xs text-stone-800">{formatFecha(orden.created_at)}</Span>
                      </View>
                      {/* Sin `mt-2`: el `space-y-1.5` del original le ganaba por
                          especificidad y la separación real eran los 6px del gap
                          (regla 51). */}
                      <View className="flex flex-row justify-between items-center pt-2 border-t border-stone-100">
                        <Span peso="semibold" className="text-xs text-stone-500">Total a cobrar:</Span>
                        <Span peso="extrabold" className="text-base text-[#C1901D]">${formatMoney(orden.total)}</Span>
                      </View>
                    </View>
                  </View>

                  <View className="flex flex-row gap-2 mt-auto pt-4">
                    {/* El `href` va en el Boton y no en un Link por fuera: en nativo
                        el Pressable del Boton se queda con el toque y el Link nunca se
                        entera (regla 57). */}
                    <View className="flex-1">
                      <Boton
                        href={`/distribuidor/ordenes/${orden.id}`}
                        variante="secundario"
                        className="w-full py-2.5"
                        claseTexto="text-xs"
                        Icono={FileText}
                      >
                        Detalle
                      </Boton>
                    </View>
                    {tab === "Pendientes" && (
                      <>
                        {/* Sin `bg-red-50` ni `text-red-600` de la instancia: en el CSS
                            de Tailwind `.bg-transparent` y `.text-stone-800` de la
                            variante `chip` van después y le ganan, así que en web el
                            botón es transparente y el texto gris (regla 25: medir, no
                            copiar la clase que pierde). */}
                        <Boton
                          variante="chip"
                          className="flex-1 justify-center border-red-200 hover:bg-red-100"
                          onClick={() => setOrdenARechazar(orden)}
                          disabled={loadingId !== null}
                          Icono={X}
                        >
                          Rechazar
                        </Boton>
                        <Boton
                          variante="primario"
                          className="flex-1 w-full py-2.5 shadow-none"
                          claseTexto="text-xs"
                          onClick={() => handleAceptar(orden)}
                          loading={loadingId === orden.id}
                          Icono={Check}
                        >
                          Aceptar
                        </Boton>
                      </>
                    )}
                  </View>
                </Tarjeta>
              </View>
            ))
          )}
        </View>
      </ContenedorPantalla>

      {/* El modal, fuera del ContenedorPantalla: dentro de una tarjeta quedaría
          encerrado en ella (regla 54). */}
      {ordenARechazar && (
        <RechazarModal
          orden={ordenARechazar}
          onClose={() => setOrdenARechazar(null)}
          onConfirm={handleRechazar}
          loading={loadingId === ordenARechazar.id}
        />
      )}
    </>
  );
}
