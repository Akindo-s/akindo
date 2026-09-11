/** @jsxImportSource nativewind */
// mobile version
import { Link as ExpoLink } from 'expo-router';
import type { ReactNode } from 'react';
import { fuente, type PesoFuente } from '../fonts';

/**
 * `peso` va por `style` como en el resto de primitivos de texto: en nativo el
 * `font-medium` del className no cambia de familia y el peso se pierde. Sin
 * `peso`, el link hereda la tipografia del texto que lo contiene.
 */
export function Link({ href, children, className, peso }: { href: string; children: ReactNode; className?: string; peso?: PesoFuente }) {
  return <ExpoLink href={href} className={className} style={peso ? fuente(peso) : undefined}>{children}</ExpoLink>;
}
