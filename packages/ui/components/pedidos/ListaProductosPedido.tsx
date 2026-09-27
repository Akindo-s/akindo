/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import { Image, View } from "react-native";
import { Package2 } from "lucide-react-native";
import type { PedidoItemResponse } from "@akindo/shared/types/pedidos";
import { P } from "../html-elements";
import { Link } from "../link";
import { Tarjeta } from "../ui/Tarjeta";

interface ListaProductosPedidoProps {
  productos: PedidoItemResponse[];
  titulo?: string;
  /** Cada renglón enlaza al detalle del producto. */
  conLinks?: boolean;
}

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Un renglón de la lista. `enHover` pinta el `hover:bg-stone-50` del original. */
function Renglon({ prod, enHover }: { prod: PedidoItemResponse; enHover: boolean }) {
  return (
    <View className={`flex flex-row items-center gap-4 p-4 transition-colors ${enHover ? "bg-stone-50" : ""}`}>
      <View className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
        {prod.imagen_producto ? (
          <Image
            source={{ uri: prod.imagen_producto }}
            accessibilityLabel={prod.nombre_producto ?? ""}
            resizeMode="cover"
            className="w-full h-full"
          />
        ) : (
          <View className="w-full h-full flex items-center justify-center">
            <Package2 size={24} color="#D6D3D1" />
          </View>
        )}
      </View>
      <View className="flex-1 min-w-0 shrink">
        <P peso="bold" numberOfLines={1} className="text-sm text-stone-900">
          {prod.nombre_producto || prod.medida_snapshot.nombre}
        </P>
        <P className="text-xs text-stone-500">
          {prod.cantidad} {prod.medida_snapshot.unidad} × ${formatMoney(prod.costo_unitario)}
        </P>
      </View>
      {/* `font-black` (900): la familia llega a 800, igual que en web. */}
      <P peso="extrabold" className="text-sm text-stone-900">${formatMoney(prod.subtotal)}</P>
    </View>
  );
}

/**
 * Lista de productos de un pedido. La usa el detalle del cliente y (más
 * adelante) el del distribuidor, de ahí el `titulo` y el `conLinks`.
 */
export function ListaProductosPedido({
  productos,
  titulo = "Productos",
  conLinks = false,
}: ListaProductosPedidoProps) {
  // El hover del renglón va por estado y no con una variante `hover:`: dentro
  // de un Link, la variante en el hijo se queda con el toque (regla 57).
  const [enHover, setEnHover] = useState<string | null>(null);

  return (
    <View className="flex flex-col gap-2">
      <P peso="semibold" className="text-xs text-stone-500 uppercase tracking-[0.3px]">{titulo}</P>
      {/* El `divide-y` del original: el borde lo pone cada renglón menos el
          primero (regla 44). */}
      <Tarjeta conPadding={false} className="overflow-hidden">
        {productos.map((prod, i) => {
          const contenido = <Renglon prod={prod} enHover={enHover === prod.producto_id} />;
          return (
            <View key={String(prod.producto_id)} className={i > 0 ? "border-t border-stone-100" : ""}>
              {conLinks ? (
                <Link
                  href={`/mercado/productos/detalle?p=${prod.producto_id}`}
                  bloque
                  onHoverChange={(v) => setEnHover(v ? String(prod.producto_id) : null)}
                >
                  {contenido}
                </Link>
              ) : (
                contenido
              )}
            </View>
          );
        })}
      </Tarjeta>
    </View>
  );
}
