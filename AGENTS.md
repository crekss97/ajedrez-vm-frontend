# Instrucciones para agentes

## Comandos

- Instalar dependencias con `npm install`.
- Levantar el frontend con `npm start` en `http://localhost:4200`.
- Verificar producción con `npm run build`; el script `prebuild` genera `public/runtime-config.js` antes de compilar.
- Ejecutar la suite Karma/Jasmine con `npm test`.
- No hay scripts dedicados de lint ni typecheck en `package.json`; no asumir que existen.

## Flujo de trabajo

- OpenProject es la fuente de verdad del backlog. Trabajar sobre un único work package en estado
  `In progress` y usar su ID numerico en Git y en el PR.
- Usar GitFlow: `main` representa produccion y `develop` integra el trabajo de la siguiente entrega.
  No hacer commits directos a ninguna de las dos ramas.
- Crear ramas cortas desde `develop` actualizado con formato `feat/op-<id>-<slug>`,
  `fix/op-<id>-<slug>` o `chore/op-<id>-<slug>`, y abrir el PR hacia `develop`.
- Reservar `hotfix/op-<id>-<slug>` para incidentes urgentes de produccion: nace desde `main`, se
  integra en `main` mediante PR y luego se sincroniza en `develop` mediante otro PR.
- Crear `release/<version>` desde `develop` solo para estabilizar una entrega; integrarla mediante PR
  en `main`, etiquetar la version y devolver sus cambios a `develop`.
- No mezclar work packages ni cambios ajenos en una rama. Si una tarea afecta backend y frontend,
  crear una rama y un PR independientes en cada repositorio con el mismo OP#.
- Usar commits convencionales, ejecutar `npm test` y `npm run build`, y no publicar la rama si las
  verificaciones fallan.
- Incluir en cada PR `OP#<id>`, alcance, pruebas, riesgos, migraciones y pasos de despliegue.
- Pasar el work package a `In review` al abrir el PR y a `Done` despues de fusionarlo en `develop` y
  completar los checks. Para `release/*` y `hotfix/*`, verificar tambien produccion.
- Los comandos de OpenCode `/op-status`, `/op-start`, `/op-pr` y `/op-close` implementan este flujo.

## Configuración

- La URL de API se obtiene de `window.__APP_CONFIG__.apiUrl`; si falta, usa `/api`.
- Mantener API mismo origen: `proxy.conf.json` reenvía `/api` en local y `vercel.json` lo reescribe al backend en producción. No configurar el dominio backend directo porque rompería las cookies OAuth.
- `vercel.json` debe conservar el rewrite `/api/:path*` antes del fallback SPA a `index.html`.

## Arquitectura

- Es una única aplicación Angular standalone; la entrada es `src/main.ts`, la configuración global está en `src/app/app.config.ts` y las rutas en `src/app/app.routes.ts`.
- La parte pública consume `/events` y `/sidebar-links` mediante los servicios en `src/app/services`.
- `EventosService` combina eventos de la API con eventos editoriales publicados; las consultas de eventos de la API fallan de forma tolerante a una lista vacía.
- `/login` muestra el acceso editorial y solo inicia Google después del clic explícito. `EditorAuthService` obtiene `/auth/me`; no guardar tokens o sesiones en `localStorage`. El guard de `/editor` valida la sesión remota y preserva `returnUrl`.
- La cookie es `HttpOnly`; todas las peticiones API usan `withCredentials` mediante el interceptor. Un `401` editorial vuelve a `/login`.
- Las lecturas públicas usan `/events` y solo reciben `published`; el editor usa `/editor/events` para incluir borradores.
- Dentro del editor, `/editor/eventos` es la biblioteca; `/editor/eventos/nuevo` crea y `/editor/eventos/:id/editar` edita. No mezclar la lista con el formulario.
- Imagen y PDF permanecen como `File` en memoria hasta guardar. `POST/PUT /api/events` envía un multipart con `evento`, `imagen` y `adjuntos`; el máximo combinado es 4 MB. Los documentos se muestran en la lista inferior y no se insertan en `descripcionLarga`.
- `descripcionLarga` se guarda como HTML sanitizable y los PDFs se registran en `adjuntos`; no usar Base64 para imágenes o documentos.
- Los componentes y páginas son standalone y usan signals/RxJS con `ChangeDetectionStrategy.OnPush`; conserva ese patrón al modificar la UI.

## Cambios y verificación

- Mantener los contratos de `src/app/models`, especialmente `Evento`, al cambiar servicios o formularios.
- No editar manualmente `public/runtime-config.js` para configurar entornos: se sobrescribe durante `npm run build`; usa `NG_APP_API_URL`.
- Después de cambios de aplicación, ejecutar al menos `npm run build`; si se modifican servicios, guards o componentes con pruebas, ejecutar también `npm test`.
