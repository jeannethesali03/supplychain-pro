# Imagen base ligera con Node 20
FROM node:20-alpine

# Dependencias de build para bcrypt
RUN apk add --no-cache python3 make g++

# Directorio de trabajo
WORKDIR /app

# Copiar manifests primero para cache de capas
COPY package*.json ./

# Instalar solo dependencias de produccion de forma reproducible
RUN npm ci --omit=dev

# Copiar el resto del codigo
COPY . .

# Crear usuario no-root para ejecutar la app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Usar usuario no-root
USER appuser

# Puerto interno de la app
EXPOSE 5000

# Comando de arranque
CMD ["node", "server.js"]
