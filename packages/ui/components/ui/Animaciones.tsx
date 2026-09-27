/** @jsxImportSource nativewind */
"use client";

import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, View } from "react-native";

const DRIVER_NATIVO = Platform.OS !== "web";

/** `animate-spin`: una vuelta por segundo, lineal, sin fin. */
export function Girando({ children }: { children: React.ReactNode }) {
    const giro = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const bucle = Animated.loop(
            Animated.timing(giro, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: DRIVER_NATIVO })
        );
        bucle.start();
        return () => bucle.stop();
    }, [giro]);
    const rotate = giro.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
    return <Animated.View style={{ transform: [{ rotate }] }}>{children}</Animated.View>;
}

/**
 * `animate-pulse`: opacidad 1 → 0.5 → 1 cada 2s con cubic-bezier(0.4, 0, 0.6, 1).
 * Animated.View no acepta className: las clases van en el View de adentro.
 */
export function Pulso({ className, children }: { className?: string; children?: React.ReactNode }) {
    const opacidad = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const curva = Easing.bezier(0.4, 0, 0.6, 1);
        const bucle = Animated.loop(
            Animated.sequence([
                Animated.timing(opacidad, { toValue: 0.5, duration: 1000, easing: curva, useNativeDriver: DRIVER_NATIVO }),
                Animated.timing(opacidad, { toValue: 1, duration: 1000, easing: curva, useNativeDriver: DRIVER_NATIVO }),
            ])
        );
        bucle.start();
        return () => bucle.stop();
    }, [opacidad]);
    return (
        <Animated.View style={{ opacity: opacidad }}>
            <View className={className}>{children}</View>
        </Animated.View>
    );
}

/**
 * El spinner de las páginas de mercado: `w-6 h-6 border-2 border-primary
 * border-t-transparent rounded-full animate-spin` (`tamano` 24 o 32).
 */
export function Spinner({ tamano = 24 }: { tamano?: 24 | 32 }) {
    return (
        <Girando>
            <View
                className={`${tamano === 32 ? "w-8 h-8" : "w-6 h-6"} border-2 border-[#DAA520] rounded-full`}
                style={{ borderTopColor: "transparent" }}
            />
        </Girando>
    );
}
