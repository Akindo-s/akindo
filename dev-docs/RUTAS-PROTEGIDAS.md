# Rutas protegidas por login

Cómo se decide quién puede entrar a una ruta, en web y en mobile. Lo que ya existía sigue igual; **lo único nuevo es el guardia del layout en mobile** (última sección).

## La sesión

| | Web (Next) | Mobile (Expo) |
|---|---|---|
| Dónde vive | Cookies `token` y `tipo_usuario`, `httpOnly`, 24 h (`apps/web/src/lib/sesion.ts`) | AsyncStorage con las mismas dos claves (`apps/mobile/utils/session.ts`) |
| Quién la lee | `sesionOpcional()` / `sesionRequerida()` en el servidor | el store `useSesion()` (React) o `sesionActual()` (loaders fuera de React) |
| Al iniciar sesión | `createSesion` escribe las cookies; Next vuelve a pintar el layout solo | `guardarSesion` escribe y avisa a los suscriptores, que vuelven a pintar |
| Al cerrarla | `destroySesion` borra las cookies | `borrarSesion` |

El núcleo compartido (`@akindo/shared/api/*`) **no sabe de cookies ni de navegación**: recibe el token y, si el backend lo rechaza, lanza `SesionRequeridaError` o `TokenExpiradoError` (`packages/shared/src/sesion.ts`). Cada app traduce ese error a lo suyo.

## Web: el guardia está en cada `page.tsx` (sin cambios)

No hay middleware. Cada página del grupo `(protected)` lee las cookies y decide:

```tsx
const token = cookieStore.get("token")?.value;
const tipoUsuario = cookieStore.get("tipo_usuario")?.value;
if (!token || tipoUsuario !== "cliente") redirect("/login");
```

Así están las 13 páginas protegidas: carrito, preorden, pedidos, perfil y las del distribuidor (cada una exige además el tipo de usuario que corresponde). Existe también `sesionRequerida(tipo?)` en `lib/sesion.ts`, que hace lo mismo en una línea, y `conSesion(fn)`, que envuelve una llamada al núcleo y convierte un token vencido en `redirect("/login")`. Los adaptadores de `lib/api/*` usan `tokenRequerido()` + `conSesion()`, así que **una acción con el token vencido también manda a login**.

El `layout.tsx` de `(protected)` **no** bloquea: solo lee la sesión con `sesionOpcional()` para pintar el Header, el Sidebar y el BottomNav según el tipo de usuario. Si alguien entra sin sesión, la que redirige es la página.

## Mobile: el guardia está en el layout del grupo (esto es lo nuevo)

En mobile no hay un "servidor antes de pintar": las pantallas ya están montadas cuando se lee el storage. Poner el redirect en cada pantalla significaría repetirlo y, peor, dejar ver un instante de contenido. Por eso `apps/mobile/app/(protected)/_layout.tsx` lo hace una sola vez para todo el grupo:

```tsx
const sesion = useSesion();
const { isLoggedIn, tipoUsuario, requiereLogin } = estadoLayoutProtegido(sesion);

// AsyncStorage es asíncrono: sin esperar se redirigía aunque hubiera sesión.
if (!sesion.cargada) return <View className="flex-1 bg-white" />;
if (requiereLogin) return <Redirect href="/login" />;
```

- `estadoLayoutProtegido` (`packages/shared/src/layoutsBehaviors/protected.ts`) es el cálculo compartido: `isLoggedIn`, `tipoUsuario` y `requiereLogin`. El layout de web llama al mismo para el Header.
- **El `cargada` es obligatorio.** La cookie de web ya está leída antes de pintar; el storage de mobile no, así que sin esa guarda la app mandaba a `/login` aunque hubiera sesión guardada.
- Todavía **no se valida el tipo de usuario** en mobile: el layout solo exige que haya token. Cuando se migre una ruta que en web pide un tipo (por ejemplo `pedidos`, que es solo de clientes), hay que agregar esa comprobación —en el layout si vale para todo el grupo, o en la pantalla si es de una sola.
- Token vencido: web lo traduce a `redirect("/login")` dentro de `conSesion`; **mobile todavía no tiene equivalente**. Hoy el error llega a la pantalla (en el carrito se ve "No se pudo cargar tu carrito" con un "Volver a intentar"). Está anotado como pendiente en `migracion-progreso.md`.

## Qué pasa con lo que no es una ruta

- **El carrito sin sesión** (agregar desde una tarjeta): no redirige, avisa. Decisión del usuario. Web responde 401 desde `/api/carrito` con `MENSAJE_CARRITO_SIN_SESION` y mobile devuelve el mismo mensaje; la tarjeta lo muestra con `useAviso()`.
- **Los loaders del layout público** (`cargarIdsCarrito`) no exigen sesión: `estadoLayoutPublico` decide si hay carrito que pedir (`tieneCarrito`), porque antes el home mandaba a `/login` a quien entraba sin cuenta.
- **El Header** no protege nada: solo muestra u oculta el carrito, el perfil y los botones de administración según `isLoggedIn` y `tipoUsuario`.
