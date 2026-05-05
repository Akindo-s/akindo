import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL } from "./constants";

/**
 * Wrapper centralizado para hacer peticiones a la API desde el servidor.
 * Acepta el token directamente para evitar leer cookies múltiples veces.
 * Si la respuesta es 498 (Token expirado), redirige al usuario a /login.
 */
export async function fetchWithAuth(
    endpoint: string,
    options: RequestInit = {},
    token?: string,
    revalidate: number | false = false  // 👈 false = no-store por defecto

) {
    // Solo leer cookies si el token no fue pasado directamente
    const authToken = token ?? (await cookies()).get("token")?.value;

    const headers = new Headers(options.headers || {});

    if (authToken) {
        headers.set("Authorization", `Bearer ${authToken}`);
    }

    // Asegurarse de que Content-Type sea JSON si no se especificó y el body es un string
    if (!headers.has("Content-Type") && typeof options.body === "string") {
        headers.set("Content-Type", "application/json");
    }

    const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers,
        ...(revalidate === false
            ? { cache: "no-store" }
            : { next: { revalidate } }),
    });

    if (response.status === 498) {
        redirect("/login");
    }

    return response;
}
