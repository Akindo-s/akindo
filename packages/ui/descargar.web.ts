// web version: un Blob + un <a download>, que es como descarga un navegador.
import type { ArchivoExportado } from "@akindo/shared/api/pedidos";

/** base64 a bytes. En el navegador `atob` siempre existe. */
function aBytes(base64: string): Uint8Array {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/**
 * Entrega el archivo al usuario.
 *
 * Se crea una URL temporal para el Blob y se dispara un `<a download>`. El
 * `href` no puede ser el del endpoint: pide `Authorization`, así que el
 * contenido ya viene generado por `@akindo/shared`.
 */
export async function descargarArchivo({ nombre, base64, tipo }: ArchivoExportado): Promise<void> {
  const url = URL.createObjectURL(new Blob([aBytes(base64)], { type: tipo }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Safari necesita que la URL siga viva mientras arranca la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
