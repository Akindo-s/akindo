import Carrito from "@akindo/ui/screens/carrito";
import {
  actualizarCantidad,
  cargarCarrito,
  eliminarItem,
  vaciarCarritos,
} from "@/utils/providers-data";

export default function CarritoScreen() {
  return (
    // `initialData` null: web lo trae del servidor y acá lo pide la pantalla.
    <Carrito
      initialData={null}
      actualizarCantidadAction={actualizarCantidad}
      eliminarItemAction={eliminarItem}
      vaciarCarritosAction={vaciarCarritos}
      recargarCarritoAction={cargarCarrito}
    />
  );
}
