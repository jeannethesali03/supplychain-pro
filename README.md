# SupplyChain Pro — Guía rápida de instalación

![Docker](https://img.shields.io/badge/Docker-ready-2496ED) ![Status](https://img.shields.io/badge/status-ready-brightgreen)

Una guía concisa para levantar el proyecto localmente con Docker. Esta página NO incluye
credenciales ni datos sensibles — las credenciales de prueba se mantienen en `Manual.txt`.

---

## Tabla de contenido

- [Requisitos previos](#requisitos-previos)
- [Arranque rápido (Docker)](#arranque-r%C3%A1pido-docker)
- [Validaciones rápidas](#validaciones-r%C3%A1pidas)
- [Puertos expuestos](#puertos-expuestos)
- [Volúmenes y recreado de datos](#vol%C3%BAmenes-y-recreado-de-datos)
- [Troubleshooting rápido](#troubleshooting-r%C3%A1pido)
- [Soporte y notas](#soporte-y-notas)

---

## Requisitos previos

- Docker Desktop (con Docker Compose v2)
- Git
- Puertos libres en el host: `5001`, `5173`, `8080`

Antes de arrancar, verifica y ajusta el archivo `.env` en la raíz del proyecto si es necesario.
Las variables clave y ejemplos están documentados en `Manual.txt` (no incluir credenciales aquí).

---

## Arranque rápido (Docker)

1. Desde la raíz del repositorio, construir y levantar los servicios:

```bash
docker compose up -d --build
```

2. Ver el estado de los contenedores:

```bash
docker compose ps
```

3. Ver los logs (si necesitas depurar):

```bash
docker compose logs -f
```

### Comandos útiles (rápido)

Copiar y pegar para levantar desde cero (recomendado en entorno nuevo):

```bash
git pull origin main
docker compose down -v
docker compose up -d --build
```

---

## Validaciones rápidas

- Backend (health): `http://localhost:5001/health`
- Swagger UI: `http://localhost:5001/api-docs`
- Frontend: `http://localhost:5173`
- phpMyAdmin: `http://localhost:8080`

Para probar login vía API (usar credenciales desde `Manual.txt`):

```bash
curl -X POST http://localhost:5001/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"correo":"admin@local.test","contrasena":"admin123"}'
```

> Nota: el ejemplo anterior asume que el usuario existe en la base de datos. Consulta
> `Manual.txt` para las credenciales de prueba y pasos de seed si necesitas crearlos.

---

## Puertos expuestos

- `5001` → Backend API (contenedor `5000`) — `http://localhost:5001`
- `5173` → Frontend (Nginx, contenedor `80`) — `http://localhost:5173`
- `8080` → phpMyAdmin (contenedor `80`) — `http://localhost:8080`

Internamente (red Docker):

- MySQL: `supplychainpro-db:3306`
- Backend: `supplychainpro-backend:5000`

---

## Volúmenes y recreado de datos

Si cambias credenciales de la base de datos o quieres reiniciar los datos de desarrollo,
recrea el volumen de MySQL y arranca de nuevo:

```bash
docker compose down -v
docker compose up -d --build
```

---

## Troubleshooting rápido

- Error CORS al abrir la UI: verificar que `CORS_ORIGINS` en `.env` incluye `http://localhost:5173`.
- Backend no conecta a DB: comprobar `DB_USER`/`DB_PASSWORD`/`DB_NAME` en `.env` y logs del contenedor.
- Credenciales inválidas en login: si las credenciales no coinciden, recrear la BD de desarrollo o ejecutar los scripts de seed (ver `Manual.txt`).

---

## Soporte y notas

- Las credenciales de prueba, pasos de autenticación en Swagger y notas de soporte se mantienen en `Manual.txt`.
- Errores comunes:
  - CORS: verificar `CORS_ORIGINS` en `.env` incluye `http://localhost:5173`.
  - DB access denied: si cambiaste `DB_PASSWORD` o `DB_ROOT_PASSWORD` y existe un volumen, recrearlo con `docker compose down -v`.

---

Si quieres, puedo añadir badges dinámicos (CI/Docker Hub) o reemplazar el `frontend/README.md` por un enlace al README raíz.
