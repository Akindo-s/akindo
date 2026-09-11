// mobile version
import { launchImageLibraryAsync } from "expo-image-picker";

/**
 * Abre la galeria y devuelve la URI de la imagen elegida, o `null` si se
 * cancelo. En iOS y Android usa el selector del sistema, que no pide permiso
 * de acceso a las fotos.
 *
 * El gemelo web (`image-picker.web.ts`) hace lo mismo con un
 * `<input type="file">`, igual que la web original.
 */
export async function elegirImagen(): Promise<string | null> {
  const resultado = await launchImageLibraryAsync({ mediaTypes: ["images"] });
  if (resultado.canceled) return null;
  return resultado.assets[0]?.uri ?? null;
}

/**
 * Convierte la URI que devuelve `elegirImagen` en lo que `FormData` necesita
 * para subirla. En nativo no hay `Blob` de un `file://`: React Native acepta
 * `{ uri, name, type }` y arma el multipart él mismo (por eso el cast).
 */
export async function archivoDeImagen(uri: string): Promise<Blob> {
  const nombre = uri.split("/").pop() || "imagen.jpg";
  const extension = nombre.split(".").pop()?.toLowerCase() || "jpeg";
  const type = `image/${extension === "jpg" ? "jpeg" : extension}`;
  return { uri, name: nombre, type } as unknown as Blob;
}
