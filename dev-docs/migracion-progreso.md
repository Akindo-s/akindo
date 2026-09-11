# Progreso de la migración de UI a `packages/ui`

Contexto mínimo para retomar. Reglas del proceso: [`migracion-ui-reglas.md`](./migracion-ui-reglas.md). Detalle técnico: [`COMPONENTES-MULTIPLATAFORMA.md`](./COMPONENTES-MULTIPLATAFORMA.md) y [`TIPOGRAFIA.md`](./TIPOGRAFIA.md).

## Rutas

| Ruta web | Estado | Compartido | Mobile |
|---|---|---|---|
| `(auth)/login` | ✅ terminada | `packages/ui/screens/login.tsx` | `app/(auth)/login/index.tsx` |
| `(auth)/registro/cliente` | ✅ terminada | `packages/ui/components/auth/RegistroClienteForm.tsx` | `app/(auth)/registro/cliente/index.tsx` |
| `(auth)/registro/distribuidor` | ✅ terminada | `packages/ui/components/auth/RegistroDistribuidorForm.tsx` | `app/(auth)/registro/distribuidor/index.tsx` |
| `(public)/` (home) | ✅ terminada (falta prueba en dispositivo) | `packages/ui/screens/home.tsx` + `components/{home,layout,mercado}/` | `app/(public)/index.tsx` |
| resto | pendiente | — | — |

**Ubicación:** desde registro se sigue la regla de `migracion-ui-reglas.md`: si el `page.tsx` solo envuelve a un componente, ese componente va a `packages/ui/components/` con la misma ruta que en web, y se importa directo como `@akindo/ui/components/auth/X` (subpath `./components/*` del exports map). No se importa desde el barrel `@akindo/ui/components`, porque la página de Next es Server Component y necesita apuntar a un módulo con `"use client"`. Login es la excepción: quedó en `screens/login.tsx`.

Layout `(auth)`: web `app/(auth)/layout.tsx` → mobile `app/(auth)/_layout.tsx` (mismo fondo `assets/images/fondo-registro.jpg`, tarjeta centrada con un `ScrollView` puesto vía `screenLayout` del `Stack`).

**Scroll en web** (pedido del usuario): el `body` no scrollea (`h-dvh overflow-hidden flex flex-col`, en `app/layout.tsx`). Cada layout pone el scroll en su `<main>` (`flex-1 min-h-0 overflow-y-auto`): `(public)`, `(protected)`, `(auth)` y `sobrenosotros`. Header, Sidebar y BottomNav quedan siempre a la vista, y los `sticky top-0` de las páginas se pegan debajo del Header (antes, arriba de la ventana, porque el Header se iba con el scroll). En `(auth)` se centra con `my-auto` en un wrapper: `justify-center` con alto fijo y overflow corta el principio de un formulario alto. El Sidebar ocupa el alto de la fila y scrollea solo si no le alcanza, así que el pie con los nombres del equipo ahora queda siempre visible abajo. En `(protected)` el BottomNav sigue siendo el viejo (`fixed`, con `pb-16` en el main).

Layout `(public)`: web `app/(public)/layout.tsx` → mobile `app/(public)/_layout.tsx`. El `BottomNav` compartido va en el flujo en las dos apps (sin `fixed`). En web lo oculta desde `md` un `<div className="md:hidden">` del layout, porque desde ahí navega el Sidebar; en mobile se ve siempre, también en horizontal, porque ahí no hay Sidebar. Mobile usa **Tabs de expo-router** (decisión del usuario) con el `BottomNav` compartido como `tabBar`; solo aparecen las tabs cuya ruta existe en el grupo (hoy solo Inicio, prop `hrefsVisibles`). El `Header` compartido va arriba de las Tabs, fijo (en web scrollea con la página). Sin `Sidebar` en mobile (en web solo aparece desde `md`; sigue en `apps/web/src/components/layout/Sidebar.tsx`, sin mover). El comportamiento común está en `packages/shared/src/layoutsBehaviors/public.ts` (`estadoLayoutPublico(sesion)` → `isLoggedIn`, `tipoUsuario`, `tieneCarrito`), y lo llaman los dos layouts y los dos `cargarIdsCarrito`.

