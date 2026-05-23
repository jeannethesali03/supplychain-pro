/**
 * DashboardLayout - Contenedor principal del dashboard
 * Estructura: Sidebar | Navbar + Main Content + Footer
 * Professional SaaS Design
 */

import { useCallback, useState, useEffect } from "react";
import "../styles/dashboard.css";
import "../styles/telemetry.css";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MapContainer from "./MapContainer";
import IncidentesView from "./IncidentesView";
import MonitoreoView from "./MonitoreoView";
import HistorialView from "./HistorialView";
import ConfiguracionView from "./ConfiguracionView";
import Footer from "./Footer";
import TelemetryPanel from "./TelemetryPanel";
import apiService from "../services/apiService";
import { useEnvios } from "../hooks/useEnvios.js";

export default function DashboardLayout({ user, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [rupturas, setRupturas] = useState([]);
  const { envios } = useEnvios();

  const currentSelectedEnvio = selectedEnvio
    ? envios.find((e) => String(e.id_envio) === String(selectedEnvio.id_envio)) || selectedEnvio
    : null;

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    async function fetchRupturas() {
      if (!currentSelectedEnvio) {
        setRupturas([]);
        return;
      }
      try {
        const res = await apiService.getTelemetriaByEnvio(currentSelectedEnvio.id_envio);
        if (res.success && res.data) {
          const tempMax = Number(currentSelectedEnvio.temp_max_permitida ?? 15);
          const tempMin = Number(currentSelectedEnvio.temp_min_permitida ?? -5);
          const breaches = res.data.filter((t) => {
            const temp = Number(t.temperatura);
            return !Number.isNaN(temp) && (temp > tempMax || temp < tempMin);
          });
          setRupturas(breaches);
        } else {
          setRupturas([]);
        }
      } catch (err) {
        console.error("Error al obtener rupturas:", err);
        setRupturas([]);
      }
    }
    fetchRupturas();
  }, [currentSelectedEnvio]);

  const renderMainContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="dashboard-main">
            <MapContainer
              selectedEnvio={currentSelectedEnvio}
              onSelectEnvio={setSelectedEnvio}
              rupturas={rupturas}
              envios={envios}
            />
            <TelemetryPanel selectedEnvio={currentSelectedEnvio} rupturas={rupturas} />
          </div>
        );

      case "monitoreo":
        return (
          <div className="dashboard-main">
            <MonitoreoView />
          </div>
        );

      case "incidentes":
        return (
          <div className="dashboard-main">
            <IncidentesView />
          </div>
        );

      case "historial":
        return (
          <div className="dashboard-main">
            <HistorialView />
          </div>
        );

      case "configuracion":
        return (
          <div className="dashboard-main">
            <ConfiguracionView />
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
