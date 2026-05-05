import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Carrito",
};

export default function CarritoPage() {
  return (
    <div className="flex items-center justify-center min-h-screen text-stone-400 text-sm">
      Carrito — próximamente
    </div>
  );
}
