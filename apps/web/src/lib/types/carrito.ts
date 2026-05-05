export interface NivelPrecio {
  cantidad_minima: number;
  costo_por_medida: number;
}

export interface CarritoUiItem {
  key: string;
  carritoId: string;
  distribuidorId: string;
  productoId: string;
  cantidad: number;
  nombre: string;
  precioUnitario: number; // Precio calculado según cantidad
  precioBase: number;     // Precio original del producto
  nivelesPrecio?: NivelPrecio[];
  imagen: string | null;
  unidad: string;
  cantidadMinima: number;
}

export interface CarritoUiGrupo {
  carritoId: string;
  distribuidorId: string;
  distribuidorNombre: string;
  distribuidorImagenPerfil: string | null;
  items: CarritoUiItem[];
  subtotal: number;
  totalArticulos: number;
}

export interface CarritoUiData {
  grupos: CarritoUiGrupo[];
  items: CarritoUiItem[];
  subtotal: number;
  envio: number;
  impuestos: number;
  total: number;
  totalArticulos: number;
}

export interface CarritoActionResult {
  ok: boolean;
  data?: CarritoUiData;
  message?: string;
  error?: string;
  status?: number;
  code?: string;
  retryable?: boolean;
}