Sesión en mobile: `apps/mobile/utils/session.ts` es un store (`useSesion()`, `guardarSesion`, `borrarSesion`, `sesionActual()`) sobre AsyncStorage; `_login`/`_logout` lo actualizan y el layout se vuelve a pintar (lo que en web hace Next al tocar cookies desde una server action). Loaders de mobile en `apps/mobile/utils/providers-data.ts`, espejo de `apps/web/src/lib/providers-data.ts`.

Se borraron `apps/mobile/app/index.tsx` (redirigía a login o a `(app)/home`) y la pantalla de prueba `app/(app)/home.tsx`: `/` ahora es `app/(public)/index.tsx`, público como en web.

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
| `layout/Header.tsx` (lo sigue usando `(protected)/layout.tsx`) | `components/layout/Header.tsx` (recibe `onLogout`) |
| `layout/BottomNav.tsx` (lo sigue usando `(protected)/layout.tsx`) | `components/layout/BottomNav.tsx` |
| `home/InfoBanner.tsx`, `home/HeroCard.tsx`, `home/FeaturedCategories.tsx` (ya no los usa ninguna ruta) | `components/home/` (`HeroCard` recibe `imagen`, `FeaturedCategories` recibe `destacadas`) |
| `mercado/MercadoBuscador.tsx`, `mercado/BarraBusquedaFiltros.tsx` (los usan las páginas de mercado) | `components/mercado/` (`MercadoBuscador` recibe `cargarCategorias`) |
| `ui/Buscador.tsx` (lo usan mercado/categorias e `InventarioView`) | `components/ui/Buscador.tsx` |
| `icons/CategoriesIcons.tsx` (ya no lo usa ninguna ruta) | `icons/CategoriesIcons.tsx` |

Nuevo en `packages/ui` sin equivalente en web: `components/ui/Degradado.tsx` (capa `absolute inset-0` con `LinearGradient` de SVG, direcciones `to-t` y `to-br`).

Dependencias de plataforma ya abstraídas (patrón `x.ts` / `x.web.ts` + alias en `apps/web/next.config.ts`): `router` (default `useRouter` + `usePathname`), `image-picker` (`elegirImagen()`: `expo-image-picker` en nativo, `<input type="file">` en web).

