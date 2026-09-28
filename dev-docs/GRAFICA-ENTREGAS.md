# `GraficaEntregas` — entregas por día, con los retrasos encima

`packages/ui/components/ui/GraficaEntregas.tsx`. Es la gráfica de
"Cumplimiento de entregas" de la pantalla de pedidos. Funciona igual en web y
en mobile.

## Qué dibuja

Una barra por día, de altura proporcional a las entregas de ese día, partida en
tres tramos según cómo llegó cada una respecto a **la fecha comprometida**:

| Tramo | Color | Significa |
|---|---|---|
| `antes` | verde | llegó antes del día acordado |
| `a_tiempo` | ámbar | llegó el día acordado |
| `con_retraso` | rojo | llegó después |

Los tramos se apilan de abajo hacia arriba en ese orden, así que el rojo
siempre queda arriba y se ve de un vistazo. La comparación es **por día**, no
por hora: entregar a las 9 o a las 18 del día comprometido es igual de puntual.

La escala la marca el día más movido de la lista, así que la gráfica siempre
llena su alto sin importar el volumen.

## Qué es y qué no es

Es **solo presentación** y **no lee ningún contexto**: los días entran por
props. Por eso la misma gráfica sirve para los pedidos del cliente y para los
del distribuidor, que los sacan de lugares distintos.

```tsx
import { GraficaEntregas } from "@akindo/ui/components/ui/GraficaEntregas";

<GraficaEntregas dias={entregas} titulo="Cumplimiento de entregas" />
```

## Los datos

El tipo vive en `@akindo/shared/types/entregas`, no en el provider de pedidos
del cliente, justamente para que el distribuidor pueda usarlo:

```ts
export interface DiaEntregas {
  /** El día, ISO. Se usa como `key`. */
  fecha: string;
  /** El rótulo del eje: "Lun". */
  etiqueta: string;
  antes: number;
  a_tiempo: number;
  con_retraso: number;
}
```

Ese módulo trae también `totalDelDia(dia)` y `puntualidadDe(dias)`, que
devuelve el porcentaje de entregas que **no** llegaron tarde (0–100) o `null`
si no hubo ninguna. Es lo que se pinta en la esquina ("84.0% a tiempo") y lo
calcula la gráfica sola: no hace falta mandárselo.

## De dónde salen hoy

De `GET /entregas/resumen?dias=7`, que agrupa los pedidos entregados del
usuario por día y compara cada `entregado_at` contra su fecha comprometida.
Sirve igual al cliente (sus compras) que al distribuidor (sus ventas).

En la pantalla de pedidos del cliente, quien los pide es `SoporteEnvioProvider`
(`@akindo/shared/soporte-envio-context`), al que la app le inyecta el loader
—Server Action en web, llamada con el token en mobile—. Sin ese loader la
gráfica no se pinta.

> **Lo único que sigue siendo de muestra es el compromiso.** Hoy se calcula
> como `confirmado_at + 5 días` dentro de `EntregaService._fecha_compromiso`,
> porque `pedido` no tiene columna de fecha comprometida. El día que la tenga,
> se lee de ahí y la gráfica es real de punta a punta; nada del front cambia.

## Para usarla en la pantalla del distribuidor

No hay que tocar el componente: se le arma la lista de días y se le pasa. Lo
natural ahí es derivarla de sus propios pedidos entregados —agrupando por día
de `entregado_at` y contando como retraso los que pasaron su fecha
comprometida— y pasarla directo, o envolver esa pantalla en su propio provider
si además necesita los accesos de soporte.

## Paginación entre periodos

Con `onAnterior` / `onSiguiente` la gráfica pinta dos flechas para moverse de
periodo en periodo; sin ellas no aparecen, así que quien no pagine la usa igual
que antes. `puedeSiguiente` deshabilita la de avanzar cuando el periodo que se
ve es el que termina hoy.

El rango se arma de las fechas que devolvió el backend, con año: "31 ago – 6
sep 2026". El mes no se repite si los dos días caen en el mismo, y el año solo
se duplica si el periodo cruza de un año a otro.

**La gráfica no se desmonta al cambiar de periodo.** Mientras llegan los datos
nuevos (`cargando`), las barras bajan a cero y el rango anterior se queda
puesto; cuando llegan, alturas y fecha se mueven a la vez. Por eso el esqueleto
de la pantalla es solo para la primera carga: reemplazar la gráfica por un
bloque gris en cada clic hace saltar toda la columna (regla 85).

## Detalles que conviene saber

- **Los altos van por `style`, no por `className`,** y son `Animated.Value`.
  Un className que cambia con el dato revienta en nativo (regla 50), y animar
  `height` obliga a `useNativeDriver: false` porque el driver nativo solo sabe
  de `transform` y `opacity` (regla 86).
- **Un tramo en cero no se desmonta**, se queda con altura 0. Si devolviera
  `null` perdería su `Animated.Value` y al volver a haber datos aparecería de
  golpe en vez de crecer. Por lo mismo las barras se indexan por posición y no
  por fecha: las fechas cambian en cada periodo.
- Una barra con al menos una entrega nunca mide menos de 3 px, para que un día
  flojo se siga viendo.
- La leyenda ("Entregados" / "Con retraso") solo aparece cuando hay algún día
  con retraso: si no, no hay rojo que explicar.
- Con la lista vacía el componente devuelve `null` y no deja un hueco.
