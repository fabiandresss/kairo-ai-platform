# Kairo — Intelligence, orchestrated.

Plataforma open-source, local-first y multiagente. 100 % gratuita: sin APIs de pago ni servicios cloud.

## Estado actual

Solo existe el **frontend prototipo** (`frontend/`). No hay backend todavía:

- Login/registro son una **demo local** (cuentas en `localStorage`, contraseñas con PBKDF2 + sal). No es seguridad real.
- Los pasos del orquestador, runs, evaluaciones y workflows usan **datos de ejemplo** (`src/data/seed.ts`).
- Real: cambio de tema, conexión a **Ollama** (`/api/tags`, generación en streaming) y pruebas de endpoints HTTP.

## Requisitos

- Node.js 20+ (probado con 22) y npm.
- Opcional: [Ollama](https://ollama.com) en `http://localhost:11434` con un modelo (`ollama pull llama3.1:8b`).
  Un modelo de 7–8B funciona con ~8 GB de RAM libres (16 GB recomendado).

## Ejecutar

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + build de producción
```

## Estructura

```
frontend/src/
  components/  brand (logo, arte), ui (sistema), layout (shell)
  context/     tema, auth demo, ajustes, notificaciones
  data/        datos de ejemplo
  services/    capa de acceso a datos (sustituible por la API FastAPI)
  pages/       auth + los 7 módulos
```

## Identidad

Crema `#FDFBD4` (claro) · Negro `#000000` (oscuro) · Naranjo `#FC4B08` (acento en ambos). Tipografía Geist + Geist Mono.
Tokens semánticos en `src/index.css`.
