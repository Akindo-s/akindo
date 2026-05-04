"use client";

import { useState, InputHTMLAttributes } from "react";
import { Check, X, Edit2 } from "lucide-react";

interface CampoEditableProps {
  /** Etiqueta visible sobre el valor (ej. "CORREO ELECTRÓNICO"). Se muestra en mayúsculas. */
  label: string;

  /** Valor actual del campo. */
  value: string;

  /** Callback que se llama con cada keystroke cuando el campo está en modo edición. */
  onChange: (val: string) => void;

  /** Callback async que se llama al presionar el botón de guardar (✓). Debe retornar true si fue exitoso. */
  onSave: () => Promise<void>;

  /** Callback que se llama al presionar cancelar (✗), para restaurar el valor original. */
  onCancel: () => void;

  /** Tipo del input HTML subyacente. Default: "text". */
  type?: InputHTMLAttributes<HTMLInputElement>["type"];

  /** Texto a mostrar cuando value está vacío. Default: "No especificado". */
  placeholder?: string;

  /** Indica si hay una operación de guardado en curso (deshabilita el botón de guardar). */
  isSaving?: boolean;

  /** Si true, dibuja un separador inferior (border-b). Útil para campos que no son el último de la lista. */
  borde?: boolean;

  /** Clases Tailwind adicionales para el contenedor raíz. */
  className?: string;
}

/**
 * `CampoEditable` — Campo que alterna entre modo visualización y modo edición inline.
 *
 * En modo visualización muestra el valor como texto plano con un botón de lápiz.
 * Al hacer clic en el lápiz, el texto se convierte en un input enfocado con botones
 * de guardar (✓) y cancelar (✗).
 *
 * @example
 * <CampoEditable
 *   label="Correo Electrónico"
 *   value={email}
 *   onChange={setEmail}
 *   onSave={handleSaveEmail}
 *   onCancel={() => setEmail(originalEmail)}
 *   isSaving={isSavingEmail}
 *   type="email"
 *   borde
 * />
 */
export function CampoEditable({
  label,
  value,
  onChange,
  onSave,
  onCancel,
  type = "text",
  placeholder = "No especificado",
  isSaving = false,
  borde = false,
  className = "",
}: CampoEditableProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    await onSave();
    setIsEditing(false);
  };

  const handleCancel = () => {
    onCancel();
    setIsEditing(false);
  };

  return (
    <div
      className={`flex items-center justify-between ${
        borde ? "border-b border-stone-100 pb-4" : ""
      } ${className}`}
    >
      <div className="flex-1 mr-4">
        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
          {label}
        </p>
        {isEditing ? (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm text-stone-900 w-full border-b border-yellow-400 focus:outline-none bg-stone-50 p-1 rounded-t"
            autoFocus
          />
        ) : (
          <p className="text-sm text-stone-900">{value || placeholder}</p>
        )}
      </div>

      {isEditing ? (
        <div className="flex gap-1">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="text-green-600 p-2 hover:bg-green-50 rounded-full transition disabled:opacity-50"
          >
            <Check size={18} />
          </button>
          <button
            onClick={handleCancel}
            className="text-stone-400 p-2 hover:bg-stone-50 rounded-full transition"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="text-yellow-600 p-2 hover:bg-yellow-50 rounded-full transition"
        >
          <Edit2 size={18} />
        </button>
      )}
    </div>
  );
}
