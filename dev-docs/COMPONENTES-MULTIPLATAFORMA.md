# Componentes y screens en `packages/ui`

Reglas para escribir UI que corra igual en `apps/web` (Next 16 + Turbopack) y `apps/mobile` (Expo + Metro).

Documento hermano de [`MIGRACION-SHARED.md`](./MIGRACION-SHARED.md), que cubre la capa de lógica (`packages/shared`). Este cubre la capa de presentación.

## La causa raíz de casi todo

`packages/ui` usa componentes de React Native (`View`, `Text`, `@expo/html-elements`, `react-native-svg`) con `className` de nativewind. Ese stack fue diseñado para **Metro**, que trae de fábrica cosas que **Turbopack no tiene**:

| Metro da gratis | Turbopack no |
|---|---|
| Resolver `archivo.web.js` según plataforma | Hay que declararlo a mano |
| Definir el global `__DEV__` | Hay que inyectarlo |
| Entender JSX dentro de archivos `.js` | Falla al parsear |
| Tree-shaking por plataforma (descarta código nativo) | Lo bundlea e intenta ejecutarlo |
| Aplicar el transform de nativewind a toda la app | Solo por archivo, con pragma |

Cada regla de abajo existe para cubrir una de esas diferencias. Si algo falla en web pero anda en mobile, casi siempre es una de estas cinco.

A eso se suma una segunda causa, independiente del bundler: **el código nació en web y arrastra tipos del DOM**. Eso es la sección 2.

---

## Checklist para un componente nuevo

1. **`/** @jsxImportSource nativewind */` en la primera línea.** Antes de cualquier import y antes de `"use client"`.
2. **Props explícitas.** Nunca extender `ButtonHTMLAttributes`, `InputHTMLAttributes`, `SVGProps` ni ninguna interfaz del DOM.
3. **Tipografía por `style`**, no por `className`: usá la prop `peso` de los primitivos, o `fuente()`.
4. Nada de texto suelto: todo string va dentro de `<Text>`, `<P>`, `<H1>`, etc.
5. Elementos SVG en **mayúscula** (`<Circle>`, no `<circle>`).
6. Si usa hooks o handlers, `"use client"` (después del pragma).
7. Si importa algo específico de plataforma, creá el par `.web` y registrá el alias (ver más abajo).
8. `npx tsc --noEmit` en las dos apps, y correr **ambas** antes de dar por cerrado.

---

## 1. El pragma de nativewind es obligatorio

Cada archivo `.tsx` de `packages/ui` tiene que empezar con:

```tsx
/** @jsxImportSource nativewind */
"use client";           // solo si el componente usa hooks/estado

import { View } from "react-native";
```

**Por qué:** es lo que convierte `className` en estilos. En mobile lo aplica `babel-preset-expo` a toda la app, así que allá funciona aunque falte. En web no hay equivalente global, así que **si te lo olvidás el componente renderiza sin estilos y nadie te avisa** — no hay error, solo sale feo.

**Por qué no está en el `tsconfig` de web:** porque el ajuste es por app, no por paquete, y se filtraba a `packages/shared`, que es agnóstico de plataforma y no debe depender de nativewind (rompía `carrito-context` y `categorias-context` con `Module not found: nativewind/jsx-dev-runtime`).

El orden importa: el pragma va **antes** de `"use client"`. Los comentarios pueden preceder a una directiva, pero un comentario que viene después de un statement ya no es "leading comment" y SWC lo ignora.

## 2. Props explícitas: nunca extender interfaces del DOM

Esta es la regla que más veces se rompió, y siempre igual:

```tsx
// ✗ mal
interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> { … }
interface InputProps extends InputHTMLAttributes<HTMLInputElement> { … }
interface IconProps  extends SVGProps<SVGSVGElement> { … }

function Boton({ children, ...props }: BotonProps) {
  return <Pressable {...props}>{children}</Pressable>;   // Pressable es de RN
}
```

