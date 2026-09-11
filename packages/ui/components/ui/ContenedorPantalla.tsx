/** @jsxImportSource nativewind */

import { Platform, ScrollView, View } from "react-native";

interface ContenedorPantallaProps {
  /** Clases del contenedor de la página (padding, gap, max-w...). */
  className: string;
  /** Índice, entre los hijos directos, del que queda fijo arriba al scrollear. */
  indiceFijo?: number;
  children: React.ReactNode;
}

/**
 * Raíz de una pantalla con un hijo fijo arriba (el buscador).
 *
 * En web scrollea el `<main>` del layout y el hijo se fija con `web:sticky` en
 * su propio className. En nativo no hay sticky en CSS: la pantalla es un
 * ScrollView y el hijo se fija con stickyHeaderIndices, que solo funciona con
 * hijos directos.
 */
export function ContenedorPantalla({ className, indiceFijo, children }: ContenedorPantallaProps) {
  if (Platform.OS === "web") {
    return <View className={className}>{children}</View>;
  }
  return (
    <ScrollView
      stickyHeaderIndices={indiceFijo === undefined ? undefined : [indiceFijo]}
      contentContainerClassName={className}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
