/** @jsxImportSource nativewind */

import { twMerge } from 'tailwind-merge';
import type { PesoFuente } from '../fonts';
import {H1,H2,P} from './html-elements';

interface TextProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Cambia el peso. En web basta un `font-semibold` en el `className` (twMerge
   * reemplaza el peso base), pero en nativo el peso es una familia distinta y
   * viaja por `style`, así que tiene que venir por prop.
   */
  peso?: PesoFuente;
  numberOfLines?: number;
}


export function Titulo({ children, className = '', peso = 'bold', numberOfLines }: TextProps) {
  return (
    <H1 peso={peso} numberOfLines={numberOfLines} className={twMerge('titulo text-xl text-[#1C1917]', className)}>
      {children}
    </H1>
  )
}

export function SubTitulo({ children, className = '', peso = 'light', numberOfLines }: TextProps) {
  return (
    <H2 peso={peso} numberOfLines={numberOfLines} className={twMerge('sub-titulo text-sm text-[#201B12] my-0', className)}>
      {children}
    </H2>
  )
}



export function Parrafo({ children, className = '', peso = 'extralight', numberOfLines }: TextProps) {
  return (
    <P peso={peso} numberOfLines={numberOfLines} className={twMerge('parrafo text-xs', className)}>
      {children}
    </P>
  )
}
