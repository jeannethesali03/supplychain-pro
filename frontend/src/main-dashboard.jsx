/**
 * Dashboard Entry Point - main-dashboard.jsx
 * Punto de entrada alternativo para usar el nuevo Dashboard Logístico
 * 
 * Uso:
 * Para usar este dashboard en lugar del App.jsx actual, cambia en main.jsx:
 * - import App from './App.jsx'
 * + import App from './dashboard/DashboardApp.jsx'
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import DashboardApp from './dashboard/DashboardApp.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DashboardApp />
  </React.StrictMode>,
)
