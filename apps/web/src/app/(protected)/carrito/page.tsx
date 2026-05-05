import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CarritoView from "@/components/carrito/CarritoView";
import {
  actualizarCantidadCarrito,
  eliminarItemCarrito,
  obtenerCarritoCliente,
  vaciarCarritosCliente,
} from "@/lib/api/carrito";

export const metadata: Metadata = {
  title: "Mi Carrito",
};

export default async function CarritoPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const tipoUsuario = cookieStore.get("tipo_usuario")?.value;

  if (!token || tipoUsuario !== "cliente") {
    redirect("/login");
  }

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
    <CarritoView
      initialData={initialData}
      actualizarCantidadAction={actualizarCantidadAction}
      eliminarItemAction={eliminarItemAction}
      vaciarCarritosAction={vaciarCarritosAction}
      recargarCarritoAction={recargarCarritoAction}
    />
  );
}
