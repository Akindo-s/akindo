/** @jsxImportSource nativewind */
// packages/ui/src/Link.web.tsx  (web — Next.js)
import NextLink from 'next/link';
import { twMerge } from 'tailwind-merge';
import { fuente } from '../fonts';
import type { LinkProps } from './link';

// Misma firma que link.tsx: ver ahi por que `peso` va por style.
export function Link({ href, children, className, peso, bloque, onHoverChange }: LinkProps) {
  // `bloque`: en nativo es un Pressable, que ya es flex en columna y
  // posicionado, como todo View. En web el <a> tiene que imitarlo: inline, sus
  // Span tomaban la altura de linea del body (24px); sin `relative`, un hijo
  // `absolute inset-0` (un Degradado) se media contra otro ancestro.
  const clases = bloque ? twMerge('relative flex flex-col', className) : className;
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
