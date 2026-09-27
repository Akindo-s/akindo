/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import { Image, View } from "react-native";
import { ShieldCheck, Truck, MapPin, CreditCard, Lock, AlertCircle, CheckCircle2 } from "lucide-react-native";
import type { PreOrdenResponse, DireccionCliente, OrdenPedidoResponse, PedidoActionResult } from "@akindo/shared/types/pedidos";
import { P, Pressable, Span } from "@akindo/ui/html";
import { Boton } from "@akindo/ui/components";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { EncabezadoPagina } from "@akindo/ui/components/ui/EncabezadoPagina";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { ModalConfirmacion } from "@akindo/ui/components/ui/ModalConfirmacion";
import FooterFijo from "@akindo/ui/components/layout/FooterFijo";
import useRouter from "@akindo/ui/router";

const MONEDA = "MXN";

// --color-primary-500 y --color-primary-600 de globals.css.
const PRIMARIO = "#DAA520";
const PRIMARIO_600 = "#C1901D";

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Etiqueta de sección: `tracking-wide` a 12px son 0.3px (regla 56). */
function EtiquetaSeccion({ children, className = "" }: { children: string; className?: string }) {
  return (
    <P peso="semibold" className={`text-xs leading-4 text-stone-500 uppercase tracking-[0.3px] ${className}`}>
      {children}
    </P>
  );
}

// ── Paso indicator ────────────────────────────────────────────────────────────

