import { NextRequest, NextResponse } from "next/server";
import {
  agregarProductoCarrito,
  obtenerCarritoCliente,
  vaciarCarritosCliente,
} from "@/lib/api/carrito";
import { obtenerProductoPublico } from "@/lib/api/productos";

export async function GET() {
  try {
    const data = await obtenerCarritoCliente();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "No se pudo obtener el carrito" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      distribuidor_id?: string;
      producto_id?: string;
      cantidad?: number;
    };
    if (!body.producto_id) {
      return NextResponse.json(
        { detail: "producto_id es obligatorio" },
        { status: 400 }
      );
    }

    let distribuidorId = body.distribuidor_id;
    if (!distribuidorId) {
      const producto = await obtenerProductoPublico(body.producto_id);
      distribuidorId = producto?.distribuidor_id;
    }
    if (!distribuidorId) {
      return NextResponse.json(
        { detail: "No se encontro el distribuidor para el producto" },
        { status: 400 }
      );
    }

    const result = await agregarProductoCarrito(
      distribuidorId,
      body.producto_id,
      body.cantidad ?? 1
    );

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "No se pudo agregar al carrito" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const result = await vaciarCarritosCliente();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
