/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import { TextInput, View } from "react-native";
import { twMerge } from "tailwind-merge";
import { Check, X, Edit2 } from "lucide-react-native";
import { Pressable } from "../html-elements";
import { Parrafo, SubTitulo } from "../titles";

interface CampoEditableProps {
  /** Etiqueta sobre el valor. Se muestra en mayúsculas. */
  label: string;

  /** Valor actual del campo. */
  value: string;

  /** Se llama con cada tecla mientras el campo está en edición. */
  onChange: (val: string) => void;

  /** Se llama al tocar el ✓. */
  onSave: () => Promise<void>;

  /** Se llama al tocar el ✗, para restaurar el valor original. */
  onCancel: () => void;

  /** Teclado del campo: `tel` y `email` cambian el teclado en nativo. */
  type?: "text" | "tel" | "email";

  /** Texto cuando `value` está vacío. Default: "No especificado". */
  placeholder?: string;

  /** Hay un guardado en curso: deshabilita el ✓. */
  isSaving?: boolean;

  /** Separador inferior. */
  borde?: boolean;

  /** Clases extra para el contenedor. */
  className?: string;
}

/**
 * `CampoEditable` — alterna entre ver y editar el valor en el mismo lugar.
 *
 * Los colores de los íconos van por prop: en nativo `currentColor` sale negro
 * (regla 4). El `hover:` de los botones sí funciona en web sobre el Pressable.
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
    <View
      className={twMerge(
        "flex flex-row items-center justify-between",
        borde ? "border-b border-stone-100 pb-4" : "",
        className
      )}
    >
      <View className="flex-1 mr-4">
        {/* `text-md` no existe en Tailwind: en web twMerge sacaba el `text-sm` del
            SubTitulo y el h2 se quedaba con los 16px/24 heredados del body. */}
        <SubTitulo peso="bold" className="text-base leading-6 text-stone-500 uppercase tracking-wider mb-1">
          {label}
        </SubTitulo>
        {isEditing ? (
          <TextInput
            value={value}
            onChangeText={onChange}
            autoFocus
            keyboardType={type === "tel" ? "phone-pad" : type === "email" ? "email-address" : "default"}
            autoCapitalize={type === "email" ? "none" : undefined}
            className="text-sm text-stone-900 w-full border-b border-yellow-400 bg-stone-50 p-1 rounded-t"
          />
        ) : (
          <Parrafo className="text-sm text-stone-900">{value || placeholder}</Parrafo>
        )}
      </View>

      {isEditing ? (
        <View className="flex flex-row gap-1">
          <Pressable
            role="button"
            accessibilityLabel="Guardar"
            onPress={handleSave}
            disabled={isSaving}
            style={isSaving ? { opacity: 0.5 } : undefined}
            className="p-2 hover:bg-green-50 rounded-full transition"
          >
            <Check size={18} color="#16A34A" />
          </Pressable>
          <Pressable
            role="button"
            accessibilityLabel="Cancelar"
            onPress={handleCancel}
            className="p-2 hover:bg-stone-50 rounded-full transition"
          >
            <X size={18} color="#A8A29E" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          role="button"
          accessibilityLabel={`Editar ${label}`}
          onPress={() => setIsEditing(true)}
          className="p-2 hover:bg-yellow-50 rounded-full transition"
        >
          <Edit2 size={18} color="#CA8A04" />
        </Pressable>
      )}
    </View>
  );
}
