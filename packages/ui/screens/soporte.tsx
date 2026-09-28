/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import { View } from "react-native";
import {
  CalendarClock,
  Check,
  Clock,
  Mail,
  MessageSquare,
  Video,
} from "lucide-react-native";
import { H1, H2, P, Pressable, Section, Span } from "@akindo/ui/html";
import { Boton } from "@akindo/ui/components";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { EncabezadoPagina } from "@akindo/ui/components/ui/EncabezadoPagina";

/**
 * Soporte — el usuario elige cómo quiere que lo contacten.
 *
 * **Es una maqueta: no envía nada.** Las dos opciones existen para acordar el
 * flujo; el botón final avisa que todavía no está conectado en vez de fingir
 * que mandó algo. Cuando haya endpoint, lo único que cambia es `onConfirmar`.
 */

type Via = "correo" | "llamada";

interface OpcionSoporte {
  via: Via;
  titulo: string;
  descripcion: string;
  /** Lo que el usuario puede esperar si elige esta vía. */
  respuesta: string;
  Icono: React.ComponentType<{ size?: number; color?: string }>;
}

const OPCIONES: OpcionSoporte[] = [
  {
    via: "correo",
    titulo: "Enviar un correo",
    descripcion: "Nos cuentas el problema por escrito y te respondemos al correo de tu cuenta.",
    respuesta: "Respuesta en menos de 24 horas hábiles",
    Icono: Mail,
  },
  {
    via: "llamada",
    titulo: "Programar una llamada",
    descripcion: "Eliges un horario y te llamamos por videollamada para revisarlo contigo.",
    respuesta: "Agenda disponible de lunes a viernes",
    Icono: Video,
  },
];

/** Horarios de muestra de la llamada. Todavía no consultan ninguna agenda. */
const HORARIOS = ["Hoy, 16:00", "Mañana, 10:00", "Mañana, 13:30", "Viernes, 09:00"];

function TarjetaOpcion({
  opcion,
  elegida,
  onPress,
}: {
  opcion: OpcionSoporte;
  elegida: boolean;
  onPress: () => void;
}) {
  // Los colores del estado van por `style` y no por `className`: un className
  // que cambia con el estado revienta en nativo (regla 50).
  return (
    <Pressable
      role="button"
      accessibilityLabel={opcion.titulo}
      onPress={onPress}
      style={{
        borderColor: elegida ? "#DAA520" : "#E7E5E4",
        backgroundColor: elegida ? "#FDF9F0" : "#FFFFFF",
      }}
      className="flex-1 min-w-[260px] border rounded-2xl p-4 cursor-pointer"
    >
      <View className="flex flex-row items-start justify-between gap-2">
        <View
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: elegida ? "#DAA520" : "#F5F5F4" }}
        >
          <opcion.Icono size={17} color={elegida ? "#FFFFFF" : "#78716C"} />
        </View>
        {elegida && (
          <View className="w-5 h-5 rounded-full bg-[#DAA520] flex items-center justify-center shrink-0">
            <Check size={12} color="#FFFFFF" />
          </View>
        )}
      </View>

      <H2 peso="bold" className="text-base leading-6 text-stone-900 mt-3">{opcion.titulo}</H2>
      <P className="text-xs leading-5 text-stone-500 mt-1">{opcion.descripcion}</P>

      <View className="flex flex-row items-center gap-1.5 mt-3 pt-3 border-t border-stone-100">
        <Clock size={12} color="#A8A29E" />
        <Span numberOfLines={2} className="text-[10px] leading-4 text-stone-400 shrink">{opcion.respuesta}</Span>
      </View>
    </Pressable>
  );
}

