import { API_URL } from "../constants";
import { TokenExpiradoError } from "../sesion";

/**
 * `RequestInit` mas la extension `next` que agrega Next.js para el ISR.
 * En React Native (Expo) esa propiedad simplemente se ignora, asi que es
 * seguro incluirla desde codigo compartido.
 */
export interface RequestInitConCache extends RequestInit {
  next?: { revalidate?: number | false };
}

/**
 * Wrapper centralizado para hacer peticiones a la API.
 *
 * A diferencia de la version original de Next, este wrapper NO lee cookies ni
 * redirige: recibe el token explicitamente y, ante un 498, lanza
 * `TokenExpiradoError` para que cada plataforma decida como navegar.
 *
 * @param revalidate `false` (por defecto) usa `no-store`; un numero activa el
 * ISR de Next. En Expo la opcion es inerte y la peticion sale sin cache.
 */
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
  revalidate: number | false = false
): Promise<Response> {
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Asegurarse de que Content-Type sea JSON si no se especificó y el body es un string
  if (!headers.has("Content-Type") && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  const init: RequestInitConCache = {
    ...options,
    headers,
    ...(revalidate === false
      ? { cache: "no-store" as RequestCache }
      : { next: { revalidate } }),
  };

  const response = await fetch(url, init);

  if (response.status === 498) {
    throw new TokenExpiradoError();
  }

  return response;
}
