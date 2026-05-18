# 🚀 Guía de Implementación - Dashboard Logístico

## Inicio Rápido

### Paso 1: Verificar que el Backend está Corriendo

```bash
# En la raíz del proyecto
docker compose ps

# Debería mostrar:
# ✓ supplychainpro-backend (puerto 5001)
# ✓ supplychainpro-frontend (puerto 5173)
# ✓ supplychainpro-db (puerto 3306)
# ✓ supplychainpro-simulator (corriendo)
```

### Paso 2: Activar el Dashboard

#### Opción A: Usar Dashboard como Punto de Entrada Principal (Recomendado)

1. Abre `frontend/src/main.jsx`

2. Encuentra esta línea:
```jsx
import App from './App.jsx'
```

3. Cámbiala por:
```jsx
import DashboardApp from './dashboard/DashboardApp.jsx'
```

4. Guarda y el navegador se recargará automáticamente (Vite HMR)

#### Opción B: Mantener Ambas Aplicaciones (Requiere React Router)

Si necesitas mantener la app original y el dashboard accesibles:

1. Instala React Router:
```bash
npm install react-router-dom
```

2. Crea un archivo `frontend/src/AppRouter.jsx`:
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import DashboardApp from './dashboard/DashboardApp.jsx'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardApp />} />
        <Route path="/legacy" element={<App />} />
      </Routes>
    </BrowserRouter>
  )
}
```

3. Cambia `main.jsx`:
```jsx
import AppRouter from './AppRouter.jsx'

// ...usar AppRouter en lugar de App
```

### Paso 3: Iniciar el Servidor Frontend

```bash
cd frontend
npm run dev
```

El dashboard estará disponible en: **http://localhost:5173**

## 🎯 Acceso al Dashboard

### Pantalla de Login
- **URL:** http://localhost:5173
- **Email de prueba:** `admin@local.test`
- **Contraseña:** `test123456`
- Las credenciales están pre-cargadas en el formulario

### Credenciales Disponibles

```
Admin:
  Email: admin@local.test
  Contraseña: admin123

Test User:
  Email: test@admin.com
  Contraseña: test123456
```

## 📋 Funcionalidades Disponibles

### 1. Dashboard Principal
- Mapa interactivo con rutas de envíos
- Click en las rutas para ver detalles
- Panel de telemetría en tiempo real
- Zoom y controles de mapa

### 2. Monitoreo
- Vista centrada en tarjetas de telemetría
- Métricas de temperatura, humedad, velocidad
- Indicadores de estado en tiempo real
- Información de ubicación GPS

### 3. Incidentes
- Historial completo de incidentes
- Clasificación por severidad
- Estadísticas agregadas
- Timestamps de cada evento

### 4. Historial
- Vista de envíos completados (En construcción)
- Búsqueda y filtros

### 5. Configuración
- Preferencias del sistema (En construcción)
- Parámetros de alerta

## 🔴 Indicadores de Estado

### Estados de Envío

| Color | Estado | Significado |
|-------|--------|------------|
| 🟢 Verde | Normal | Temperaturas y humedad dentro de rango |
| 🟠 Naranja | Advertencia | Valores fuera de rango normalizado |
| 🔴 Rojo | Crítico | ALERTA - Ruptura de cadena de frío |
| ⚪ Gris | Sin conexión | Falta de datos del sensor |

### Indicador LIVE
- 🟡 Amarillo parpadeante = Conexión en tiempo real activa
- 🔌 Icono verde = Backend conectado
- 🔔 Campana = Notificaciones (3 por defecto)

## 🗺️ Usando el Mapa

### Interacciones
1. **Click en una ruta:** Selecciona ese envío
2. **Botón +/-:** Aumenta/disminuye zoom
3. **Botón ✕:** Limpia la selección

### Información Mostrada
- ID del envío
- Estado actual
- Temperatura y humedad
- Velocidad
- Coordenadas GPS

## 🚗 Monitoreando Envíos

### Tarjeta de Telemetría

Cada tarjeta muestra:

```
┌─ Envío #123 [CRÍTICO] ──┐
│ • Mercancía: Productos Lácteos
│ • 🌡️ Temperatura: 12.5°C
│ • 💧 Humedad: 65.3%
│ • 🚀 Velocidad: 85.2 km/h
│ • 📍 GPS: 5.1234, -74.5678
│ • ⏱️ Viaje: 2h 45m
│ • 🕐 Actualizado: 14:32:15
│ [Ver detalles →]
└──────────────────────────┘
```

### Cambios de Estado
Los estados se actualizan en tiempo real:
- Verde → Naranja → Rojo (degradación)
- Rojo → Verde (recuperación)
- Animaciones suaves con pulso

## 📊 Panel de Incidentes

### Historial de Incidentes

Ejemplo de incidente:

```
⚠️ TEMPERATURA CRÍTICA
   Hace 15 minutos
   
   Severidad: CRÍTICO
   Vehículo: #045
   Descripción: Temperatura superó -18°C
