// mobile version
import { launchImageLibraryAsync, UIImagePickerPreferredAssetRepresentationMode } from "expo-image-picker";
import { File } from "expo-file-system";

/**
 * Abre la galeria y devuelve la URI de la imagen elegida, o `null` si se
 * cancelo. En iOS y Android usa el selector del sistema, que no pide permiso
 * de acceso a las fotos.
 *
 * El gemelo web (`image-picker.web.ts`) hace lo mismo con un
 * `<input type="file">`, igual que la web original.
 *
 * `preferredAssetRepresentationMode: Compatible`: la fototeca de iOS guarda
 * HEIC y la API solo acepta jpeg/png/webp (respondía 422 "Tipo de archivo no
 * permitido: image/heic"). En modo compatible, el selector del sistema entrega
 * un JPEG. `quality` recomprime: las fotos de un teléfono pasan fácil del
 * límite de 5 MB de la API.
 */
export async function elegirImagen(): Promise<string | null> {
  const resultado = await launchImageLibraryAsync({
    mediaTypes: ["images"],
    preferredAssetRepresentationMode: UIImagePickerPreferredAssetRepresentationMode.Compatible,
    quality: 0.8,
  });
  if (resultado.canceled) return null;
  return resultado.assets[0]?.uri ?? null;
}

/**
 * Convierte la URI que devuelve `elegirImagen` en lo que hay que mandarle a la
 * API dentro de un `FormData`.
 *
 * Tiene que ser un `Blob` de verdad o algo con `bytes()`: el `fetch` global de
 * Expo arma el multipart él mismo (`expo/src/winter/fetch/convertFormData.ts`)
 * y solo entiende strings, `Blob` y objetos con `bytes()`. El
 * `{ uri, name, type }` de toda la vida —el que sí entiende el FormData de
 * React Native— lo rechaza con "Unsupported FormDataPart implementation".
 *
 * El `File` de expo-file-system cumple: es Blob-compatible, tiene `bytes()` y
 * expone `name` y `type`, que es de donde salen el `filename` y el
 * `content-type` de la parte.
 */
export async function archivoDeImagen(uri: string): Promise<Blob> {
  return new File(uri);
}
