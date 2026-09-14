/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { View } from "react-native";
import { Star, MessageSquare, Calendar, User, Package, ExternalLink } from "lucide-react-native";
import type { ValoracionResponse } from "@akindo/shared/types/pedidos";
import { P, Span } from "@akindo/ui/html";
import { Boton, Link } from "@akindo/ui/components";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { HeaderSticky } from "@akindo/ui/components/ui/HeaderSticky";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const MENSAJES_FEEDBACK = [
  { threshold: 4.5, text: "¡Excelente! Tus clientes están encantados con tu servicio." },
  { threshold: 4.0, text: "Buen trabajo. Sigue brindando un gran servicio para mantener tu puntuación." },
  { threshold: 3.0, text: "Vas por buen camino, pero hay margen para mejorar la experiencia de tus clientes." },
  { threshold: 0.0, text: "Atención: Te recomendamos revisar los comentarios para mejorar la satisfacción de tus clientes." },
];

function getFeedbackMessage(promedio: number) {
  return MENSAJES_FEEDBACK.find((m) => promedio >= m.threshold)?.text || "";
}

/**
 * Fila de cinco estrellas. `fill` además de `color`: en nativo `currentColor`
 * sale negro, y la clase `fill-amber-400` del original no llega a un Svg.
 */
function Estrellas({ puntuacion, tamano, vacia }: { puntuacion: number; tamano: number; vacia: string }) {
  return (
    <View className="flex flex-row items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        const llena = s <= puntuacion;
        return (
          <Star
            key={s}
            size={tamano}
            // amber-400 llena; stone-300 o stone-200 vacía, sin relleno.
            color={llena ? "#FBBF24" : vacia}
            fill={llena ? "#FBBF24" : "none"}
          />
        );
      })}
    </View>
  );
}

/**
 * "Ver Pedido #…". El `group-hover:rotate-12` del ícono y el color de hover del
 * texto no existen en nativo: van por estado con `onHoverChange` (reglas 5 y
 * 47), y el className del Link queda fijo (regla 50).
 */
function EnlacePedido({ pedidoId }: { pedidoId: string }) {
  const [hover, setHover] = useState(false);
  // --color-primary-600 y --color-primary-700 de globals.css.
  const color = hover ? "#9E7517" : "#C1901D";

  return (
    <Link
      href={`/pedidos/${pedidoId}`}
      bloque
      onHoverChange={setHover}
      // --color-primary-50 y --color-primary-100.
      className="flex flex-row items-center gap-1.5 bg-[#FFFBF0] hover:bg-[#FDF3D7] px-3 py-1.5 rounded-xl shadow-sm active:scale-95 cursor-pointer"
    >
      <View style={{ transform: [{ rotate: hover ? "12deg" : "0deg" }] }}>
        <Package size={12} color={color} />
      </View>
      <Span peso="bold" className="text-[11px] leading-normal" style={{ color }}>
        Ver Pedido #{pedidoId.slice(0, 8).toUpperCase()}
      </Span>
      <View className="ml-0.5" style={{ opacity: 0.7 }}>
        <ExternalLink size={12} color={color} />
      </View>
    </Link>
  );
}

function TarjetaValoracion({ v }: { v: ValoracionResponse }) {
  return (
    // `md:flex-1` y no `flex-1` (el `h-full` del original): solo cuando las
    // tarjetas van de a dos hay una celda con alto que llenar; en una columna
    // sin alto, `flex-1` colapsa la tarjeta en nativo (regla 59).
    <Tarjeta className="flex flex-col md:flex-1">
      <View className="flex flex-row items-center justify-between mb-3">
        <Estrellas puntuacion={v.puntuacion} tamano={14} vacia="#E7E5E4" />
        <View className="flex flex-row items-center gap-1">
          <Calendar size={10} color="#A8A29E" />
          <Span peso="medium" className="text-[10px] leading-normal text-stone-400">
            {formatFecha(v.created_at)}
          </Span>
        </View>
      </View>

      {v.comentario ? (
        <P className="text-sm leading-5 text-stone-700 italic md:flex-1 mb-4">{`"${v.comentario}"`}</P>
      ) : (
        <P className="text-xs leading-4 text-stone-400 italic md:flex-1 mb-4">El cliente no dejó un comentario.</P>
      )}

      <View className="pt-3 border-t border-stone-50 flex flex-row items-center justify-between mt-auto">
        <View className="flex flex-row items-center gap-1.5 shrink">
          <View className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center">
            <User size={12} color="#A8A29E" />
          </View>
          <Span peso="bold" className="text-[11px] leading-normal text-stone-600">Cliente Akindo</Span>
        </View>
        <EnlacePedido pedidoId={v.pedido_id} />
      </View>
    </Tarjeta>
  );
}