```

### Acciones
- 🗑️ Limpiar historial
- Ver detalles de cada evento
- Estadísticas (Críticos, Advertencias, Informativos)

## 🔄 Tiempo Real

El dashboard se conecta automáticamente al WebSocket:

### Eventos que se Reciben
```
✓ Nueva telemetría
✓ Cambios de posición (simulador)
✓ Nuevos incidentes
✓ Cambios de estado de envío
✓ Eventos del simulador
```

### Cómo Funciona
1. Login → obtiene token JWT
2. Token se envía al WebSocket
3. Se suscribe a eventos del servidor
4. Recibe actualizaciones en tiempo real
5. Actualiza UI automáticamente

## 💾 Datos Persistentes

El dashboard guarda en localStorage:

```javascript
// Recupera automáticamente al recargar:
- Último envío visualizado
- Ruta dibujada en el mapa
- Historial de incidentes
- Zoom y posición del mapa
- Preferencias de usuario
```

## 🔒 Seguridad

### Autenticación
- JWT tokens almacenados en localStorage
- Validación en cada petición API
- Logout limpia credenciales

### CORS
El backend solo acepta peticiones desde:
- http://localhost:5173 (desarrollo)
- Configurado en `CORS_ORIGINS` del `.env`

## ⚙️ Configuración Avanzada

### Variables de Entorno

En `frontend/.env`:

```env
# API Backend
VITE_API_BASE=http://localhost:5000/api

# Simulador Externo
VITE_SIMULATOR_EXTERNAL_URL=http://localhost:3001/api/simulator/health
```

### Puerto del Frontend

Si necesitas cambiar el puerto (default 5173):

```bash
npm run dev -- --port 3000
```

## 🔧 Troubleshooting

### Error: "No autenticado"
```
✓ Solución: Login nuevamente con credenciales correctas
✓ Verificar token en localStorage
✓ Revisar que backend esté corriendo
```

### Error: "No se puede conectar a WebSocket"
```
✓ Verificar backend en http://localhost:5001/health
✓ Revisar consola del navegador (DevTools > Console)
✓ Revisar logs del backend: docker compose logs supplychainpro-backend
```

### No aparecen datos de telemetría
```
✓ Verificar que hay envíos en la BD
✓ Verificar que el simulador está corriendo
✓ Revisar en DevTools > Network > WS para conexión WebSocket
✓ Ejecutar: docker compose ps
```

### Mapa en blanco
```
✓ Limpiar caché del navegador (Ctrl+Shift+Delete)
✓ Forzar recarga (Ctrl+F5)
✓ Revisar consola para errores JavaScript
```

## 📱 Usar en Móvil

El dashboard es completamente responsive:

1. En el mismo Wi-Fi: `http://<IP_LOCAL>:5173`
2. Ejemplo: `http://192.168.1.100:5173`
3. Interfaz se adapta automáticamente a pantalla

## 🎨 Personalizar Estilos

### Cambiar Colores Principales

Editar `frontend/src/dashboard/styles/dashboard.css`:

```css
:root {
  --color-primary: #3b82f6;      /* Azul → Tu color */
  --color-success: #10b981;      /* Verde */
  --color-warning: #f59e0b;      /* Naranja */
  --color-danger: #ef4444;       /* Rojo */
}
```

### Cambiar Tamaños

```css
:root {
  --border-radius: 8px;          /* Redondez de bordes */
  --shadow: 0 4px 6px rgba(...); /* Sombras */
}
```

## 📚 Archivos Importantes

```
frontend/src/dashboard/
├── DashboardApp.jsx           # Punto de entrada
├── components/
│   ├── DashboardLayout.jsx    # Estructura principal
│   ├── MapContainer.jsx       # Mapa interactivo
│   ├── TelemetryPanel.jsx     # Tarjetas
│   ├── IncidentsPanel.jsx     # Incidentes
│   └── ...
├── services/
│   ├── apiService.js          # APIs REST
│   ├── socketService.js       # WebSocket
│   └── storageService.js      # localStorage
└── hooks/
    ├── useAuth.js             # Autenticación
    ├── useTelemetry.js        # Datos en tiempo real
    └── ...
```

## 🚀 Deployment

Para usar en producción:

1. Construir el proyecto:
```bash
npm run build
```

2. Los archivos estáticos estarán en `dist/`

3. Servir con Nginx en el contenedor (ya configurado)

## 📞 Soporte

Para problemas:

1. Revisar logs del backend:
```bash
docker compose logs -f supplychainpro-backend
```

2. Revisar DevTools del navegador:
   - Console (errores JavaScript)
   - Network (peticiones HTTP)
   - Storage (localStorage)

3. Revisar estado de contenedores:
```bash
docker compose ps
```

---

**¡El Dashboard Logístico está listo para usar!** 🚀

Dirígete a http://localhost:5173 y comienza a monitorear tus envíos en tiempo real.
