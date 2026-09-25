/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { Image, TextInput, View } from "react-native";
import { Star, MessageCircle, CheckCircle2, BadgeCheck, MessageSquare, XCircle } from "lucide-react-native";
import type { PedidoResponse, PedidoActionResult } from "@akindo/shared/types/pedidos";
import { H3, P, Pressable, Span } from "@akindo/ui/html";
import { Boton, Link } from "@akindo/ui/components";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { EncabezadoPagina } from "@akindo/ui/components/ui/EncabezadoPagina";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import { ListaProductosPedido } from "@akindo/ui/components/pedidos/ListaProductosPedido";
import { HistorialActualizacionesPedido } from "@akindo/ui/components/pedidos/HistorialActualizacionesPedido";

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

/** Las cinco estrellas, para elegir o para mostrar una valoración. */
function Estrellas({
  puntuacion,
  tamano,
  onElegir,
}: {
  puntuacion: number;
  tamano: number;
  onElegir?: (n: number) => void;
}) {
  // El `hover:scale-110` del original: va por estado porque el className de un
  // Pressable con variante no puede cambiar (reglas 5 y 50).
  const [enHover, setEnHover] = useState(0);

  return (
    <View className={onElegir ? "flex flex-row justify-center gap-2" : "flex flex-row items-center gap-1"}>
      {[1, 2, 3, 4, 5].map((n) => {
        // Las llenas son `fill-amber-400 text-amber-400`; las vacías,
        // `fill-stone-200 text-stone-200` en el formulario y solo el trazo
        // `text-stone-300` en la valoración ya publicada.
        const llena = n <= puntuacion;
        const color = llena ? "#FBBF24" : onElegir ? "#E7E5E4" : "#D6D3D1";
        const relleno = llena ? "#FBBF24" : onElegir ? "#E7E5E4" : "none";
        const estrella = <Star size={tamano} color={color} fill={relleno} />;
        if (!onElegir) return <View key={n}>{estrella}</View>;
        return (
          <Pressable
            key={n}
            role="button"
            accessibilityLabel={`${n} estrellas`}
            onPress={() => onElegir(n)}
            onHoverIn={() => setEnHover(n)}
            onHoverOut={() => setEnHover(0)}
            className="outline-none transition-transform"
            style={enHover === n ? { transform: [{ scale: 1.1 }] } : undefined}
          >
            {estrella}
          </Pressable>
        );
      })}
    </View>
  );
}

function ValoracionForm({ onSubmit, loading }: { onSubmit: (p: number, c: string) => void; loading: boolean }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState("");

  return (
    // Sin el `mb-6` del original: ahí el contenedor era `space-y-6` (márgenes,
    // que colapsan con el del hijo y quedaban 24px), y acá es `gap-6`, que se
    // suma al margen y dejaba 48px (regla 58).
    <Tarjeta variante="calido">
      <H3 peso="bold" className="text-sm text-stone-900 text-center mb-2">¡Califica tu experiencia!</H3>
      <P className="text-xs text-stone-500 text-center mb-4">Tu opinión ayuda al distribuidor y a otros compradores.</P>

      <View className="mb-4">
        <Estrellas puntuacion={puntuacion} tamano={32} onElegir={setPuntuacion} />
      </View>

      {puntuacion > 0 && (
        <View className="flex flex-col gap-3">
          <View className="relative">
            {/* El ícono dentro del campo: el `pl-9` del textarea le deja el lugar. */}
            <View className="absolute left-3 top-3 z-10">
              <MessageCircle size={16} color="#A8A29E" />
            </View>
            <TextInput
              value={comentario}
              onChangeText={setComentario}
              multiline
              placeholder="¿Qué te pareció el pedido?"
              placeholderTextColor="#A8A29E"
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-sm min-h-[80px]"
            />
          </View>
          <Boton variante="primario" className="w-full py-2.5" onClick={() => onSubmit(puntuacion, comentario)} loading={loading}>
            Enviar valoración
          </Boton>
        </View>
      )}
    </Tarjeta>
  );
}

/** Los tres nodos de la línea de tiempo, en orden. */
const PASOS = [
  { label: "Preparando", step: 0 },
  { label: "En camino", step: 1 },
  { label: "Entregado", step: 2 },
] as const;

