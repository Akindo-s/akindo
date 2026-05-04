"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, StorefrontIcon, AllInboxIcon, AccountCircleIcon } from "../icons/NavigationIcons";

const links = [
    { label: "Inicio", href: "/", Icon: HomeIcon },
    { label: "Marketplace", href: "/catalogo", Icon: StorefrontIcon },
    { label: "Pedidos", href: "/pedidos", Icon: AllInboxIcon },
    { label: "Mi Perfil", href: "/perfil", Icon: AccountCircleIcon },
];

export function Sidebar() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <aside className="hidden md:flex flex-col w-56 lg:w-64 shrink-0 border-r border-stone-100 bg-white h-[calc(100vh-49px)] sticky top-[49px]">
            {/* Navegación principal */}
            <nav className="flex flex-col gap-1 p-3 flex-1">
                {links.map(({ label, href, Icon }) => {
                    const active = isActive(href);
                    return (
                        <Link
                            key={label}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                active
                                    ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)]"
                                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                            }`}
                        >
                            <Icon
                                size={20}
                                className={active ? "text-[var(--color-primary-500)]" : "text-stone-400"}
                            />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Branding en el fondo */}
            <div className="p-4 border-t border-stone-100">
                <p className="text-[10px] text-stone-400 font-medium tracking-wider uppercase">
                    Akindo © {new Date().getFullYear()}
                </p>
            </div>
        </aside>
    );
}
