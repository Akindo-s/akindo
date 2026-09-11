# Contexto de Sesión Actual (2026-09-11)

## Estado General
Migrando componentes de `apps/web` a `packages/ui` para que web (Next) y `apps/mobile` (Expo) compartan el mismo código. Branch: `mobile-dev`.

## Último Trabajo Completado
✅ `/registro/cliente` y `/registro/distribuidor` completamente migrados. Ambas rutas:
- Usan componentes de `packages/ui/components/auth/`
- Incluyen ProgressBar, Input, Boton, Checkbox (nuevo), VentanaEmergente
- Web y mobile comparten la misma implementación
- Selector de foto con abstracción `elegirImagen()` (expo-image-picker en nativo, input type=file en web)

### Archivos Modificados pero No Commiteados
```
M apps/mobile/app/(auth)/_layout.tsx
M apps/mobile/metro.config.js
M apps/mobile/app/(auth)/registro/cliente/index.tsx (nuevo)
M apps/mobile/app/(auth)/registro/distribuidor/index.tsx (nuevo)
M apps/web/src/app/(auth)/registro/cliente/page.tsx
M apps/web/src/app/(auth)/registro/distribuidor/page.tsx
M packages/ui/components/auth/RegistroClienteForm.tsx (nuevo)
M packages/ui/components/auth/RegistroDistribuidorForm.tsx (nuevo)
M packages/ui/components/ui/ProgressBar.tsx (nuevo)
M packages/ui/components/inputs.tsx (Checkbox + emailAddress/telephoneNumber)
M packages/ui/components/button.tsx (icon colors)
M packages/ui/image-picker.ts (nuevo)
M packages/ui/image-picker.web.ts (nuevo)
M apps/web/next.config.ts (alias para image-picker.web)
M packages/ui/fonts.ts (fuente stack completa)
```

## Pruebas Completadas
✅ Web: 1280px y 375×667 (scroll, validaciones, foto preview, animación ProgressBar)
✅ Typecheck pasa en apps/web y apps/mobile (0 errores)
✅ iOS bundle compila, detecta expo-image-picker y nuevas strings
✅ Web bundle usa image-picker.web, no el de expo

❌ **Falta:** Testing en dispositivo/simulator iOS (animaciones, foto picker, dos pasos)

## Cambios Pendientes de Test + Commit
1. **Botón logout provisional en home** (solicitado 2026-09-11 16:00 UTC)
   - Agregar en `apps/web/src/app/(public)/page.tsx` para poder testear rutas autenticadas
   - Llamar a logout action de sesión y navegar a `/login`

2. **Testing en mobile:**
   - Reiniciar Metro: `npx expo start --clear`
   - Verificar: selector de foto, ProgressBar animation, header sticky, ciudad/estado en dos columnas, teclado telefónico

## Próximas Rutas (Decisiones Pendientes)
La siguiente es `(public)/` (home). Antes de migrar, se necesitan 3 decisiones:

### 1️⃣ Rutas en Mobile
- **Problema:** `app/index.tsx` hoy decide entre login y `(app)/home` (cuando tiene sesión)
- **Conflicto:** un `app/(public)/index.tsx` chocaría con esto
- **Opciones:**
  - A) Reemplazar lógica de `app/index.tsx` con un grupo `(public)` como en web (más homogéneo)
  - B) Mantener `app/index.tsx` redirect y poner home en `(app)/home` (menos cambios)

### 2️⃣ Sesión y Carrito en Mobile
- **Problema:** web tiene `lib/sesion.ts` y `lib/providers-data.ts` (token desde cookies, carrito desde llamadas)
- **Falta en mobile:** equivalente de Expo (AsyncStorage para token, context o zustand para carrito)
- **Pregunta:** ¿Armar esto como parte de la migración del home, o antes?

### 3️⃣ Navegación en Mobile
- **Opciones:**
  - A) Reutilizar `BottomNav`, `Header` de web (idénticos a web)
  - B) Usar `expo-router` tabs (más nativo, pero requiere layout diferente)

## Estructura Aprendida
```
packages/ui/
  ├─ components/
  │   ├─ auth/
  │   │   ├─ RegistroClienteForm.tsx (nuevo)
  │   │   └─ RegistroDistribuidorForm.tsx (nuevo)
  │   ├─ ui/
  │   │   ├─ ProgressBar.tsx (nuevo, Animated + SVG)
  │   │   ├─ Boton.tsx (icon colors)
  │   │   └─ ...
  │   ├─ inputs.tsx (Checkbox + tel type)
  │   ├─ html-elements.tsx (SVG exports)
  │   └─ index.ts (exports)
  ├─ screens/
  │   └─ login.tsx (excepción: no va en components/)
  ├─ fonts.ts (fuente stack completa)
  ├─ image-picker.ts (nativo: expo-image-picker)
  └─ image-picker.web.ts (web: input type=file)

apps/web/src/
  ├─ app/(auth)/
  │   ├─ layout.tsx
  │   ├─ login/page.tsx
  │   └─ registro/
  │       ├─ cliente/page.tsx (importa de @akindo/ui)
  │       └─ distribuidor/page.tsx (importa de @akindo/ui)
  ├─ components/auth/ (archivos viejos con comentario "movido a")
  └─ next.config.ts (alias image-picker.web)

apps/mobile/app/
  ├─ (auth)/
  │   ├─ _layout.tsx (ImageBackground + ScrollView)
  │   ├─ login/index.tsx
  │   └─ registro/
  │       ├─ cliente/index.tsx (importa de @akindo/ui)
  │       └─ distribuidor/index.tsx (importa de @akindo/ui)
  └─ index.tsx (redirect a login o (app)/home)
```

## Reglas Técnicas Clave
1. **Animated no interpola boxShadow**: usar capa separada con sombra fija + opacity animada
2. **SVG gradients vía `<Defs><LinearGradient>`** (no CSS gradients)
3. **React state para focus/hover** (no CSS pseudo-clases)
4. **Icon colors vía prop** (currentColor no funciona en RN)
5. **emailAddress/telephoneNumber types** mapean a keyboardType
6. **fuente()** retorna stack completa: `"Plus Jakarta Sans", "Plus Jakarta Sans Fallback"`
7. **Metro config:** `inlineRem: 16` (rem base = 16px = web)
8. **CSS interop registration** debe ocurrir en contexto client (importar en html-elements.tsx)

## Pasos Inmediatos
1. Agregar botón logout en `apps/web/src/app/(public)/page.tsx`
2. Testear mobile: `npx expo start --clear`, luego en iOS Simulator
3. Después decidir las 3 preguntas de home y proceder con migración

## Referencias
- `dev-docs/migracion-progreso.md`: tabla de rutas, status, lecciones técnicas
- `dev-docs/COMPONENTES-MULTIPLATAFORMA.md`: patrones web vs mobile
- `dev-docs/TIPOGRAFIA.md`: font stacks y sizing
- `MEMORY.md`: memoria persistente (ui-migration-progress, migration-workflow)

## Logs Útiles
```bash
# Typecheck ambas apps
npm run typecheck -w apps/web
npm run typecheck -w apps/mobile

# Metro limpio
cd apps/mobile && npx expo start --clear

# Build web
cd apps/web && npm run dev

# Ver bundle size
npm run build -w apps/web && du -sh apps/web/.next
```

## Commits Listos
- `feat: migrate /registro/cliente and /registro/distribuidor to packages/ui`
  - Incluye: forms, ProgressBar, Checkbox, image-picker abstraction, font fix, icon colors
  - Limpiar: remover archivos viejos de web (dejarlos con comentario "movido a")
