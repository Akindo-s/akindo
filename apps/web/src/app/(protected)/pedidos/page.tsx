import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis Pedidos",
};

export default function PedidosPage() {
  return (
    <div className="flex items-center justify-center min-h-screen text-stone-400 text-sm">
      Pedidos — próximamente
    </div>
  );
}
