/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { Truck, ChevronDown } from "lucide-react-native";
import type { PedidoListItem, EstadoPedido, PedidoResponse, PedidoActionResult } from "@akindo/shared/types/pedidos";
import { H3, P, Pressable, Section, Span } from "@akindo/ui/html";
import { Boton, Link } from "@akindo/ui/components";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { HeaderSticky } from "@akindo/ui/components/ui/HeaderSticky";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import { useAviso } from "@akindo/ui/components/ui/Avisos";

const MONEDA = "MXN";

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

/** Etiqueta y colores del estado, en la tarjeta del pedido. */
const ESTADO_TARJETA: Record<EstadoPedido, { label: string; clases: string }> = {
  "pendiente de envio": { label: "Pendiente", clases: "bg-amber-100 text-amber-700" },
  "en envio": { label: "En Tránsito", clases: "bg-blue-100 text-blue-700" },
  "entregado": { label: "entregado", clases: "bg-green-100 text-green-700" },
  "cancelado": { label: "cancelado", clases: "bg-red-100 text-red-700" },
};

/**
 * El `<select>` del original: en React Native no existe, así que es un botón
 * que muestra la opción elegida y despliega la lista abajo. Mantiene la caja
 * del select (borde, radio, padding) y el ChevronDown a la derecha.
 */
