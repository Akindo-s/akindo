# Progreso de la migración de UI a `packages/ui`

Contexto mínimo para retomar. Reglas del proceso: [`migracion-ui-reglas.md`](./migracion-ui-reglas.md). Detalle técnico: [`COMPONENTES-MULTIPLATAFORMA.md`](./COMPONENTES-MULTIPLATAFORMA.md) y [`TIPOGRAFIA.md`](./TIPOGRAFIA.md).

## Rutas

| Ruta web | Estado | Compartido | Mobile |
|---|---|---|---|
| `(auth)/login` | ✅ terminada | `packages/ui/screens/login.tsx` | `app/(auth)/login/index.tsx` |
| `(auth)/registro/cliente` | ✅ terminada | `packages/ui/components/auth/RegistroClienteForm.tsx` | `app/(auth)/registro/cliente/index.tsx` |
| `(auth)/registro/distribuidor` | ✅ terminada | `packages/ui/components/auth/RegistroDistribuidorForm.tsx` | `app/(auth)/registro/distribuidor/index.tsx` |
| `(public)/` (home) | ⏭ siguiente | — | — |
| resto | pendiente | — | — |

**Ubicación:** desde registro se sigue la regla de `migracion-ui-reglas.md`: si el `page.tsx` solo envuelve a un componente, ese componente va a `packages/ui/components/` con la misma ruta que en web, y se importa directo como `@akindo/ui/components/auth/X` (subpath `./components/*` del exports map). No se importa desde el barrel `@akindo/ui/components`, porque la página de Next es Server Component y necesita apuntar a un módulo con `"use client"`. Login es la excepción: quedó en `screens/login.tsx`.

Layout `(auth)`: web `app/(auth)/layout.tsx` → mobile `app/(auth)/_layout.tsx` (mismo fondo `assets/images/fondo-registro.jpg`, tarjeta centrada con un `ScrollView` puesto vía `screenLayout` del `Stack`).

## Ya movido (el archivo de web lleva el comentario "archivo movido a …")

| Web (`apps/web/src/components/`) | `packages/ui/` |
|---|---|
| `auth/LoginForm.tsx` (ya no lo usa ninguna ruta) | `screens/login.tsx` |
| `auth/RegistroClienteForm.tsx` (ya no lo usa ninguna ruta) | `components/auth/RegistroClienteForm.tsx` |
| `auth/RegistroDistribuidorForm.tsx` (ya no lo usa ninguna ruta) | `components/auth/RegistroDistribuidorForm.tsx` |
| `ui/ProgressBar.tsx` (solo lo usaba el form de distribuidor) | `components/ui/ProgressBar.tsx` |
| `VentanaEmergente.tsx` | `components/VentanaEmergente.tsx` |
| `inputs.tsx` | `components/inputs.tsx` (más `Checkbox`, que en web era un `<input type="checkbox">` inline) |
| `titles.tsx` | `components/titles.tsx` |
| `ui/Boton.tsx` | `components/button.tsx` |
| `icons/AuthIcons.tsx` | `icons/AuthIcons.tsx` |
| `icons/NavigationIcons.tsx` | `icons/NavigationIcons.tsx` (los 15 íconos) |

Dependencias de plataforma ya abstraídas (patrón `x.ts` / `x.web.ts` + alias en `apps/web/next.config.ts`): `router`, `image-picker` (`elegirImagen()`: `expo-image-picker` en nativo, `<input type="file">` en web).

## Reglas aprendidas (aplican a cada ruta)

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
13. **Llamadas a la API**: si no persisten nada por plataforma (registro, lecturas públicas), el componente compartido llama directo al núcleo de `@akindo/shared`, que ya es dependencia de `packages/ui`. Solo se inyecta por prop lo que necesita glue: sesión, cookies, storage. Motivo: en un build de producción, Next reemplaza el mensaje de un error lanzado desde una Server Action por uno genérico.
14. Los íconos de `Boton` reciben el color de su variante (`variantes[x].icono`).
15. **Clases que chocan**: en web gana la que el CSS de Tailwind v3 pone después. Por ejemplo, `w-fit` le gana a `w-10` y `rounded-xl` a `rounded-full`. Pero **nativewind descarta `fit-content`**, así que en nativo `w-10`/`h-10` sí aplicarían. Hay que medir en web cuál gana y no copiar las que pierden. Caso típico: `Boton` con `w-10 h-10 p-0 rounded-full` mide 34×42 en web; esas clases se sacan y queda igual en las dos plataformas.
16. `Animated` no puede interpolar el string de `boxShadow` en react-native-web (se queda solo con el color). Para animar una sombra: capa con la sombra fija y `opacity` animada. `boxShadow` estático sí anda en las dos plataformas (RN 0.76+).
17. Sin CSS que RN no tenga: `linear-gradient` → `LinearGradient` de SVG (`@akindo/ui/html`); `@keyframes`/`transition` → `Animated`; `grid grid-cols-2 gap-3` → fila con dos `flex-1`; `sticky top-0` → `stickyHeaderIndices` del `ScrollView`.
18. Un `ScrollView` recorta su propia sombra en iOS: la sombra y el `max-h` van en un `View` por fuera.
19. Texto con tamaño arbitrario (`text-[10px]`) no trae line-height: en web heredaba 1.5 del body, así que hay que agregar `leading-normal`.
20. `fuente()` en web devuelve la pila completa (`"Plus Jakarta Sans", "Plus Jakarta Sans Fallback"`). Si no, los glifos que faltan en Jakarta (como `→`) caen a otra fuente.
21. `Input` mapea `emailAddress` → teclado de email, `telephoneNumber` → teclado de teléfono. En web react-native-web los vuelve a pintar como `type="email"`/`"tel"`. Un `type="text"` de web queda sin `type`.