Esas interfaces traen entre 280 y 300 props que **solo existen en el DOM** (`onBlur`, `form`, `formAction`, `autoComplete`, los handlers tipados con eventos de React DOM). Spreadearlas sobre un `Pressable`, `TextInput` o `Svg` de React Native no compila, y lo poco que compila miente sobre lo que va a pasar en nativo.

```tsx
// ✓ bien — solo lo que funciona en las dos plataformas
interface BotonProps {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  accessibilityLabel?: string;
}
```

Declarar las props a mano se siente más trabajo, pero el resultado es una superficie honesta: si algo no está en la interfaz, es porque no funciona en las dos plataformas.

### Dos consecuencias en `Boton`

**`onClick` no recibe el evento** (`() => void`). El evento de RN (`GestureResponderEvent`) y el del DOM (`MouseEvent`) no son compatibles; exponer uno sería mentirle a una plataforma. Antes se casteaba de uno a otro, y eso reventaba apenas alguien leyera `event.currentTarget` en nativo. Si de verdad necesitás el evento, usá `Pressable` directo.

**No existe `type="submit"`.** El botón se renderiza como `Pressable`, no como `<button>`, así que no hay submit nativo de formularios en ninguna de las dos plataformas. La acción se conecta siempre por `onClick`, y la validación la hace el formulario a mano.

Lo mismo vale para `required` en `Input`: se acepta como semántica, pero no valida nada por su cuenta.

### Elementos SVG en mayúscula

```tsx
<circle cx="9" cy="8" r="2" />   // ✗ elemento del DOM, no existe en nativo
<Circle cx="9" cy="8" r="2" />   // ✓ de react-native-svg, vía @akindo/ui/html
```

Web lo perdona (react-native-web corre en el DOM); nativo no lo conoce.

### Y `cssInterop` tiene que coincidir con el componente real

En [`nativewind-classname.ts`](./packages/ui/nativewind-classname.ts), `nativeStyleToProp` solo acepta props que el componente realmente tiene. `Path` no tiene `width` ni `height` (esas son de `Svg`) — copiar el bloque de un componente a otro rompe el typecheck.

## 3. Tipografía: va por `style`, no por `className`

La fuente del proyecto es **Plus Jakarta Sans**, y se declara distinto en cada plataforma:

| | Web | Nativo |
|---|---|---|
| Carga | `next/font/google` en `layout.tsx` | `useFonts` en `app/_layout.tsx` |
| Familia | una: `"Plus Jakarta Sans"` | **una por peso**: `PlusJakartaSans_500Medium`, … |
| Peso | `fontWeight` numérico | el `fontWeight` se **ignora** en fuentes custom |

El mapa entre ambas vive en un solo archivo, [`packages/ui/tailwind-tokens.js`](./packages/ui/tailwind-tokens.js), que consumen los dos `tailwind.config.js` y también el runtime. **Si cambia la fuente, se cambia ahí y las dos apps siguen.**

### Cómo aplicarla

```tsx
import { fuente } from "@akindo/ui/fonts";

<H2 peso="semibold">Iniciar Sesión</H2>          // primitivos: prop `peso`
<Text style={fuente("medium")}>…</Text>          // Text/TextInput crudos
```

Los primitivos de `@akindo/ui/html` (`H1`, `H2`, `H3`, `P`, `A`) ya la inyectan solos: por defecto usan el peso `normal`, y con la prop `peso` se elige otro.

### Por qué no se puede por `className`

Los componentes de texto tienen `cssInterop` registrado, así que nativewind **convierte su `className` en estilos de react-native-web y descarta la familia** — la clase nunca llega al DOM. Se puede comprobar: un `View` sí muestra sus clases de Tailwind en el DOM, un `H2` no, solo tiene clases `r-*` generadas por RNW.

Tampoco alcanza con ponerla en el `<html>`: ni `Text` de react-native-web ni el de React Native **heredan `fontFamily`** del contenedor. Por eso todo texto necesita la fuente explícita.

