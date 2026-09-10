"use client";

import { cssInterop } from 'nativewind';
import { H1, H2, P, A, Nav, Header } from '@expo/html-elements';
import {Rect,Svg,Path} from 'react-native-svg'


cssInterop(H1, { className: 'style' });
cssInterop(H2, { className: 'style' });
cssInterop(P, { className: 'style' });
cssInterop(A, { className: 'style' });
cssInterop(Nav, { className: 'style' });
cssInterop(Header, { className: 'style' });


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