# Portal de Preregistro de Reembolsos – Pacífico Salud

Aplicación web de autoservicio para preregistro de reembolsos de gastos médicos, construida con **Vite + React (TypeScript)** y **TailwindCSS**, lista para desplegarse en **AWS Amplify Hosting**.

## Stack

- Vite + React 18 (TypeScript)
- TailwindCSS
- React Router
- React Hook Form + Zod
- TanStack Query (React Query)
- Context + `useReducer` para estado global del wizard

## Requisitos previos

- Node.js 18+
- npm o yarn/pnpm

## Instalación

```bash
npm install
```

## Scripts

- `npm run dev` – Levanta el entorno de desarrollo en Vite.
- `npm run build` – Genera el build de producción.
- `npm run preview` – Sirve el build de producción.

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar según el entorno:

- `VITE_API_BASE_URL` – URL base futura para APIs reales de Atlas.
- `VITE_SESSION_TTL_MINUTES` – TTL de sesión en minutos (por defecto 15).
- `VITE_LOCKOUT_HOURS` – Horas de bloqueo por intentos fallidos (por defecto 24).
- `VITE_FILE_MIN_SIZE_KB` – Tamaño mínimo del archivo en KB (por defecto 20).

Estas variables son leídas en `src/config.ts` y usadas en servicios y utilidades.

## Arquitectura y flujo

- `src/pages` – Un archivo por paso del flujo (Autenticación, Selección de asegurado, Tipo de siniestro, Carga de documentos, Revisión y envío, Confirmación).
- `src/components` – Componentes reutilizables (Stepper, Card, Button, Inputs, Dropzone, Alert/Toast, etc.).
- `src/services` – Capa de servicios preparada para reemplazar mocks por APIs reales:
  - `authService.ts` – `login(policyNumber, dob, captchaToken?)`, `getInsuredList(sessionToken)`.
  - `claimService.ts` – `createPreRegistration(payload)`.
- `src/store` – Estado global del wizard (sesión, asegurado seleccionado, tipo de siniestro, documentos, número de preregistro).
- `src/utils` – Utilidades (enmascarado de nombres, validadores de archivos, helpers de sesión, formateo de número de preregistro).

El flujo completo:

1. **Autenticación** con número de póliza, fecha de nacimiento y un captcha simulado.
2. **Selección del asegurado** cuando hay múltiples asegurados en la póliza.
3. **Registro del siniestro** eligiendo el tipo (Gastos médicos, Emergencia, Consulta).
4. **Carga de documentos** con validación por tipo, tamaño mínimo y heurística de nombre.
5. **Revisión y envío** con resumen y validaciones finales.
6. **Confirmación** mostrando el número único de preregistro.

Todo el flujo funciona con APIs mockeadas y está listo para integrar endpoints reales.

## Mock de APIs y futura integración con Atlas

Los servicios están implementados como mocks con `setTimeout` y errores simulados:

- `src/services/authService.ts`
  - `login(policyNumber, dob, captchaToken?)` implementa:
    - Validación contra datos mock:
      - `policyNumber: "POL123456"`, `dob: "1990-05-20"`.
    - Contador de intentos fallidos y bloqueo por 24 horas (configurable vía `VITE_LOCKOUT_HOURS`) usando `localStorage`.
    - Creación de una sesión mock con token guardado en `sessionStorage`.
  - `getInsuredList(sessionToken)` devuelve:
    - Para `POL123456`: dos asegurados (Titular y Dependiente).
    - Otra póliza mock con un solo asegurado.

- `src/services/claimService.ts`
  - `createPreRegistration(payload)`:
    - Simula una llamada a API con `setTimeout`.
    - Genera número de preregistro con formato `PS-YYYYMMDD-XXXXXX`.
    - Puede simular errores/timeout configurables.

Para integrar APIs reales de Atlas:

1. Configurar `VITE_API_BASE_URL` en `.env` con la URL base real.
2. Reemplazar la implementación de cada método en `authService.ts` y `claimService.ts` por llamadas `fetch`/`axios` usando `VITE_API_BASE_URL`.
3. Mantener las mismas firmas:
   - `login(policyNumber, dob, captchaToken?)`
   - `getInsuredList(sessionToken)`
   - `createPreRegistration(payload)`

## Manejo de sesión y seguridad (simulado)

- La sesión se guarda en `sessionStorage` con timestamp de creación.
- El TTL se define en `VITE_SESSION_TTL_MINUTES`. Si se excede:
  - Se limpia la sesión.
  - Se redirige a Autenticación con el mensaje: **“Tu sesión expiró. Por favor, inicia nuevamente.”**
- Bloqueo por intentos fallidos:
  - Tras 3 intentos fallidos consecutivos por póliza, se bloquea el acceso durante `VITE_LOCKOUT_HOURS`.
  - El estado de bloqueo se persiste en `localStorage`.

## Captcha simulado

El componente `CaptchaMock` (checkbox “No soy un robot”) actúa como placeholder:

- Para sustituirlo por reCAPTCHA/hCaptcha:
  - Reemplazar su implementación por el widget real.
  - Hacer que `login` reciba `captchaToken` como string y lo envíe a la API real.

## Estilos y branding

- Colores definidos en `tailwind.config.cjs`:
  - `primary` (azul corporativo), `accent`, `background`, `success`, `warning`, `error`.
- Fuente principal: **Inter** (con fallback sans-serif).
- Componentes:
  - Header con logo de texto “Pacífico Salud”.
  - Stepper horizontal en desktop y diseño compacto para móvil.
  - Botones primarios (sólidos azules) y secundarios (outline).
  - Inputs con estados de foco visibles, mensajes de ayuda y errores claros.
  - Alertas tipo toast y mensajes inline.

## AWS Amplify Hosting

El archivo `amplify.yml` está listo para Amplify Hosting con Vite:

- Instala dependencias con `npm ci`.
- Ejecuta `npm run build`.
- Publica la carpeta `dist`.

### Rewrites para React Router

En la consola de Amplify, configurar una regla de **Rewrites and redirects**:

- **Source**: `/\<\*>`
- **Target**: `/index.html`
- **Type**: `200 (Rewrite)`

Esto permite que las rutas de React Router funcionen correctamente (SPA).

## Accesibilidad

- Etiquetas y `aria-*` configurados en inputs y botones principales.
- Estados de foco visibles.
- Navegación por teclado soportada en todos los pasos.

## Próximos pasos sugeridos

- Agregar más pruebas unitarias y de integración.
- Conectar con las APIs reales de Atlas usando la capa de servicios existente.

