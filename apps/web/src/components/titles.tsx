import '@/components/titles.css'
import { twMerge } from 'tailwind-merge';

interface TextProps {
  children: React.ReactNode;
  className?: string;
}

export function Titulo({ children, className = '' }: TextProps) {
  return (
    <h1 className={twMerge('titulo font-bold text-xl', className)}>
      {children}
    </h1>
  )
}

export function SubTitulo({ children, className = '' }: TextProps) {
  return (
    <h2 className={twMerge('sub-titulo text-sm font-light', className)}>
      {children}
    </h2>
  )
}



export function Parrafo({ children, className = '' }: TextProps) {
  return (
    <p className={twMerge('parrafo text-xs font-extralight', className)}>
      {children}
    </p>
  )
}