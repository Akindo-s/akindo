// mobile version
import { Alert } from "react-native";

/**
 * Pregunta sí/no. Equivalente del `window.confirm` de web: en nativo es el
 * diálogo del sistema, que también bloquea hasta que el usuario elige.
 */
export function confirmar(mensaje: string, titulo = "Confirmar"): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(titulo, mensaje, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Aceptar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
