export interface AnuncioDestacado{
    coverImage?:string,
    titulo?:string,
    description?:string,
    link?:string,
    internal:boolean,
    internalCover?:any,
    badges?:string[],
    style?:"default"|"akindostyle"|"dark"
}



export const anuncioBeta:AnuncioDestacado = {
    internal:true,
    titulo:"Tienda en Beta",
    description:"Los productos y distribuidores de esta tienda NO SON REALES. Las compras y el seguimiento de pedidos son SIMULACIONES.",
    style:"akindostyle",
    
}