/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { Image, TextInput, View } from "react-native";
import {
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  MessageCircle,
  AlertCircle,
  Star,
} from "lucide-react-native";
import type { PedidoResponse, EstadoPedido, PedidoActionResult } from "@akindo/shared/types/pedidos";
import { H3, P, Span } from "@akindo/ui/html";
import { Boton } from "@akindo/ui/components";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { Selector } from "@akindo/ui/components/ui/Selector";
import { HeaderSticky } from "@akindo/ui/components/ui/HeaderSticky";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import { ListaProductosPedido } from "@akindo/ui/components/pedidos/ListaProductosPedido";
import { HistorialActualizacionesPedido } from "@akindo/ui/components/pedidos/HistorialActualizacionesPedido";
import { ResumenFinancieroPedido } from "@akindo/ui/components/pedidos/ResumenFinancieroPedido";

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

const ESTADOS_DISPONIBLES: { etiqueta: string; valor: EstadoPedido }[] = [
  { etiqueta: "Pendiente de Envío", valor: "pendiente de envio" },
  { etiqueta: "En Envío", valor: "en envio" },
  { etiqueta: "Entregado", valor: "entregado" },
  { etiqueta: "Cancelado", valor: "cancelado" },
];

/** La API manda más campos de los que declara el tipo compartido. */
type DireccionCompleta = {
  numero_exterior?: string;
  colonia?: string;
  municipio?: string;
};

/** La dirección de entrega, armada como en el original. */
function textoDireccion(pedido: PedidoResponse) {
  const dir = pedido.direccion_entrega;
  if (!dir) return "—";
  const extra = dir as typeof dir & DireccionCompleta;
  const partes = [
    extra.numero_exterior ? `${dir.calle}, ${extra.numero_exterior}` : dir.calle,
    extra.colonia,
    extra.municipio,
    dir.estado,
    `CP ${dir.codigo_postal}`,
  ];
  return partes.filter(Boolean).join(", ");
}

interface DistribuidorPedidoDetalleProps {
  /** Datos ya cargados. Web los trae del servidor; mobile pasa `null`. */
  pedido: PedidoResponse | null;
  /** Solo mobile: lo pide al montar, porque no hay servidor que lo precargue. */
  cargarPedido?: () => Promise<PedidoResponse | null>;
  /** Cambia el estado del pedido. Necesita la sesión, así que la inyecta la app (regla 13). */
  actualizarEstadoAction: (estado: EstadoPedido, descripcion?: string) => Promise<PedidoActionResult<PedidoResponse>>;
}