> Detalle que cuesta encontrar: en el `fontFamily` del config de Tailwind hay que usar el **nombre literal** de la familia, no `var(--font-jakarta)`. nativewind parsea pensando en React Native, donde las variables CSS no existen, y descarta el valor.

### Al agregar un peso nuevo

1. Sumarlo a `PESOS` en `tailwind-tokens.js`.
2. Agregar el import correspondiente al `useFonts` de `apps/mobile/app/_layout.tsx` (la clave **tiene que** coincidir con el nombre de familia del mapa).
3. Sumarlo al array `weight` de `next/font` en `apps/web/src/app/layout.tsx`.

## 4. El texto siempre dentro de un componente de texto

```tsx
// ✗ mal — en web es un error de consola, en nativo REVIENTA
<View className="text-xs">
  ¿No tienes una cuenta? <Link href="/registro">Regístrate</Link>
</View>

// ✓ bien
<P className="text-xs">
  ¿No tienes una cuenta? <Link href="/registro">Regístrate</Link>
</P>
```

React Native no permite text nodes sueltos dentro de un `View`. `react-native-web` lo perdona con un `console.error`, pero en iOS/Android lanza excepción. **Es el bug más fácil de escribir y el que más tarde te enterás**, porque web te deja seguir.

Los componentes de texto vienen de `@akindo/ui/html`, que mapean a `Text` en nativo y a etiquetas HTML en web:

`H1` · `H2` · `H3` · `P` · `A` · `Header` · `Section` · `Pressable` · `Svg` · `Path` · `Circle`

## 5. Código específico de plataforma: el patrón `.web`

Cuando un componente necesita algo que solo existe en una plataforma (routing, links, storage), se parte en dos archivos:

```
packages/ui/components/link.tsx        → expo-router      (nativo)
packages/ui/components/link.web.tsx    → next/link        (web)

packages/ui/router.ts                  → expo-router      (nativo)
packages/ui/router.web.ts              → next/navigation  (web)
```

**Ojo, y esto es lo importante:** el exports map de `packages/ui` usa wildcards que **fijan el archivo nativo**:

```json
"./*": "./*.ts"
```

`@akindo/ui/router` resuelve a `router.ts`, siempre. Los exports maps se resuelven **antes** que cualquier lógica de plataforma, así que el gemelo `.web` es inalcanzable por sí solo — ni Metro ni Turbopack lo eligen.

Por eso cada par `.web` necesita su alias explícito en [`apps/web/next.config.ts`](./apps/web/next.config.ts):

```ts
turbopack: {
  resolveAlias: {
    "@akindo/ui/router": "@akindo/ui/router.web",
    // ...agregar acá cada nuevo par
  },
}
```

Si te lo salteás, web arrastra el archivo nativo → `expo-router` → `react-native-screens` → código Fabric nativo → **500 en build**.

> **Deuda conocida:** si esto crece a varios pares, conviene migrar el exports map a conditional exports (`"react-native"` para Metro, `"browser"` / `"default"` para Next) y que se resuelvan solos. Con uno o dos, el alias manual es más simple y explícito.

### Excepción: imports relativos dentro del paquete

`components/index.ts` hace `import { Link } from './link'`. Metro elige `link.web.tsx` en web; **Turbopack no**, y no se puede interceptar con `resolveAlias` (los alias solo aplican a specifiers bare, no a rutas relativas).

Si necesitás un par `.web` que se consuma por import relativo, exponelo por el exports map y aliasealo, en vez de confiar en la resolución por extensión.

## 6. Tailwind: registrar el paquete en las dos apps

`packages/ui` vive fuera de ambas apps, así que **ninguna lo escanea por defecto**. Ya está declarado en las dos, pero si agregás una carpeta nueva (por ejemplo `packages/ui/forms/`) hay que sumarla en los dos configs:

