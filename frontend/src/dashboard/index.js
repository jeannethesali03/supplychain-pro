/**
 * Índice Centralizado de Exportaciones del Dashboard
 * Facilita imports de servicios, hooks y componentes
 */

// ===== Servicios =====
export { default as apiService } from './services/apiService'
export { default as socketService } from './services/socketService'
export { default as storageService } from './services/storageService'

// ===== Hooks =====
export { useAuth } from './hooks/useAuth'
export { useEnvios } from './hooks/useEnvios'
export { useTelemetry } from './hooks/useTelemetry'
export { useIncidents } from './hooks/useIncidents'

// ===== Componentes =====
export { default as DashboardLayout } from './components/DashboardLayout'
export { default as DashboardApp } from './DashboardApp'
export { default as Sidebar } from './components/Sidebar'
export { default as Navbar } from './components/Navbar'
export { default as MapContainer } from './components/MapContainer'
export { default as TelemetryPanel } from './components/TelemetryPanel'
export { default as IncidentsPanel } from './components/IncidentsPanel'
export { default as LoginScreen } from './components/LoginScreen'
export { default as Footer } from './components/Footer'

// Uso de ejemplo:
// import { useAuth, apiService, DashboardApp } from './dashboard'
