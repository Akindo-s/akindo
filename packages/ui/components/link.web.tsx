/** @jsxImportSource nativewind */
// packages/ui/src/Link.web.tsx  (web — Next.js)
import NextLink from 'next/link';
import type { ReactNode } from 'react';

export function Link({ href, children,className }: { href: string; children: ReactNode,className:string }) {
  return <NextLink href={href} className={className}>{children}</NextLink>;
}