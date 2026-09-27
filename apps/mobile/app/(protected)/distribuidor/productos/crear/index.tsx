import RegistrarProductoForm from "@akindo/ui/components/productos/RegistrarProductoForm";
import {
  actualizarProductoDistribuidor,
  crearProductoDistribuidor,
  guardarBorradorProductoDistribuidor,
  subirImagenProductoDistribuidor,
} from "@/utils/providers-data";

export default function CrearProductoScreen() {
  return (
    <RegistrarProductoForm
      crearAction={crearProductoDistribuidor}
      guardarBorradorAction={guardarBorradorProductoDistribuidor}
      actualizarAction={actualizarProductoDistribuidor}
      subirImagenAction={subirImagenProductoDistribuidor}
    />
  );
}
