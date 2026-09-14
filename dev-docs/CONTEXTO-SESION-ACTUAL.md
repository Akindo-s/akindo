# Contexto de sesión actual (2026-09-13)

Migración de `apps/web` a `packages/ui` para que web (Next) y `apps/mobile` (Expo) compartan la UI. Branch `mobile-dev`.

**El estado completo está en [`migracion-progreso.md`](./migracion-progreso.md)**: la tabla de rutas (hechas y pendientes), la lista de archivos ya movidos, las 72 reglas aprendidas, cómo se verifica cada ruta y los pendientes conocidos. Este archivo es solo el resumen para retomar. Complementarios: [`RUTAS-PROTEGIDAS.md`](./RUTAS-PROTEGIDAS.md) (quién entra a cada ruta), [`COMPONENTES-MULTIPLATAFORMA.md`](./COMPONENTES-MULTIPLATAFORMA.md), [`TIPOGRAFIA.md`](./TIPOGRAFIA.md) y [`migracion-ui-reglas.md`](./migracion-ui-reglas.md) (el proceso pedido por el usuario).

## Cómo se trabaja (pedido del usuario)

- **Una ruta a la vez.** No se empieza la siguiente hasta que la actual está terminada en las dos plataformas.
- **Al terminar una ruta se para**, se reporta y el usuario prueba y commitea.
- **No se borra nada de `apps/web`**: al archivo migrado se le agrega arriba `// archivo movido a … ; referenciado en otros componentes de web.`
- **Sesiones**: cuando una ruta necesita sesión de cliente o de distribuidor, se para y se le pide al usuario que la cambie a mano en el simulador. No se escriben contraseñas en formularios.
- **Escrituras reales** (aceptar, rechazar, cancelar, archivar, valorar, cambiar estado, crear o editar productos): no se hacen sin preguntarle antes. Hasta ahora solo se hizo una, con permiso: el pedido `#9e84ca5d` de `testuser` pasó de "pendiente de envío" a "en envío".

## Qué está hecho

Todo `(auth)` y todo `(public)`. De `(protected)`: el layout del grupo, `carrito`, `perfil`, `pedidos`, `pedidos/ordenes`, `pedidos/[pedidoId]` (las vistas de cliente y de distribuidor), y del distribuidor `pedidos`, `ordenes`, `ordenes/[ordenId]`, el panel `/distribuidor`, su inventario `distribuidor/productos` y **crear / editar producto** (`distribuidor/productos/crear` y `[id]/editar`, un solo form compartido).

Las últimas tandas (panel, inventario y crear/editar producto) pueden estar **sin commitear**: mirar `git status`.

## Qué falta

`distribuidor/valoraciones`, `distribuidor/reportes`, `carrito/preorden` y `admin/categorias`.

En mobile ya no quedan links del distribuidor que caigan en "Unmatched Route" por rutas sin migrar dentro de lo hecho.

## Cosas que conviene tener presentes

- **`Boton` resuelve `w-fit`/`w-full` al revés que web** (ver pendientes en `migracion-progreso.md`): hoy se compensa poniendo `w-full` en cada instancia. Arreglar el componente toca todas las pantallas que usan `primario` y necesita su propia tanda.
- **`tsc` no alcanza para validar JSX**: los comentarios `{/* … */}` entre atributos o justo después de un `&& (` compilan en TypeScript pero rompen en Next (SWC) y en Metro (Babel). Hay que abrir la página en el dev server y la pantalla en el simulador (regla 64).
- **`components/ui/Selector.tsx` ahora tiene la API del `Selector` de web** (`modo` simple/múltiple, opciones con `etiqueta`, `claseCaja` para imitar un `<select>`). `screens/distribuidor-pedidos.tsx` sigue con su `SelectorEstado` propio.
- Con HMR, un clic que "no hace nada" en web puede ser un chunk viejo: recargar la pestaña antes de buscar el bug (pasó con las opciones del Selector).

## Estado del entorno de prueba

- Simulador: iPhone 17 Pro, con **sesión de distribuidor** (`Dulcería el valle`) en el momento de escribir esto. La cuenta de cliente que se usó antes es `sergio9`.
- La foto de perfil del cliente quedó con una imagen de muestra del simulador (una cascada), de cuando se probó la subida de imágenes.
- El dev server de web (puerto 3000) lo levantó otra sesión; esta lo usó abriendo una pestaña a `localhost:3000`.