const ORDEN_ESTADOS = ["pendiente de envio", "en envio", "entregado", "cancelado"];

interface PedidoDetalleProps {
  /** Datos ya cargados. Web los trae del servidor; mobile pasa `null`. */
  pedido: PedidoResponse | null;
  /** Solo mobile: lo pide al montar, porque no hay servidor que lo precargue. */
  cargarPedido?: () => Promise<PedidoResponse | null>;
  /** Publica la valoración. Necesita la sesión, así que la inyecta la app (regla 13). */
  valorarAction: (puntuacion: number, comentario?: string) => Promise<PedidoActionResult>;
}

export default function PedidoDetalle({ pedido: pedidoInicial, cargarPedido, valorarAction }: PedidoDetalleProps) {
  const [pedido, setPedido] = useState<PedidoResponse | null>(pedidoInicial);
  const [errorCarga, setErrorCarga] = useState(false);
  const [intento, setIntento] = useState(0);
  const [loadingVal, setLoadingVal] = useState(false);
  const [distribuidorEnHover, setDistribuidorEnHover] = useState(false);

  useEffect(() => {
    if (pedidoInicial || !cargarPedido) return;
    let vigente = true;
    setErrorCarga(false);
    cargarPedido().then(
      (recibido) => {
        if (!vigente) return;
        if (recibido) setPedido(recibido);
        else setErrorCarga(true);
      },
      () => { if (vigente) setErrorCarga(true); },
    );
    return () => { vigente = false; };
  }, [intento]);

  const handleValorar = async (puntuacion: number, comentario: string) => {
    if (!pedido) return;
    setLoadingVal(true);
    const resultado = await valorarAction(puntuacion, comentario);
    setLoadingVal(false);
    if (resultado.ok) setPedido({ ...pedido, tiene_valoracion: true });
  };

  if (!pedido) {
    // En web, si el pedido no existe el `page.tsx` redirige a `/pedidos` antes
    // de pintar; el original traía además esta pantalla de error (inalcanzable
    // por el redirect), que es la que sirve en mobile, donde el pedido se pide
    // desde la pantalla.
    return (
      <ContenedorPantalla key="pedido-detalle-cargando" indiceFijo={0} className="mx-auto flex w-full max-w-lg flex-col pb-20">
        <EncabezadoPagina titulo="Pedido" href="/pedidos" />
        {errorCarga ? (
          <View className="flex flex-col items-center justify-center px-4 pt-16">
            <View className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <XCircle size={32} color="#EF4444" />
            </View>
            <H3 peso="bold" className="text-xl text-stone-900 mb-2 text-center">No pudimos encontrar el pedido</H3>
            <P className="text-sm text-stone-500 max-w-xs mb-6 text-center">
              Es posible que el enlace haya expirado o que no tengas permisos para ver este detalle.
            </P>
            <Boton variante="secundario" onClick={() => setIntento((n) => n + 1)}>Volver a intentar</Boton>
            <Link href="/pedidos" bloque className="mt-2 hover:underline">
              <Span peso="semibold" className="text-sm text-[#C1901D]">Volver a mis pedidos</Span>
            </Link>
          </View>
        ) : (
          <View className="flex items-center justify-center py-20">
            <Spinner tamano={32} />
          </View>
        )}
      </ContenedorPantalla>
    );
  }

  const pasoActual = ORDEN_ESTADOS.indexOf(pedido.estado);

  return (
    // indiceFijo 0: el encabezado.
    <ContenedorPantalla key="pedido-detalle" indiceFijo={0} className="mx-auto flex w-full max-w-lg flex-col pb-20">
      <EncabezadoPagina titulo={`Pedido #${pedido.id.slice(0, 8)}`} href="/pedidos" />

      {/* `space-y-6` → `gap-6` (regla 44). */}
      <View className="px-4 pt-4 flex flex-col gap-6">
        {/* Línea de tiempo */}
        {pedido.estado !== "cancelado" && (
          <View className="bg-white rounded-2xl p-5 border border-stone-100 drop-shadow-sm">
            <View className="relative flex flex-row justify-between">
              {/* La línea de fondo y la de avance. Van antes que los nodos: en
                  nativo un hermano posterior se pinta encima (regla 43). */}
              <View className="absolute top-4 left-4 right-4 h-0.5 bg-stone-100" />
              <View
                className="absolute top-4 left-4 h-0.5 bg-[#DAA520]"
                style={{ width: `${(Math.max(pasoActual, 0) / 2) * 100}%` }}
              />

              {PASOS.map((paso) => {
                const pasado = pasoActual >= paso.step;
                const actual = pasoActual === paso.step;
                return (
                  <View key={paso.step} className="relative z-10 flex flex-col items-center gap-2">
                    <View
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        pasado ? "bg-[#DAA520] border-[#DAA520]" : "bg-white border-stone-200"
                      }`}
                    >
                      {pasado ? (
                        <CheckCircle2 size={16} color="#FFFFFF" />
                      ) : (
                        <View className="w-2 h-2 rounded-full bg-stone-200" />
                      )}
                    </View>
                    <Span
                      peso="semibold"
                      className={`text-[10px] leading-normal uppercase tracking-[0.5px] ${
                        actual ? "text-[#C1901D]" : pasado ? "text-stone-800" : "text-stone-400"
                      }`}
                    >
                      {paso.label}
                    </Span>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Valoración (entregado y sin valorar) */}
        {pedido.estado === "entregado" && !pedido.tiene_valoracion && (
          <ValoracionForm onSubmit={handleValorar} loading={loadingVal} />
        )}

        {/* Distribuidor */}
        <View>
          <P peso="semibold" className="text-xs text-stone-500 uppercase tracking-[0.3px] mb-2">Vendido por</P>
          <Link href={`/mercado/distribuidor/tienda?d=${pedido.distribuidor_id}`} bloque onHoverChange={setDistribuidorEnHover}>
            <Tarjeta conPadding={false} className={`p-3 ${distribuidorEnHover ? "border-stone-200" : ""}`}>
              <View className="flex flex-row items-center gap-3">
                <View className="w-11 h-11 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center shrink-0">
                  {pedido.distribuidor_imagen ? (
                    <Image
                      source={{ uri: pedido.distribuidor_imagen }}
                      accessibilityLabel={pedido.distribuidor_nombre ?? "Distribuidor"}
                      resizeMode="cover"
                      className="w-full h-full"
                    />
                  ) : (
                    <Span peso="bold" className="text-base leading-normal text-amber-700">
                      {pedido.distribuidor_nombre?.charAt(0) ?? "D"}
                    </Span>
                  )}
                </View>
                <View className="flex-1 min-w-0 shrink">
                  <View className="flex flex-row items-center gap-1.5">
                    <P peso="bold" numberOfLines={1} className="text-sm text-stone-900 shrink">{pedido.distribuidor_nombre}</P>
                    {pedido.distribuidor_verificado && <BadgeCheck size={15} color="#DAA520" />}
                  </View>
                  <P className="text-xs text-stone-500">
                    {pedido.distribuidor_verificado ? "Distribuidor verificado" : "Distribuidor"}
                  </P>
                </View>
              </View>
            </Tarjeta>
          </Link>
        </View>

        <ListaProductosPedido productos={pedido.paquetes} conLinks />

        <HistorialActualizacionesPedido actualizaciones={pedido.actualizaciones} titulo="Historial del pedido" />

        {/* La valoración ya publicada */}
        {pedido.valoracion && (
          <View>
            <P peso="semibold" className="text-xs text-stone-500 uppercase tracking-[0.3px] mb-3">Valoración del pedido</P>
            <Tarjeta className="bg-stone-50 border-stone-200">
              <View className="mb-2">
                <Estrellas puntuacion={pedido.valoracion.puntuacion} tamano={16} />
              </View>
              {pedido.valoracion.comentario && (
                <View className="flex flex-row gap-2">
                  <View className="mt-1 shrink-0">
                    <MessageSquare size={14} color="#A8A29E" />
                  </View>
                  <P className="text-sm text-stone-700 italic shrink">
                    "{pedido.valoracion.comentario}"
                  </P>
                </View>
              )}
              <P peso="medium" className="text-[10px] leading-normal text-stone-400 mt-3">
                Publicada el {formatFecha(pedido.valoracion.created_at)}
              </P>
            </Tarjeta>
          </View>
        )}
      </View>
    </ContenedorPantalla>
  );
}
