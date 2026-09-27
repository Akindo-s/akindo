# `BarraFiltros` — buscador + pestañas + desplegables

`packages/ui/components/ui/BarraFiltros.tsx`. Es el bloque de filtros de los
listados largos: órdenes de compra y pedidos (del cliente o del distribuidor).
Funciona igual en web y en mobile.

## Qué es y qué no es

Es **solo presentación**. No guarda estado, no conoce la API y no sabe qué se
está listando: todo lo que muestra entra por props y todo lo que el usuario toca
sale por callbacks. El estado (qué se buscó, qué pestaña está activa, en qué
página va) y la llamada a la API viven en la pantalla, que es la que sabe qué
endpoint tiene que pegar.

Por eso la misma barra sirve para órdenes y para pedidos: lo único que cambia
son las pestañas y los desplegables que se le pasan.

## Las tres piezas

| Pieza | De dónde sale | Se apaga si… |
|---|---|---|
| Buscador | `Buscador` (`components/ui/Buscador.tsx`) | nunca: siempre se pinta |
| Pestañas | una fila de chips que scrollea | no pasas `pestanas` |
| Desplegables | `Selector` en `modo="simple"` | no pasas `desplegables` |

## Props

```ts
placeholder?: string            // texto del buscador
busqueda: string                // la búsqueda ya aplicada (valor inicial del campo)
onBuscar: (q: string) => void   // se llama con el debounce, no en cada tecla
debounceMs?: number             // default 350

pestanas?: PestanaFiltro[]      // { valor, etiqueta, cantidad? }; valor null = "Todas"
pestanaActiva?: string | null
onPestana?: (valor: string | null) => void

desplegables?: DesplegableFiltro[]  // { id, valor, opciones, tipo?, className? }
onDesplegable?: (id: string, valor: string) => void

className?: string
```

`cantidad` es opcional y se pinta al lado de la etiqueta ("Todas 17"). Si el
backend solo sabe contar el filtro activo —que es el caso hoy en órdenes—, se
manda `cantidad` únicamente en la pestaña activa y el resto va en `null`.

**`tipo` distingue filtrar de ordenar.** Un desplegable `"filtro"` (el default)
recorta el listado, así que al cambiarlo la pantalla debería volver a la página
1: la página en la que estabas ya no significa lo mismo. Uno `"orden"` reordena
las mismas órdenes, así que la página actual se respeta.

```tsx
const cambiarFiltro = (aplicar: () => void, reiniciarPagina = true) => {
  if (reiniciarPagina) setPagina(1);
  aplicar();
};

onDesplegable={(id, valor) =>
  cambiarFiltro(
    () => { /* … */ },
    desplegables.find((d) => d.id === id)?.tipo !== "orden",
  )
}
```

`onDesplegable` recibe el `id` del desplegable, así una sola función atiende a
todos:

```tsx
onDesplegable={(id, valor) =>
  id === "distribuidor" ? setDistribuidorId(valor) : setRangoMonto(valor)
}
```

## Cómo se acomoda

- **Hasta `md`**: buscador arriba a todo el ancho, los desplegables en una fila
  de dos (`flex-1` cada uno) y las pestañas en un carrusel horizontal.
- **Desde `md`**: desplegables y buscador comparten renglón (el buscador a la
  derecha, con `md:flex-row-reverse`) y las pestañas quedan abajo.

El carrusel es un `ScrollView` horizontal y no un `overflow-x-auto`, porque en
nativo no existe (regla 17). Los colores de la pestaña activa van por `style` y
no por `className`, porque un className que cambia con el estado revienta en
nativo (regla 50).

## Cómo se usa

Ejemplo completo, el de órdenes de compra (`screens/ordenes.tsx`):

```tsx
const [estado, setEstado] = useState<EstadoOrden | null>(null);
const [busqueda, setBusqueda] = useState("");
const [pagina, setPagina] = useState(1);

// Cualquier filtro manda de vuelta a la página 1.
const cambiarFiltro = (aplicar: () => void) => { setPagina(1); aplicar(); };

<BarraFiltros
  placeholder="Filtrar por ID de orden o ítem..."
  busqueda={busqueda}
  onBuscar={(q) => cambiarFiltro(() => setBusqueda(q))}
  pestanas={pestanas}
  pestanaActiva={estado}
  onPestana={(v) => cambiarFiltro(() => setEstado(v as EstadoOrden | null))}
  desplegables={desplegables}
  onDesplegable={(id, valor) => cambiarFiltro(() => /* … */)}
/>
```

Y los filtros se juntan en un `useMemo` que es el que dispara la recarga:

```tsx
const filtros = useMemo<FiltrosOrdenes>(
  () => ({ estado, q: busqueda, pagina, cantidad: 10 }),
  [estado, busqueda, pagina],
);

useEffect(() => { cargarOrdenes(filtros).then(setListado); }, [filtros]);
```

## Para usarla en pedidos

Pedidos (cliente o distribuidor) tiene sus propios estados y su propio endpoint,
así que lo único que hay que armar son las pestañas:

```tsx
const PESTANAS_PEDIDOS: PestanaFiltro[] = [
  { valor: null, etiqueta: "Todos" },
  { valor: "pendiente de envio", etiqueta: "Por enviar" },
  { valor: "en envio", etiqueta: "En tránsito" },
  { valor: "entregado", etiqueta: "Entregados" },
  { valor: "cancelado", etiqueta: "Cancelados" },
];
```

y pasar el `onBuscar` al loader correspondiente. Si ese endpoint todavía no
acepta búsqueda por texto, se filtra en memoria sobre lo que ya se cargó: la
barra no cambia.

## Detalles que conviene saber

- **El texto mientras se escribe lo lleva la barra, no la pantalla.** El
  `Buscador` es el mismo componente de siempre, con su debounce: `onBuscar`
  llega una sola vez cuando el usuario deja de teclear (350 ms por defecto,
  configurable con `debounceMs`), y Enter —o "Buscar" en el teclado del
  teléfono— la dispara al instante. La prop `busqueda` es solo el valor de
  arranque del campo: si la pantalla la cambia desde afuera (por ejemplo al
  limpiar los filtros), el campo se entera.
- Los `Selector` de la barra se cierran solos al tocar afuera: en web con el
  `mousedown` del documento y en nativo con el modal anclado (regla 76).
- En móvil la fila de desplegables hace `wrap`: con dos quedan a la mitad y con
  tres el tercero baja a su propio renglón.
- **En web, el desplegable abierto necesita que sus ancestros lo dejen salir.**
  Cada `View` de react-native-web es `position: relative` con `z-index: 0`, o
  sea un contexto de apilamiento: el `z-40` del `Selector` no puede pasar por
  encima de un hermano de su padre. Por eso la barra lleva `z-10` en la fila de
  desplegables y la pantalla le pone `z-20` al bloque de filtros. Si lo metes
  en otra pantalla y el desplegable queda por debajo de la lista, es esto.
