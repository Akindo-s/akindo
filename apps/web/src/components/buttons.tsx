import '@/components/buttons.css'

interface BotonProps {
  Icono?: React.ComponentType<{ className?: string }> | null;
  texto?: string | null;
  secundario?: boolean;
  className?: string;
}

export function Boton({ Icono = null, texto = null, secundario = false, className = '' }: BotonProps) {
  return (
    <button type='button' className={`${secundario ? 'boton-secundario' : 'boton'} flex flex-row h-fit w-fit items-center p-1   ${className} hover:cursor-pointer`}>
      {Icono && (
        <Icono className="h-3 w-fit"/>
      )}
      {texto && (
        <span className='text-xs'>
          {texto}
        </span>
      )}
    </button>
  )
}