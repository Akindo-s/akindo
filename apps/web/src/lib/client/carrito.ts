export interface AddToCartInput {
  distribuidorId?: string;
  productoId: string;
  cantidad?: number;
}

export async function agregarProductoCliente(input: AddToCartInput): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
}> {
  const res = await fetch("/api/carrito", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      distribuidor_id: input.distribuidorId,
      producto_id: input.productoId,
      cantidad: input.cantidad ?? 1,
    }),
  });

  const body = (await res.json()) as { ok?: boolean; message?: string; error?: string; detail?: string };
  if (!res.ok || !body.ok) {
    return { ok: false, error: body.error ?? body.detail ?? "No se pudo agregar al carrito" };
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("carrito:updated"));
  }

  return { ok: true, message: body.message ?? "Producto agregado al carrito" };
}
