"use client";

import { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { Boton } from "@/components/ui/Boton";

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
 * `ModalConfirmacion` — Componente reutilizable para pedir confirmación de acciones destructivas o importantes.
 * 
 * @example
 * <ModalConfirmacion
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onConfirm={handleArchivar}
 *   titulo="¿Archivar producto?"
 *   mensaje="Este producto dejará de estar visible para tus clientes."
 *   textoConfirmar="Archivar"
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
    // Bloquear el scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Cerrar con Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Click fuera para cerrar */}
            <div className="absolute inset-0" onClick={onClose} />

            <div 
                className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                {/* Botón X */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition p-1 rounded-full hover:bg-stone-100"
                    disabled={isConfirming}
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center mt-2">
                    {/* Icono de advertencia, ajustado por variante si quisieras, aquí por default es rojo/naranja */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${varianteConfirmacion === 'peligro' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        <AlertCircle size={24} />
                    </div>

                    <h2 className="text-xl font-bold text-stone-900 mb-2">
                        {titulo}
                    </h2>
                    
                    <p className="text-sm text-stone-500 mb-8">
                        {mensaje}
                    </p>

                    <div className="flex gap-3 w-full">
                        <Boton 
                            
                            variante={varianteConfirmacion} 
                            className="flex-1 "
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
                    </div>
                </div>
            </div>
        </div>
    );
}
