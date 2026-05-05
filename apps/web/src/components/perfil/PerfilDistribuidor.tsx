import { PlusCircle, FileText, Users } from "lucide-react";
import { Suspense } from "react";
import { Boton } from "@/components/ui/Boton";
import { AllInboxIcon } from "../icons/NavigationIcons";
import ResumenStats, { ResumenStatsSkeleton } from "./dashboard/ResumenStats";
import AlertasExistenciasList, { AlertasExistenciasSkeleton } from "./dashboard/AlertasExistenciasList";
import PedidosActivosList, { PedidosActivosSkeleton } from "./dashboard/PedidosActivosList";

interface Direccion {
    id: string;
    calle: string;
    ciudad: string;
    estado: string;
    codigo_postal: string;
    es_predeterminada: boolean;
}

interface Distribuidor {
    id: string;
    nombre: string;
    nombre_negocio: string;
    rfc: string;
    direcciones: Direccion[];
    imagen_perfil: string | null;
    imagen_fondo: string | null;
    valoracion_promedio: number;
    total_valoraciones: number;
    fecha_creacion: string;
}

interface Props {
    distribuidor: Distribuidor | null;
}

export default function PerfilDistribuidor({ distribuidor }: Props) {
    if (!distribuidor) return <div className="p-4 text-center text-sm text-stone-500">Cargando dashboard...</div>;

    return (
        <div className="flex flex-col w-full max-w-2xl lg:max-w-4xl mx-auto pb-10 bg-[#FAF7F2] md:bg-transparent min-h-screen overflow-x-hidden">
            {/* Header */}
            <header className="flex flex-col items-center justify-center p-4 mb-2">
                <h1 className="text-xl font-semibold text-stone-900">Administracion</h1>
                <h2 className="font-extralight">
                    gestiona tu negocio desde un <b className="font-bold text-[var(--color-primary-500)] tracking-wider">unico</b> lugar
                </h2>
            </header>

            {/* Resumen */}
            
            <section className="px-4 mb-4 mt-4">
                <h2 className="text-2xl font-bold text-stone-900 mb-1">Resumen</h2>
                <p className="text-sm text-stone-500">Cifras de ventas de este último mes.</p>
            </section>

            {/* Stats grid con Suspense */}
            <Suspense fallback={<ResumenStatsSkeleton />}>
                <ResumenStats />
            </Suspense>
            

            {/* Acciones rápidas */}
            <section className="px-4 mb-8">
                <div className="flex gap-3 overflow-x-auto no-scrollbar p-2">
                    <Boton variante="chip" href="/distribuidor/productos/" className="m-0  px-5">
                        <AllInboxIcon size={16} className="flex-shrink-0" />
                        Inventario
                    </Boton>
                    <Boton variante="chip" href="/distribuidor/productos/crear" className="bg-[#DDA11E]">
                        <PlusCircle size={16} className="flex-shrink-0" />
                        Nuevo producto
                    </Boton>
                    <Boton variante="chip">
                        <FileText size={16} className="flex-shrink-0" />
                        Borrador de factura
                    </Boton>
                    <Boton variante="chip">
                        <Users size={16} className="flex-shrink-0" />
                        Clientes
                    </Boton>
                </div>
            </section>

            {/* Pedidos Activos con Suspense */}
            <Suspense fallback={<PedidosActivosSkeleton />}>
                <PedidosActivosList />
            </Suspense>

            {/* Alertas de existencias con Suspense */}
            <Suspense fallback={<AlertasExistenciasSkeleton />}>
                <AlertasExistenciasList />
            </Suspense>
        </div>
    );
}
