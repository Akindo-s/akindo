/** @jsxImportSource nativewind */
"use client";

import { View } from "react-native";
import { usePathname } from "@akindo/ui/router";
import { Nav, Span } from "../html-elements";
import { Link } from "../link";
import { HomeIcon, StorefrontIcon, AllInboxIcon, AccountCircleIcon } from "../../icons/NavigationIcons";


const tabs = [
  { label: "Inicio", href: "/", Icon: HomeIcon },
  { label: "Mercado", href: "/mercado", Icon: StorefrontIcon },
  { label: "Pedidos", href: "/pedidos", altHref: "/distribuidor/pedidos", Icon: AllInboxIcon },
  { label: "Perfil", href: "/perfil", Icon: AccountCircleIcon },
];

interface BottomNavProps {
  tipoUsuario?: string;
  /**
   * Solo se muestran las tabs con estos href. Mobile pasa las rutas que ya
   * existen en su navegador de tabs; web no lo pasa y muestra todas.
   */
  hrefsVisibles?: string[];
}

export function BottomNav({ tipoUsuario, hrefsVisibles }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    // Va en el flujo, debajo de lo que scrollea, en las dos plataformas: en
    // mobile es el `tabBar` de las Tabs; en web, el último hijo del layout. Si
    // se oculta (en web desde md, donde está el Sidebar) lo decide el layout.
    <Nav className="z-30 bg-white border-t border-stone-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] select-none">
      <View className="flex flex-row items-center justify-around h-14 max-w-lg mx-auto w-full">
        {tabs.map(({ label, href, altHref, Icon }) => {
          const resolvedHref = (altHref && tipoUsuario === "distribuidor") ? altHref : href;
          if (hrefsVisibles && !hrefsVisibles.includes(resolvedHref)) return null;

          const active = isActive(resolvedHref);
          // text-primary-500 activo, text-neutral-400 inactivo. El texto no
          // hereda el color del contenedor: va en el Span y en el ícono.
          const color = active ? "#DAA520" : "#9C968B";
          return (
            <Link
              key={label}
              href={resolvedHref}
              bloque
              className="flex flex-col items-center gap-0.5 cursor-pointer transition-colors"
            >
              <Icon size={22} color={color} />
              <Span peso="medium" className="text-[10px] leading-normal" style={{ color }}>
                {label}
              </Span>
            </Link>
          );
        })}
      </View>
    </Nav>
  );
}
