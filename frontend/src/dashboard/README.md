# Dashboard Logístico - Módulo Independiente

## 📋 Descripción

Dashboard de Monitoreo Logístico en Tiempo Real completamente independiente para SupplyChain Pro. Construido como un módulo desacoplado que no modifica el código existente del proyecto.

**Características principales:**
- ✅ Monitoreo de envíos en tiempo real
- ✅ Mapa interactivo con rutas de camiones
- ✅ Panel de telemetría con métricas IoT
- ✅ Sistema de alertas de incidentes
- ✅ Indicador de conexión en vivo
- ✅ Diseño responsive y moderno
- ✅ Persistencia de datos en localStorage
- ✅ WebSocket para actualizaciones en tiempo real

## 🏗️ Arquitectura

El dashboard está organizado en una estructura modular completamente separada:

```
frontend/src/dashboard/
├── components/              # Componentes React
│   ├── DashboardLayout.jsx  # Contenedor principal
│   ├── Sidebar.jsx          # Menú lateral
│   ├── Navbar.jsx           # Barra superior
│   ├── MapContainer.jsx     # Mapa interactivo
│   ├── TelemetryPanel.jsx   # Tarjetas de telemetría
│   ├── IncidentsPanel.jsx   # Panel de incidentes
│   ├── LoginScreen.jsx      # Pantalla de login
│   └── Footer.jsx           # Pie de página
├── services/                # Servicios de datos
│   ├── apiService.js        # Consumidor de APIs REST
│   ├── socketService.js     # Gestor de WebSockets
│   └── storageService.js    # Persistencia en localStorage
├── hooks/                   # Hooks personalizados
│   ├── useAuth.js           # Autenticación
│   ├── useEnvios.js         # Datos de envíos
│   ├── useTelemetry.js      # Telemetría en tiempo real
│   └── useIncidents.js      # Gestión de incidentes
├── styles/                  # Estilos CSS
│   ├── dashboard.css        # Estilos principales
│   ├── sidebar.css          # Sidebar
│   ├── navbar.css           # Navbar
│   ├── map.css              # Mapa
│   ├── telemetry.css        # Telemetría e incidentes
│   └── login.css            # Login
└── DashboardApp.jsx         # Componente raíz
```

## 🚀 Cómo Usar

### Opción 1: Como Ruta Alternativa (Recomendado)

1. **Usar el dashboard como punto de entrada alternativo:**

```bash
# Editar frontend/src/main.jsx
```

Cambia el import de:
```jsx
import App from './App.jsx'
```

A:
```jsx
import DashboardApp from './dashboard/DashboardApp.jsx'
```

2. **Iniciar el servidor:**
```bash
npm run dev
```

### Opción 2: Integrar como Nueva Ruta (Requiere Modificar App.jsx)

Si deseas mantener ambas aplicaciones en paralelo, necesitarías un enrutador (como React Router). Por ahora, el dashboard es una aplicación completamente independiente.

## 📱 Componentes Principales

### DashboardLayout
- Contenedor principal con estructura flex
- Manage de sidebar y navbar
- Renderizado condicional de vistas
- Responsive para móviles

### Sidebar
- Menú lateral colapsable
- 5 opciones de navegación: Dashboard, Monitoreo, Incidentes, Historial, Configuración
- Indicador de estado de conexión
- Animaciones suaves

### Navbar
- Indicador LIVE en tiempo real
- Estado de conexión al backend
- Dropdown de usuario con logout
- Notificaciones (placeholder)

### MapContainer
- Mapa canvas interactivo
- Dibuja rutas de envíos simuladas
- Controles de zoom
- Información popup del envío seleccionado
- Integración con telemetría en vivo

### TelemetryPanel
- Grid de tarjetas de envíos
- Muestra: temperatura, humedad, velocidad, ubicación
- Indicadores de estado con colores
- Datos obtenidos en tiempo real desde WebSocket
- Responsive grid

### IncidentsPanel
- Listado cronológico de incidentes
- Filtro por severidad (crítico, advertencia, informativo)
- Estadísticas agregadas
- Limpieza de historial

### LoginScreen
- Formulario seguro de autenticación
- Pre-cargado con credenciales de demo
- Manejo de errores
- Animaciones decorativas

## 🔌 Servicios de Datos

### apiService
Consumidor centralizado de APIs REST del backend:
```javascript
import apiService from './services/apiService.js'

// Login
await apiService.login(correo, contrasena)

// Envíos
await apiService.getEnvios()
await apiService.getEnvioById(id)

// Telemetría
await apiService.getTelemetria()
await apiService.getUltimaTelemetria(vehiculoId)

// Incidentes
await apiService.getIncidentes()
await apiService.getIncidentesByVehiculo(vehiculoId)

// Rutas
await apiService.getRutas()
```

