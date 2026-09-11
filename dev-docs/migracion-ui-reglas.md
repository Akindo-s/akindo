# objetivo
Migrar los components de la app /web a packages/ui para que sea utilizable por la app web y la app mobile/ manteniendo la funcionalidad intacta e identica en ambas plataformas sin un posible cierre a funcionalidades unicas por dispositivo (cada app puede crear su propio wrapper de funcionalidad o de componente pero no es algo que se agregue explicitamente).

# resumen 
la branch de mobile-dev se usara para mover componente por componente, page.tsx por page.tsx y layout.tsx a _layout.tsx cada tipo de archivo tiene sus reglas de "movimiento".

# reglas de movimiento
* cada .tsx que se cree en packages/ui tiene que tener esta linea de codigo al inicio del script "/** @jsxImportSource nativewind */"
* en caso de que algun componente use algun color o valor que sea una variable CSS tienes que buscarla en web/src/app/global.css para saber el valor y usarlo hardcodeado.
* Las dependencias exclusivas de Next o Expo se abstraeran o ya estan abstraidas en packages/ui o packages/shared, si estas abstracciones crecen mucho tenemos que ponernar en una carpeta dedicada. Las dependencias exclusivas siguen el patron de "nombrePaquete.ts" para mobile y "nombrePaquete.web.ts" para web, por ejemplo "router.ts" y "router.web.ts" en donde uno usa expoNavigation y otro nextNavigation. El import de estas dependencias es, por ejemplo, 'import {useRouter} from "@akindo/ui/router".

## Componentes
Estos pasan directo de web/src/components a packages/ui/components/ siguiendo exactamente la misma estructura.
Por cada componente que se pase se tiene que usar componentes de react-native equivalentes o identicos, en caso de tener una version semantica en el archivo packages/ui/components/html-elements.tsx se tiene que si o si usar, en caso de que exista un componente semantico en la depencencia @expo/html-elements pero no en nuestro script propio se tiene que declarar ahi y usar desde ahi siguiendo este patron de inyeccion de classname property...
```ts
import { 
    H1 as RawH1
    } from '@expo/html-elements';

export const H1 = conTipografia(RawH1 as React.ComponentType<ComponentProps<typeof RawH1>>);
```


## Paginas/page.tsx/screens
Cada ruta en la app web tiene un page.tsx que puede o no ser solo un wrapper de un componente, en caso de ser asi solo hay que tratarlo como un componente.

En caso de no ser asi de convierte en un componente y eso es lo que se mueve a packages/ui/screens/ siguiendo la misma arquitectura y nomenglatura de archivos en web.

## Layouts
Estos por su naturaleza no se mueven, cada app tiene sus propios layouts, lo que se hace es lo siguiente...
* (para estilos) se copian y pegan (o adaptan) los estilos de web y el uso de sus componentes a mobile.
* (para comportamientos) se abstraen y mueven a packages/shared/layoutsBehaviors y se llaman desde el layout para web y el _layout para mobile.