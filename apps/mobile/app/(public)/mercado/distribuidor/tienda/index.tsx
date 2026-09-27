import { useLocalSearchParams } from "expo-router";
import Tienda from "@akindo/ui/screens/tienda";
import {
  actualizarImagenNegocio,
  actualizarImagenPerfil,
  actualizarPerfilDistribuidor,
  esDistribuidorDueno,
} from "@/utils/providers-data";

export default function TiendaScreen() {
  const { d } = useLocalSearchParams<{ d?: string }>();
  return (
    <Tienda
      distribuidorId={typeof d === "string" ? d : null}
      esDistribuidorDueno={esDistribuidorDueno}
      actualizarImagenNegocio={actualizarImagenNegocio}
      actualizarImagenPerfil={actualizarImagenPerfil}
      actualizarPerfilDistribuidor={actualizarPerfilDistribuidor}
    />
  );
}