## Cómo verificar una ruta

- **Web**: agregar una ruta temporal (`app/(auth)/<ruta>-original/page.tsx`) que renderice el componente viejo de web y comparar medidas (`getBoundingClientRect`/`getComputedStyle`) contra la migrada. Borrarla al terminar. Para levantar la preview está `.claude/launch.json` (`web`).
- Envíos a la API: interceptar `window.fetch` en la página y devolver respuestas falsas (error con `detail`, y éxito). Así se prueba el camino completo sin crear registros en la base local.
- Selector de archivos: sobrescribir `HTMLInputElement.prototype.click` para los `type="file"`, cargarles un `File` con `DataTransfer` y disparar `change`.
- Si Next se reinicia (por ejemplo al tocar `next.config.ts`), la consola se llena de errores del WebSocket de HMR. No son de la app.
- Con el pane del navegador oculto, `requestAnimationFrame`, `ResizeObserver` y los timers quedan pausados o frenados: ahí no se pueden verificar animaciones.
- **Mobile**: `npx tsc --noEmit -p apps/mobile/tsconfig.json` y `cd apps/mobile && npx expo export --platform ios --output-dir <tmp>` (compila el bundle sin dispositivo). Ningún simulador tiene Expo Go instalado.

## Siguiente: `(public)/` (home, `/`)

Es la primera ruta con layout de app: el `(public)/layout.tsx` de web lee la sesión de las cookies y arma `Header`, `Sidebar` y `BottomNav` (`components/layout/`) dentro de un `CarritoProvider` con `cargarIdsCarrito` (`lib/providers-data`). La página usa `MercadoBuscador`, `InfoBanner`, `HeroCard`, `FeaturedCategories` y `Titulo`.

Según las reglas, `Header`, `Sidebar` y `BottomNav` son componentes y se mueven. El layout no se mueve: sus estilos se copian al `_layout` de mobile, y lo que es comportamiento (leer la sesión) va a `packages/shared/layoutsBehaviors`.

**Decidir antes de empezar:**
- **Rutas de mobile**: hoy `app/index.tsx` decide entre login y `(app)/home`. Un `app/(public)/index.tsx` también sería `/` y chocaría con él. ¿Se reemplaza esa redirección por el grupo `(public)` igual que en web?
- **Sesión y carrito en mobile**: falta el glue de Expo equivalente a `lib/sesion.ts` y `lib/providers-data.ts` (token desde AsyncStorage, loader de ids del carrito). Está anotado como pendiente en `MIGRACION-SHARED.md`.
- **Navegación en mobile**: en web hay `Sidebar` (desktop) y `BottomNav` (móvil). ¿En mobile se usan los mismos componentes tal cual, o tabs de expo-router? El objetivo de "idéntico" apunta a lo primero.

## Pendientes conocidos (no bloquean)

- `apps/mobile/app/_layout.tsx` tiene `contentStyle: { backgroundColor: 'red' }` y un `SafeAreaView` raíz: el fondo de `(auth)` no llega a cubrir la barra de estado. No se tocó.
- Diferencia entre el MVP (Tailwind v4, rama `main`) y web hoy (v3): `input { font-size: 17px }` de `globals.css` dejó de aplicar, porque ahora `text-xs` le gana por especificidad. Los inputs miden 12px en web y en mobile; en el MVP medían 17px.
- El preset de nativewind reemplaza `boxShadow`, así que `shadow-sm`/`md`/`lg` no son los de Tailwind. Pasa igual en las dos apps.
- `import "@akindo/ui/nativewind-init"` en el `layout.tsx` de web quedó redundante. No molesta.
- Android no se probó (`elevation-[50]` de `VentanaEmergente`).
- **Login en producción (web)**: `_login` es una Server Action y lanza el error de la API. En build de producción Next lo reemplaza por un mensaje genérico, así que "Credenciales inválidas" no llegaría al usuario. Arreglo posible: que `_login` devuelva el error como valor en vez de lanzarlo, o llamar al núcleo `login` desde el cliente y usar la Server Action solo para `createSesion`.
- Registro de cliente: `pb-18` no existe en Tailwind v3, así que no aplica en ninguna de las dos apps. En el MVP (v4) eran 72px de padding abajo. Se dejó igual a la web actual.
- El botón de volver de registro de cliente no tiene acción, igual que en el original.
- Registro de distribuidor: el volver del paso 1 ahora lleva a `/login` (el original iba a `/registro`, que da 404). Con `push` en mobile se apila un login nuevo en vez de volver al anterior. Si molesta, cambiar a `router.back()`.
- `expo-image-picker ~57.0.16` está declarado en `apps/mobile` (autolinking) y en `packages/ui` (donde vive el import). Es una sola copia en el store. Expo Go ya lo trae nativo.
