/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import { View } from "react-native";
import useRouter from "@akindo/ui/router";
import { useIdsCarrito } from "@akindo/shared/carrito-context";
import { Header as HeaderSemantico, Nav, Pressable, Span } from "../html-elements";
import { Link } from "../link";
import { Boton } from "../button";
import { ShoppingCartIcon, AccountCircleIcon } from "../../icons/NavigationIcons";
import { LogInIcon, LogOutIcon } from "../../icons/AuthIcons";

interface HeaderProps {
  isLoggedIn: boolean;
  tipoUsuario?: string;
  /**
   * Cierra la sesión. Web: la server action que borra las cookies (Next vuelve
   * a pintar el layout solo, porque la acción toca cookies). Mobile: borra
   * AsyncStorage y avisa al store de sesión.
   */
  onLogout: () => Promise<void>;
}

// text-neutral-700, y text-primary-500 en hover.
const colorIcono = (enHover: boolean) => (enHover ? "#DAA520" : "#565045");

function CarritoLink() {
  const idsCarrito = useIdsCarrito();
  const [enHover, setEnHover] = useState(false);
  return (
    <Link href="/carrito" bloque onHoverChange={setEnHover} className="relative transition">
      <ShoppingCartIcon size={22} color={colorIcono(enHover)} />
      {idsCarrito.size > 0 ? (
        <View className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DAA520] px-1">
          <Span peso="bold" className="text-[10px] leading-none text-white">
            {idsCarrito.size > 99 ? "99+" : idsCarrito.size}
          </Span>
        </View>
      ) : null}
    </Link>
  );
}

function PerfilLink() {
  const [enHover, setEnHover] = useState(false);
  return (
    <Link href="/perfil" bloque onHoverChange={setEnHover} className="transition">
      <AccountCircleIcon size={22} color={colorIcono(enHover)} />
    </Link>
  );
}

function IniciarSesionLink() {
  // text-primary-600, y text-primary-700 en hover.
  const [enHover, setEnHover] = useState(false);
  const color = enHover ? "#9E7517" : "#C1901D";
  return (
    <Link href="/login" bloque onHoverChange={setEnHover} className="flex flex-row items-center gap-1.5 transition select-none">
      <LogInIcon size={18} color={color} />
      <Span peso="medium" className="text-xs" style={{ color }}>Iniciar sesión</Span>
    </Link>
  );
}

/**
 * En el original era un `Boton variante="peligro"`, pero las clases de la
 * instancia le ganaban a casi toda la variante: texto e ícono gris
 * (`text-stone-400`, rojo en hover), `rounded-lg` en vez de `rounded-full`. El
 * `Boton` compartido pinta el texto con el color de la variante, así que acá
 * se arma con el resultado final que se veía en web.
 */
function CerrarSesionBoton({ onPress }: { onPress: () => void }) {
  const [enHover, setEnHover] = useState(false);
  // text-stone-400, y text-red-500 en hover.
  const color = enHover ? "#EF4444" : "#A8A29E";
  return (
    <Pressable
      role="button"
      accessibilityLabel="Cerrar sesión"
      onPress={onPress}
      onHoverIn={() => setEnHover(true)}
      onHoverOut={() => setEnHover(false)}
      className="flex flex-row items-center justify-center gap-2 px-6 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition cursor-pointer"
    >
      <LogOutIcon size={20} color={color} />
      <Span peso="medium" className="text-sm" style={{ color }}>Cerrar sesión</Span>
    </Pressable>
  );
}

export function Header({ isLoggedIn, tipoUsuario, onLogout }: HeaderProps) {
  const router = useRouter();
  const isAdminOrDistributor = tipoUsuario === "distribuidor" || tipoUsuario === "admin";

  const handleLogout = async () => {
    try {
      await onLogout();
      // `replace`: en expo-router `push` siempre apila, y desde "/" dejaba un
      // segundo home encima del primero.
      router.replace("/");
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <HeaderSemantico className="relative top-0 z-30 bg-white w-full flex flex-row items-center justify-between px-4 md:px-8 lg:px-16 py-3 border-b border-stone-100">
      <View className="flex flex-row items-center gap-8">
        <Link href="/" peso="bold" className="text-xl md:text-2xl text-[#2B2722] select-none">
          Akindo
        </Link>
      </View>

      {/* `shrink`: en CSS un flex item se encoge y sus botones pasan a otra
          línea (flex-wrap); en RN y react-native-web el default es no encogerse. */}
      <Nav className="flex flex-row items-center gap-3 flex-wrap shrink">
        {isLoggedIn ? (
          <>
            {/* `native:w-auto`: `max-w-fit` no existe en nativo y el `w-full` del
                primario ocuparía toda la barra. El `text-xs` le ganaba al
                `text-sm` de la variante en el original. */}
            {tipoUsuario === "admin" && (
              <Boton
                className="max-w-fit native:w-auto"
                claseTexto="text-xs"
                onClick={() => router.push('/admin/categorias')}
              >
                Administración
              </Boton>
            )}
            {tipoUsuario === "distribuidor" && (
              <Boton
                className="max-w-fit native:w-auto"
                claseTexto="text-xs"
                onClick={() => router.push('/distribuidor')}
              >
                Administrar negocio
              </Boton>
            )}
            {
              !isAdminOrDistributor && tipoUsuario === 'cliente' && (<>
                <CarritoLink />
                <PerfilLink />
              </>)
            }

            {isAdminOrDistributor && <CerrarSesionBoton onPress={handleLogout} />}
          </>
        ) : (
          <>
            <IniciarSesionLink />
            <Link
              href="/registro/cliente"
              bloque
              className="bg-[#DAA520] hover:bg-[#C1901D] px-3 py-1.5 rounded-lg transition select-none"
            >
              <Span peso="medium" className="text-xs text-white">Regístrate</Span>
            </Link>
          </>
        )}
      </Nav>
    </HeaderSemantico>
  );
}
