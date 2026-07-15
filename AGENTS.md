# Instrucciones para agentes

## Comandos

- Instalar dependencias con `npm install`.
- Levantar el frontend con `npm start` en `http://localhost:4200`.
- Verificar producción con `npm run build`; el script `prebuild` genera `public/runtime-config.js` antes de compilar.
- Ejecutar la suite Karma/Jasmine con `npm test`.
- No hay scripts dedicados de lint ni typecheck en `package.json`; no asumir que existen.

## Configuración

- La URL de API se obtiene de `window.__APP_CONFIG__.apiUrl`, generado desde `NG_APP_API_URL`; si falta, se usa `http://localhost:3000/api`.
- Para despliegues, `NG_APP_API_URL` debe incluir el sufijo `/api`; configura primero el backend y su CORS (`ALLOWED_ORIGINS`).
- `vercel.json` publica `dist/ajedrez-vm/browser` y redirige todas las rutas a `index.html` porque la aplicación es una SPA.

## Arquitectura

- Es una única aplicación Angular standalone; la entrada es `src/main.ts`, la configuración global está en `src/app/app.config.ts` y las rutas en `src/app/app.routes.ts`.
- La parte pública consume `/events` y `/sidebar-links` mediante los servicios en `src/app/services`.
- `EventosService` combina eventos de la API con eventos editoriales publicados; las consultas de eventos de la API fallan de forma tolerante a una lista vacía.
- El panel `/editor` está protegido por `editor-auth.guard`; su autenticación es mock y la sesión persiste en `localStorage`, mientras que la gestión editorial usa la API.
- Dentro del editor, `/editor/eventos` es la biblioteca; `/editor/eventos/nuevo` crea y `/editor/eventos/:id/editar` edita. No mezclar la lista con el formulario.
- Imagen y PDF permanecen como `File` en memoria hasta guardar. `POST/PUT /api/events` envía un multipart con `evento`, `imagen` y `adjuntos`; el máximo combinado es 4 MB. Los documentos se muestran en la lista inferior y no se insertan en `descripcionLarga`.
- `descripcionLarga` se guarda como HTML sanitizable y los PDFs se registran en `adjuntos`; no usar Base64 para imágenes o documentos.
- Los componentes y páginas son standalone y usan signals/RxJS con `ChangeDetectionStrategy.OnPush`; conserva ese patrón al modificar la UI.

## Cambios y verificación

- Mantener los contratos de `src/app/models`, especialmente `Evento`, al cambiar servicios o formularios.
- No editar manualmente `public/runtime-config.js` para configurar entornos: se sobrescribe durante `npm run build`; usa `NG_APP_API_URL`.
- Después de cambios de aplicación, ejecutar al menos `npm run build`; si se modifican servicios, guards o componentes con pruebas, ejecutar también `npm test`.
