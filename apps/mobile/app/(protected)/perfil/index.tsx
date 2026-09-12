import { useEffect, useState } from "react";
import { View } from "react-native";
import { Redirect, Stack, Tabs } from "expo-router";
import Perfil from "@akindo/ui/screens/perfil";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import { useSesion } from "@/utils/session";
import { _logout } from "@/utils/auth";
import {
  actualizarImagenPerfil,
  agregarDireccion,
  cargarDirecciones,
  cargarPerfilCliente,
  cargarPerfilDistribuidor,
  guardarDireccion,
  guardarPerfilCliente,
  quitarDireccion,
} from "@/utils/providers-data";

/**
 * Igual que el `page.tsx` de web: un distribuidor no tiene perfil propio acá,
 * se va a su tienda. La diferencia es que web lo resuelve en el servidor antes
 * de pintar y acá hay que pedir el perfil primero.
 */
function PerfilDistribuidor() {
  const [destino, setDestino] = useState<string | null>(null);

  useEffect(() => {
    cargarPerfilDistribuidor().then((distribuidor) =>
      setDestino(distribuidor?.id ? `/mercado/distribuidor/tienda?d=${distribuidor.id}` : "/mercado"),
    );
  }, []);

  if (!destino) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner tamano={32} />
      </View>
    );
  }
  return <Redirect href={destino as never} />;
}

export default function PerfilScreen() {
  const { tipo } = useSesion();

  if (tipo === "distribuidor") return <PerfilDistribuidor />;

  return (
    // `cliente` null: web lo trae del servidor y acá lo pide la pantalla.
    <>
    
    <Perfil
      cliente={null}
      cargarCliente={cargarPerfilCliente}
      actualizarPerfil={guardarPerfilCliente}
      subirImagenPerfil={actualizarImagenPerfil}
      cargarDirecciones={cargarDirecciones}
      crearDireccion={agregarDireccion}
      actualizarDireccion={guardarDireccion}
      eliminarDireccion={quitarDireccion}
      onLogout={_logout}
      />
      </>
  );
}
