/** @jsxImportSource nativewind */
// mobile version
import { Link as ExpoLink } from 'expo-router';
import type { ReactNode } from 'react';

export function Link({ href, children,className }: { href: string; children: ReactNode,className:string }) {
  return <ExpoLink href={href} className={className}>{children}</ExpoLink>;
}