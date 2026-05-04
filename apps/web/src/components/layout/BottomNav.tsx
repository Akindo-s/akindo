"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, StorefrontIcon, AllInboxIcon, MoreVertIcon, AccountCircleIcon } from "../icons/NavigationIcons";
import { ReactNode } from "react";

const tabs = [
  { label: "Inicio", href: "/", Icon: HomeIcon },
  { label: "Marketplace", href: "/catalogo", Icon: StorefrontIcon },
  { label: "Pedidos", href: "/pedidos", Icon: AllInboxIcon },
  { label: "Más", href: "#", Icon: MoreVertIcon },
];

interface BottomNavProps {
  tipoUsuario?: string;
}

export function BottomNav({ tipoUsuario }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "#") return false;
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] select-none md:hidden">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map(({ label, href, Icon }) => {
          if (label === "Más" && tipoUsuario === "admin") {
            const adminActive = isActive("/admin/categorias");
            return (
              <Link key="Admin" href="/admin/categorias">
                <div className="flex flex-col items-center gap-0.5 cursor-pointer transition-colors">
                  <AccountCircleIcon
                    size={22}
                    className={adminActive ? "text-[var(--color-primary-500)]" : "text-[var(--color-neutral-400)]"}
                  />
                  <span
                    className={`text-[10px] font-medium ${adminActive ? "text-[var(--color-primary-500)]" : "text-[var(--color-neutral-400)]"
                      }`}
                  >
                    Admin
                  </span>
                </div>
              </Link>
            );
          }

          const active = isActive(href);
          const content = (
            <div className="flex flex-col items-center gap-0.5 cursor-pointer transition-colors">
              <Icon
                size={22}
                className={active ? "text-[var(--color-primary-500)]" : "text-[var(--color-neutral-400)]"}
              />
              <span
                className={`text-[10px] font-medium ${active ? "text-[var(--color-primary-500)]" : "text-[var(--color-neutral-400)]"
                  }`}
              >
                {label}
              </span>
            </div>
          );

          if (href === "#") {
            return <button key={label} type="button" className="outline-none">{content}</button>;
          }

          return (
            <Link key={label} href={href}>
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
