# Ajedrez VM Frontend

Frontend Angular para visualizar los eventos publicados por el backend.

El acceso editorial comienza en `/login` mediante Google. No hay registro ni botón público: solo
pueden ingresar los correos habilitados previamente en Neon.

## Scripts

- `npm install`
- `npm start`
- `npm run build`
- `npm test`

## Desarrollo local

El frontend corre por defecto en `http://localhost:4200`.

La URL se toma desde `runtime-config.js`. Por defecto usa el proxy de mismo origen:

```txt
/api
```

## Variables de entorno

Revisa [`.env.example`](.env.example).

- `NG_APP_API_URL`: override opcional; para sesiones seguras debe mantenerse en `/api`.

Ejemplo:

```env
NG_APP_API_URL=/api
```

## Build

Antes del build se genera automáticamente `public/runtime-config.js` usando la variable `NG_APP_API_URL`.

```bash
npm run build
```

Si no defines la variable, el build usa `/api`. `npm start` aplica `proxy.conf.json` hacia
`http://localhost:3000`; en producción, `vercel.json` reescribe `/api/*` al backend.

## Despliegue en Vercel

El proyecto ya tiene configuración para SPA y proxy de API en [`vercel.json`](vercel.json).

### Configuración recomendada

1. Crea un proyecto de Vercel apuntando a esta carpeta.
2. Mantén `NG_APP_API_URL=/api` o no definas la variable.
3. Verifica que el callback Google sea la URL `/api/auth/google/callback` de este frontend.
4. Despliega o vuelve a desplegar.

Ejemplo:

```env
NG_APP_API_URL=/api
```

## Conexión con el backend desplegado

Para que el frontend se conecte correctamente:

1. Despliega primero el backend y aplica `migrations/005_auth.sql` en Neon.
2. Provisiona los editores y configura las credenciales Google en el backend.
3. Despliega el frontend con el rewrite de `/api` incluido en `vercel.json`.
4. Asegúrate de que el backend permita el origen del frontend mediante `ALLOWED_ORIGINS`.

No apuntes `NG_APP_API_URL` directamente al dominio del backend: el inicio OAuth, el callback y las
peticiones autenticadas deben atravesar el mismo dominio del frontend para compartir las cookies
`HttpOnly` correctamente.

## Git y archivos `.env`

- `.env` sí debe estar ignorado.
- `.env.example` no debe ir al `.gitignore`, porque documenta qué variables necesita el proyecto.
