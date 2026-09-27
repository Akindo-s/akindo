/** @jsxImportSource nativewind */
"use client";

import { useEffect } from "react";
import { Platform, View } from "react-native";
import { AlertCircle, X } from "lucide-react-native";
import { H2, P, Pressable } from "../html-elements";
import { Boton } from "../button";

interface ModalConfirmacionProps {
    /** Controla si el modal es visible. */
    isOpen: boolean;
    /** Título principal del modal. */
    titulo: string;
    /** Mensaje explicativo del modal. */
    mensaje: string;
    /** Texto del botón de confirmar. Default: "Confirmar" */
    textoConfirmar?: string;
    /** Texto del botón de cancelar. Default: "Cancelar" */
    textoCancelar?: string;
    /** Variante del botón de confirmación. Default: "peligro" */
    varianteConfirmacion?: "primario" | "peligro" | "secundario";
    /** Estado de carga durante la confirmación. */
    isConfirming?: boolean;
    /** Función a ejecutar al hacer clic en Cancelar o fuera del modal. */
    onClose: () => void;
    /** Función a ejecutar al hacer clic en Confirmar. */
    onConfirm: () => void;
}

/**
 * `ModalConfirmacion` — pide confirmación de una acción destructiva.
 *
 * Igual que el original de web, pero sin DOM: el `fixed` pasa a
 * `absolute web:fixed` (regla 6) y el bloqueo del scroll del body y el cierre
 * con Escape quedan solo en web, donde existen `document` y el teclado.
 *
 * @example
 * <ModalConfirmacion
 *   isOpen={abierto}
 *   onClose={() => setAbierto(false)}
 *   onConfirm={cancelar}
 *   titulo="Cancelar Orden"
 *   mensaje="Esta acción no se puede deshacer."
 *   textoConfirmar="Sí, cancelar orden"
 * />
 */
export function ModalConfirmacion({
    isOpen,
    titulo,
    mensaje,
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    varianteConfirmacion = "peligro",
    isConfirming = false,
    onClose,
    onConfirm,
}: ModalConfirmacionProps) {
    // Bloquear el scroll del body cuando el modal está abierto (solo web).
    useEffect(() => {
        if (Platform.OS !== "web") return;
        document.body.style.overflow = isOpen ? "hidden" : "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Cerrar con Escape (solo web: en nativo no hay tecla).
    useEffect(() => {
        if (Platform.OS !== "web") return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <View className="absolute web:fixed inset-0 z-50 elevation-[50] flex items-center justify-center p-4 bg-stone-900/40 web:backdrop-blur-sm">
            {/* Click fuera para cerrar */}
            <Pressable className="absolute inset-0" onPress={onClose} />

            {/* Sin `role="dialog"`: no es un rol de accesibilidad válido en
                React Native. */}
            <View className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl p-6">
                {/* Botón X */}
                <Pressable
                    role="button"
                    accessibilityLabel="Cerrar"
                    onPress={onClose}
                    disabled={isConfirming}
                    className="absolute top-4 right-4 z-10 transition p-1 rounded-full hover:bg-stone-100"
                >
                    <X size={20} color="#A8A29E" />
                </Pressable>

                <View className="flex flex-col items-center mt-2">
                    {/* El ícono de advertencia: rojo en la variante peligro. */}
                    <View className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${varianteConfirmacion === "peligro" ? "bg-red-100" : "bg-yellow-100"}`}>
                        <AlertCircle size={24} color={varianteConfirmacion === "peligro" ? "#DC2626" : "#CA8A04"} />
                    </View>

                    <H2 peso="bold" className="text-xl text-stone-900 mb-2 text-center">
                        {titulo}
                    </H2>

                    <P className="text-sm text-stone-500 mb-8 text-center">
                        {mensaje}
                    </P>

                    <View className="flex flex-row gap-3 w-full">
                        <Boton
                            variante={varianteConfirmacion}
                            className="flex-1"
                            onClick={onClose}
                            disabled={isConfirming}
                        >
                            {textoCancelar}
                        </Boton>

                        <Boton
                            variante="secundario"
                            className="flex-1 self-center bg-transparent"
                            onClick={onConfirm}
                            loading={isConfirming}
                            loadingText="Espere..."
                        >
                            {textoConfirmar}
                        </Boton>
                    </View>
                </View>
            </View>
        </View>
    );
}
