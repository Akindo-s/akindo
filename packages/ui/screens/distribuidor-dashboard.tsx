/** @jsxImportSource nativewind */
"use client";

import { Suspense, use, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import {
  PlusCircle,
  ShoppingBag,
  ShoppingBasket,
  MessageSquare,
  Inbox,
  ChevronRight,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react-native";
import type { OrdenPedidoListItem } from "@akindo/shared/types/pedidos";
import type { AlertaExistencia, PedidoActivo, ResumenMensual } from "@akindo/shared/api/distribuidor";
import { MONEDA } from "@akindo/shared/constants";
import { H2, H3, H4, P, Section, Span } from "@akindo/ui/html";
import { Boton, Link } from "@akindo/ui/components";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { Badge } from "@akindo/ui/components/ui/Badge";
import { HeaderSticky } from "@akindo/ui/components/ui/HeaderSticky";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { ModalConfirmacion } from "@akindo/ui/components/ui/ModalConfirmacion";
import { useAviso } from "@akindo/ui/components/ui/Avisos";
import { AllInboxIcon, StorefrontIcon } from "@akindo/ui/icons/NavigationIcons";
import ProductActionsMenu from "@akindo/ui/components/perfil/ProductActionsMenu";

function formatMoney(v: number, minimos = 2) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: minimos, maximumFractionDigits: 2 });
}

// ── Resumen ───────────────────────────────────────────────────────────────────

function ResumenStats({ resumen }: { resumen: ResumenMensual | null }) {
  const volumen = resumen?.volumen_bruto_mes || 0;
  const pedidos = resumen?.pedidos_activos || 0;
  const pocoStock = resumen?.productos_poco_stock || 0;

  return (
    <Section className="px-4 flex flex-col gap-3 mb-6">
      <Tarjeta variante="calido" className="relative overflow-hidden">
        <P peso="bold" className="text-[10px] leading-normal text-stone-600 tracking-[0.5px] mb-2">VOLUMEN BRUTO</P>
        <H3 peso="bold" className="text-4xl text-stone-900 mb-2">${formatMoney(volumen)}</H3>
      </Tarjeta>

      <View className="flex flex-row gap-3">
        <Tarjeta variante="calido" className="flex-1 flex flex-col justify-between min-h-[100px] min-w-0">
          <P peso="bold" className="text-[10px] leading-tight text-stone-600 tracking-[0.5px] mb-2">ACTIVOS{"\n"}PEDIDOS</P>
          <H3 peso="bold" numberOfLines={1} className="text-2xl text-stone-900">{pedidos}</H3>
        </Tarjeta>
        <Tarjeta variante="calido" className="flex-1 flex flex-col justify-between min-h-[100px] min-w-0">
          <P peso="bold" className="text-[10px] leading-tight text-stone-600 tracking-[0.5px] mb-2">POCO{"\n"}STOCK</P>
          <View className="min-w-0">
            <H3 peso="bold" numberOfLines={1} className="text-xl text-red-700">{pocoStock} art.</H3>
            <P peso="bold" numberOfLines={1} className="text-[8px] leading-normal text-stone-500 uppercase tracking-[0.8px] mt-0.5">UMBRAL DEL 67</P>
          </View>
        </Tarjeta>
      </View>
    </Section>
  );
}

// ── Órdenes pendientes ────────────────────────────────────────────────────────

