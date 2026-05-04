"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCartIcon, NotificationsIcon, AccountCircleIcon } from "../icons/NavigationIcons";
import { LogInIcon } from "../icons/AuthIcons";
import { Boton } from "@/components/ui/Boton";

interface HeaderProps {
  isLoggedIn: boolean;
  tipoUsuario?: string;
}

export function Header({ isLoggedIn, tipoUsuario }: HeaderProps) {
  const router = useRouter();
  const isAdminOrDistributor = tipoUsuario === "distribuidor" || tipoUsuario === "administrador";
  
  return (
    <header className="sticky top-0 z-30 bg-white w-full flex items-center justify-between px-4 py-3 border-b border-stone-100">
      <Link href="/" className="text-xl font-bold text-[var(--color-neutral-900)] select-none">
        Akindo
      </Link>

      <nav className="flex items-center gap-3">
        {isLoggedIn ? (
          <>
            {isAdminOrDistributor && (
              <Boton 
                className="text-xs"

                onClick={() => router.push('/distribuidor')}
              >
                Administrar negocio
              </Boton>
            )}
            {
              !isAdminOrDistributor&&(<>

                <Link href="/carrito" className="text-[var(--color-neutral-700)] hover:text-[var(--color-primary-500)] transition">
              <ShoppingCartIcon size={22} />
            </Link>
            <Link href="/perfil" className="text-[var(--color-neutral-700)] hover:text-[var(--color-primary-500)] transition">
              <AccountCircleIcon size={22} />
            </Link>
              </>)
            }
            <button className="text-[var(--color-neutral-700)] hover:text-[var(--color-primary-500)] transition cursor-pointer">
              <NotificationsIcon size={22} />
            </button>
            
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
