/** @jsxImportSource nativewind */
// packages/ui/src/Link.web.tsx  (web — Next.js)
import NextLink from 'next/link';
import { twMerge } from 'tailwind-merge';
import { fuente } from '../fonts';
import type { LinkProps } from './link';

// Misma firma que link.tsx: ver ahi por que `peso` va por style.
export function Link({ href, children, className, peso, bloque, onHoverChange }: LinkProps) {
  // `bloque`: en nativo es un Pressable, que ya es flex en columna. Un <a>
  // inline le daria a sus Span la altura de linea del body (24px) y el link
  // quedaria mas alto que el original.
  const clases = bloque ? twMerge('flex flex-col', className) : className;
  return (
    <NextLink
      href={href}
      className={clases}
      style={peso ? fuente(peso) : undefined}
      onMouseEnter={onHoverChange && (() => onHoverChange(true))}
      onMouseLeave={onHoverChange && (() => onHoverChange(false))}
    >
      {children}
    </NextLink>
  );
}
