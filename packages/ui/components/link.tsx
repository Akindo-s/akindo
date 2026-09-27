/** @jsxImportSource nativewind */
// mobile version
import { Link as ExpoLink } from 'expo-router';
import { cssInterop } from 'nativewind';
import type { ReactNode } from 'react';
import { fuente, type PesoFuente } from '../fonts';
import { Pressable } from './html-elements';

// Sin registrar, nativewind no convierte el className de ExpoLink y en nativo
// el link salia sin color ni tamano (negro, 14px). El `style` de `peso` se
// combina con el que sale del className.
cssInterop(ExpoLink, { className: 'style' });

export interface LinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  peso?: PesoFuente;
  /**
   * El link es un contenedor (flex, íconos, varios textos) y no texto en línea.
   * Sin esto `ExpoLink` es un `Text` y el `className` de flex no aplica. Los
   * textos de adentro van en su propio `Span`/`Text`.
   */
  bloque?: boolean;
  /** Para `hover:` que cambia el color de un ícono o texto de adentro (ver regla 5). */
  onHoverChange?: (enHover: boolean) => void;
}

/**
 * `peso` va por `style` como en el resto de primitivos de texto: en nativo el
 * `font-medium` del className no cambia de familia y el peso se pierde. Sin
 * `peso`, el link hereda la tipografia del texto que lo contiene.
 */
export function Link({ href, children, className, peso, bloque, onHoverChange }: LinkProps) {
  if (bloque) {
    return (
      <ExpoLink href={href} asChild>
        <Pressable
          role="link"
          className={className}
          onHoverIn={onHoverChange && (() => onHoverChange(true))}
          onHoverOut={onHoverChange && (() => onHoverChange(false))}
        >
          {children}
        </Pressable>
      </ExpoLink>
    );
  }
  return <ExpoLink href={href} className={className} style={peso ? fuente(peso) : undefined}>{children}</ExpoLink>;
}