export default function DistribuidorPedidoDetalle({
  pedido: pedidoInicial,
  cargarPedido,
  actualizarEstadoAction,
}: DistribuidorPedidoDetalleProps) {
  const [pedido, setPedido] = useState<PedidoResponse | null>(pedidoInicial);
  const [errorCarga, setErrorCarga] = useState(false);
  const [intento, setIntento] = useState(0);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoPedido | null>(pedidoInicial?.estado ?? null);
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pedidoInicial || !cargarPedido) return;
    let vigente = true;
    setErrorCarga(false);
    cargarPedido().then(
      (recibido) => {
        if (!vigente) return;
        if (recibido) {
          setPedido(recibido);
          setNuevoEstado(recibido.estado);
        } else setErrorCarga(true);
      },
      () => { if (vigente) setErrorCarga(true); },
    );
    return () => { vigente = false; };
  }, [intento]);

  const handleActualizar = async () => {
    if (!pedido || !nuevoEstado) return;
    if (nuevoEstado === pedido.estado && !descripcion) return;
    setLoading(true);
    setError(null);
    const res = await actualizarEstadoAction(nuevoEstado, descripcion);
    setLoading(false);
    if (res.ok && res.data) {
      setPedido(res.data);
      setDescripcion("");
    } else {
      setError(res.error ?? "No se pudo actualizar el estado");
    }
  };

  if (!pedido) {
    return (
      <ContenedorPantalla key="dist-pedido-cargando" indiceFijo={0} className="mx-auto flex w-full max-w-2xl flex-col pb-20">
        <HeaderSticky titulo="Pedido" />
        {errorCarga ? (
          <View className="px-4 pt-16 flex flex-col items-center">
            <View className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <XCircle size={32} color="#EF4444" />
            </View>
            <H3 peso="bold" className="text-xl text-stone-900 mb-2 text-center">No pudimos encontrar el pedido</H3>
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

  const finalizado = pedido.estado === "entregado" || pedido.estado === "cancelado";
  const sinCambios = nuevoEstado === pedido.estado && !descripcion;

  return (
    // indiceFijo 0: el HeaderSticky.
    <ContenedorPantalla key="dist-pedido" indiceFijo={0} className="mx-auto flex w-full max-w-2xl flex-col pb-20">
      <HeaderSticky titulo={`Pedido #${pedido.id.slice(0, 8)}`} />

      {/* `space-y-6` → `gap-6` (regla 44). */}
      <View className="px-4 pt-4 flex flex-col gap-6">
        {/* Actualizar estado, solo si el pedido sigue abierto */}
        {!finalizado ? (
          <Tarjeta className="border-l-4 border-l-[#DAA520] shadow-md">
            <View className="flex flex-row items-center gap-2 mb-4">
              <AlertCircle size={18} color="#C1901D" />
              <H3 peso="bold" className="text-sm text-stone-900 uppercase tracking-[-0.35px]">Actualizar Estado</H3>
            </View>

            {/* El grid de dos columnas desde sm: acá alcanza con una columna
                que pasa a fila (los `-m`/`p` de la regla 26 harían falta solo
                si hubiera más de dos celdas por renglón). */}
            <View className="flex flex-col sm:flex-row gap-4">
              <View className="sm:flex-1">
                <View className="flex flex-col gap-2">
                  {/* `leading-6`: el original era un `<label>`, que es inline, así que su
                      renglón lo marcaba el strut de 24px del contenedor (16px × 1.5) y no
                      los 15px de su propio texto de 10px. Un `<p>` del mismo tamaño sí
                      mide 15 (ahí va `leading-normal`, regla 19). */}
                  <Span peso="bold" className="text-[10px] leading-6 text-stone-400 uppercase tracking-[0.5px]">Nuevo Estado</Span>
                  <Selector
                    modo="simple"
                    opciones={ESTADOS_DISPONIBLES}
                    valor={nuevoEstado ?? pedido.estado}
                    onChange={setNuevoEstado}
                    accessibilityLabel="Nuevo estado del pedido"
                    claseCaja="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5"
                    claseTexto="text-sm text-stone-800"
                  />
                </View>
              </View>

              <View className="sm:flex-1">
                <View className="flex flex-col gap-2">
                  <Span peso="bold" className="text-[10px] leading-6 text-stone-400 uppercase tracking-[0.5px]">Nota de actualización (opcional)</Span>
                  <View className="relative">
                    {/* El ícono dentro del campo: el `pl-10` le deja el lugar. */}
                    <View className="absolute left-3 top-3 z-10">
                      <MessageCircle size={16} color="#D6D3D1" />
                    </View>
                    <TextInput
                      value={descripcion}
                      onChangeText={setDescripcion}
                      multiline
                      placeholder="Ej: El repartidor está en camino..."
                      placeholderTextColor="#A8A29E"
                      className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm min-h-[44px]"
                    />
                  </View>
                </View>
              </View>
            </View>

            <View className="mt-4 flex flex-row justify-end">
              {/* `w-full`: en el CSS de Tailwind `.w-fit` va antes que `.w-full`, así que
                  en web gana el `w-full` de la variante y el botón ocupa todo el ancho;
                  el `twMerge` del Boton compartido deja el `w-fit` de la base, así que
                  hay que pedirlo en la instancia (ver regla 41, corregida). */}
              <Boton onClick={handleActualizar} loading={loading} disabled={sinCambios} className="w-full px-8 drop-shadow-sm">
                Guardar Cambios
              </Boton>
            </View>
            {error && (
              <View className="flex flex-row items-center gap-1 mt-2">
                <XCircle size={12} color="#EF4444" />
                <P peso="medium" className="text-xs text-red-500 shrink">{error}</P>
              </View>
            )}
          </Tarjeta>
        ) : (
          <View className="bg-green-50 border border-green-100 rounded-2xl p-4 flex flex-row items-center gap-3">
            <CheckCircle2 size={20} color="#16A34A" />
            <View className="shrink">
              <P peso="bold" className="text-sm text-green-900">Pedido Finalizado</P>
              <P className="text-xs text-green-700">Este pedido ya se encuentra en estado {pedido.estado}.</P>
            </View>
          </View>
        )}

        {/* Cliente y resumen: el grid de dos columnas desde md. */}
        <View className="flex flex-col md:flex-row gap-12">
          <View className="md:flex-1 flex flex-col gap-2">
              <P peso="semibold" className="text-xs text-stone-500 uppercase tracking-[0.3px]">Información del Cliente</P>
              {/* `md:flex-1` (el `h-full` del original): la tarjeta llena la celda
                  solo cuando las dos van en fila. En columna, un `flex-1` con el alto
                  del padre automático colapsa la tarjeta en nativo (regla 59). */}
              <Tarjeta className="md:flex-1">
                <View className="flex flex-row items-center gap-3 mb-4">
                  <View className="w-12 h-12 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center border-2 border-stone-100">
                    {pedido.cliente_imagen ? (
                      <Image
                        source={{ uri: pedido.cliente_imagen }}
                        accessibilityLabel={pedido.cliente_nombre ?? ""}
                        resizeMode="cover"
                        className="w-full h-full"
                      />
                    ) : (
                      <User size={24} color="#A8A29E" />
                    )}
                  </View>
                  <View className="shrink">
                    <P peso="bold" className="text-sm text-stone-900">{pedido.cliente_nombre || "Cliente Akindo"}</P>
                    <P className="text-xs text-stone-500">ID: {pedido.cliente_id?.slice(0, 8)}</P>
                  </View>
                </View>

                <View className="flex flex-col gap-3 pt-3 border-t border-stone-50">
                  <View className="flex flex-row gap-2 p-3 bg-[#FFFBF0] rounded-2xl border border-[#FDF3D7]">
                    <View className="shrink-0 mt-0.5">
                      <MapPin size={18} color="#C1901D" />
                    </View>
                    <View className="shrink">
                      <P peso="bold" className="text-[10px] leading-normal text-[#9E7517] uppercase tracking-[0.25px]">Dirección de Entrega</P>
                      <P peso="bold" className="text-sm text-stone-800 leading-relaxed">{textoDireccion(pedido)}</P>
                    </View>
                  </View>
                  <View className="flex flex-row gap-2">
                    <View className="shrink-0 mt-0.5">
                      <Calendar size={16} color="#A8A29E" />
                    </View>
                    <View className="shrink">
                      <P peso="bold" className="text-[10px] leading-normal text-stone-400 uppercase">Fecha del Pedido</P>
                      <P className="text-xs text-stone-700">{formatFecha(pedido.confirmado_at)}</P>
                    </View>
                  </View>
                </View>
            </Tarjeta>
          </View>

          <View className="md:flex-1">
            <ResumenFinancieroPedido total={pedido.total} comision={pedido.comision_servicio} esDistribuidor />
          </View>
        </View>

        {/* Valoración del cliente */}
        {pedido.tiene_valoracion && pedido.valoracion && (
          <View className="flex flex-col gap-2">
            <P peso="semibold" className="text-xs text-stone-500 uppercase tracking-[0.3px]">Valoración del Cliente</P>
            <Tarjeta className="bg-amber-50/30 border-amber-100/50">
              <View className="flex flex-row items-start gap-4">
                <View className="bg-white p-3 rounded-2xl drop-shadow-sm border border-amber-100 min-w-[60px] items-center">
                  <P peso="extrabold" className="text-2xl text-amber-600 leading-none">{pedido.valoracion.puntuacion}</P>
                  <View className="flex flex-row justify-center gap-0.5 mt-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={8}
                        color={s <= pedido.valoracion!.puntuacion ? "#FBBF24" : "#E7E5E4"}
                        fill={s <= pedido.valoracion!.puntuacion ? "#FBBF24" : "none"}
                      />
                    ))}
                  </View>
                </View>
                <View className="flex-1 shrink">
                  <P peso="bold" className="text-xs text-stone-800 mb-1">Comentario:</P>
                  <P className="text-sm text-stone-600 leading-relaxed italic">
                    "{pedido.valoracion.comentario || "Sin comentarios adicionales."}"
                  </P>
                  <P peso="medium" className="text-[10px] leading-normal text-stone-400 mt-2 uppercase tracking-[-0.25px]">
                    Recibida el {formatFecha(pedido.valoracion.created_at)}
                  </P>
                </View>
              </View>
            </Tarjeta>
          </View>
        )}

        <ListaProductosPedido productos={pedido.paquetes} titulo="Productos solicitados" conLinks />

        <HistorialActualizacionesPedido actualizaciones={pedido.actualizaciones} />
      </View>
    </ContenedorPantalla>
  );
}
