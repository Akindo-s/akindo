/** @jsxImportSource nativewind */

import { twMerge } from 'tailwind-merge';
import {H1,H2,P} from './html-elements';

interface TextProps {
  children: React.ReactNode;
  className?: string;
}


export function Titulo({ children, className = '' }: TextProps) {
  return (
    <H1 peso="bold" className={twMerge('titulo text-xl text-[#1C1917]', className)}>
      {children}
    </H1>
  )
}

export function SubTitulo({ children, className = '' }: TextProps) {
  return (
    <H2 peso="light" className={twMerge('sub-titulo text-sm text-[#201B12] my-0', className)}>
      {children}
    </H2>
  )
}



export function Parrafo({ children, className = '' }: TextProps) {
  return (
    <P peso="extralight" className={twMerge('parrafo text-xs', className)}>
      {children}
    </P>
  )
}