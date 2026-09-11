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
