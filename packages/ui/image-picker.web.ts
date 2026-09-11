// web version (Next): lo mismo que hacia el `<input type="file" accept="image/*">`
// del form original, sin arrastrar expo-image-picker al bundle de web.

/**
 * Abre el selector de archivos y devuelve una URL `blob:` de la imagen
 * elegida, o `null` si se cancelo. Tiene que llamarse dentro de un gesto del
 * usuario (un onPress), como cualquier `input.click()`.
 */
export function elegirImagen(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    // Safari no abre el selector si el input no esta en el documento.
    document.body.appendChild(input);

    const terminar = (uri: string | null) => {
      input.remove();
      resolve(uri);
    };
    input.addEventListener("change", () => {
      const archivo = input.files?.[0];
      terminar(archivo ? URL.createObjectURL(archivo) : null);
    });
    input.addEventListener("cancel", () => terminar(null));

    input.click();
  });
}
