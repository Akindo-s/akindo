"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCartIcon, NotificationsIcon, AccountCircleIcon } from "../icons/NavigationIcons";
import { LogInIcon, LogOutIcon } from "../icons/AuthIcons";
import { Boton } from "@/components/ui/Boton";
import { ConstructionIcon } from "lucide-react";

interface HeaderProps {
  isLoggedIn: boolean;
  tipoUsuario?: string;
}

export function Header({ isLoggedIn, tipoUsuario }: HeaderProps) {
  
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const isAdminOrDistributor = tipoUsuario === "distribuidor" || tipoUsuario === "admin";

  useEffect(() => {
    if (!isLoggedIn || isAdminOrDistributor) {
      setCartCount(0);
      return;
    }

    const fetchCartCount = async () => {
      try {
        const res = await fetch("/api/carrito", { cache: "reload" });
        if (!res.ok) return;
        const data = (await res.json()) as { items?:[] };
        setCartCount(Number(data.items?.length ?? 0));
      } catch {
        // ignore header badge fetch errors
      }
    };

    fetchCartCount();

    const onCarritoUpdated = () => fetchCartCount();
    window.addEventListener("carrito:updated", onCarritoUpdated);
    return () => window.removeEventListener("carrito:updated", onCarritoUpdated);
  }, [isLoggedIn, isAdminOrDistributor, pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <header className="relative top-0 z-30 bg-white w-full flex items-center justify-between px-4 md:px-8 lg:px-16 py-3 border-b border-stone-100">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl md:text-2xl font-bold text-[var(--color-neutral-900)] select-none">
          Akindo
        </Link>
      </div>

      <nav className="flex items-center gap-3 flex-wrap justify-end-safe">
        {isLoggedIn ? (
          <>
            {tipoUsuario === "admin" && (
              <Boton
                className="text-xs max-w-fit"
                onClick={() => router.push('/admin/categorias')}
              >
                Administración
              </Boton>
            )}
            {tipoUsuario === "distribuidor" && (
              <Boton
                className="text-xs max-w-fit"
                onClick={() => router.push('/distribuidor')}
              >
                Administrar negocio
              </Boton>
            )}
            {
              !isAdminOrDistributor && (<>
                <Link href="/carrito" className="relative text-[var(--color-neutral-700)] hover:text-[var(--color-primary-500)] transition">
                  <ShoppingCartIcon size={22} />
                  {cartCount > 0 ? (
                    <span className="absolute -right-2.5 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary-500)] px-1 text-[10px] font-bold leading-none text-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  ) : null}
                </Link>
                <Link href="/perfil" className="text-[var(--color-neutral-700)] hover:text-[var(--color-primary-500)] transition">
                  <AccountCircleIcon size={22} />
                </Link>
              </>)
            }
            

            {isAdminOrDistributor && (
              <Boton
              variante="peligro" 
                onClick={handleLogout}
                className="flex  gap-1 text-stone-400 hover:text-red-500 transition cursor-pointer items-center justify-center p-1.5 hover:bg-red-50 rounded-lg"
                title="Cerrar sesión"
              >
                <LogOutIcon size={20} />
                <span className="text-nowrap">cerrar sesion</span>
              </Boton>
            )}
            <Boton variante="secundario" className=" bg-transparent text-[var(--color-neutral-700)] hover:text-[var(--color-primary-500)] transition cursor-pointer">
              <NotificationsIcon size={22} />
            </Boton>

          </>
        ) : (
          <>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition select-none"
            >
              <LogInIcon size={18} />
              Iniciar sesión
            </Link>
            <Link
              href="/registro/cliente"
              className="text-xs font-medium bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white px-3 py-1.5 rounded-lg transition select-none"
            >
              Regístrate
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
