"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, StorefrontIcon, AllInboxIcon, AccountCircleIcon, ShoppingCartIcon } from "../icons/NavigationIcons";
import { Parrafo } from "../titles";

const links = [
    { label: "Inicio", href: "/", Icon: HomeIcon, condition: ({ }) => true },
    { label: "Mercado", href: "/mercado", Icon: StorefrontIcon, condition: ({ }) => true },
    { label: "Pedidos", href: "/pedidos", Icon: AllInboxIcon, condition: ({ }) => true },
    { label: "Mi Perfil", href: "/perfil", Icon: AccountCircleIcon, condition: ({ }) => true },
    { label: 'Mi carrito', href: '/carrito', Icon: ShoppingCartIcon, condition: ({ tipoUsuario }: { tipoUsuario: string }) => tipoUsuario == 'cliente' }
];
const akindoMiembros = [
    "Morquecho",
    "Medina",
    "Beltran",
    "Escamilla",
    "Ontiveros"
]
interface SidebarProps {
    tipoUsuario?: string;
}

export function Sidebar({ tipoUsuario }: SidebarProps) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <aside className="hidden md:flex flex-col w-54 lg:w-64 shrink-0 border-r border-stone-100 bg-white h-fit sticky top-0">
            {/* Navegación principal */}
            <nav className="flex flex-col gap-1 p-3 flex-1 min-h-[calc(100lvh-71px)]">
                {links.map(({ label, href, Icon, condition }) => {
                    if (label === "Mi Perfil" && tipoUsuario === "admin") {
                        // Insertar Administración antes de Mi Perfil para administradores
                        const adminActive = isActive("/admin/categorias");
                        return (
                            <React.Fragment key="admin-group">
                                <Link
                                    href="/admin/categorias"
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${adminActive
                                        ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)]"
                                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                                        }`}
                                >
                                    <AccountCircleIcon // Reusando icono para evitar importar otro
                                        size={20}
                                        className={adminActive ? "text-[var(--color-primary-500)]" : "text-stone-400"}
                                    />
                                    Administración
                                </Link>
                                <Link
                                    key={label}
                                    href={href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(href)
                                        ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)]"
                                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                                        }`}
                                >
                                    <Icon
                                        size={20}
                                        className={isActive(href) ? "text-[var(--color-primary-500)]" : "text-stone-400"}
                                    />
                                    {label}
                                </Link>
                            </React.Fragment>
                        );
                    }

                    if (!condition?.({ tipoUsuario: tipoUsuario ?? "" })) {
                        return null;
                    }
                    const active = isActive(href);
                    return (
                        <Link
                            key={label}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active
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
            <div className="p-4 border-t border-stone-100 flex flex-col gap-2">
                <p className="text-[10px] text-stone-400 font-medium tracking-wider uppercase">
                    Akindo © {new Date().getFullYear()}
                </p>
                {akindoMiembros.map(a => ( //no hay necesidad, pudiste escribirlos birote, eh!

                    <Parrafo key={`${a}${Math.random()}`} className="text-xs text-stone-400 font-normal tracking-wider uppercase">
                        {a}
                    </Parrafo>
                ))}
            </div>
        </aside>
    );
}
