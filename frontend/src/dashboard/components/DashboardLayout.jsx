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
import EstadísticasView from "./ConfiguracionView";
import Footer from "./Footer";
import TelemetryPanel from "./TelemetryPanel";
import apiService from "../services/apiService";
import { useEnvios } from "../hooks/useEnvios.js";
import { useIncidents } from "../hooks/useIncidents.js";
import { useTheme } from "../hooks/useTheme.js";

export default function DashboardLayout({ user, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [rupturas, setRupturas] = useState([]);
  const [mapHighlight, setMapHighlight] = useState(null);
  const { envios } = useEnvios();
  const { incidents } = useIncidents();
  const themeContext = useTheme();

  const currentSelectedEnvio = selectedEnvio
    ? envios.find((e) => String(e.id_envio) === String(selectedEnvio.id_envio)) || selectedEnvio
    : null;

  const handleSelectEnvio = useCallback((envio) => {
    setSelectedEnvio(envio);
    if (selectedIncident && String(selectedIncident.id_envio) !== String(envio?.id_envio)) {
      setSelectedIncident(null);
    }
  }, [selectedIncident]);

  const handleSelectIncident = useCallback((incident) => {
    const incidentEnvio = envios.find((e) => String(e.id_envio) === String(incident.id_envio));
    if (incidentEnvio) {
      setSelectedEnvio(incidentEnvio);
    }
    setSelectedIncident(incident);
    setActiveView("dashboard");
  }, [envios]);

  const handleNavigateToMap = (data) => {
    if (!data) return;
    if (data.type === "incident" && data.incident) {
      handleSelectIncident(data.incident);
    } else if (data.type === "vehiculo") {
      // Buscar el primer incidente de este vehículo
      const matchingIncident = incidents.find(
        (inc) => String(inc.id_vehiculo) === String(data.data?.id_vehiculo || data.id_vehiculo)
      );
      if (matchingIncident) {
        handleSelectIncident(matchingIncident);
      } else {
        const matchingEnvio = envios.find(
          (e) => String(e.id_vehiculo) === String(data.data?.id_vehiculo || data.id_vehiculo)
        );
        if (matchingEnvio) {
          handleSelectEnvio(matchingEnvio);
          setActiveView("dashboard");
        } else {
          setActiveView("dashboard");
        }
      }
    } else if (data.type === "ruta") {
      // Buscar el primer incidente de esta ruta
      const routeName = data.data?.ruta || data.ruta;
      const matchingIncident = incidents.find(
        (inc) => String(inc.nombre_ruta || inc.ruta) === String(routeName)
      );
      if (matchingIncident) {
        handleSelectIncident(matchingIncident);
      } else {
        const matchingEnvio = envios.find(
          (e) => String(e.nombre_ruta || e.ruta) === String(routeName)
        );
        if (matchingEnvio) {
          handleSelectEnvio(matchingEnvio);
          setActiveView("dashboard");
        } else {
          setActiveView("dashboard");
        }
      }
    } else {
      setMapHighlight(data);
      setActiveView("dashboard");
    }
  };

  // Función para navegar al panel de incidentes
  const navigateToIncidentsPanel = (incident) => {
    if (incident) {
      setSelectedIncident(incident);
    }
    setActiveView("incidentes");
  };

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
              selectedIncident={selectedIncident}
              incidents={incidents}
              onSelectEnvio={handleSelectEnvio}
              onSelectIncident={handleSelectIncident}
              rupturas={rupturas}
              envios={envios}
            />
            <TelemetryPanel
              selectedEnvio={currentSelectedEnvio}
              selectedIncident={selectedIncident}
              rupturas={rupturas}
              onViewIncidents={navigateToIncidentsPanel}
            />
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
            <IncidentesView
              onShowIncident={handleSelectIncident}
              selectedIncident={selectedIncident}
            />
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
            <EstadísticasView
              themeContext={themeContext}
              onNavigateToMap={handleNavigateToMap}
            />
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
