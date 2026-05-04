"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit3, Archive, PackagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { archivarProducto } from "@/lib/api/productos";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";

interface ProductActionsMenuProps {
    productoId: string;
}

export default function ProductActionsMenu({ productoId }: ProductActionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Cerrar al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleEdit = () => {
        setIsOpen(false);
        router.push(`/distribuidor/productos/${productoId}/editar`);
    };

    const handleArchiveClick = () => {
        setIsOpen(false);
        setIsArchiveModalOpen(true);
    };

    const confirmArchive = async () => {
        setIsArchiving(true);
        const success = await archivarProducto(productoId);
        setIsArchiving(false);
        setIsArchiveModalOpen(false);
        
        if (success) {
            router.refresh();
        } else {
            alert("Error al archivar el producto");
        }
    };

    const handleRestock = () => {
        setIsOpen(false);
        // Lleva a editar para que le suba existencias
        router.push(`/distribuidor/productos/${productoId}/editar`);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="text-stone-400 p-2 hover:text-stone-600 transition hover:bg-stone-100 rounded-full"
            >
                <MoreVertical size={16} />
            </button>

            {isOpen && (
                <div className="absolute right-0 bottom-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-stone-100 py-1 z-10 flex flex-col overflow-hidden">
                    <button 
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-[#FDF2E3] hover:text-[#DAA520] transition text-left"
                    >
                        <Edit3 size={14} />
                        Editar
                    </button>
                    <button 
                        onClick={handleRestock}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-[#FDF2E3] hover:text-[#DAA520] transition text-left"
                    >
                        <PackagePlus size={14} />
                        Surtir existencias
                    </button>
                    <div className="h-px bg-stone-100 my-1" />
                    <button 
                        onClick={handleArchiveClick}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-red-50 hover:text-red-500 transition text-left"
                    >
                        <Archive size={14} />
                        Archivar
                    </button>
                </div>
            )}

            {/* Modal de confirmación */}
            <ModalConfirmacion
                isOpen={isArchiveModalOpen}
                onClose={() => setIsArchiveModalOpen(false)}
                onConfirm={confirmArchive}
                isConfirming={isArchiving}
                titulo="¿Archivar producto?"
                mensaje="El producto se marcará como archivado y ya no aparecerá activo en el catálogo público."
                textoConfirmar="Sí, archivar"
            />
        </div>
    );
}
