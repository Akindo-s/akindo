"use client";

import { useEffect, useRef, useState } from "react";

interface RevelarProps {
    children: React.ReactNode;
    delay?: number;
    direccion?: "arriba" | "abajo" | "izquierda" | "derecha";
    className?: string;
}

/**
 * `Revelar` — Componente para animar la entrada de elementos al hacer scroll.
 */
export function Revelar({ 
    children, 
    delay = 0, 
    direccion = "arriba",
    className = "" 
}: RevelarProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { 
                threshold: 0.1,
                rootMargin: "0px 0px -50px 0px" // Dispara un poco antes de que sea totalmente visible
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    const getDireccionClass = () => {
        if (isVisible) return "opacity-100 translate-x-0 translate-y-0";
        
        switch (direccion) {
            case "arriba": return "opacity-0 translate-y-10";
            case "abajo": return "opacity-0 -translate-y-10";
            case "izquierda": return "opacity-0 translate-x-10";
            case "derecha": return "opacity-0 -translate-x-10";
            default: return "opacity-0 translate-y-10";
        }
    };

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ease-out ${getDireccionClass()} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}
