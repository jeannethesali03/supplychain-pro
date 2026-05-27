import { useEffect } from "react";
import { useTelemetry } from "../hooks/useTelemetry.js";
import { useIncidents } from "../hooks/useIncidents.js";
import { formatShipmentId, getIncidentTypeLabel } from "../utils/formatters.js";
import "../styles/telemetry.css";

const TelemetryPanel = ({ selectedEnvio, selectedIncident, rupturas = [], onViewIncidents }) => {
  const { telemetry } = useTelemetry(selectedEnvio?.id_envio);
  const { incidents } = useIncidents(selectedEnvio?.id_envio);

  // Efecto para hacer scroll vertical suave hasta el incidente seleccionado en la lista
  useEffect(() => {
    if (selectedIncident?.id_incidente) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`telemetry-incident-${selectedIncident.id_incidente}`);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedIncident]);
  if (!selectedEnvio) {
    return (
      <div className="telemetry-panel-placeholder">
        <p>Seleccione un envío para ver los detalles de telemetría.</p>
      </div>
    );
  }

  

  const {
    id_envio,
    codigo_rastreo,
    origen,
    destino,
    incidencia,
  } = selectedEnvio;

  const panelClass = incidencia ? "telemetry-card alert" : "telemetry-card";

  // Mostrar todos los incidentes
  const allIncidents = incidents || [];
  const latestRuptura = rupturas && rupturas.length > 0
    ? rupturas.reduce((latest, current) => {
        const latestTs = Date.parse(latest.timestamp || latest.fecha_creacion || latest.created_at || latest.fecha || "");
        const currentTs = Date.parse(current.timestamp || current.fecha_creacion || current.created_at || current.fecha || "");

        if (Number.isNaN(latestTs) && Number.isNaN(currentTs)) return current;
        if (Number.isNaN(latestTs)) return current;
        if (Number.isNaN(currentTs)) return latest;
        return currentTs >= latestTs ? current : latest;
      }, rupturas[0])
    : null;

  const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };

  const telemetryTemp = toNumber(telemetry?.temperatura);
  const rupturaTemp = toNumber(latestRuptura?.temperatura ?? latestRuptura?.valor_registrado);
  const temperatureValue = telemetryTemp ?? rupturaTemp;
  const temperatureText = temperatureValue !== null ? temperatureValue.toFixed(1) : "N/A";
  const shipmentId = formatShipmentId(id_envio);

  return (
    <div className="telemetry-panel">
      <div className={panelClass}>
        <div className="card-header">
          <div style={{ marginBottom: "8px" }}>
            <h3 style={{ margin: "0 0 4px 0" }}>{codigo_rastreo || `Envío #${id_envio}`}</h3>
           
          </div>
          <p style={{ margin: "6px 0 0 0", color: "#64748b", fontSize: "0.8rem" }}>
            {origen && destino ? `${origen} → ${destino}` : "Ruta no disponible"}
          </p>
          <button className="options-button">...</button>
        </div>
        <div className="card-body">
          <div className="telemetry-item">
            <span className="icon">🌡️</span>
            <p>{temperatureText} °C</p>
            <span>Temperatura</span>
          </div>
          <div className="telemetry-item">
            <span className="icon">💧</span>
            <p>{telemetry?.humedad ?? "N/A"} %</p>
            <span>Humedad</span>
          </div>
          <div className="telemetry-item">
            <span className="icon">🔋</span>
            <p>{telemetry?.porcentaje_bateria ?? "N/A"} %</p>
            <span>Batería</span>
          </div>
        </div>
        {incidencia && (
          <div className="card-footer">
            <p>ALERTA: {incidencia.descripcion}</p>
          </div>
        )}
        
        {/* Mostrar contadores de rupturas */}
        {rupturas && rupturas.length > 0 && (
          <div className="card-footer" style={{ marginTop: incidencia ? "0" : "10px", background: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5" }}>
            <p style={{ margin: 0, fontWeight: 500 }}>
              <strong>⚠️ Historial:</strong> Se detectaron {rupturas.length} rupturas de temperatura en la ruta.
            </p>
          </div>
        )}

        {/* Mostrar lista detallada de todos los incidentes registrados */}
        {allIncidents.length > 0 && (
          <div className="card-footer incidents-list" style={{ marginTop: "10px", background: "#fff5f5", borderColor: "#fca5a5", padding: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ margin: 0, color: "#dc2626", fontSize: "0.85rem", fontWeight: 700 }}>
                ⚠️ Detalles de Incidentes ({allIncidents.length}):
              </h4>
              {onViewIncidents && (
                <button
                  onClick={() => onViewIncidents(allIncidents[0])}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "background 0.2s ease"
                  }}
                  onMouseEnter={(e) => e.target.style.background = "#b91c1c"}
                  onMouseLeave={(e) => e.target.style.background = "#dc2626"}
                >
                  📋 Ver Panel Completo →
                </button>
              )}
            </div>
            <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
              {allIncidents.map((inc, idx) => {
                const isSelected = selectedIncident?.id_incidente && inc.id_incidente === selectedIncident.id_incidente;
                const tipoUpper = (inc.tipo_incidente || inc.tipo || "").toString().toUpperCase();
                let label = getIncidentTypeLabel(inc.tipo_incidente);
                let colorClass = "#7f1d1d";
                let valText = null;

                if (tipoUpper === "RUPTURA_CADENA_FRIO" || tipoUpper === "TEMPERATURA_CRITICA") {
                  label = "🌡️ Ruptura de Frío";
                  valText = `Reg: ${inc.valor_registrado}°C (Límite: ${inc.valor_limite}°C)`;
                } else if (tipoUpper === "BATERIA_BAJA") {
                  label = "🔋 Batería Baja";
                  valText = `Reg: ${inc.valor_registrado}% (Límite: 10%)`;
                  colorClass = "#b45309";
                } else if (tipoUpper === "OUT_OF_BOUNDS" || tipoUpper === "GEOFENCE_VIOLATION" || tipoUpper === "VIOLACION_GEOFENCE") {
                  label = "🗺️ Desvío de Ruta";
                  colorClass = "#4338ca";
                  valText = "Vehículo fuera del geofence";
                } else if (tipoUpper === "STORAGE_FULL" || tipoUpper === "VOLUMEN_LLENO") {
                  label = "💾 Almacenamiento Lleno";
                  colorClass = "#b91c1c";
                  valText = "Almacenamiento al 100%";
                }

                return (
                  <div
                    key={idx}
                    id={`telemetry-incident-${inc.id_incidente}`}
                    onClick={() => onViewIncidents && onViewIncidents(inc)}
                    className="telemetry-incident-card-item"
                    style={{
                      background: isSelected ? "rgba(254, 226, 226, 0.95)" : "#fff",
                      padding: "8px",
                      borderRadius: "6px",
                      border: isSelected ? "2px solid #dc2626" : "1px solid #fecaca",
                      fontSize: "0.75rem",
                      boxShadow: isSelected ? "0 0 8px rgba(220, 38, 38, 0.2)" : "0 1px 2px rgba(0,0,0,0.05)",
                      cursor: onViewIncidents ? "pointer" : "default"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", alignItems: "center" }}>
                      <strong style={{ color: colorClass }}>
                        ⚠️ {label}
                      </strong>
                      <span style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 600 }}>
                        {inc.fecha_incidente || inc.marca_tiempo_dispositivo ? new Date(inc.fecha_incidente || inc.marca_tiempo_dispositivo).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                      </span>
                    </div>
                    {valText && (
                      <p style={{ margin: "0 0 4px 0", color: "#475569", fontWeight: "600" }}>
                        {valText}
                      </p>
                    )}
                    <p style={{ margin: "0", color: "#64748b", fontSize: "0.7rem", lineHeight: "1.3" }}>
                      {inc.descripcion || "Incidente registrado durante el trayecto"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TelemetryPanel;
