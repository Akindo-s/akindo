/** @jsxImportSource nativewind */
// packages/ui/src/Link.web.tsx  (web — Next.js)
import NextLink from 'next/link';
import type { ReactNode } from 'react';
import { fuente, type PesoFuente } from '../fonts';

// Misma firma que link.tsx: ver ahi por que `peso` va por style.
export function Link({ href, children, className, peso }: { href: string; children: ReactNode; className?: string; peso?: PesoFuente }) {
  return <NextLink href={href} className={className} style={peso ? fuente(peso) : undefined}>{children}</NextLink>;
}
