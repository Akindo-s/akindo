# Progreso de la migración de UI a `packages/ui`

Contexto mínimo para retomar. Reglas del proceso: [`migracion-ui-reglas.md`](./migracion-ui-reglas.md). Detalle técnico: [`COMPONENTES-MULTIPLATAFORMA.md`](./COMPONENTES-MULTIPLATAFORMA.md) y [`TIPOGRAFIA.md`](./TIPOGRAFIA.md).

## Rutas

| Ruta web | Estado | Compartido | Mobile |
|---|---|---|---|
| `(auth)/login` | ✅ terminada | `packages/ui/screens/login.tsx` | `app/(auth)/login/index.tsx` |
| `(auth)/registro/cliente` | ⏭ siguiente | — | — |
| `(auth)/registro/distribuidor` | pendiente | — | — |
| resto | pendiente | — | — |

Layout `(auth)`: web `app/(auth)/layout.tsx` → mobile `app/(auth)/_layout.tsx` (mismo fondo `assets/images/fondo-registro.jpg`, tarjeta centrada con un `ScrollView` puesto vía `screenLayout` del `Stack`).

## Ya movido (el archivo de web lleva el comentario "archivo movido a …")

| Web (`apps/web/src/components/`) | `packages/ui/` |
|---|---|
| `auth/LoginForm.tsx` (ya no lo usa ninguna ruta) | `screens/login.tsx` |
| `VentanaEmergente.tsx` | `components/VentanaEmergente.tsx` |
| `inputs.tsx` | `components/inputs.tsx` |
| `titles.tsx` | `components/titles.tsx` (`SubTitulo` y `Parrafo` existen pero todavía no se exportan en `components/index.ts`) |
| `ui/Boton.tsx` | `components/button.tsx` |
| `icons/AuthIcons.tsx` | `icons/AuthIcons.tsx` |

## Reglas aprendidas en `/login` (aplican a cada ruta)

1. **Primitivos de `@expo/html-elements`**: cada uno que se use va registrado en `nativewind-classname.ts`, que se importa desde `components/html-elements.tsx`. Existen `Span`, `Div`, `Main`, etc.: un `<span>` de web pasa a `Span`.
2. `conTipografia` ya aplica `my-0`, igual que el preflight de Tailwind. No hace falta ponerle `my-0` a `H1`/`H2`/`P`.
3. **Un `Text` no hereda de su `View`**: color, tamaño, `uppercase` y `text-center` van en el texto mismo.
4. **`Svg`**: su `className` no llega al DOM en web. Tamaño y color van por las props `size`/`color`, en hex.
5. `hover:` o `focus-within:` que afecten a un texto o un ícono se reemplazan por estado (`onHoverIn`/`onHoverOut`, `onFocus`/`onBlur`). El `hover:` en el `className` de un `View`/`Pressable` sí funciona en web.
6. `fixed` → `absolute web:fixed`. Existen las variantes `web:`, `native:` y `android:`. En Android, algo que tiene que quedar por encima de elementos con sombra necesita `elevation-[N]`.
7. `Animated.View` no acepta `className`, y en web tampoco se le puede registrar. Se arma un `View` con `className` por fuera y el `Animated.View` solo con `style`, con `useNativeDriver: Platform.OS !== "web"`.
8. Las variables CSS (`var(--color-…)`) pasan a hex, sacado de `apps/web/src/app/globals.css`.
9. En web, un `<div>` que solo contiene texto chico hereda del body un line-height de 24px. Para igualar la altura en RN puede hacer falta `h-6`.
10. Un callback como `onClose`, si se usa dentro de un efecto, va en un ref: los padres pasan una arrow nueva en cada render.
11. `Input type="emailAddress"` ya activa el teclado de email y `autoCapitalize="none"`. `Link` acepta `peso`.
12. Mobile usa `inlineRem: 16` (`metro.config.js`), así que las clases en rem miden lo mismo que en web.

## Cómo verificar una ruta

- **Web**: agregar una ruta temporal (`app/(auth)/<ruta>-original/page.tsx`) que renderice el componente viejo de web y comparar medidas (`getBoundingClientRect`/`getComputedStyle`) contra la migrada. Borrarla al terminar. Para levantar la preview está `.claude/launch.json` (`web`).
- Con el pane del navegador oculto, `requestAnimationFrame`, `ResizeObserver` y los timers quedan pausados o frenados: ahí no se pueden verificar animaciones.
- **Mobile**: `npx tsc --noEmit -p apps/mobile/tsconfig.json` y `cd apps/mobile && npx expo export --platform ios --output-dir <tmp>` (compila el bundle sin dispositivo). Ningún simulador tiene Expo Go instalado.

## Siguiente: `(auth)/registro/cliente`

- `RegistroClienteForm` usa: `VentanaEmergente`, `Titulo`/`SubTitulo`/`Parrafo`, `Boton` secundario con `ArrowBackIcon` (hay que mover `icons/NavigationIcons.tsx`), `Input` y un `<input type="checkbox">`, que en RN no tiene equivalente (se arma con `Pressable` + estado).
- Registro: web tiene `_registerClient` en `lib/auth.ts` (`"use server"`) y mobile en `utils/auth.ts`. Se inyecta por prop, igual que `login`.
- **Decidir antes**: la regla dice que un `page.tsx` que solo envuelve a un componente se trata como componente (`components/auth/…`), pero login quedó en `screens/login.tsx`. ¿Registro va en `screens/registro/cliente.tsx` o en `components/auth/RegistroClienteForm.tsx`?
- En el original, el botón de volver no tiene `onClick` (no hace nada).
- `Boton` renderiza el `Icono` sin `color`. En web toma `currentColor` del contenedor, pero en nativo sale negro: al migrar el botón de volver, pasarle el color de la variante (`#4F4634` en `secundario`).

## Pendientes conocidos (no bloquean)

- `apps/mobile/app/_layout.tsx` tiene `contentStyle: { backgroundColor: 'red' }` y un `SafeAreaView` raíz: el fondo de `(auth)` no llega a cubrir la barra de estado. No se tocó.
- Diferencia entre el MVP (Tailwind v4, rama `main`) y web hoy (v3): `input { font-size: 17px }` de `globals.css` dejó de aplicar, porque ahora `text-xs` le gana por especificidad. Los inputs miden 12px en web y en mobile; en el MVP medían 17px.
- El preset de nativewind reemplaza `boxShadow`, así que `shadow-sm`/`md`/`lg` no son los de Tailwind. Pasa igual en las dos apps.
- `import "@akindo/ui/nativewind-init"` en el `layout.tsx` de web quedó redundante. No molesta.
- Android no se probó (`elevation-[50]` de `VentanaEmergente`).
