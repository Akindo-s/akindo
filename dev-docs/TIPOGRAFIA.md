# Tipografía

La fuente del proyecto es **Plus Jakarta Sans**, en web y en mobile.

Referencia rápida de uso. El *por qué* de cada decisión está en la [sección 3 de `COMPONENTES-MULTIPLATAFORMA.md`](./COMPONENTES-MULTIPLATAFORMA.md#3-tipografía-va-por-style-no-por-classname).

## Uso

Los primitivos de texto de `@akindo/ui/html` ya traen la fuente. Solo elegís el peso:

```tsx
import { H1, H2, P } from "@akindo/ui/html";

<H1 peso="bold">Akindo</H1>
<H2 peso="semibold">Iniciar Sesión</H2>
<P>Texto normal</P>              {/* sin peso = normal */}
```

Para un `Text` o `TextInput` crudo de React Native, va por el prop `style`:

```tsx
import { fuente } from "@akindo/ui/fonts";

<Text style={fuente("medium")}>Etiqueta</Text>
<TextInput style={fuente()} />
```

**No uses `className` para la fuente** (`font-bold`, `font-sans`, …). En nativo el peso por `className` no cambia de familia y se pierde, y en web el `style` de `fuente()` le gana a la clase igual.

## Pesos

| `peso` | Web | Nativo |
|---|---|---|
| `extralight` | 200 | `PlusJakartaSans_200ExtraLight` |
| `light` | 300 | `PlusJakartaSans_300Light` |
| `normal` *(default)* | 400 | `PlusJakartaSans_400Regular` |
| `medium` | 500 | `PlusJakartaSans_500Medium` |
| `semibold` | 600 | `PlusJakartaSans_600SemiBold` |
| `bold` | 700 | `PlusJakartaSans_700Bold` |

Son una unión de TypeScript: un peso mal escrito no compila.

En web es una sola familia con `fontWeight` numérico; en nativo **cada peso es una familia distinta**, porque React Native ignora `fontWeight` en fuentes custom. `fuente()` resuelve eso con `Platform.OS`, así que el código compartido no se entera.

## Dónde vive cada cosa

| Archivo | Qué hace |
|---|---|
| [`packages/ui/tailwind-tokens.js`](./packages/ui/tailwind-tokens.js) | **Fuente de verdad**: el mapa peso → (familia nativa, peso web) |
| [`packages/ui/fonts.ts`](./packages/ui/fonts.ts) | `fuente(peso)`, resuelve según plataforma |
| [`packages/ui/components/html-elements.tsx`](./packages/ui/components/html-elements.tsx) | Inyecta la fuente en `H1` `H2` `H3` `P` `A` |
| `apps/web/src/app/layout.tsx` | Carga la fuente con `next/font/google` |
| `apps/mobile/app/_layout.tsx` | Carga la fuente con `useFonts` + `SplashScreen` |

Los dos `tailwind.config.js` leen `tailwind-tokens.js`, así que el `fontFamily` de Tailwind queda alineado con el runtime.

## Agregar un peso

Los cuatro lugares, o se desincroniza:

1. `PESOS` en `packages/ui/tailwind-tokens.js`
2. La unión `PesoFuente` en `packages/ui/fonts.ts`
3. El `useFonts` de `apps/mobile/app/_layout.tsx` — la clave **tiene que** ser igual al nombre de familia del mapa
4. El array `weight` de `next/font` en `apps/web/src/app/layout.tsx`

## Cambiar de fuente

- El nombre de familia de web: `FAMILIA_WEB` en `tailwind-tokens.js` (tiene que coincidir con lo que registre `next/font`).
- Los nombres nativos: `PESOS` en el mismo archivo, más el paquete `@expo-google-fonts/*` correspondiente en mobile.

Usá el **nombre literal** de la familia, no `var(--font-…)`: nativewind parsea pensando en React Native, donde las variables CSS no existen, y descarta el valor sin avisar.
