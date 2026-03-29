# Ajedrez VM Frontend

Frontend Angular para visualizar los eventos publicados por el backend.

## Scripts

- `npm install`
- `npm start`
- `npm run build`
- `npm test`

## Desarrollo local

El frontend corre por defecto en `http://localhost:4200`.

La URL de la API se toma desde `runtime-config.js`. Para desarrollo local, el valor por defecto es:

```txt
http://localhost:3000/api
```

## Variables de entorno

Revisa [`.env.example`](C:\valentin\Proyectos\ajedrez-vm\ajedrez-vm-frontend\.env.example).

- `NG_APP_API_URL`: URL pública del backend incluyendo `/api`.

Ejemplo:

```env
NG_APP_API_URL=https://tu-backend.vercel.app/api
```

## Build

Antes del build se genera automáticamente `public/runtime-config.js` usando la variable `NG_APP_API_URL`.

```bash
npm run build
```

Si no defines la variable, el build usa `http://localhost:3000/api`.

## Despliegue en Vercel

El proyecto ya tiene configuración para SPA en [vercel.json](C:\valentin\Proyectos\ajedrez-vm\ajedrez-vm-frontend\vercel.json).

### Configuración recomendada

1. Crea un proyecto de Vercel apuntando a esta carpeta.
2. Agrega la variable `NG_APP_API_URL` con la URL del backend desplegado.
3. Despliega o vuelve a desplegar.

Ejemplo:

```env
NG_APP_API_URL=https://tu-backend.vercel.app/api
```

## Conexión con el backend desplegado

Para que el frontend se conecte correctamente:

1. Despliega primero el backend.
2. Copia su URL pública.
3. Configura `NG_APP_API_URL` en el frontend con esa URL terminada en `/api`.
4. Asegúrate de que el backend tenga permitido el origen del frontend mediante `ALLOWED_ORIGINS`.

## Git y archivos `.env`

- `.env` sí debe estar ignorado.
- `.env.example` no debe ir al `.gitignore`, porque documenta qué variables necesita el proyecto.
