# CLAUDE.md — condohub-admin

**Consola de administración** de CondoHub para el rol `ADMIN`. Micro frontend Angular cargado por el shell React. Responsable: **Aldana**.

## Stack

Angular 18 (standalone components, signals) · Angular Material · Apollo Angular (GraphQL de Gestión) · `@angular/elements` para exponerse como Web Component · `@angular-architects/module-federation` · Jest o Karma · ESLint.

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
npm start           # ng serve, puerto 4200
npm test
npm run lint
npm run build
```

## Convenciones

- Ninguna regla de negocio se calcula en el front (montos, recargos, morosidad): se muestran tal como los devuelve el backend.
- Dinero llega como string decimal; formatear con pipe, nunca convertir a `number` para operar.
- Acciones irreversibles (confirmar pago, aplicar recargo) piden confirmación en un diálogo.

## Estado (16/10/2026)

Esqueleto: módulo ES con `mount`/`unmount` que muestra la sesión y consulta `miPerfil` a Gestión (React + Vite, 3 tests, `Dockerfile` con nginx, CI en GitHub Actions). **Faltan todas las pantallas y funciones de este documento.** Cómo correrlo y su contrato con el shell: `README.md`.

## Código funcional protegido (obligatorio)

Código en `main` con tests en verde **no se reescribe, refactoriza, renombra ni reformatea** si la tarea no lo pide explícitamente. Lo nuevo se agrega extendiendo (clases, métodos o archivos nuevos). Si es inevitable tocar código funcional, **detente antes de editar**, explica qué archivo/líneas y por qué, y espera confirmación; luego haz el mínimo diff. Nunca edites tests existentes para que pase código nuevo. Corre los tests antes y después: todo lo que pasaba debe seguir pasando. En el resumen, lista cada archivo existente que modificaste.
