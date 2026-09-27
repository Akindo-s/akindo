"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

/**
 * Exportación contable masiva.
 *
 * El provider decide **qué formatos se ofrecen**: la pantalla pinta un botón
 * por cada uno de los que reciba, así que agregar el PDF el día de mañana es
 * agregarlo a esta lista, sin tocar la UI.
 *
 * `descargar` es lo que en la práctica genera el documento: llama a la API,
 * recibe el archivo y se lo entrega al usuario (en web una descarga del
 * navegador; en nativo, la hoja de compartir). Devuelve el nombre del archivo
 * entregado para poder avisarlo.
 */

export type FormatoExportacion = "xlsx" | "pdf" | "csv";

export interface OpcionExportacion {
  formato: FormatoExportacion;
  /** "Excel (.xlsx)". */
  etiqueta: string;
  /** "Formato dinámico ERP / SAP". */
  descripcion: string;
  /**
   * Un formato anunciado pero todavía no implementado se muestra apagado, en
   * vez de ofrecer una descarga que falla.
   */
  disponible: boolean;
}

/** Genera el documento y se lo entrega al usuario. */
export type DescargarExportacion = (formato: FormatoExportacion) => Promise<string>;

interface EstadoExportacion {
  opciones: OpcionExportacion[];
  /** El formato que se está generando, o `null`. */
  generando: FormatoExportacion | null;
  error: string | null;
  descargar: (formato: FormatoExportacion) => Promise<void>;
}

const SIN_EXPORTACION: EstadoExportacion = {
  opciones: [],
  generando: null,
  error: null,
  descargar: async () => {},
};

const ExportacionContext = createContext<EstadoExportacion>(SIN_EXPORTACION);

/** Lo que se ofrece hoy: solo Excel está implementado de punta a punta. */
export const OPCIONES_EXPORTACION_ORDENES: OpcionExportacion[] = [
  {
    formato: "xlsx",
    etiqueta: "Excel (.xlsx)",
    descripcion: "Formato dinámico ERP / SAP",
    disponible: true,
  },
  {
    formato: "pdf",
    etiqueta: "Expediente PDF",
    descripcion: "Con sellos de firma digital",
    disponible: false,
  },
];

export function ExportacionProvider({
  children,
  opciones = OPCIONES_EXPORTACION_ORDENES,
  onDescargar,
}: {
  children: ReactNode;
  opciones?: OpcionExportacion[];
  /** La inyecta la app, porque necesita la sesión (regla 13). */
  onDescargar: DescargarExportacion;
}) {
  const [generando, setGenerando] = useState<FormatoExportacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const descargar = useCallback(
    async (formato: FormatoExportacion) => {
      const opcion = opciones.find((o) => o.formato === formato);
      if (!opcion?.disponible || generando) return;
      setGenerando(formato);
      setError(null);
      try {
        await onDescargar(formato);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo generar la exportación");
      } finally {
        setGenerando(null);
      }
    },
    [opciones, generando, onDescargar],
  );

  return (
    <ExportacionContext.Provider value={{ opciones, generando, error, descargar }}>
      {children}
    </ExportacionContext.Provider>
  );
}

export function useExportacion(): EstadoExportacion {
  return useContext(ExportacionContext);
}