function OrdenesPendientes({ ordenes }: { ordenes: OrdenPedidoListItem[] }) {
  if (ordenes.length === 0) return null;

  return (
    <Section className="px-4 mb-8">
      <View className="flex flex-row justify-between items-end mb-4">
        <View className="flex flex-col shrink">
          <H2 peso="bold" className="text-xl text-stone-900">Órdenes pendientes</H2>
          <P peso="medium" className="text-[10px] leading-normal text-stone-500 uppercase tracking-[0.5px]">Requieren tu aprobación</P>
        </View>
        <Link href="/distribuidor/ordenes" bloque className="mb-1 hover:underline">
          <Span peso="bold" className="text-[10px] leading-tight text-red-600 uppercase tracking-[0.5px] text-right">
            gestionar{"\n"}todas
          </Span>
        </Link>
      </View>

      <View className="flex flex-col gap-3">
        {ordenes.slice(0, 3).map((orden) => (
          <Link key={orden.id} href={`/distribuidor/ordenes/${orden.id}`} bloque>
            <Tarjeta variante="calido" conPadding={false} className="p-3 flex flex-row items-center justify-between cursor-pointer border-red-100 bg-red-50/30 relative">
              <View className="flex flex-row gap-3 items-center shrink">
                <View className="relative w-10 h-10 rounded-full flex items-center justify-center bg-[#F0D275]">
                  <View className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#F0D275] items-center justify-center">
                    <Span className="text-base leading-normal text-[#7B5A12]">{orden.paquetes.length}</Span>
                  </View>
                  <Inbox size={20} color="#7B5A12" />
                </View>
                <View className="shrink">
                  <H4 peso="bold" className="text-sm text-stone-900">{orden.cliente_nombre || "Cliente Akindo"}</H4>
                  <View className="flex flex-row items-center gap-2 mt-0.5 flex-wrap">
                    <Span peso="medium" className="text-[10px] leading-normal text-stone-500">#{orden.id.substring(0, 8).toUpperCase()}</Span>
                    <View className="flex flex-row gap-1">
                      {/* Sin el `text-[8px] px-1 py-0` de la instancia: en web el
                          `text-xs px-3 py-1` del propio Badge va después en el CSS y le
                          gana (regla 62). */}
                      {orden.pre_autorizado && <Badge variante="exito">Pre pagado</Badge>}
                      <Badge variante="advertencia">Pendiente</Badge>
                    </View>
                  </View>
                </View>
              </View>
              <View className="flex flex-row items-center gap-3 shrink-0">
                <P peso="extrabold" className="text-sm text-stone-900 text-right">${formatMoney(orden.total)}</P>
                <ChevronRight size={16} color="#A8A29E" />
              </View>
            </Tarjeta>
          </Link>
        ))}
      </View>
    </Section>
  );
}

// ── Pedidos activos ───────────────────────────────────────────────────────────

function PedidosActivos({ pedidos: todos }: { pedidos: PedidoActivo[] }) {
  const pedidos = todos.filter((p) => p.estado !== "entregado" && p.estado !== "cancelado");

  if (pedidos.length === 0) {
    return (
      <Section className="px-4 mb-8">
        <H2 peso="bold" className="text-xl text-stone-900 mb-4">Pedidos activos</H2>
        <Tarjeta variante="calido" className="py-6">
          <P className="text-sm text-stone-500 mb-2 text-center">
            No tienes pedidos activos, ¡da click aquí para averiguar cómo vender mejor!
          </P>
          <View className="items-center">
            <Link href="https://www.youtube.com/watch?v=a40r8AhnPm8&t=2s" bloque className="hover:underline">
              <Span peso="bold" className="text-xs text-[#DDA11E] underline">Descubrir el secreto</Span>
            </Link>
          </View>
        </Tarjeta>
      </Section>
    );
  }

  return (
    <Section className="px-4 mb-8">
      <View className="flex flex-row justify-between items-end mb-4">
        <H2 peso="bold" className="text-xl text-stone-900 shrink">Pedidos activos</H2>
        <Span peso="bold" className="text-[10px] leading-tight text-yellow-700 uppercase tracking-[0.5px] mb-1 text-right">
          VER{"\n"}TODO
        </Span>
      </View>

      <View className="flex flex-col gap-3">
        {pedidos.slice(0, 3).map((pedido) => {
          const esPendiente = pedido.estado === "pendiente de envio" || pedido.estado === "pendiente";
          const esEnEnvio = pedido.estado === "en envio";
          const fondoIcono = esPendiente ? "bg-orange-100" : esEnEnvio ? "bg-blue-100" : "bg-stone-100";
          const colorIcono = esPendiente ? "#EA580C" : esEnEnvio ? "#2563EB" : "#57534E";

          return (
            <Link key={pedido.pedido_id} href={`/pedidos/${pedido.pedido_id}`} bloque>
              <Tarjeta variante="calido" conPadding={false} className="p-3 flex flex-row items-center justify-between cursor-pointer">
                <View className="flex flex-row gap-3 items-center shrink">
                  <View className={`w-10 h-10 rounded-full flex items-center justify-center ${fondoIcono}`}>
                    {esPendiente ? <Clock size={20} color={colorIcono} /> : <CheckCircle2 size={20} color={colorIcono} />}
                  </View>
                  <View className="shrink">
                    <H4 peso="bold" className="text-sm text-stone-900">{pedido.cliente_nombre}</H4>
                    <View className="flex flex-row items-center gap-2 mt-0.5">
                      <Span peso="medium" className="text-[10px] leading-normal text-stone-500">#{pedido.orden_id.substring(0, 8).toUpperCase()}</Span>
                      <Badge
                        variante={esPendiente ? "advertencia" : esEnEnvio ? "neutro" : "exito"}
                        claseTexto="capitalize"
                      >
                        {pedido.estado === "pendiente de envio" ? "Pendiente" : pedido.estado}
                      </Badge>
                    </View>
                  </View>
                </View>
                <View className="flex flex-row items-center gap-3 shrink-0">
                  <P peso="bold" className="text-sm text-stone-900 text-right">${formatMoney(pedido.total)}</P>
                  <ChevronRight size={16} color="#A8A29E" />
                </View>
              </Tarjeta>
            </Link>
          );
        })}
      </View>
    </Section>
  );
}

