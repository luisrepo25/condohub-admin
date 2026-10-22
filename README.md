# condohub-admin

Micro frontend **admin** de CondoHub (Consola de administración, rol `ADMIN`). Hecho en **Angular 18**. Responsable: Aldana. Reglas y stack previsto: ver `CLAUDE.md`.

Este es el **esqueleto**: el shell lo monta con `mount(el, { getToken, user })` y la pantalla solo confirma que el login llega a Gestión (consulta `miPerfil`). Las funciones del `CLAUDE.md` se agregan encima.

## Cómo correrlo

```bash
npm install
npm run dev        # compila (ng build) y sirve remoteEntry.js en http://localhost:4200/remoteEntry.js
npm test
npm run build
```

Para verlo en el navegador, levanta además el shell (`frontends/shell`, puerto 5173), la infraestructura (`docker compose -f infra/docker-compose.yml up -d`) y Gestión, e inicia sesión con un usuario de rol `ADMIN`. Si el 8080 está ocupado, copia `.env.example` a `.env` y cambia `VITE_GATEWAY_URL` (p. ej. `http://localhost:8090`) antes de compilar.

## Contrato con el shell

El build es un módulo ES (`src/remoteEntry.ts`, salida `dist/remoteEntry.js`) que exporta `mount(el, contexto)` y `unmount(el)`; el shell lo carga con `import(url)` desde `VITE_REMOTE_*`. Angular va incluido en el módulo (no se comparte) y la pantalla es el Web Component `<condohub-admin>` (`@angular/elements`, sin zone.js). La URL del gateway (`VITE_GATEWAY_URL`) se escribe en `src/entorno.ts` (generado, no se sube) antes de compilar o probar. Cuando se adopte Module Federation real, solo cambia la configuración de build; `mount`/`unmount` y la pantalla siguen igual.