Íconos de `lucide-react`: se usa **`lucide-react-native`** (declarado en `packages/ui`), que corre en las dos plataformas vía `react-native-svg`. El color va por la prop `color` (en nativo `currentColor` sale negro). Web usa ~57 íconos de lucide en 39 archivos.

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
22. **Rutas de FastAPI con barra final**: un `@router.post('/')` bajo `prefix="/distribuidores"` es `/distribuidores/`. Sin la barra, la API responde 307 y en mobile el `fetch` del POST se quedaba colgado. Llamar siempre con la barra que declara el router.
23. **`Link` con íconos o varios textos → `bloque`**: en nativo un `ExpoLink` es un `Text`; con `bloque` pasa a `asChild` + `Pressable` (flex en columna). En web le suma `flex flex-col` al `<a>`: si no, sus `Span` toman la línea de 24px del body y el link crece. Los textos de adentro van en su propio `Span`. `onHoverChange` sirve para colores de hover de íconos/textos adentro.
24. **Flex items que se encogen**: en CSS un flex item se encoge solo (`flex-shrink: 1`); en RN y react-native-web no. Si en web un contenedor hacía `flex-wrap` o un texto se cortaba en líneas, hace falta `shrink` (casos: `Nav` del Header, columna de texto del `InfoBanner`).
25. **Clases de la instancia que pisaban la variante del `Boton` viejo**: en el original, `className` ganaba en tamaño/color de texto y en radio (`text-xs` sobre `text-sm`, `text-stone-400` sobre `text-red-600`, `rounded-lg` sobre `rounded-full`). Medir en web; para texto está la prop `claseTexto` del `Boton`. Si pisaba casi todo (el "Cerrar sesión" del Header), armar un `Pressable` con el resultado final.
26. **`grid grid-cols-N gap-3`** con columnas responsive: fila `flex-row flex-wrap -m-1.5` y cada celda `w-1/2 md:w-1/3 lg:w-1/4 p-1.5`. Da el mismo ancho y separación que el grid.
27. **`sticky` dentro de una pantalla**: en web queda `web:sticky top-0` en el componente (se pega arriba del `<main>`, que es lo que scrollea). En nativo la pantalla es un `ScrollView` con `stickyHeaderIndices`, que solo sirve para hijos directos; por eso `screens/home.tsx` usa `View` en web y `ScrollView` en nativo.
28. **No ocultar un View de react-native-web con una clase de `display`** (`hidden`, `md:hidden`, `web:md:hidden`): react-native-web le pone a cada View `display: flex` con una clase de la misma especificidad, y gana según el orden de las hojas de estilo. En Chrome `web:md:hidden` funcionaba, pero en el Safari del usuario el `BottomNav` seguía visible junto al Sidebar. Si la visibilidad depende del layout, envolver en un `<div className="md:hidden">` del DOM en el layout de web. `native:w-auto` sí sirve para anular un `w-full` cuando el `max-w-fit` que lo limitaba en web no existe en nativo.
29. **expo-router navega distinto que Next**: `Link` sin opciones hace *navigate* (no duplica pantallas y en Tabs salta a la tab); `router.push` siempre apila, así que desde la misma ruta deja un duplicado. Tras cerrar sesión el Header usa `router.replace("/")`. En web, una server action que toca cookies ya hace que Next vuelva a pintar el layout: no hace falta `router.refresh()` (que tampoco existe en expo-router).
30. **Datos que un Server Component cargaba solo** (`FeaturedCategories` era `async`): la pieza compartida los recibe por prop. Web los carga en el `page.tsx` (sigue en el servidor, sin parpadeo); mobile, en la pantalla con un `useEffect`.
31. `Degradado` usa `useId()` para el id del `LinearGradient`: con varias tarjetas en la misma página, ids repetidos harían que todas tomen el primero.

## Cómo verificar una ruta

- **Web**: agregar una ruta temporal (`app/(auth)/<ruta>-original/page.tsx`) que renderice el componente viejo de web y comparar medidas (`getBoundingClientRect`/`getComputedStyle`) contra la migrada. Borrarla al terminar. Para levantar la preview está `.claude/launch.json` (`web`).
- Componentes con estados que dependen de la sesión o de datos que la API local no trae (Header por tipo de usuario, categorías destacadas): página temporal `"use client"` que pinta el viejo y el nuevo lado a lado con props forzadas y datos de prueba, cada uno en un `data-cmp` para medirlos. Para un `fixed` (BottomNav), envolverlo en un div con `transform: translateZ(0)`. Borrarla al terminar.
- Sesión en web sin credenciales: `document.cookie = "token=x"` y `"tipo_usuario=distribuidor"` alcanzan para ver el Header con sesión y probar "Cerrar sesión" (la server action las borra).
- Envíos a la API: interceptar `window.fetch` en la página y devolver respuestas falsas (error con `detail`, y éxito). Así se prueba el camino completo sin crear registros en la base local.
- Selector de archivos: sobrescribir `HTMLInputElement.prototype.click` para los `type="file"`, cargarles un `File` con `DataTransfer` y disparar `change`.
- Si Next se reinicia (por ejemplo al tocar `next.config.ts`), la consola se llena de errores del WebSocket de HMR. No son de la app.
- Con el pane del navegador oculto, `requestAnimationFrame`, `ResizeObserver` y los timers quedan pausados o frenados: ahí no se pueden verificar animaciones.
- **Mobile**: `npx tsc --noEmit -p apps/mobile/tsconfig.json` y `cd apps/mobile && npx expo export --platform ios --output-dir <tmp>` (compila el bundle sin dispositivo). Ningún simulador tiene Expo Go instalado.

## Siguiente ruta

Candidata natural: `(public)/mercado` (`app/(public)/mercado/page.tsx`), porque ya reusa `MercadoBuscador`/`BarraBusquedaFiltros`/`Buscador` migrados y es la segunda tab. Al migrarla: agregar `app/(public)/mercado/index.tsx` en mobile (la tab aparece sola en el `BottomNav`) y cambiar el import de la página web al componente compartido. Confirmar con el usuario antes de empezar.