```js
// apps/web/tailwind.config.js  y  apps/mobile/tailwind.config.js
content: [
  "../../packages/ui/*.{js,jsx,ts,tsx}",
  "../../packages/ui/{components,screens,icons}/**/*.{js,jsx,ts,tsx}",
]
```

Los globs están acotados a las carpetas de fuente a propósito: un `packages/ui/**` genérico también barre `packages/ui/node_modules` y Tailwind lo avisa como problema de performance.

Síntoma de que falta: `warn - No utility classes were detected in your source files`, y todo sale sin estilos.

**Ambas apps usan Tailwind v3.** No subir web a v4: `nativewind/preset` es un preset formato v3 (`presets: [...]`), mecanismo que v4 eliminó al pasar a config CSS-first. nativewind 4.x no funciona con Tailwind v4.

## 7. Server Components: quién puede recibir qué

Las screens de `packages/ui` son interactivas, así que son Client Components. Eso limita lo que la página de Next les puede pasar:

```tsx
// apps/web/src/app/(auth)/login/page.tsx  — Server Component
import { _login } from "@/lib/auth";
import LoginForm from "@akindo/ui/screens/login";

export default function LoginPage() {
  return <LoginForm login={_login} />;   // _login DEBE ser Server Action
}
```

Un Server Component no puede pasarle una función cualquiera a un Client Component. El módulo que la exporta necesita `"use server"`:

```ts
// apps/web/src/lib/auth.ts
"use server";
export async function _login(email: string, password: string) { /* ... */ }
```

En mobile no aplica: `_login` viene de `apps/mobile/utils/auth.ts` y es una función normal. Esa asimetría es justamente el motivo de que la screen reciba `login` **por prop** en vez de importarlo — cada plataforma inyecta el suyo.

## 8. Estilos en `apps/web` que no vienen de nativewind

Si escribís CSS suelto en un `.css` aparte, **no uses `@layer`**. En Tailwind v3 `@layer` es una directiva que exige `@tailwind` en el mismo archivo, y Next procesa cada CSS por separado. Va en [`apps/web/src/app/globals.css`](./apps/web/src/app/globals.css), que sí tiene las directivas.

Importa mantener la capa `components` cuando la regla define algo que una utilidad debería poder pisar (`.titulo { color }` vs `<Titulo className="text-white">`).

---

## Dependencias: pnpm es estricto

pnpm no aplana `node_modules`. Si un archivo **de tu app** termina importando un paquete —aunque el import lo haya inyectado un transform y vos nunca lo escribiste—, ese paquete tiene que estar declarado en el `package.json` de esa app.

Ya pasó tres veces:

| Paquete | Dónde faltaba | Lo importaba |
|---|---|---|
| `react-native-svg` | `apps/web` | `packages/ui` (y el alias de Turbopack no resolvía sin él) |
| `react-native-safe-area-context` | `apps/web` | `nativewind` por debajo |
| `react-native-css-interop` | `apps/mobile` | el transform de Babel, inyectado en tus archivos |

Síntomas: `Unable to resolve module X` en Metro, o —más traicionero— un `resolveAlias` de Turbopack que **se ignora en silencio** porque no puede resolver el target desde `apps/web`.

En `apps/mobile/metro.config.js` **no** volver a poner `disableHierarchicalLookup = true`: viene de la guía de monorepos de Expo para Yarn/npm, donde el hoisting aplana todo. Con pnpm las deps transitivas viven anidadas y Metro necesita poder subir por el árbol.

### Las dos apps tienen que usar la MISMA versión de React

`packages/ui` peerea `react` con un rango amplio (`>=18`) y lo consumen las dos apps. Si cada una trae una versión distinta, pnpm resuelve los peers por separado y **duplica todo lo que peerea React**: `react-native`, `nativewind`, `react-native-css-interop`, `react-native-svg`.

