/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { Image, TextInput, View } from "react-native";
import { Check, X, User, Info, AlertCircle } from "lucide-react-native";
import type { OrdenPedidoResponse, PedidoActionResult } from "@akindo/shared/types/pedidos";
import { H3, P, Section, Span } from "@akindo/ui/html";
import { Boton } from "@akindo/ui/components";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { Badge } from "@akindo/ui/components/ui/Badge";
import { HeaderSticky } from "@akindo/ui/components/ui/HeaderSticky";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import { useAviso } from "@akindo/ui/components/ui/Avisos";
import { ListaProductosPedido } from "@akindo/ui/components/pedidos/ListaProductosPedido";
import { ResumenFinancieroPedido } from "@akindo/ui/components/pedidos/ResumenFinancieroPedido";
import useRouter from "@akindo/ui/router";

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

const VARIANTE_ESTADO = {
  pendiente: "advertencia",
  aceptada: "exito",
} as const;

interface DistribuidorOrdenDetalleProps {
  /** Datos ya cargados. Web los trae del servidor; mobile pasa `null`. */
  orden: OrdenPedidoResponse | null;
  /** Solo mobile: la pide al montar, porque no hay servidor que la precargue. */
  cargarOrden?: () => Promise<OrdenPedidoResponse | null>;
  aceptarAction: (id: string) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
  rechazarAction: (id: string, motivo?: string) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
}

