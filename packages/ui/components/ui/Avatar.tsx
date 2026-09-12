/** @jsxImportSource nativewind */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Image, View } from "react-native";
import { AddAPhotoIcon } from "../../icons/AuthIcons";
import { elegirImagen, archivoDeImagen } from "../../image-picker";
import { Pressable, Span } from "../html-elements";

interface AvatarProps {
  /** Si se puede cambiar la foto. */
  editable: boolean;
  /** Imagen actual, o `null` para el estado "Subir Foto". */
  urlPreview: string | null;
  /**
   * Sube la imagen elegida y devuelve si se guardó. Necesita la sesión, así que
   * la inyecta la app (web: server action; mobile: llamada con el token). Sin
   * esto el Avatar solo muestra la vista previa.
   */
  onSubir?: (archivo: Blob) => Promise<boolean>;
}

/**
 * Foto de perfil, con la opción de cambiarla.
 *
 * El original era un `<label>` con un `<input type="file">` adentro; acá el
 * selector es `elegirImagen()` del par de plataforma, y el archivo que espera
 * la API sale de `archivoDeImagen(uri)`.
 */
export default function Avatar({ editable = true, urlPreview = null, onSubir }: AvatarProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const elegir = useCallback(async () => {
    const uri = await elegirImagen();
    if (!uri) return;
    setPreview(uri);
    if (!onSubir) return;
    // Si la API la rechaza, volver a la foto anterior: antes la vista previa
    // se quedaba puesta y la subida fallaba en silencio.
    const ok = await onSubir(await archivoDeImagen(uri));
    if (!ok) setPreview(urlPreview);
  }, [onSubir, urlPreview]);

  useEffect(() => {
    setPreview(urlPreview);
  }, [urlPreview]);

  return (
    <Pressable
      role={editable ? "button" : undefined}
      accessibilityLabel={editable ? "Cambiar foto de perfil" : undefined}
      disabled={!editable}
      onPress={elegir}
      className="relative flex flex-col items-center justify-center w-28 lg:w-20 xl:w-24 h-28 lg:h-20 xl:h-24 border border-dashed border-stone-300 rounded-full cursor-pointer hover:bg-stone-50 transition bg-stone-50/50 mb-4 lg:mb-2 xl:mb-4"
    >
      {preview ? (
        <Image source={{ uri: preview }} accessibilityLabel="Avatar" resizeMode="cover" className="w-full h-full rounded-full" />
      ) : (
        editable && (
          <>
            <View className="mb-1 lg:mb-0 xl:mb-1">
              <AddAPhotoIcon size={24} color="#44403C" />
            </View>
            <Span peso="medium" className="text-xs text-stone-500">Subir Foto</Span>
          </>
        )
      )}

      {editable && (
        <View className="absolute bottom-1 right-1 w-6 lg:w-5 xl:w-6 h-6 lg:h-5 xl:h-6 bg-[#DAA520] rounded-full flex items-center justify-center border border-white">
          <Span peso="bold" className="text-white text-sm lg:text-xs leading-none select-none">+</Span>
        </View>
      )}
    </Pressable>
  );
}