function PasoIndicador() {
  const pasos = [
    { label: "Carrito", done: true },
    { label: "Confirmación\nde productos", done: true },
    { label: "Pago", active: true },
  ];
  return (
    <View className="flex flex-row items-center justify-center px-4 py-3 w-full">
      {pasos.map((p, i) => (
        <View key={i} className="flex flex-row items-center">
          <View className="flex flex-col items-center gap-1">
            <View
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                p.done ? "bg-[#DAA520]" : p.active ? "border-2 border-[#DAA520] bg-white" : "border-2 border-stone-200 bg-white"
              }`}
            >
              {p.done ? (
                <CheckCircle2 size={16} color="#FFFFFF" />
              ) : (
                <Span peso="bold" className={`text-xs leading-4 ${p.active ? "text-[#DAA520]" : "text-stone-400"}`}>{i + 1}</Span>
              )}
            </View>
            {/* `whitespace-pre`: el `\n` del label ya corta el renglón en un Text. */}
            <Span
              peso={p.active ? "semibold" : "normal"}
              className={`text-[10px] leading-[12.5px] text-center ${p.active ? "text-[#DAA520]" : "text-stone-500"}`}
            >
              {p.label}
            </Span>
          </View>
          {i < 2 && <View className="w-10 h-px bg-stone-200 mb-4 mx-1" />}
        </View>
      ))}
    </View>
  );
}

// ── Opción seleccionable (dirección o método de pago) ────────────────────────

/**
 * Botón con borde que se marca al elegirlo. El `hover:border-stone-300` del
 * original va por estado y no por clase: con una variante en el className, las
 * clases de "elegida" no podrían cambiar con el estado (regla 50).
 */
function OpcionMarcable({
  elegida,
  onPress,
  className,
  children,
}: {
  elegida: boolean;
  onPress: () => void;
  className: string;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      role="radio"
      aria-checked={elegida}
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      className={`w-full rounded-xl border p-3 cursor-pointer ${
        elegida ? "border-[#DAA520] bg-amber-50" : `${hover ? "border-stone-300" : "border-stone-200"} bg-white`
      } ${className}`}
    >
      {children}
    </Pressable>
  );
}

function Radio({ elegida, className = "" }: { elegida: boolean; className?: string }) {
  return (
    <View
      className={`w-4 h-4 rounded-full border-2 shrink-0 ${elegida ? "border-[#DAA520] bg-[#DAA520]" : "border-stone-300"} ${className}`}
    />
  );
}

// ── Selección de dirección ────────────────────────────────────────────────────

function SelectorDireccion({
  direcciones,
  seleccionada,
  onChange,
}: {
  direcciones: DireccionCliente[];
  seleccionada: string;
  onChange: (id: string) => void;
}) {
  return (
    // `space-y-2` → `gap-2` (regla 44).
    <View className="flex flex-col gap-2">
      {direcciones.map((d) => (
        <OpcionMarcable key={d.id} elegida={seleccionada === d.id} onPress={() => onChange(d.id)} className="flex flex-row items-start gap-2">
          <Radio elegida={seleccionada === d.id} className="mt-0.5" />
          <View className="shrink">
            <P peso="medium" className="text-sm leading-5 text-stone-800">{d.calle}</P>
            <P className="text-xs leading-4 text-stone-500">
              {d.ciudad}, {d.estado} {d.codigo_postal}
            </P>
            {/* En web el `<span>` suelto va en un renglón de 24px (la línea
                que el `<button>` hereda del body), no en los 15px del texto. */}
            {d.es_predeterminada && (
              <View className="h-6 justify-center">
                <Span peso="semibold" className="text-[10px] leading-[15px] text-[#C1901D] uppercase tracking-[0.25px]">
                  Predeterminada
                </Span>
              </View>
            )}
          </View>
        </OpcionMarcable>
      ))}
    </View>
  );
}

// ── Métodos de pago (UI only) ─────────────────────────────────────────────────

type MetodoPago = "credito" | "debito";

function SelectorMetodoPago({ seleccionado, onChange }: { seleccionado: MetodoPago; onChange: (m: MetodoPago) => void }) {
  const opciones: { id: MetodoPago; label: string }[] = [
    { id: "credito", label: "Tarjeta de crédito" },
    { id: "debito", label: "Tarjeta de débito" },
  ];
  return (
    <View className="flex flex-col gap-2">
      {opciones.map((op) => (
        <OpcionMarcable
          key={op.id}
          elegida={seleccionado === op.id}
          onPress={() => onChange(op.id)}
          className="flex flex-row items-center gap-3"
        >
          <Radio elegida={seleccionado === op.id} />
          <CreditCard size={18} color="#78716C" />
          <Span className="text-sm leading-5 text-stone-800">{op.label}</Span>
        </OpcionMarcable>
      ))}
    </View>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

interface PreOrdenProps {
  /** Preorden ya cargada: web la trae del servidor y la ruta de mobile la pide antes de montar. */
  preOrden: PreOrdenResponse;
  /** Crea la orden. Necesita la sesión y los paquetes de la preorden, así que la arma cada plataforma. */
  crearOrdenAction: (data: { direccion_id: string; pre_autorizado: boolean }) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
}

export default function PreOrden({ preOrden, crearOrdenAction }: PreOrdenProps) {
  const router = useRouter();

  const predeterminada = preOrden.direcciones_disponibles.find((d) => d.es_predeterminada);
  const [direccionId, setDireccionId] = useState(predeterminada?.id ?? preOrden.direcciones_disponibles[0]?.id ?? "");
  const [metodo, setMetodo] = useState<MetodoPago>("credito");
  const [preAutorizado, setPreAutorizado] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sinDirecciones = preOrden.direcciones_disponibles.length === 0;

  async function handleSubmit() {
    if (!direccionId) { setError("Selecciona una dirección de entrega"); return; }
    setLoading(true);
    setError(null);
    const result = await crearOrdenAction({ direccion_id: direccionId, pre_autorizado: preAutorizado });
    setLoading(false);
    if (!result.ok) { setError(result.error ?? "No se pudo crear la orden"); return; }
    // `replace` y no el `push` del original: en nativo, "volver" desde pedidos
    // regresaba a esta preorden ya enviada (regla 29).
    router.replace("/pedidos" as never);
  }

  const resumenRows = [
    { label: `Subtotal (${preOrden.productos.length} producto${preOrden.productos.length !== 1 ? "s" : ""})`, value: `$${formatMoney(preOrden.subtotal)}` },
    { label: "Costo de envío", value: preOrden.costo_envio === 0 ? "Gratis" : `$${formatMoney(preOrden.costo_envio)}` },
    { label: "Impuestos (Estimados)", value: preOrden.impuestos === 0 ? "$0.00" : `$${formatMoney(preOrden.impuestos)}` },
  ];

  return (
    <>
      {/* indiceFijo 0: el encabezado. `pb-80` deja lugar para el FooterFijo. */}
      <ContenedorPantalla key="preorden" indiceFijo={0} className="mx-auto flex w-full max-w-lg flex-col pb-80">
        <EncabezadoPagina titulo="Orden de pedido" href="/carrito" />
        <PasoIndicador />

        {/* `space-y-4` → `gap-4` (regla 44). */}
        <View className="flex flex-col gap-4 px-4">
          {/* Paquete de pedido */}
          <View>
            <EtiquetaSeccion className="mb-2">Paquete de pedido</EtiquetaSeccion>
            <Tarjeta conPadding={false}>
              {preOrden.productos.map((prod, i) => (
                // `divide-y`: borde arriba de cada fila menos la primera (regla 44).
                <View key={prod.producto_id} className={`flex flex-row gap-3 p-3 ${i > 0 ? "border-t border-stone-100" : ""}`}>
                  <View className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-100">
                    {prod.imagen ? (
                      <Image source={{ uri: prod.imagen }} accessibilityLabel={prod.nombre} resizeMode="cover" className="w-full h-full" />
                    ) : (
                      <View className="w-full h-full flex items-center justify-center">
                        <Span className="text-2xl text-stone-300">📦</Span>
                      </View>
                    )}
                  </View>
                  <View className="flex-1 min-w-0">
                    <P peso="semibold" className="text-sm leading-tight text-stone-900">{prod.nombre}</P>
                    {prod.sku && <P className="text-[10px] leading-normal text-stone-400 mt-0.5">SKU: {prod.sku}</P>}
                    <View className="flex flex-row items-center justify-between mt-2">
                      <View className="bg-stone-100 rounded-full px-2 py-0.5">
                        <Span className="text-xs leading-4 text-stone-500">
                          Cant: {prod.cantidad} {prod.unidad}
                        </Span>
                      </View>
                      <Span peso="bold" className="text-sm leading-5 text-[#C1901D]">${formatMoney(prod.subtotal)}</Span>
                    </View>
                  </View>
                </View>
              ))}
            </Tarjeta>
          </View>

          {/* Detalles de entrega */}
          <View>
            <EtiquetaSeccion className="mb-2">Detalles de entrega</EtiquetaSeccion>
            <Tarjeta variante="calido">
              <View className="flex flex-row items-center gap-2 mb-3">
                <Truck size={16} color={PRIMARIO_600} />
                <P peso="medium" className="text-sm leading-5 text-stone-800">Entrega estándar</P>
              </View>
              <View className="flex flex-row items-start gap-2">
                <View className="mt-0.5 shrink-0">
                  <MapPin size={14} color="#A8A29E" />
                </View>
                <View className="flex-1">
                  <P peso="semibold" className="text-xs leading-4 text-stone-600 mb-1">{preOrden.distribuidor_nombre}</P>
                  {sinDirecciones ? (
                    <P className="text-xs leading-4 text-red-500">
                      No tienes direcciones registradas. Por favor añade una en tu perfil.
                    </P>
                  ) : (
                    <SelectorDireccion direcciones={preOrden.direcciones_disponibles} seleccionada={direccionId} onChange={setDireccionId} />
                  )}
                </View>
              </View>
            </Tarjeta>
          </View>

          {/* Métodos de pago */}
          <View>
            <EtiquetaSeccion className="mb-2">Métodos de Pago</EtiquetaSeccion>
            <SelectorMetodoPago seleccionado={metodo} onChange={setMetodo} />
          </View>

          {/* Pre-autorización */}
          <Tarjeta variante="calido">
            <Pressable
              role="checkbox"
              aria-checked={preAutorizado}
              onPress={() => setPreAutorizado((v) => !v)}
              className="flex flex-row items-start gap-3 w-full cursor-pointer"
            >
              <View
                className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center mt-0.5 ${
                  preAutorizado ? "border-[#DAA520] bg-[#DAA520]" : "border-stone-300 bg-white"
                }`}
              >
                {preAutorizado && <CheckCircle2 size={14} color="#FFFFFF" />}
              </View>
              <View className="flex-1">
                <P peso="semibold" className="text-sm leading-5 text-stone-800">Pre-autorizar pago</P>
                <P className="text-xs leading-relaxed text-stone-500 mt-0.5">
                  Si el distribuidor acepta tu orden, el pago se procesará automáticamente. Recomendado para agilizar el proceso.
                </P>
              </View>
            </Pressable>

            {!preAutorizado && (
              <View className="mt-3 flex flex-row items-start gap-2 bg-amber-100/60 rounded-lg p-2.5">
                <View className="shrink-0 mt-0.5">
                  <AlertCircle size={14} color="#D97706" />
                </View>
                <P className="text-[11px] leading-relaxed text-amber-700 shrink">
                  Sin pre-autorizar, deberás pagar manualmente cuando el distribuidor acepte tu orden. Recibirás una notificación.
                </P>
              </View>
            )}
          </Tarjeta>
        </View>
      </ContenedorPantalla>

      {/* Footer fijo. En web el `className` del original se concatenaba al del
          FooterFijo y ganaban por orden de CSS el `bg-white` y el `z-50` de la
          base, y el `flex-col`, el `py-4` y la sombra de la instancia; además
          `space-y-3` se sumaba al `gap-3` de la base: 24px entre bloques. Acá
          van solo las que ganaban (twMerge deja pisar al `className`). */}
      <FooterFijo className="flex-col py-4 gap-6 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        {error && (
          <View className="flex flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
            <AlertCircle size={16} color="#EF4444" />
            <P className="text-sm leading-5 text-red-600 shrink">{error}</P>
          </View>
        )}

        {/* Resumen de la orden. `space-y-1` y el `mb-2` del título colapsaban
            (8px); con márgenes explícitos queda igual. */}
        <View className="rounded-xl bg-white border border-stone-100 p-3">
          <EtiquetaSeccion className="mb-2">Resumen de la orden</EtiquetaSeccion>
          {resumenRows.map((row, i) => (
            <View key={row.label} className={`flex flex-row items-center justify-between ${i > 0 ? "mt-1" : ""}`}>
              <Span className="text-xs leading-4 text-stone-500">{row.label}</Span>
              <Span peso="medium" className="text-xs leading-4 text-stone-700">{row.value}</Span>
            </View>
          ))}
          <View className="flex flex-row items-center justify-between pt-2 border-t border-stone-100 mt-1">
            <Span peso="bold" className="text-sm leading-5 text-stone-900">Total</Span>
            <Span peso="extrabold" className="text-lg leading-7 text-[#C1901D]">
              ${formatMoney(preOrden.total)}{" "}
              <Span className="text-xs text-stone-400">{MONEDA}</Span>
            </Span>
          </View>
        </View>

        <P className="text-[10px] leading-relaxed text-center text-stone-400">
          Al confirmar esta orden, aceptas los{" "}
          <Span className="text-[10px] underline" style={{ color: PRIMARIO_600 }}>Términos de Servicio</Span>{" "}
          y la{" "}
          <Span className="text-[10px] underline" style={{ color: PRIMARIO_600 }}>Política de Devoluciones</Span>{" "}
          de Akindo.
        </P>

        {/* Dos botones con `key` distinta y no uno que cambia de variante: las
            clases de cada variante traen `hover:`/`disabled:` y cambiarlas con
            el estado revienta en nativo (reglas 37 y 50). */}
        {preAutorizado ? (
          <Boton
            key="pagar"
            variante="primario"
            className="w-full"
            onClick={handleSubmit}
            loading={loading}
            loadingText="Procesando..."
            disabled={sinDirecciones || loading}
            Icono={Lock}
          >
            Pagar orden de forma segura
          </Boton>
        ) : (
          <Boton
            key="crear"
            variante="peligro"
            className="w-full"
            onClick={handleSubmit}
            loading={loading}
            loadingText="Procesando..."
            disabled
            Icono={ShieldCheck}
          >
            Crear orden de compra
          </Boton>
        )}
      </FooterFijo>

      {/* Fuera del ContenedorPantalla (regla 54). */}
      <ModalConfirmacion
        titulo="Solo pagos pre autorizados"
        isOpen={!preAutorizado}
        onClose={() => setPreAutorizado(true)}
        textoConfirmar="Okey"
        textoCancelar="Esta bien"
        onConfirm={() => setPreAutorizado(true)}
        mensaje="actualmente solo podemos aceptar ordenes de compra pre pagadas, estamos a poco tiempo de aceptar ordenes de compra sin pre autorizar el pago, tenmepaciencia."
      />
    </>
  );
}
