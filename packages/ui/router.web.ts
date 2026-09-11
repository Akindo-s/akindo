import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export { usePathname, useSearchParams };
export default useRouter;

/**
 * Cambia parámetros de la ruta actual sin navegar. `null` borra el parámetro.
 * Web: `router.replace` con `scroll: false`, como hacían las páginas de mercado.
 */
export function useActualizarParametros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return useCallback((cambios: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);
}