function SelectorEstado({
  opciones,
  valor,
  onChange,
}: {
  opciones: { val: EstadoPedido; label: string }[];
  valor: EstadoPedido;
  onChange: (v: EstadoPedido) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const elegida = opciones.find((o) => o.val === valor) ?? opciones[0];

  return (
    <View>
      <Pressable
        role="button"
        accessibilityLabel="Estado del pedido"
        onPress={() => setAbierto((v) => !v)}
        className="w-full flex flex-row items-center justify-between p-3 bg-white border border-stone-200 rounded-xl"
      >
        <Span className="text-sm text-stone-800">{elegida.label}</Span>
        <ChevronDown size={16} color="#A8A29E" />
      </Pressable>
      {abierto && (
        <View className="mt-1 bg-white border border-stone-200 rounded-xl overflow-hidden">
          {opciones.map((op, i) => (
            <Pressable
              key={op.val}
              role="button"
              onPress={() => { onChange(op.val); setAbierto(false); }}
              className={`p-3 ${i > 0 ? "border-t border-stone-100" : ""}`}
            >
              <Span className={`text-sm ${op.val === valor ? "text-[#C1901D]" : "text-stone-800"}`}>{op.label}</Span>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function ActualizarEstadoModal({
  pedido,
  onClose,
  onConfirm,
  loading
}: {
  pedido: PedidoListItem;
  onClose: () => void;
  onConfirm: (estado: EstadoPedido, desc: string) => void;
  loading: boolean;
}) {
  // Solo se puede transicionar "hacia adelante" o cancelar
  const opciones: { val: EstadoPedido; label: string }[] =
    pedido.estado === "pendiente de envio"
      ? [{ val: "en envio", label: "En Tránsito" }, { val: "cancelado", label: "Cancelar Pedido" }]
      : [{ val: "entregado", label: "Entregado" }, { val: "cancelado", label: "Cancelar Pedido" }];

  const [estadoSelect, setEstadoSelect] = useState<EstadoPedido>(opciones[0].val);
  const [desc, setDesc] = useState("");

  return (
    // `fixed` no existe en nativo: ahí `absolute` cubre el área de la pantalla
    // (debajo del Header y arriba del BottomNav).
    <View className="absolute web:fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 elevation-[50]">
      <Tarjeta className="w-full max-w-md shadow-2xl">
        <H3 peso="bold" className="text-lg text-stone-900 mb-2">Actualizar Pedido</H3>
        <P className="text-sm text-stone-500 mb-4">
          Actualiza el estado del pedido <Span peso="bold" className="text-sm text-stone-500">#{pedido.id.slice(0, 8)}</Span> de <Span peso="bold" className="text-sm text-stone-500">{pedido.cliente_nombre}</Span>.
        </P>

        <View className="flex flex-col gap-4 mb-6">
          <SelectorEstado opciones={opciones} valor={estadoSelect} onChange={setEstadoSelect} />

          <TextInput
            value={desc}
            onChangeText={setDesc}
            multiline
            placeholder="Mensaje para el cliente (ej. Tu pedido va en camino por DHL...)"
            placeholderTextColor="#A8A29E"
            className="w-full p-3 bg-white border border-stone-200 rounded-xl text-sm min-h-[80px]"
          />
        </View>

        <View className="flex flex-row gap-3">
          <Boton variante="secundario" onClick={onClose} className="w-full flex-1">
            Volver
          </Boton>
          {/* En el original las clases de la instancia pintaban el botón rojo
              relleno cuando la opción es cancelar (la variante peligro es de
              borde). El texto va por `claseTexto` (regla 25). */}
          <Boton
            variante={estadoSelect === "cancelado" ? "peligro" : "primario"}
            onClick={() => onConfirm(estadoSelect, desc)}
            loading={loading}
            className={estadoSelect === "cancelado" ? "w-full flex-1 bg-red-600 hover:bg-red-700 border-transparent" : "w-full flex-1"}
            claseTexto={estadoSelect === "cancelado" ? "text-white" : undefined}
          >
            Actualizar
          </Boton>
        </View>
      </Tarjeta>
    </View>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = ["Activos", "Historial"] as const;
type Tab = (typeof TABS)[number];

export interface DatosPedidosDistribuidor {
  activos: PedidoListItem[];
  historial: PedidoListItem[];
}

interface PedidosDistribuidorProps {
  /** Datos ya cargados. Web los trae del servidor; mobile pasa `null`. */
  datos: DatosPedidosDistribuidor | null;
  /** Solo mobile: los pide al montar. */
  cargarDatos?: () => Promise<DatosPedidosDistribuidor>;
  actualizarAction: (id: string, estado: EstadoPedido, desc?: string) => Promise<PedidoActionResult<PedidoResponse>>;
}

export default function PedidosDistribuidor({
  datos: datosIniciales,
  cargarDatos,
  actualizarAction,
}: PedidosDistribuidorProps) {
  const [tab, setTab] = useState<Tab>("Activos");

  const [activos, setActivos] = useState<PedidoListItem[]>(datosIniciales?.activos ?? []);
  const [historial, setHistorial] = useState<PedidoListItem[]>(datosIniciales?.historial ?? []);
  const [cargado, setCargado] = useState(!!datosIniciales);
  const [errorCarga, setErrorCarga] = useState(false);
  const [intento, setIntento] = useState(0);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  // El error lo pinta la `VentanaEmergente` del layout (ver Avisos.tsx).
  const avisar = useAviso();
  const [pedidoAActualizar, setPedidoAActualizar] = useState<PedidoListItem | null>(null);

  useEffect(() => {
    if (datosIniciales || !cargarDatos) return;
    let vigente = true;
    setErrorCarga(false);
    cargarDatos().then(
      (recibidos) => {
        if (!vigente) return;
        setActivos(recibidos.activos);
        setHistorial(recibidos.historial);
        setCargado(true);
      },
      () => { if (vigente) setErrorCarga(true); },
    );
    return () => { vigente = false; };
  }, [intento]);

  const mostrados = tab === "Activos" ? activos : historial;

  const handleActualizar = async (estadoNuevo: EstadoPedido, desc: string) => {
    if (!pedidoAActualizar) return;
    setLoadingId(pedidoAActualizar.id);
    const res = await actualizarAction(pedidoAActualizar.id, estadoNuevo, desc);
    setLoadingId(null);
    const pedido = pedidoAActualizar;
    setPedidoAActualizar(null);

    if (!res.ok) {
      avisar(res.error ?? "No se pudo actualizar el pedido");
      return;
    }

    const pedidoModificado = { ...pedido, estado: estadoNuevo };
    if (estadoNuevo === "entregado" || estadoNuevo === "cancelado") {
      setActivos(a => a.filter(p => p.id !== pedidoModificado.id));
      setHistorial(h => [pedidoModificado, ...h]);
    } else {
      setActivos(a => a.map(p => p.id === pedidoModificado.id ? pedidoModificado : p));
    }
  };

  if (!cargado) {
    return (
      <Section className="mx-auto w-full max-w-5xl px-4 pt-6">
        {errorCarga ? (
          <Tarjeta>
            <P className="text-sm text-stone-500 text-center">No se pudieron cargar los pedidos.</P>
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
      <ContenedorPantalla key="distribuidor-pedidos" indiceFijo={0} className="mx-auto w-full max-w-5xl pb-20">
        <HeaderSticky titulo="Gestión de Pedidos" />

        <View className="px-4 pt-8">
          <P className="text-sm text-stone-500 mt-1">
            Actualiza el estado de los pedidos activos para mantener informados a tus clientes.
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
                {t === "Activos" && activos.length > 0 && (
                  <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: activa ? "#F59E0B" : "#FEF3C7" }}>
                    <Span peso="bold" className={`text-xs ${activa ? "text-stone-900" : "text-amber-700"}`}>
                      {activos.length}
                    </Span>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View className="flex flex-col gap-4">
          {mostrados.length === 0 ? (
            <View className="py-16 items-center">
              <View className="mb-4">
                <Truck size={48} color="#D6D3D1" />
              </View>
              <P peso="medium" className="text-stone-500 text-center">No hay pedidos {tab.toLowerCase()}</P>
            </View>
          ) : (
            mostrados.map((pedido) => {
              const cfg = ESTADO_TARJETA[pedido.estado] ?? { label: pedido.estado, clases: "bg-stone-100 text-stone-700" };
              return (
                <Tarjeta key={pedido.id} className="flex flex-col md:flex-row gap-4 justify-between items-center relative overflow-hidden">
                  <View className="flex-1 w-full pl-2">
                    <View className="flex flex-row items-center gap-2 mb-1">
                      <P peso="bold" className="text-[10px] leading-normal text-stone-400 tracking-[0.5px] uppercase">
                        #{pedido.id.slice(0, 8)}
                      </P>
                      <View className={`px-2 py-0.5 rounded-md ${cfg.clases.split(" ")[0]}`}>
                        <Span peso="semibold" className={`text-[10px] leading-normal uppercase tracking-[0.5px] ${cfg.clases.split(" ")[1]}`}>
                          {cfg.label}
                        </Span>
                      </View>
                    </View>
                    <H3 peso="bold" className="text-base text-stone-900 mb-1">{pedido.cliente_nombre}</H3>
                    <P className="text-xs text-stone-500">{pedido.primer_producto_nombre} ...</P>
                  </View>

                  <View className="flex-1 w-full border-t md:border-t-0 md:border-l border-stone-100 pt-3 md:pt-0 md:pl-4 flex flex-col gap-1">
                    <View className="flex flex-row justify-between">
                      <Span className="text-xs text-stone-500">Confirmado:</Span>
                      <Span peso="medium" className="text-xs text-stone-800">{formatFecha(pedido.confirmado_at)}</Span>
                    </View>
                    {/* Sin `mt-2`: en el original el `space-y-1` del contenedor le ganaba por
                        especificidad y la separación real era de 4px, la que ya da el `gap-1`. */}
                    <View className="flex flex-row justify-between pt-2 border-t border-stone-50">
                      <Span peso="bold" className="text-sm text-stone-800">Total:</Span>
                      <Span peso="bold" className="text-sm text-[#C1901D]">${formatMoney(pedido.total)}</Span>
                    </View>
                  </View>

                  {tab === "Activos" ? (
                    <View className="w-full md:w-auto mt-2 md:mt-0 flex-shrink-0 flex flex-row gap-2">
                      <Boton variante="secundario" className="flex-1 md:flex-none py-2.5" claseTexto="text-xs" href={`/pedidos/${pedido.id}`}>
                        Ver detalle
                      </Boton>
                      <Boton
                        variante="primario"
                        className="flex-1 md:flex-none py-2.5"
                        claseTexto="text-xs"
                        onClick={() => setPedidoAActualizar(pedido)}
                      >
                        Actualizar
                      </Boton>
                    </View>
                  ) : (
                    <View className="w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
                      <Boton variante="secundario" className="w-full py-2.5" claseTexto="text-xs" href={`/pedidos/${pedido.id}`}>
                        Ver detalle
                      </Boton>
                    </View>
                  )}
                </Tarjeta>
              );
            })
          )}
        </View>
      </ContenedorPantalla>

      {pedidoAActualizar && (
        <ActualizarEstadoModal
          pedido={pedidoAActualizar}
          onClose={() => setPedidoAActualizar(null)}
          onConfirm={handleActualizar}
          loading={loadingId === pedidoAActualizar.id}
        />
      )}
    </>
  );
}
