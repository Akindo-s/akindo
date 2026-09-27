import { useCallback, useMemo } from "react";
import { useRouter, usePathname, useLocalSearchParams, useNavigation } from "expo-router";

export { usePathname };
export default useRouter;

/**
 * Misma API que `useSearchParams` de Next (`.get()`, `.toString()`), armada
 * con los parámetros de expo-router.
 */
export function useSearchParams(): URLSearchParams {
  const parametros = useLocalSearchParams();
  return useMemo(() => {
    const busqueda = new URLSearchParams();
    for (const [clave, valor] of Object.entries(parametros)) {
      if (typeof valor === "string") busqueda.set(clave, valor);
      else if (Array.isArray(valor)) valor.forEach((v) => busqueda.append(clave, v));
    }
    return busqueda;
  }, [parametros]);
}

/**
 * Cambia parámetros de la ruta actual sin navegar. `null` borra el parámetro.
 * Nativo: `setParams` de la navegación de la propia pantalla. El
 * `router.setParams` de expo-router, con Tabs y un Stack anidado, navegaba
 * (al índice de mercado, o a "Unmatched Route") en vez de cambiar los params.
 */
export function useActualizarParametros() {
  const navigation = useNavigation();
  return useCallback((cambios: Record<string, string | null>) => {
    const parametros: Record<string, string | undefined> = {};
    for (const [clave, valor] of Object.entries(cambios)) parametros[clave] = valor ?? undefined;
    navigation.setParams(parametros as never);
  }, [navigation]);
}
