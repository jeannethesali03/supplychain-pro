/**
 * DashboardLayout - Contenedor principal del dashboard
 * Estructura: Sidebar | Navbar + Main Content + Footer
 * Professional SaaS Design
 */

import { useCallback, useState } from "react";
import "../styles/dashboard.css";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MapContainer from "./MapContainer";
import IncidentsPanel from "./IncidentsPanel";
import Footer from "./Footer";

export default function DashboardLayout({ user, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedEnvio, setSelectedEnvio] = useState(null);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const renderMainContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="dashboard-main">
            <MapContainer
              selectedEnvio={selectedEnvio}
              onSelectEnvio={setSelectedEnvio}
            />
          </div>
        );

      case "monitoreo":
        return (
          <div className="dashboard-main">
            <div className="monitoreo-container">
              <h2>Monitoreo en Tiempo Real</h2>
              <p style={{ color: "var(--color-text-tertiary)", marginTop: "var(--spacing-lg)" }}>
                Vista de monitoreo - En construcción
              </p>
            </div>
          </div>
        );

      case "incidentes":
        return (
          <div className="dashboard-main">
            <IncidentsPanel />
          </div>
        );

      case "historial":
        return (
          <div className="dashboard-main">
            <div className="historial-container">
              <h2>Historial de Envíos</h2>
              <p style={{ color: "var(--color-text-tertiary)", marginTop: "var(--spacing-lg)" }}>
                Vista de historial - En construcción
              </p>
            </div>
          </div>
        );

      case "configuracion":
        return (
          <div className="dashboard-main">
            <div className="config-container">
              <h2>Configuración</h2>
              <p style={{ color: "var(--color-text-tertiary)", marginTop: "var(--spacing-lg)" }}>
                Panel de configuración - En construcción
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <div className="dashboard-content">
        <Navbar
          user={user}
          onLogout={onLogout}
          onToggleSidebar={toggleSidebar}
          currentView={activeView}
        />

        <main className="dashboard-main-wrapper">{renderMainContent()}</main>

        <Footer />
      </div>
    </div>
  );
}