Verificación del home hecha en web (1280 y 375, comparando contra una copia de la página vieja y los 4 estados del Header: sin sesión, cliente, distribuidor, admin): medidas iguales al píxel, buscador (Enter, limpiar), chips, cerrar sesión con cookie de prueba. Mobile: typecheck y `expo export --platform ios` sin errores ni warnings. **Falta probarlo en el simulador/dispositivo**: Tabs + BottomNav, Header con y sin sesión (login → home, cerrar sesión), buscador fijo al scrollear (con categorías destacadas visibles), badge animado del hero, link "Conocenos" (externo).

## Pendientes conocidos (no bloquean)

- `apps/mobile/app/_layout.tsx`: el `contentStyle` rojo pasó a blanco (web no pinta fondo en el body, así que en un navegador se ve el blanco del canvas). Sigue el `SafeAreaView` raíz: el fondo de `(auth)` no llega a cubrir la barra de estado.
- **Home público en web**: antes, sin sesión, `/` mandaba a `/login` porque el `CarritoProvider` del layout llamaba a `obtenerIdsCarrito`, que exige sesión (pasaba igual en `main`). Se arregló en `cargarIdsCarrito` (`tieneCarrito` de `layoutsBehaviors/public`), a pedido del usuario.
- **Caché del carrito**: `carrito-context` guarda los ids en variables del módulo y nunca las invalida; si la primera carga fue sin sesión (lista vacía), después de iniciar sesión el badge sigue en 0 hasta recargar la app (web: hasta recargar la página). Además, si el loader falla, la promesa rechazada queda guardada. Pasa igual en las dos plataformas.
- **Token vencido en mobile**: web traduce el `TokenExpiradoError` a `redirect("/login")` (`conSesion`); mobile todavía no tiene equivalente. En el home, un error al cargar las destacadas simplemente oculta la sección.
- `apps/mobile/.env.local` quedó con `localhost` en vez de `127.0.0.1`. No era la causa del bug del registro (en el simulador de iOS las dos llegan a la Mac) y no cambia nada; en un emulador de Android haría falta `10.0.2.2` o la IP de la Mac.
- Badge del hero: cuando el texto está vacío mide 8px de alto en web (solo el padding); en nativo un `Text` vacío podría medir una línea. No afecta el layout (la tarjeta tiene `min-h`).
- Diferencia entre el MVP (Tailwind v4, rama `main`) y web hoy (v3): `input { font-size: 17px }` de `globals.css` dejó de aplicar, porque ahora `text-xs` le gana por especificidad. Los inputs miden 12px en web y en mobile; en el MVP medían 17px.
- El preset de nativewind reemplaza `boxShadow`, así que `shadow-sm`/`md`/`lg` no son los de Tailwind. Pasa igual en las dos apps.
- `import "@akindo/ui/nativewind-init"` en el `layout.tsx` de web quedó redundante. No molesta.
- Android no se probó (`elevation-[50]` de `VentanaEmergente`).
- **Login en producción (web)**: `_login` es una Server Action y lanza el error de la API. En build de producción Next lo reemplaza por un mensaje genérico, así que "Credenciales inválidas" no llegaría al usuario. Arreglo posible: que `_login` devuelva el error como valor en vez de lanzarlo, o llamar al núcleo `login` desde el cliente y usar la Server Action solo para `createSesion`.
- Registro de cliente: `pb-18` no existe en Tailwind v3, así que no aplica en ninguna de las dos apps. En el MVP (v4) eran 72px de padding abajo. Se dejó igual a la web actual.
- El botón de volver de registro de cliente no tiene acción, igual que en el original.
- Registro de distribuidor: el volver del paso 1 ahora lleva a `/login` (el original iba a `/registro`, que da 404). Con `push` en mobile se apila un login nuevo en vez de volver al anterior. Si molesta, cambiar a `router.back()`.
- `expo-image-picker ~57.0.16` está declarado en `apps/mobile` (autolinking) y en `packages/ui` (donde vive el import). Es una sola copia en el store. Expo Go ya lo trae nativo.