### socketService
Gestor de WebSocket para tiempo real:
```javascript
import socketService from './services/socketService.js'

// Conectar
socketService.connect(token)

// Suscribirse a eventos
socketService.onTelemetryUpdate((data) => {
  console.log('Nueva telemetría:', data)
})

socketService.onIncidentNew((incident) => {
  console.log('Nuevo incidente:', incident)
})

socketService.onSimulatorPosition((position) => {
  console.log('Nueva posición:', position)
})
```

### storageService
Persistencia de datos en localStorage:
```javascript
import storageService from './services/storageService.js'

// Rutas
storageService.setCurrentRoute(envioId, route)
storageService.getCurrentRoute(envioId)

// Incidentes
storageService.addIncident(incident)
storageService.getIncidents()

// Preferencias
storageService.setPreferences({...})
```

## 🎨 Diseño Visual

### Paleta de Colores
- **Primario:** #3b82f6 (Azul)
- **Success:** #10b981 (Verde)
- **Warning:** #f59e0b (Naranja)
- **Danger:** #ef4444 (Rojo)
- **Gray:** #e5e7eb / #6b7280

### Estados de Envíos
- 🟢 **Normal:** Verde - Operativo estable
- 🟠 **Advertencia:** Naranja - Condiciones fuera de rango
- 🔴 **Crítico:** Rojo - Alerta urgente
- ⚪ **Sin conexión:** Gris - Falta de datos

### Estilos
- Border radius: 8px
- Sombras suaves: `box-shadow: 0 4px 6px rgba(0,0,0,0.1)`
- Transiciones: `transition: all 0.3s ease`
- Responsive: Mobile-first design

## 🔐 Autenticación

El dashboard usa el mismo sistema de autenticación que el backend:

**Credenciales de prueba:**
- Email: `admin@local.test`
- Contraseña: `admin123`

Los tokens JWT se almacenan en localStorage y se envían en todas las peticiones:
```
Authorization: Bearer <token>
```

## ⚡ Tiempo Real

El dashboard se conecta automáticamente al WebSocket del backend:

```javascript
const SOCKET_URL = "http://localhost:5000"

// Eventos disponibles:
- telemetria:nueva
- telemetria:actualización
- incidente:nuevo
- incidente:resuelto
- envio:estado
- envio:completado
- simulator:posicion
- simulator:evento
- simulator:estado
```

## 💾 Persistencia

Los datos se persisten automáticamente en localStorage:
- Última ruta visualizada
- Posiciones actuales de vehículos
- Historial de incidentes (últimos 100)
- Preferencias de usuario
- Estado del sidebar

## 📱 Responsive Design

- **Desktop (1024px+):** Layout completo con sidebar y todas las columnas
- **Tablet (768px-1024px):** Sidebar colapsable, ajustes de grid
- **Mobile (480px-768px):** Sidebar hamburguesa, single column
- **Mobile Small (<480px):** Interfaz optimizada para pantallas pequeñas

## 🚀 Integración con Backend Existente

El dashboard se conecta a las APIs y WebSocket existentes:

**APIs utilizadas:**
- `/api/auth/login`
- `/api/envios`
- `/api/vehiculos`
- `/api/registrosTelemetria`
- `/api/incidentes`
- `/api/rutas`
- `/api/simulador/health`

**WebSocket events:**
- Telemetría en vivo
- Incidentes
- Posición del simulador

**NO se modifica:**
- Backend existente
- Simulador IoT
- Otras rutas del frontend
- Dependencias del proyecto

## 🔧 Desarrollo

### Agregar un nuevo componente

1. Crear archivo en `components/`
2. Implementar componente React
3. Importar estilos necesarios
4. Exportar en `DashboardLayout.jsx`

### Agregar nuevo servicio

1. Crear archivo en `services/`
2. Exportar instancia singleton
3. Usar en hooks

### Agregar nuevo hook

1. Crear archivo en `hooks/`
2. Usar servicios internamente
3. Retornar estado y métodos
4. Usar en componentes

## 📝 Variables de Entorno

El dashboard usa las mismas variables que el frontend:

```
VITE_API_BASE=http://localhost:5000/api
VITE_SIMULATOR_EXTERNAL_URL=http://localhost:3001/api/simulator/health
```

## 🐛 Troubleshooting

### El dashboard no se conecta al backend
- Verificar que el backend esté corriendo en `http://localhost:5001`
- Revisar la consola del navegador para errores
- Confirmar que `CORS_ORIGINS` incluya `http://localhost:5173`

### Sin datos de telemetría
- Verificar que el simulador esté activo
- Confirmar que hay envíos en la base de datos
- Revisar conexión WebSocket en DevTools

### Estilos no se aplican
- Verificar que los imports CSS están correctos
- Limpiar caché del navegador
- Revisar ruta de los archivos CSS

## 📚 Recursos Adicionales

- Documentación de Backend: `backend/README_ROUTES.md`
- Documentación del Simulador: `simulator/README_SIMULATOR.md`
- Manual de Usuario: `Manual.txt`

---

**Nota:** Este módulo fue construido como completamente independiente del código existente. Para alternar entre el dashboard y la aplicación original, solo necesitas cambiar el import en `main.jsx`.