export default function DistribuidorOrdenDetalle({
  orden: ordenInicial,
  cargarOrden,
  aceptarAction,
  rechazarAction,
}: DistribuidorOrdenDetalleProps) {
  const router = useRouter();
  const avisar = useAviso();
  const [orden, setOrden] = useState<OrdenPedidoResponse | null>(ordenInicial);
  const [errorCarga, setErrorCarga] = useState(false);
  const [intento, setIntento] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalRechazo, setModalRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  useEffect(() => {
    if (ordenInicial || !cargarOrden) return;
    let vigente = true;
    setErrorCarga(false);
    cargarOrden().then(
      (recibida) => {
        if (!vigente) return;
        if (recibida) setOrden(recibida);
        else setErrorCarga(true);
      },
      () => { if (vigente) setErrorCarga(true); },
    );
    return () => { vigente = false; };
  }, [intento]);

  const handleAceptar = async () => {
    if (!orden) return;
    setLoading(true);
    const res = await aceptarAction(orden.id);
    setLoading(false);
    if (!res.ok) {
      avisar(res.error ?? "No se pudo aceptar la orden");
      return;
    }
    // En web esto era `router.refresh()`: el servidor devolvía la orden ya
    // aceptada. Acá lo resuelve la pantalla, que es la que tiene los datos.
    setOrden({ ...orden, estado: "aceptada" });
    // Si era pre-autorizado, se convirtió en pedido.
    if (orden.pre_autorizado) router.push("/distribuidor/pedidos" as never);
  };

  const handleRechazar = async () => {
    if (!orden) return;
    setLoading(true);
    const res = await rechazarAction(orden.id, motivoRechazo);
    setLoading(false);
    if (!res.ok) {
      avisar(res.error ?? "No se pudo rechazar la orden");
      return;
    }
    setModalRechazo(false);
    setOrden({ ...orden, estado: "rechazada" });
  };

  if (!orden) {
    return (
      <ContenedorPantalla key="dist-orden-cargando" indiceFijo={0} className="flex flex-col min-h-screen bg-[#FAF7F2] pb-24">
        <HeaderSticky titulo="Orden" />
        {errorCarga ? (
          <View className="px-4 pt-16 flex flex-col items-center">
            <View className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <X size={32} color="#EF4444" />
            </View>
            <H3 peso="bold" className="text-xl text-stone-900 mb-2 text-center">No pudimos encontrar la orden</H3>
            <Boton variante="secundario" onClick={() => setIntento((n) => n + 1)}>Volver a intentar</Boton>
          </View>
        ) : (
          <View className="flex items-center justify-center py-20">
            <Spinner tamano={32} />
          </View>
        )}
      </ContenedorPantalla>
    );
  }

  const pendiente = orden.estado === "pendiente";

  return (
    <>
      {/* indiceFijo 0: el HeaderSticky. */}
      <ContenedorPantalla key="dist-orden" indiceFijo={0} className="flex flex-col min-h-screen bg-[#FAF7F2] pb-24">
        <HeaderSticky titulo={`Orden #${orden.id.slice(0, 8)}`} />

        {/* `space-y-6` → `gap-6` (regla 44). */}
        <View className="flex-1 w-full max-w-2xl mx-auto p-4 flex flex-col gap-6">
          {/* Estado y acciones */}
          <Tarjeta className="relative overflow-hidden border-stone-200/60 shadow-sm">
            <View className="flex flex-col gap-4">
              <View className="flex flex-row justify-between items-start">
                <View className="shrink">
                  <P peso="bold" className="text-[10px] leading-normal text-stone-500 uppercase tracking-[1px] mb-1">Estado de la Orden</P>
                  <View className="flex flex-row items-center gap-2">
                    <Badge
                      variante={VARIANTE_ESTADO[orden.estado as keyof typeof VARIANTE_ESTADO] ?? "error"}
                      peso="bold"
                      claseTexto="capitalize text-xs"
                    >
                      {orden.estado}
                    </Badge>
                    {/* `shrink` en el badge y en su texto: en web el badge se encoge
                        y el texto pasa a dos renglones cuando no cabe; en RN nada se
                        encoge solo (regla 24). */}
                    {orden.pre_autorizado && (
                      <Badge variante="exito" peso="bold" className="shrink" claseTexto="text-[10px] leading-normal uppercase shrink">
                        Pre-pago Autorizado
                      </Badge>
                    )}
                  </View>
                </View>
                {/* `native:shrink-0`: en web el bloque del total se encoge como en el
                    original; en nativo, encogerlo parte el precio en dos renglones
                    ("$17,880." / "00"), así que ahí no se encoge y lo que cede es la
                    columna de los badges. */}
                <View className="items-end shrink native:shrink-0">
                  <P peso="bold" className="text-[10px] leading-normal text-stone-500 uppercase tracking-[1px] mb-1">Total</P>
                  {/* `font-black` (900): la familia llega a 800, igual que en web. */}
                  <P peso="extrabold" className="text-2xl text-[#C1901D]">${formatMoney(orden.total)}</P>
                </View>
              </View>

              {pendiente && (
                <View className="flex flex-row gap-3 pt-2">
                  <Boton
                    variante="chip"
                    className="flex-1 shrink bg-white border-stone-200 hover:bg-stone-50"
                    onClick={() => setModalRechazo(true)}
                    disabled={loading}
                    Icono={X}
                  >
                    Rechazar
                  </Boton>
                  <Boton
                    variante="primario"
                    className="flex-1 shrink shadow-lg"
                    onClick={handleAceptar}
                    loading={loading}
                    Icono={Check}
                    iconoSize={16}
                  >
                    Aceptar Orden
                  </Boton>
                </View>
              )}
            </View>
          </Tarjeta>

          {/* Cliente */}
          <Section className="flex flex-col gap-2">
            <P peso="semibold" className="text-xs text-stone-500 uppercase tracking-[0.3px]">Información del Cliente</P>
            {/* Sin `p-4`: en web el `p-5` de la Tarjeta le gana por orden del CSS
                (regla 41), y con el padding chico la tarjeta mide distinto. */}
            <Tarjeta className="flex flex-row items-center gap-4 border-stone-200/60">
              <View className="w-12 h-12 rounded-full bg-[#FDF3D7] flex items-center justify-center shrink-0 overflow-hidden border border-stone-200">
                {orden.cliente_imagen ? (
                  <Image
                    source={{ uri: orden.cliente_imagen }}
                    accessibilityLabel={orden.cliente_nombre ?? ""}
                    resizeMode="cover"
                    className="w-full h-full"
                  />
                ) : (
                  <User size={24} color="#C1901D" />
                )}
              </View>
              <View className="flex-1 min-w-0 shrink">
                <P peso="bold" numberOfLines={1} className="text-sm text-stone-900">{orden.cliente_nombre || "Cliente Akindo"}</P>
                <P numberOfLines={1} className="text-xs text-stone-500">{orden.cliente_email || "Sin email registrado"}</P>
                <P className="text-[10px] leading-normal text-stone-400 mt-0.5 italic">Recibida el {formatFecha(orden.created_at)}</P>
              </View>
            </Tarjeta>
          </Section>

          <ResumenFinancieroPedido total={orden.total} comision={0} esDistribuidor />

          {orden.pre_autorizado && (
            <View className="flex flex-row items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
              <View className="shrink-0">
                <Info size={16} color="#16A34A" />
              </View>
              {/* Los `**` del original se ven tal cual: no es markdown, es texto. */}
              <P peso="medium" className="text-[10px] leading-tight text-green-700 shrink">
                Esta orden tiene un **pago pre-autorizado**. Al aceptarla, el cobro se procesará automáticamente y se generará el pedido de envío.
              </P>
            </View>
          )}

          <ListaProductosPedido productos={orden.paquetes} titulo="Productos en la Orden" conLinks />

          {/* Ayuda */}
          <View className="pt-4">
            <View className="p-4 rounded-2xl bg-stone-100/50 border border-stone-200/40 items-center">
              <View className="mb-2">
                <AlertCircle size={20} color="#A8A29E" />
              </View>
              <P className="text-xs text-stone-500 max-w-[280px] text-center leading-relaxed">
                ¿Tienes problemas con esta orden? Contacta a soporte Akindo para asistencia con inventario o pagos.
              </P>
            </View>
          </View>
        </View>
      </ContenedorPantalla>

      {/* El modal, fuera del ContenedorPantalla (regla 54). */}
      {modalRechazo && (
        <View className="absolute web:fixed inset-0 z-50 flex items-center justify-center bg-black/60 web:backdrop-blur-sm p-4 elevation-[50]">
          <Tarjeta className="w-full max-w-md shadow-2xl">
            <H3 peso="bold" className="text-lg text-stone-900 mb-2">Rechazar orden de compra</H3>
            <P className="text-sm text-stone-500 mb-4 leading-relaxed">
              Indica el motivo por el cual no puedes procesar esta orden. Se le notificará al cliente.
            </P>

            <TextInput
              value={motivoRechazo}
              onChangeText={setMotivoRechazo}
              multiline
              placeholder="Ej: No contamos con stock suficiente de uno de los artículos..."
              placeholderTextColor="#A8A29E"
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm mb-6 min-h-[120px]"
            />

            <View className="flex flex-row gap-3">
              {/* `shrink`: en web los encoge el flex-shrink que RN no trae (regla 60). */}
              <Boton variante="secundario" onClick={() => setModalRechazo(false)} className="flex-1 shrink bg-white" disabled={loading}>
                Cancelar
              </Boton>
              <Boton
                variante="peligro"
                onClick={handleRechazar}
                loading={loading}
                // `border-0`: el `border-none` del original quita el borde (regla 61).
                className="flex-1 shrink border-0 bg-red-600 hover:bg-red-700"
                claseTexto="text-white"
              >
                Confirmar
              </Boton>
            </View>
          </Tarjeta>
        </View>
      )}
    </>
  );
}
