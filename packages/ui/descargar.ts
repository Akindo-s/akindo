// mobile version
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { ArchivoExportado } from "@akindo/shared/api/pedidos";

/**
 * Guarda el archivo y abre la hoja para compartirlo.
 *
 * En nativo no existe la descarga del navegador: el archivo se escribe en la
 * caché de la app (que el sistema limpia solo) y se ofrece con la hoja del
 * sistema, desde donde el usuario lo manda a Archivos, a un correo o a otra
 * app.
 */
export async function descargarArchivo({ nombre, base64, tipo }: ArchivoExportado): Promise<void> {
  const archivo = new File(Paths.cache, nombre);
  if (archivo.exists) archivo.delete();
  archivo.create();
  archivo.write(base64, { encoding: "base64" });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Este dispositivo no puede compartir archivos");
  }
  await Sharing.shareAsync(archivo.uri, { mimeType: tipo, dialogTitle: nombre, UTI: "com.microsoft.excel.xlsx" });
}
