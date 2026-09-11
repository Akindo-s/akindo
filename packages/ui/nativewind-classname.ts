"use client";

import { cssInterop } from 'nativewind';
import { H1, H2, H3, P, A, Span, Nav, Header, Section, Footer } from '@expo/html-elements';
import {Rect,Svg,Path} from 'react-native-svg'


// Todo primitivo de @expo/html-elements que se use desde packages/ui tiene que
// estar registrado aca: en web su JSX interno no pasa por nativewind, asi que
// sin esto el className se descarta en silencio.
cssInterop(H1, { className: 'style' });
cssInterop(H2, { className: 'style' });
cssInterop(H3, { className: 'style' });
cssInterop(P, { className: 'style' });
cssInterop(A, { className: 'style' });
cssInterop(Span, { className: 'style' });
cssInterop(Nav, { className: 'style' });
cssInterop(Header, { className: 'style' });
cssInterop(Section, { className: 'style' });
cssInterop(Footer, { className: 'style' });


cssInterop(Svg, {
  className: {
    target: false,
    nativeStyleToProp: { width: true, height: true, stroke: true, fill: true }
  },
});


cssInterop(Path, {
  className: {
    target: false,
    // Sin width/height: son props de Svg, no de Path. Estaban copiadas del
    // bloque de arriba y TypeScript las rechaza contra PathProps.
    nativeStyleToProp: { stroke: true, fill: true }
  },
});