// ── Alertas de existencias ────────────────────────────────────────────────────

function AlertasExistencias({
  productos,
  onPedirArchivar,
}: {
  productos: AlertaExistencia[];
  onPedirArchivar: (productoId: string) => void;
}) {
  if (productos.length === 0) {
    return (
      <Section className="px-4 mb-8">
        <H2 peso="bold" className="text-xl text-stone-900 mb-4">Alertas de existencias</H2>
        <Tarjeta variante="calido" className="py-6">
          <P className="text-sm text-stone-500 text-center">Todo en orden. No tienes productos con bajo stock.</P>
        </Tarjeta>
      </Section>
    );
  }

  return (
    <Section className="px-4 mb-8">
      <View className="flex flex-row justify-between items-end mb-4">
        <H2 peso="bold" className="text-xl text-stone-900">Alertas de existencias</H2>
      </View>

      <View className="flex flex-col gap-3">
        <Tarjeta variante="calido" className="py-3">
          <H4 peso="bold" className="text-lg text-red-700">{productos.length} artículos</H4>
          <P peso="bold" className="text-[8px] leading-normal text-stone-500 uppercase tracking-[0.8px] mt-0.5">UMBRAL DEL 67</P>
        </Tarjeta>

        {productos.slice(0, 3).map((producto) => (
          <Tarjeta key={producto.producto_id} variante="calido" conPadding={false} className="p-3 flex flex-row gap-3 items-center">
            <View className="w-14 h-14 bg-[#DDA11E]/10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-[#DDA11E]/20">
              {producto.imagen ? (
                <Image source={{ uri: producto.imagen }} accessibilityLabel={producto.nombre} resizeMode="cover" className="w-full h-full" />
              ) : (
                <ImageIcon size={24} color="#854D0E" />
              )}
            </View>
            <View className="flex-1 shrink">
              <H4 peso="bold" className="text-sm text-stone-900 leading-tight">{producto.nombre}</H4>
              <P className="text-[10px] leading-normal text-stone-500 mb-1">SKU: {producto.sku || "N/A"}</P>
              {/* `shrink` en el precio en vez de `flex-wrap`: en web el texto se
                  parte en dos renglones y el badge se queda al lado (regla 24). */}
              <View className="flex flex-row items-center gap-2">
                <Span peso="semibold" className="text-xs text-stone-800 shrink">
                  ${formatMoney(producto.costo)} {MONEDA} / {producto.unidad}
                </Span>
                <Badge variante={producto.existencias === 0 ? "error" : "advertencia"}>
                  {producto.existencias === 0 ? "Sin Stock" : `Bajo Stock (${producto.existencias})`}
                </Badge>
              </View>
            </View>
            <ProductActionsMenu productoId={producto.producto_id} onPedirArchivar={onPedirArchivar} />
          </Tarjeta>
        ))}
      </View>
    </Section>
  );
}

// ── Esqueletos por sección ────────────────────────────────────────────────────
// Los del original de web (`ResumenStatsSkeleton`, `OrdenesPendientesSkeleton`,
// …), que se perdieron al juntar las cuatro llamadas en una sola.

function Bloque({ className }: { className: string }) {
  return <View className={`bg-stone-200 rounded-2xl ${className}`} />;
}

function ResumenSkeleton() {
  return (
    <Section className="px-4 flex flex-col gap-3 mb-6">
      <Bloque className="h-[120px] w-full" />
      <View className="flex flex-row gap-3">
        <Bloque className="flex-1 h-[100px]" />
        <Bloque className="flex-1 h-[100px]" />
      </View>
    </Section>
  );
}

