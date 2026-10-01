import { Metadata } from "next";
import Carrito from "@akindo/ui/screens/carrito";
import {
  actualizarCantidadCarrito,
  eliminarItemCarrito,
  obtenerCarritoCliente,
  vaciarCarritosCliente,
} from "@/lib/api/carrito";
import { sesionRequerida } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Mi Carrito",
};

export default async function CarritoPage() {
  await sesionRequerida("cliente");

  const initialData = await obtenerCarritoCliente();

  async function actualizarCantidadAction(
    distribuidorId: string,
    productoId: string,
    cantidad: number
  ) {
    "use server";
    return actualizarCantidadCarrito(distribuidorId, productoId, cantidad);
  }

  async function eliminarItemAction(distribuidorId: string, productoId: string) {
    "use server";
    return eliminarItemCarrito(distribuidorId, productoId);
  }

  async function recargarCarritoAction() {
    "use server";
    return obtenerCarritoCliente();
  }

  async function vaciarCarritosAction() {
    "use server";
    return vaciarCarritosCliente();
  }

  return (
    <Carrito
      initialData={initialData}
      actualizarCantidadAction={actualizarCantidadAction}
      eliminarItemAction={eliminarItemAction}
      vaciarCarritosAction={vaciarCarritosAction}
      recargarCarritoAction={recargarCarritoAction}
    />
  );
}