Eso rompe cosas silenciosamente. El caso concreto: los tipos de nativewind (`className` sobre `View`, `Text`, …) son una *module augmentation* de `"react-native"`, y TypeScript solo la fusiona si la resuelve **al mismo módulo** que importa el código augmentado. Con dos copias de `react-native`, la augmentación apunta a una y los componentes a la otra → 19 errores de `Property 'className' does not exist`.

Por eso `pnpm-workspace.yaml` fija la versión:

```yaml
overrides:
  react: 19.2.3
  react-dom: 19.2.3
```

**La versión la manda Expo**, no Next: el SDK la pinea (`npx expo install --check`), mientras que Next acepta cualquier `^19`. Si Expo sube de versión, se actualiza el override y web va detrás.

Por la misma razón, `apps/web/tsconfig.json` incluye el `.d.ts` de nativewind **desde `packages/ui`**, no una copia propia:

```jsonc
"include": [ "../../packages/ui/nativewind-env.d.ts", … ]
```

Anclarlo en `apps/web` lo resolvía contra otra instancia de `react-native` y la augmentación no aplicaba.

### Paquetes con parte nativa: `npx expo install`, no `pnpm add`

Para cualquier dependencia con módulo nativo (AsyncStorage, SVG, reanimated…), usar:

```bash
cd apps/mobile && npx expo install <paquete>
```

`pnpm add` instala la última versión publicada, sin saber cuál soporta tu SDK. El binario nativo ya viene compilado dentro de Expo Go, así que si el JS no coincide con esa versión el módulo nativo resuelve a `null` — el síntoma es `Native module is null`. `npx expo install --check` lista lo desalineado y `--fix` lo corrige.

---

## Verificar antes de cerrar

Las dos apps, siempre. Un componente puede andar perfecto en mobile y estar roto en web (y al revés, aunque es menos común).

Primero el typecheck, que es rápido y atrapa justo la clase de bug de la sección 2:

```bash
npx tsc --noEmit -p apps/web/tsconfig.json && npx tsc --noEmit -p apps/mobile/tsconfig.json
```

Después, las dos apps corriendo:

```bash
pnpm dev:web
```

```bash
cd apps/mobile && npx expo start --clear
```

Qué mirar:

- **Web:** que la ruta devuelva 200, que el componente tenga estilos (no solo que renderice), y la consola del navegador limpia. Un `Unexpected text node` ahí significa que en nativo va a reventar. Si ves errores raros tipo `props is not defined`, probá en una pestaña nueva: suelen ser chunks viejos de HMR.
- **Mobile:** que el bundle compile sin errores de resolución y que no aparezca el warning de Tailwind.

---

## Ojo con esto

- **El pragma faltante no da error, da un componente sin estilos.** Es el modo de falla silencioso más probable de esta arquitectura.
- **Web perdona el texto suelto en `View`; nativo no.** Si desarrollás mirando solo web, ese bug llega a producción móvil.
- **Ojo al portar props booleanas de web.** `secureTextEntry` en `Input` estaba como `secureTextEntry={showPassword}`, invertido: mostraba la contraseña en claro por defecto. Lo correcto es `isPassword && !showPassword`. Cuando muevas un componente de web, revisá el sentido de cada booleana, no solo que compile.
- **Dos versiones de React duplican medio árbol de dependencias.** Si el typecheck empieza a decir que `className` no existe, revisá `pnpm-workspace.yaml` → `overrides` antes de tocar los tipos.
- **Un alias de Turbopack cuyo target no resuelve se ignora sin avisar.** Si agregás uno y "no hace nada", revisá primero que el paquete esté declarado en `apps/web/package.json`.
- `apps/web/src/lib/rn-dev-global.ts` y el `<script>` inline del `layout.tsx` definen `__DEV__` para el bundle de web. No los borres: sin eso, cualquier código de React Native que lo referencie tira `ReferenceError` en runtime.
- `react-native-css-interop` tiene un **patch de pnpm** aplicado (`doctor.js` traía JSX crudo dentro de un `.js`, que Turbopack no puede parsear). Si actualizás nativewind, revisá que el patch siga aplicando.
