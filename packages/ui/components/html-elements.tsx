/** @jsxImportSource nativewind */

import { 
    H1 as RawH1, 
    H2 as RawH2, 
    H3 as RawH3,
    P as RawP,
    A as RawA,
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
 */
function conTipografia<P extends object>(Componente: React.ComponentType<P>) {
  const Envuelto = ({ peso = 'normal', style, ...props }: P & ConFuente) => (
    <Componente {...(props as P)} style={[fuente(peso), style]} />
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
export const Svg = RawSvg as React.ComponentType<WithClassName<ComponentProps<typeof RawSvg>>>;
export const Path = RawPath as React.ComponentType<WithClassName<ComponentProps<typeof RawPath>>>;
export const Circle = RawCircle as React.ComponentType<WithClassName<ComponentProps<typeof RawCircle>>>;
export const Header = RawHeader as React.ComponentType<WithClassName<ComponentProps<typeof RawHeader>>>;
export const Section = RawSection as React.ComponentType<WithClassName<ComponentProps<typeof RawSection>>>;
export const Pressable = RawPressable as React.ComponentType<WithClassName<ComponentProps<typeof RawPressable>>>;
export const Footer = RawFooter as React.ComponentType<WithClassName<ComponentProps<typeof RawFooter>>>;

