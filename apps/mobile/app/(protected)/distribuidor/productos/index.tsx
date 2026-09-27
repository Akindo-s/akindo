import { useEffect, useState } from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import Inventario from "@akindo/ui/screens/inventario";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import { archivarProductoDistribuidor, cargarPerfilDistribuidor } from "@/utils/providers-data";

export default function InventarioScreen() {
  // En web el `page.tsx` saca el id del perfil en el servidor; acá hay que
  // pedirlo antes de pintar la pantalla.
  const [distribuidorId, setDistribuidorId] = useState<string | null>(null);
  const [sinPerfil, setSinPerfil] = useState(false);

  useEffect(() => {
    let vigente = true;
    cargarPerfilDistribuidor().then(
      (perfil) => {
        if (!vigente) return;
        if (perfil?.id) setDistribuidorId(perfil.id);
        else setSinPerfil(true);
      },
      () => { if (vigente) setSinPerfil(true); },
    );
    return () => { vigente = false; };
  }, []);

  // Lo mismo que hace el `page.tsx` cuando el perfil no trae id.
  if (sinPerfil) return <Redirect href={"/distribuidor" as never} />;

  if (!distribuidorId) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FAF7F2]">
        <Spinner tamano={32} />
      </View>
    );
  }

  return <Inventario distribuidorId={distribuidorId} archivarAction={archivarProductoDistribuidor} />;
}
