"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface HeaderStickyProps {
  titulo: string;
  onBack?: () => void;
  mostrarBack?: boolean;
  derecha?: ReactNode;
}

export function HeaderSticky({
  titulo,
  onBack,
  mostrarBack = true,
  derecha
}: HeaderStickyProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md flex items-center px-4 h-14 border-b border-stone-200/50 shadow-sm transition-all duration-300">
      <div className="flex items-center w-full max-w-4xl mx-auto">
        {mostrarBack && (
          <button 
            onClick={handleBack} 
            className="absolute p-2 -ml-2 text-stone-700 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100/50"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        
        <h1 className={`text-center text-sm font-bold text-stone-900 truncate px-4 flex-1 ${!mostrarBack && !derecha ? 'text-center' : ''}`}>
          {titulo}
        </h1>

        {derecha && (
          <div className="flex items-center">
            {derecha}
          </div>
        )}
      </div>
    </header>
  );
}
