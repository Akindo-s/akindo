export interface AnuncioDestacado{
    coverURL?:string,
    titulo?:string,
    description?:string,
    link?:string,
    accent?:string,
    internal:boolean,
    internalCover?:any
}

const imagenAnuncioBeta = require("../images/anuncios/anuncioBeta.png");


export const anuncioBeta:AnuncioDestacado = {
    internal:true,
    internalCover:imagenAnuncioBeta,
    titulo:"Tienda en Beta",
    description:"Los productos y distribuidores de esta tienda NO SON REALES. Las compras y el seguimiento de pedidos son SIMULACIONES."

}