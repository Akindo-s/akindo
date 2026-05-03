"use client";

import { useEffect, useState } from "react";

interface VentanaEmergenteProps {
  mensaje: string;
  duracion?: number;
  onClose: () => void;
}

export function VentanaEmergente({ mensaje, duracion = 4000, onClose }: VentanaEmergenteProps) {
  const [visible, setVisible] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);
  const [deltaX, setDeltaX] = useState(0);

  useEffect(() => {
    // Activa la animación de entrada al montar el componente
    const animIn = setTimeout(() => setVisible(true), 10);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duracion);

    return () => {
      clearTimeout(animIn);
      clearTimeout(timer);
    };
  }, [duracion, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX !== null) {
      const currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      if (diff > 0) {
        setDeltaX(diff);
      }
    }
  };

  const handleTouchEnd = () => {
    if (deltaX > 80) {
      setVisible(false);
      setTimeout(onClose, 300);
    } else {
      setDeltaX(0);
    }
    setStartX(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateX(${deltaX}px)` }}
      className={`fixed top-4 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-sm z-50 bg-[#E0533D] text-white p-4 rounded-xl shadow-lg border border-[#FEE2E2]/20 flex items-center justify-between gap-3 transition-all duration-300 ease-out select-none cursor-pointer ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full"
      }`}
    >
      <span className="text-xs sm:text-sm font-medium">{mensaje}</span>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-white hover:text-stone-200 text-lg font-bold p-1 leading-none outline-none cursor-pointer select-none"
      >
        ×
      </button>
    </div>
  );
}
