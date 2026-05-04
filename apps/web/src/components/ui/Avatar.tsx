'use client'
import { AddAPhotoIcon } from "@/components/icons/AuthIcons";
import { actualizarImagenPerfil } from "@/lib/api/usuario";
import { useCallback, useEffect, useState } from "react";


interface AvatarProps {
  editable:boolean,
  nameInput:string,
  urlPreview:string|null
}

export default function Avatar({ editable=true,nameInput="avatar",urlPreview=null }:AvatarProps) {
    const [preview, setPreview] = useState<string | null>(null);
    

    const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            actualizarImagenPerfil(file);
            setPreview(URL.createObjectURL(file));
        }
    }, [setPreview]);



    useEffect(()=>{
        setPreview(urlPreview);
    },[urlPreview])

    return (
        <label className="relative flex flex-col items-center justify-center w-28 lg:w-20 xl:w-24 h-28 lg:h-20 xl:h-24 border border-dashed border-stone-300 rounded-full cursor-pointer hover:bg-stone-50 transition bg-stone-50/50 mb-4 lg:mb-2 xl:mb-4">
            {editable&&(

                <input
                type="file"
                name={nameInput}
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                />
            )}
            {preview ? (
                <img
                    src={preview}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-full"
                />
            ) : (
                editable&&(

                    <>
                    <AddAPhotoIcon className="text-stone-700 mb-1 lg:mb-0 xl:mb-1" size={24} />
                    <span className="text-xs text-stone-500 font-medium">Subir Foto</span>
                </>
                )
            )}

            {editable&&(

                <div className="absolute bottom-1 right-1 w-6 lg:w-5 xl:w-6 h-6 lg:h-5 xl:h-6 bg-[#DAA520] rounded-full flex items-center justify-center border border-white text-white font-bold text-sm lg:text-xs leading-none select-none">
                +
            </div>
            )}
        </label>
    )
}