interface DistribuidorValoracionesProps {
  /** Valoraciones ya cargadas. Web las trae del servidor; mobile pasa `null`. */
  valoraciones: ValoracionResponse[] | null;
  /** Solo mobile: las pide al montar, porque no hay servidor que las precargue. */
  cargarValoraciones?: () => Promise<ValoracionResponse[]>;
}

export default function DistribuidorValoraciones({
  valoraciones: valoracionesIniciales,
  cargarValoraciones,
}: DistribuidorValoracionesProps) {
  const [valoraciones, setValoraciones] = useState<ValoracionResponse[] | null>(valoracionesIniciales);
  const [errorCarga, setErrorCarga] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (valoracionesIniciales || !cargarValoraciones) return;
    let vigente = true;
    setErrorCarga(false);
    cargarValoraciones().then(
      (recibidas) => { if (vigente) setValoraciones(recibidas); },
      () => { if (vigente) setErrorCarga(true); },
    );
    return () => { vigente = false; };
  }, [intento]);

  if (!valoraciones) {
    return (
      <View className="mx-auto w-full max-w-4xl px-4 pt-8">
        {errorCarga ? (
          <Tarjeta>
            <P className="text-sm text-stone-500 text-center">No se pudieron cargar las valoraciones.</P>
            <Boton variante="secundario" className="mt-3 w-full" onClick={() => setIntento((n) => n + 1)}>
              Volver a intentar
            </Boton>
          </Tarjeta>
        ) : (
          <View className="flex items-center justify-center py-20">
            <Spinner tamano={32} />
          </View>
        )}
      </View>
    );
  }

  const promedio =
    valoraciones.length > 0
      ? (valoraciones.reduce((acc, v) => acc + v.puntuacion, 0) / valoraciones.length).toFixed(1)
      : 0;

  return (
    // indiceFijo 0: el HeaderSticky.
    <ContenedorPantalla key="distribuidor-valoraciones" indiceFijo={0} className="mx-auto w-full max-w-4xl pb-20">
      <HeaderSticky titulo="Mis Valoraciones" />

      <View className="px-4 pt-8 pb-6">
        <P className="text-sm leading-5 text-stone-500 mt-1">Lo que tus clientes opinan de tu servicio.</P>

        {valoraciones.length > 0 && (
          <View className="mt-6 flex flex-row items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <View className="items-center">
              {/* `font-black` (900) no está cargado en ninguna plataforma: en web
                  el navegador ya pintaba el 800, que es lo que va acá. */}
              <P peso="extrabold" className="text-3xl leading-9 text-amber-600 text-center">{promedio}</P>
              <View className="mt-1">
                <Estrellas puntuacion={Number(promedio)} tamano={12} vacia="#D6D3D1" />
              </View>
            </View>
            <View className="h-10 w-px bg-amber-200" />
            {/* `shrink`: en CSS la columna se encoge sola y el mensaje salta de
                renglón; en RN no (regla 24). */}
            <View className="shrink">
              <P peso="bold" className="text-sm leading-5 text-stone-800">{valoraciones.length} Valoraciones totales</P>
              {/* text-[11px] sin leading heredaba el 1.5 del body (regla 19). */}
              <P className="text-[11px] leading-normal text-stone-500 mt-0.5">
                {getFeedbackMessage(Number(promedio))}
              </P>
            </View>
          </View>
        )}
      </View>

      <View className="px-4">
        {valoraciones.length === 0 ? (
          <Tarjeta className="items-center py-16">
            <View className="mb-4">
              <MessageSquare size={48} color="#E7E5E4" />
            </View>
            {/* El `<p>` no traía tamaño: heredaba 16px/24 del body (regla 53). */}
            <P peso="medium" className="text-base leading-6 text-stone-500 text-center">
              Aún no has recibido valoraciones de tus clientes.
            </P>
          </Tarjeta>
        ) : (
          // `grid-cols-1 md:grid-cols-2 gap-4` es una fila que envuelve (regla 26).
          <View className="flex flex-row flex-wrap -m-2">
            {valoraciones.map((v) => (
              <View key={v.id} className="w-full md:w-1/2 p-2">
                <TarjetaValoracion v={v} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ContenedorPantalla>
  );
}
