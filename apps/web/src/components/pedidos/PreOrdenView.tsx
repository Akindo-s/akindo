"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ShieldCheck, Truck, MapPin, CreditCard, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Boton } from "@/components/ui/Boton";
import { Tarjeta } from "@/components/ui/Tarjeta";
import type { PreOrdenResponse, DireccionCliente, OrdenPedidoResponse, PedidoActionResult } from "@/lib/types/pedidos";
import FooterFijo from "../layout/FooterFijo";
import { Parrafo } from "../titles";
import { ModalConfirmacion } from "../ui/ModalConfirmacion";

const MONEDA = "MXN";

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Paso indicator ────────────────────────────────────────────────────────────

function PasoIndicador({className}:{className:string}) {
  return (
    <div className={`flex items-center justify-center gap-0 px-4 py-3 ${className}`}>
      {[
        { label: "Carrito", done: true },
        { label: "Confirmación\nde productos", done: true },
        { label: "Pago", active: true },
      ].map((p, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${p.done ? "bg-[var(--color-primary-500)] text-white" :
                p.active ? "border-2 border-[var(--color-primary-500)] text-[var(--color-primary-500)] bg-white" :
                "border-2 border-stone-200 text-stone-400 bg-white"}`}
            >
              {p.done ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            <span className={`text-[10px] text-center whitespace-pre leading-tight
              ${p.active ? "text-[var(--color-primary-500)] font-semibold" : "text-stone-500"}`}>
              {p.label}
            </span>
          </div>
          {i < 2 && <div className="w-10 h-px bg-stone-200 mb-4 mx-1" />}
        </div>
      ))}
    </div>
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
    <div className="space-y-2">
      {direcciones.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => onChange(d.id)}
          className={`w-full text-left rounded-xl border p-3 transition-all
            ${seleccionada === d.id
              ? "border-[var(--color-primary-500)] bg-amber-50"
              : "border-stone-200 bg-white hover:border-stone-300"}`}
        >
          <div className="flex items-start gap-2">
            <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0
              ${seleccionada === d.id
                ? "border-[var(--color-primary-500)] bg-[var(--color-primary-500)]"
                : "border-stone-300"}`}
            />
            <div>
              <p className="text-sm font-medium text-stone-800">
                {d.calle}
              </p>
              <p className="text-xs text-stone-500">
                {d.ciudad}, {d.estado} {d.codigo_postal}
              </p>
              {d.es_predeterminada && (
                <span className="text-[10px] text-[var(--color-primary-600)] font-semibold uppercase tracking-wide">
                  Predeterminada
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Métodos de pago (UI only) ─────────────────────────────────────────────────

type MetodoPago = "credito" | "debito";

function SelectorMetodoPago({
  seleccionado,
  onChange,
}: {
  seleccionado: MetodoPago;
  onChange: (m: MetodoPago) => void;
}) {
  const opciones: { id: MetodoPago; label: string }[] = [
    { id: "credito", label: "Tarjeta de crédito" },
    { id: "debito", label: "Tarjeta de débito" },
  ];
  return (
    <div className="space-y-2">
      {opciones.map((op) => (
        <button
          key={op.id}
          type="button"
          onClick={() => onChange(op.id)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all
            ${seleccionado === op.id
              ? "border-[var(--color-primary-500)] bg-amber-50"
              : "border-stone-200 bg-white hover:border-stone-300"}`}
        >
          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0
            ${seleccionado === op.id
              ? "border-[var(--color-primary-500)] bg-[var(--color-primary-500)]"
              : "border-stone-300"}`}
          />
          <CreditCard size={18} className="text-stone-500" />
          <span className="text-sm text-stone-800">{op.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

interface PreOrdenViewProps {
  preOrden: PreOrdenResponse;
  crearOrdenAction: (data: {
    direccion_id: string;
    pre_autorizado: boolean;
  }) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
}

export default function PreOrdenView({ preOrden, crearOrdenAction }: PreOrdenViewProps) {
  const router = useRouter();

  const predeterminada = preOrden.direcciones_disponibles.find((d) => d.es_predeterminada);
  const [direccionId, setDireccionId] = useState(
    predeterminada?.id ?? preOrden.direcciones_disponibles[0]?.id ?? ""
  );
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
    router.push("/pedidos");
  }

  const resumenRows = [
    { label: `Subtotal (${preOrden.productos.length} producto${preOrden.productos.length !== 1 ? "s" : ""})`, value: `$${formatMoney(preOrden.subtotal)}` },
    { label: "Costo de envío", value: preOrden.costo_envio === 0 ? "Gratis" : `$${formatMoney(preOrden.costo_envio)}` },
    { label: "Impuestos (Estimados)", value: preOrden.impuestos === 0 ? "$0.00" : `$${formatMoney(preOrden.impuestos)}` },
  ];

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col pb-80">
      <EncabezadoPagina titulo="Orden de pedido" href="/carrito" >
      
      </EncabezadoPagina>
      <PasoIndicador className="w-full"/>

      <div className="space-y-4 px-4">

        {/* Paquete de pedido */}
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
            Paquete de pedido
          </p>
          <Tarjeta conPadding={false} className="divide-y divide-stone-100">
            {preOrden.productos.map((prod) => (
              <div key={prod.producto_id} className="flex gap-3 p-3">
                <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-100">
                  {prod.imagen ? (
                    <img src={prod.imagen} alt={prod.nombre} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-2xl">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 leading-tight">{prod.nombre}</p>
                  {prod.sku && <p className="text-[10px] text-stone-400 mt-0.5">SKU: {prod.sku}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-stone-500 bg-stone-100 rounded-full px-2 py-0.5">
                      Cant: {prod.cantidad} {prod.unidad}
                    </span>
                    <span className="text-sm font-bold text-[var(--color-primary-600)]">
                      ${formatMoney(prod.subtotal)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </Tarjeta>
        </div>

        {/* Detalles de entrega */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Detalles de entrega</p>
          </div>
          <Tarjeta variante="calido">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={16} className="text-[var(--color-primary-600)]" />
              <p className="text-sm font-medium text-stone-800">Entrega estándar</p>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-stone-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-stone-600 mb-1">
                  {preOrden.distribuidor_nombre}
                </p>
                {sinDirecciones ? (
                  <p className="text-xs text-red-500">
                    No tienes direcciones registradas. Por favor añade una en tu perfil.
                  </p>
                ) : (
                  <SelectorDireccion
                    direcciones={preOrden.direcciones_disponibles}
                    seleccionada={direccionId}
                    onChange={setDireccionId}
                  />
                )}
              </div>
            </div>
          </Tarjeta>
        </div>

        {/* Métodos de pago */}
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
            Métodos de Pago
          </p>
          <SelectorMetodoPago seleccionado={metodo} onChange={setMetodo} />
        </div>

        {/* Pre-autorización */}
        <Tarjeta variante="calido">
          <button
            type="button"
            onClick={() => setPreAutorizado((v) => !v)}
            className="flex items-start gap-3 w-full text-left"
          >
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors
              ${preAutorizado
                ? "border-[var(--color-primary-500)] bg-[var(--color-primary-500)]"
                : "border-stone-300 bg-white"}`}
            >
              {preAutorizado && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">Pre-autorizar pago</p>
              <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                Si el distribuidor acepta tu orden, el pago se procesará automáticamente. Recomendado para agilizar el proceso.
              </p>
            </div>
          </button>

          {!preAutorizado && (
            <div className="mt-3 flex items-start gap-2 bg-amber-100/60 rounded-lg p-2.5">
              <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Sin pre-autorizar, deberás pagar manualmente cuando el distribuidor acepte tu orden. Recibirás una notificación.
              </p>
            </div>
          )}
        </Tarjeta>

      </div>

      {/* Footer fijo */}
      <FooterFijo className="flex flex-col fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2] border-t border-stone-100 shadow-[0_-4px_20px_rgba(0,0,0,0.2)] px-4 py-4 space-y-3">

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Resumen de la orden */}
        <div className="rounded-xl bg-white border border-stone-100 p-3 text-sm text-stone-700 space-y-1">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Resumen de la orden</p>
          {resumenRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-xs text-stone-500">{row.label}</span>
              <span className="text-xs font-medium">{row.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-1">
            <span className="text-sm font-bold text-stone-900">Total</span>
            <span className="text-lg font-extrabold text-[var(--color-primary-600)]">
              ${formatMoney(preOrden.total)} <span className="text-xs font-normal text-stone-400">{MONEDA}</span>
            </span>
          </div>
        </div>

        <p className="text-[10px] text-center text-stone-400 leading-relaxed">
          Al confirmar esta orden, aceptas los{" "}
          <span className="text-[var(--color-primary-600)] underline cursor-pointer">Términos de Servicio</span>{" "}
          y la{" "}
          <span className="text-[var(--color-primary-600)] underline cursor-pointer">Política de Devoluciones</span>{" "}
          de Akindo.
        </p>
          
        <Boton
          variante={preAutorizado?'primario':"peligro"}
          className="!w-full"
          
          onClick={handleSubmit}
          loading={loading}
          loadingText="Procesando..."
          disabled={sinDirecciones || loading || !preAutorizado}
          Icono={preAutorizado ? Lock : ShieldCheck}
        >
          {preAutorizado ? "Pagar orden de forma segura" : "Crear orden de compra"}
        </Boton>
      </FooterFijo>
      {
        !preAutorizado&&(

          <ModalConfirmacion 
        titulo="Solo pagos pre autorizados" 
        isOpen={true}
        onClose={()=>setPreAutorizado(true)}
        textoConfirmar="Okey"
        textoCancelar="Esta bien"
        onConfirm={()=>setPreAutorizado(true)}
        mensaje="actualmente solo podemos aceptar ordenes de compra pre pagadas, estamos a poco tiempo de aceptar ordenes de compra sin pre autorizar el pago, tenmepaciencia."/>
      )
    }
    </section>
  );
}
