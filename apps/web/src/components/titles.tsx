import '@/components/titles.css'

export function Titulo({children}){
    return (
        <h1 className="titulo font-bold text-xl">
            {children}
        </h1>
    )
}

export function SubTitulo({children}){
    return (
        <h2 className='sub-titulo text-sm font-light'>
            {children}
        </h2>
    )
}
export function Parrafo({children}){
    return(
        <p className='parrafo text-xs font-extralight'>
            {children}
        </p>
    )
}