/** El de órdenes, pedidos y alertas: un título y dos o tres tarjetas. */
function ListaSkeleton({ anchoTitulo, altos }: { anchoTitulo: string; altos: string[] }) {
  return (
    <Section className="px-4 mb-8">
      <View className="flex flex-row justify-between items-end mb-4">
        <View className={`h-6 bg-stone-200 rounded ${anchoTitulo}`} />
      </View>
      <View className="flex flex-col gap-3">
        {altos.map((alto, i) => <Bloque key={i} className={`${alto} w-full`} />)}
      </View>
    </Section>
  );
}

/**
 * Lee el dato de una sección. Cada una puede llegar ya resuelta o como promesa:
 * web pasa las promesas sin `await` desde el Server Component (Next las va
 * mandando a medida que resuelven) y mobile las crea en la ruta. `use` puede
 * llamarse condicionalmente, a diferencia de los hooks.
 */
function valorDe<T>(entrada: T | Promise<T>): T {
  return entrada instanceof Promise ? use(entrada) : entrada;
}

function SeccionResumen({ entrada }: { entrada: ResumenMensual | null | Promise<ResumenMensual | null> }) {
  return <ResumenStats resumen={valorDe(entrada)} />;
}

function SeccionOrdenes({ entrada }: { entrada: OrdenPedidoListItem[] | Promise<OrdenPedidoListItem[]> }) {
  return <OrdenesPendientes ordenes={valorDe(entrada)} />;
}

function SeccionPedidos({ entrada }: { entrada: PedidoActivo[] | Promise<PedidoActivo[]> }) {
  return <PedidosActivos pedidos={valorDe(entrada)} />;
}

function SeccionAlertas({
  entrada,
  archivados,
  onPedirArchivar,
}: {
  entrada: AlertaExistencia[] | Promise<AlertaExistencia[]>;
  archivados: string[];
  onPedirArchivar: (productoId: string) => void;
}) {
  // Los archivados se filtran acá: el original hacía `router.refresh()`, que en
  // nativo no existe.
  const productos = valorDe(entrada).filter((p) => !archivados.includes(p.producto_id));
  return <AlertasExistencias productos={productos} onPedirArchivar={onPedirArchivar} />;
}

// ── Pantalla ──────────────────────────────────────────────────────────────────

export interface DatosDashboard {
  resumen: ResumenMensual | null;
  ordenesPendientes: OrdenPedidoListItem[];
  pedidosActivos: PedidoActivo[];
  alertas: AlertaExistencia[];
}

/**
 * Lo mismo que `DatosDashboard`, pero cada sección puede venir como promesa sin
 * resolver. Así vuelve el streaming por sección del original: el encabezado, el
 * "Resumen" y los chips se pintan enseguida y cada bloque aparece cuando llega
 * su llamada, con su esqueleto mientras tanto.
 *
 * Las promesas tienen que estar creadas antes de pintar y no cambiar de
 * identidad entre renders (web: en el Server Component; mobile: en un `useMemo`
 * de la ruta), y ninguna debe rechazar: quien la crea le pone su `.catch`.
 */
export type SeccionesDashboard = {
  [K in keyof DatosDashboard]: DatosDashboard[K] | Promise<DatosDashboard[K]>;
};

interface DistribuidorDashboardProps {
  /** Las cuatro secciones, ya resueltas o como promesas. */
  secciones: SeccionesDashboard;
  /** Archiva un producto de las alertas. Necesita la sesión (regla 13). */
  archivarAction: (productoId: string) => Promise<boolean>;
}

