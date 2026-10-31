# CLAUDE.md — condohub-admin

**Consola de administración** de CondoHub para el rol `ADMIN`. Micro frontend Angular cargado por el shell React. Responsable: **Aldana**.

## Stack

Angular 18 (standalone components, signals, zoneless) · Jest · Angular Material · Apollo Angular (GraphQL de Gestión) · `@angular/elements` para exponerse como Web Component · `@angular-architects/module-federation` · ESLint. (Hoy instalado: Angular, `@angular/elements` y Jest; el resto se suma con las pantallas.)

## Integración con el shell

Se expone como Web Component `<condohub-admin>` vía Module Federation, con el contrato `mount(el, { getToken, user })` / `unmount(el)`. No hace login propio: usa `getToken()` del shell en un interceptor HTTP/Apollo. Debe funcionar también suelto (`ng serve`) con un token de desarrollo para trabajar sin el shell.

## Pantallas (y reglas que muestran)

| Pantalla | Backend | Reglas |
|---|---|---|
| Unidades y alícuotas | Gestión GraphQL | F1, F2 (avisar si no suman 100 %) |
| Emisión de expensas | Gestión | F3 |
| Estado de cuenta y morosos | Gestión | F4, F7 |
| Conciliación de pagos pendientes (ver comprobante, confirmar/rechazar con motivo) | Gestión | F8 |
| Recargos propuestos (confirmar/rechazar) | Gestión | F5 |
| Proveedores y egresos | Gestión | F11 |
| Reservas: calendario, finalizar con/sin daños, sagas `REQUIERE_REVISION` | Reservas REST | R6, S3 |
| Misiones del agente y acciones pendientes de confirmación | Agentes REST | G1–G3 |
| Reportes por voz (grabar, descargar Excel/PDF) | Servicio IA | G4 |
| Cámaras y alertas de visitantes recurrentes | Acceso / IA | I4 |

## Estructura

```
src/app/
├── core/          # interceptor de token, cliente Apollo, guardas
├── shared/        # componentes y pipes (moneda, fecha local)
└── features/      # unidades/, expensas/, pagos/, recargos/, reservas/, agente/, reportes/, camaras/
```

Cada feature: `*.page.ts` (contenedor), componentes de presentación sin lógica de negocio y un `*.service.ts` con las consultas. Las queries GraphQL en archivos `.graphql` con tipos generados por graphql-codegen desde `contracts/graphql/schema.graphql`.

## Comandos

```bash
npm install
npm run codegen     # tipos desde el schema GraphQL
npm run dev         # compila y sirve remoteEntry.js en el puerto 4200
npm test
npm run build
```

## Convenciones

- Ninguna regla de negocio se calcula en el front (montos, recargos, morosidad): se muestran tal como los devuelve el backend.
- Dinero llega como string decimal; formatear con pipe, nunca convertir a `number` para operar.
- Acciones irreversibles (confirmar pago, aplicar recargo) piden confirmación en un diálogo.

## Estado (30/10/2026)

Angular 18 (standalone, signals, zoneless). `src/remoteEntry.ts` exporta `mount`/`unmount` y, para Module Federation, `init`/`get` (contenedor que expone `./remote`); registra el Web Component `<condohub-admin>`. `AdminComponent` muestra la sesión y `miPerfil` y compone `<ch-consola>` (`src/app/consola/`), con cinco pestañas probadas contra el sistema local:

- **Pagos** (F8): `pagosPendientes`, confirmar (recibo, F7) o rechazar con motivo; pide confirmación.
- **Recargos** (F5): `recargosPropuestos`, confirmar o rechazar; nada se cobra sin el clic del ADMIN.
- **Sagas** (S3): `GET /reservas/api/sagas/requieren-revision`.
- **Agente** (G1–G3, G5): lanza la misión, sigue su avance, muestra la bitácora y deja aprobar o rechazar cada acción pendiente (G2); botón del agente de monitoreo.
- **Reportes por voz** (G4): graba con el micrófono o sube un audio, sigue el reporte, **muestra el resultado en una tabla** (vista previa de las primeras 50 filas con «Mostrando N de M», `vista-previa.tabla.ts`) y ofrece la descarga a Excel o PDF.

Capas: `core/` (cliente de API por el gateway con el token del shell, `unidades.ts` resuelve «B-101» desde `unidadId`, adaptadores de confirmación y micrófono) y `features/<f>/` con `*.service.ts` (signals, sin red propia: reciben el puerto `Api`) y `*.page.ts` (solo presentación). Los sondeos del agente y de los reportes se liberan al desmontar. 25 pruebas con Jest (los servicios con código de regla en el nombre).

**Falta:** unidades y alícuotas (F1, F2), emisión de expensas (F3), estado de cuenta/morosos, proveedores y egresos (F11), calendario de reservas, cámaras y alertas (I4), Angular Material y Apollo (no hacen falta hasta ahora). Cómo correrlo y su contrato con el shell: `README.md`.

## Código funcional protegido (obligatorio)

Código en `main` con tests en verde **no se reescribe, refactoriza, renombra ni reformatea** si la tarea no lo pide explícitamente. Lo nuevo se agrega extendiendo (clases, métodos o archivos nuevos). Si es inevitable tocar código funcional, **detente antes de editar**, explica qué archivo/líneas y por qué, y espera confirmación; luego haz el mínimo diff. Nunca edites tests existentes para que pase código nuevo. Corre los tests antes y después: todo lo que pasaba debe seguir pasando. En el resumen, lista cada archivo existente que modificaste.
