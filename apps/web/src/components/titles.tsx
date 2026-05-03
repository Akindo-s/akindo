import '@/components/titles.css'

interface TextProps {
  children: React.ReactNode;
  className?: string;
}

export function Titulo({ children }: TextProps) {
  return (
    <h1 className="titulo font-bold text-xl">
      {children}
    </h1>
  )
}

export function SubTitulo({ children }: TextProps) {
  return (
    <h2 className='sub-titulo text-sm font-light'>
      {children}
    </h2>
  )
}

export function Parrafo({ children, className = '' }: TextProps) {
  return (
    <p className={`parrafo text-xs font-extralight ${className}`}>
      {children}
    </p>
  )
}