export default function DistribuidorDashboard({ secciones, archivarAction }: DistribuidorDashboardProps) {
  const avisar = useAviso();
  // La confirmación de archivar vive acá y no en el menú de la tarjeta: en
  // nativo un `absolute` adentro de la tarjeta taparía solo la tarjeta (regla 54).
  const [productoAArchivar, setProductoAArchivar] = useState<string | null>(null);
  const [archivando, setArchivando] = useState(false);
  // Lo que se archivó en esta visita. El original hacía `router.refresh()`; acá
  // se filtra en la sección, que es lo que se vería al recargar.
  const [archivados, setArchivados] = useState<string[]>([]);

  const confirmarArchivar = async () => {
    if (!productoAArchivar) return;
    setArchivando(true);
    const ok = await archivarAction(productoAArchivar);
    setArchivando(false);
    const archivado = productoAArchivar;
    setProductoAArchivar(null);
    if (!ok) {
      // El `alert()` del original no existe en nativo.
      avisar("Error al archivar el producto");
      return;
    }
    setArchivados((actuales) => [...actuales, archivado]);
  };

  return (
    <>
    {/* indiceFijo 0: el HeaderSticky. */}
    <ContenedorPantalla key="dashboard" indiceFijo={0} className="max-w-2xl lg:max-w-6xl flex flex-col w-full mx-auto pb-10 bg-[#FAF7F2] md:bg-transparent min-h-screen">
      <HeaderSticky titulo="Administración"/>
      

      

      <View className="px-4 pt-4 mb-2 ">
        <H2 peso="extralight" className="text-sm text-stone-500">
          gestiona tu negocio desde un <Span peso="bold" className="text-sm text-[#DAA520] tracking-[0.5px]">único</Span> lugar
        </H2>
      </View>

      <Section className="px-4 mb-4 mt-4">
        <H2 peso="bold" className="text-2xl text-stone-900 mb-1">Resumen</H2>
        <P className="text-sm text-stone-500">Cifras de ventas de este último mes.</P>
      </Section>

      {/* Un `Suspense` por sección, como el original: cada bloque aparece cuando
          llega su llamada, no las cuatro juntas. */}
      <Suspense fallback={<ResumenSkeleton />}>
        <SeccionResumen entrada={secciones.resumen} />
      </Suspense>

      {/* Acciones rápidas */}
      <Section className="px-4 mb-8">
        {/* El `overflow-x-auto` del original: en nativo la fila que scrollea es
            un ScrollView horizontal (regla 17). */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 p-2">
          <Boton claseTexto="text-xs" className="w-fit min-w-fit px-4 py-3" variante="oscuro" href="/distribuidor/pedidos" Icono={StorefrontIcon} iconoSize={16}>Mi tienda</Boton>
          <Boton claseTexto="text-xs" className="w-fit min-w-fit px-4 py-3"variante="primario" href="/distribuidor/productos/crear" Icono={PlusCircle} iconoSize={16}>Nuevo producto</Boton>
          <Boton claseTexto="text-xs" className="w-fit min-w-fit px-4 py-3" variante="chip" href="/distribuidor/pedidos" Icono={ShoppingBasket} iconoSize={16}>Pedidos</Boton>
          <Boton claseTexto="text-xs" className="w-fit min-w-fit px-4 py-3" variante="chip" href="/distribuidor/ordenes" Icono={ShoppingBag} iconoSize={16}>Órdenes de Compra</Boton>
          <Boton claseTexto="text-xs" className="w-fit min-w-fit py-3 m-0 px-5" variante="chip" href="/distribuidor/productos/" Icono={AllInboxIcon} iconoSize={16}>Inventario</Boton>
          <Boton  claseTexto="text-xs" className="w-fit min-w-fit px-4 py-3" variante="chip" href="/distribuidor/valoraciones" Icono={MessageSquare} iconoSize={16}>Valoraciones</Boton>
        </ScrollView>
      </Section>

      <Suspense fallback={<ListaSkeleton anchoTitulo="w-56" altos={["h-[76px]", "h-[76px]"]} />}>
        <SeccionOrdenes entrada={secciones.ordenesPendientes} />
      </Suspense>
      <Suspense fallback={<ListaSkeleton anchoTitulo="w-48" altos={["h-[76px]", "h-[76px]"]} />}>
        <SeccionPedidos entrada={secciones.pedidosActivos} />
      </Suspense>
      <Suspense fallback={<ListaSkeleton anchoTitulo="w-48" altos={["h-[60px]", "h-[80px]", "h-[80px]"]} />}>
        <SeccionAlertas entrada={secciones.alertas} archivados={archivados} onPedirArchivar={setProductoAArchivar} />
      </Suspense>
      
    </ContenedorPantalla>

    {/* El modal, fuera del ContenedorPantalla (regla 54). */}
    <ModalConfirmacion
      isOpen={productoAArchivar !== null}
      onClose={() => !archivando && setProductoAArchivar(null)}
      onConfirm={confirmarArchivar}
      isConfirming={archivando}
      titulo="¿Archivar producto?"
      mensaje="El producto se marcará como archivado y ya no aparecerá activo en el catálogo público."
      textoConfirmar="Sí, archivar"
    />
    </>
  );
}