/** Los horarios de la llamada. Se pintan solo si se eligió esa vía. */
function Horarios({ elegido, onElegir }: { elegido: string | null; onElegir: (h: string) => void }) {
  return (
    <View className="mt-4">
      <Span peso="semibold" className="text-[10px] leading-4 uppercase tracking-[0.6px] text-stone-400">
        Elige un horario
      </Span>
      <View className="flex flex-row flex-wrap gap-2 mt-2">
        {HORARIOS.map((h) => {
          const activo = h === elegido;
          return (
            <Pressable
              key={h}
              role="button"
              accessibilityLabel={h}
              onPress={() => onElegir(h)}
              style={{
                backgroundColor: activo ? "#1C1917" : "#FFFFFF",
                borderColor: activo ? "#1C1917" : "#E7E5E4",
              }}
              className="px-3.5 py-2 rounded-xl border cursor-pointer"
            >
              <Span peso="semibold" className="text-xs leading-5" style={{ color: activo ? "#FFFFFF" : "#57534E" }}>
                {h}
              </Span>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export interface SoporteProps {
  /** A dónde vuelve el botón de regreso. */
  volverA?: string;
}

export default function Soporte({ volverA = "/pedidos" }: SoporteProps) {
  const [via, setVia] = useState<Via | null>(null);
  const [horario, setHorario] = useState<string | null>(null);
  const [aviso, setAviso] = useState(false);

  const opcion = OPCIONES.find((o) => o.via === via);
  // La llamada necesita horario; el correo, nada más que estar elegido.
  const listo = via === "correo" || (via === "llamada" && horario !== null);

  return (
    <ContenedorPantalla key="soporte" className="mx-auto w-full px-0 lg:px-16 lg:pt-8 pb-24 bg-[#FAF7F2] min-h-screen items-center">
      <EncabezadoPagina titulo="Soporte" href={volverA} className="w-full" />

      <Section className="px-4 pt-5">
        <H1 peso="bold" className="text-2xl leading-8 text-stone-900">¿Cómo prefieres que te contactemos?</H1>
        <P className="text-sm leading-6 text-stone-500 mt-1">
          Elige una de las dos vías y te respondemos por ahí.
        </P>
      </Section>

      <Section className="px-4 mt-5 flex flex-row flex-wrap gap-3">
        {OPCIONES.map((o) => (
          <TarjetaOpcion
            key={o.via}
            opcion={o}
            elegida={via === o.via}
            onPress={() => {
              setVia(o.via);
              // Cambiar de vía descarta el horario: no significa nada en el
              // correo y volvería a aparecer elegido si se regresa.
              setHorario(null);
              setAviso(false);
            }}
          />
        ))}
      </Section>

      {opcion && (
        <Section className="px-4 mt-5">
          <View className="bg-white border border-stone-100 rounded-2xl p-5 drop-shadow-sm">
            <View className="flex flex-row items-center gap-2">
              {via === "correo" ? <MessageSquare size={14} color="#B45309" /> : <CalendarClock size={14} color="#B45309" />}
              <H2 peso="semibold" className="text-[10px] leading-4 uppercase tracking-[0.6px] text-[#B45309]">
                {via === "correo" ? "Por correo" : "Por videollamada"}
              </H2>
            </View>

            <P className="text-xs leading-5 text-stone-500 mt-2">
              {via === "correo"
                ? "Te escribimos al correo de tu cuenta con el seguimiento de tu caso."
                : "Te mandamos la liga de la videollamada al correo de tu cuenta."}
            </P>

            {via === "llamada" && <Horarios elegido={horario} onElegir={(h) => { setHorario(h); setAviso(false); }} />}

            <Boton
              onClick={() => setAviso(true)}
              disabled={!listo}
              claseTexto="text-xs leading-5"
              className="py-2.5 px-4 rounded-xl mt-5 w-full md:w-auto"
            >
              {via === "correo" ? "Enviar solicitud" : "Confirmar llamada"}
            </Boton>

            {/* La maqueta lo dice en vez de fingir que mandó algo. */}
            {aviso && (
              <View className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mt-3">
                <Span peso="medium" className="text-xs leading-5 text-amber-800">
                  Todavía no está conectado: esta pantalla es una maqueta y no envía nada.
                </Span>
              </View>
            )}
          </View>
        </Section>
      )}
    </ContenedorPantalla>
  );
}
