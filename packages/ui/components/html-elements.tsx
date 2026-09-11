/** @jsxImportSource nativewind */

// Registra el cssInterop de los primitivos antes de usarlos. Tiene que ir aca y
// no solo en el layout.tsx de web: ese layout es Server Component, y un modulo
// "use client" importado solo por efecto desde ahi nunca se evalua en el
// navegador. Sin el registro, el className de H1/H2/P/Header/Section se
// descartaba en web sin avisar.
import '../nativewind-classname';

import {
    H1 as RawH1, 
    H2 as RawH2, 
    H3 as RawH3,
    P as RawP,
    A as RawA,
    Span as RawSpan,
    Section as RawSection,
    Header as RawHeader,
    Footer as RawFooter
    } from '@expo/html-elements';

import { Pressable as RawPressable } from 'react-native';
import {
    Svg as RawSvg,
    Path as RawPath,
    Circle as RawCircle
} from "react-native-svg"
import React from 'react';
import type { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';
import { fuente, type PesoFuente } from '../fonts';

type WithClassName<T> = T & { className?: string };

/** Props extra que agregan los primitivos de texto envueltos. */
type ConFuente = { peso?: PesoFuente; style?: any };

/**
 * Envuelve un componente de texto para que use la tipografia del proyecto.
 *
 * Sin esto se queda con la fuente por defecto de react-native-web (web) o del
 * sistema (nativo): ni `Text` de RN ni el de react-native-web heredan
 * `fontFamily` del contenedor, y el `className` tampoco sirve porque
 * `cssInterop` lo convierte en estilos y descarta la familia.
 *
 * El `style` que llegue por props va al final, asi una instancia puede pisar
 * la fuente si lo necesita.
 *
 * Tambien arranca con `my-0`, que es lo que hacia el preflight de Tailwind en
 * la app web original: ahi `h1`..`p` no traen margen propio, mientras que los
 * de @expo/html-elements traen `marginVertical` de 0.67em a 1em en las dos
 * plataformas. Va por className y no por `style` a proposito: el `style` gana
 * sobre el className, y un `mt-1` de la instancia dejaria de aplicar.
 */
function conTipografia<P extends object>(Componente: React.ComponentType<P>) {
  const Envuelto = ({ peso = 'normal', style, className, ...props }: P & ConFuente & { className?: string }) => (
    <Componente {...(props as P)} className={twMerge('my-0', className)} style={[fuente(peso), style]} />
  );
  Envuelto.displayName = `conTipografia(${Componente.displayName ?? Componente.name ?? 'Componente'})`;
  return Envuelto as React.ComponentType<WithClassName<P> & ConFuente>;
}

// Los que renderizan texto llevan la tipografia del proyecto inyectada.
export const H1 = conTipografia(RawH1 as React.ComponentType<ComponentProps<typeof RawH1>>);
export const H2 = conTipografia(RawH2 as React.ComponentType<ComponentProps<typeof RawH2>>);
export const H3 = conTipografia(RawH3 as React.ComponentType<ComponentProps<typeof RawH3>>);
export const P = conTipografia(RawP as React.ComponentType<ComponentProps<typeof RawP>>);
export const A = conTipografia(RawA as React.ComponentType<ComponentProps<typeof RawA>>);
export const Span = conTipografia(RawSpan as React.ComponentType<ComponentProps<typeof RawSpan>>);
export const Svg = RawSvg as React.ComponentType<WithClassName<ComponentProps<typeof RawSvg>>>;
export const Path = RawPath as React.ComponentType<WithClassName<ComponentProps<typeof RawPath>>>;
export const Circle = RawCircle as React.ComponentType<WithClassName<ComponentProps<typeof RawCircle>>>;
export const Header = RawHeader as React.ComponentType<WithClassName<ComponentProps<typeof RawHeader>>>;
export const Section = RawSection as React.ComponentType<WithClassName<ComponentProps<typeof RawSection>>>;
export const Pressable = RawPressable as React.ComponentType<WithClassName<ComponentProps<typeof RawPressable>>>;
export const Footer = RawFooter as React.ComponentType<WithClassName<ComponentProps<typeof RawFooter>>>;

