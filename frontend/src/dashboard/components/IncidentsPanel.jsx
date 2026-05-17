/**
 * IncidentsPanel - Panel de incidentes
 */

import { useCallback } from "react";
import { useIncidents } from "../hooks/useIncidents.js";
import "../styles/telemetry.css";

function IncidentItem({
  incident,
  severityIcon,
  severityColor,
  typeLabel,
}) {
  const incidentTime = new Date(incident.timestamp || incident.fecha).toLocaleTimeString(
    "es-ES"
  );
  const incidentDate = new Date(incident.timestamp || incident.fecha).toLocaleDateString(
    "es-ES"
  );

  return (
    <div className="incident-item" style={{ borderLeftColor: severityColor }}>
      <div className="incident-header">
        <span className="incident-icon">{severityIcon}</span>
        <div className="incident-info">
          <h4 className="incident-type">{typeLabel}</h4>
          <p className="incident-time">{`${incidentDate} a las ${incidentTime}`}</p>
        </div>
      </div>

      <div className="incident-details">
        <div className="detail-item">
          <span className="detail-label">Severidad:</span>
          <span
            className="detail-value"
            style={{
              color: severityColor,
              fontWeight: "bold",
            }}
          >
            {incident.severidad || "Media"}
          </span>
        </div>
        {incident.id_vehiculo && (
          <div className="detail-item">
            <span className="detail-label">Vehículo:</span>
            <span className="detail-value">#{incident.id_vehiculo}</span>
          </div>
        )}
        {incident.descripcion && (
          <div className="detail-item">
            <span className="detail-label">Descripción:</span>
            <span className="detail-value">{incident.descripcion}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IncidentsPanel({ vehiculoId = null }) {
  const {
    incidents,
    loading,
    error,
    clearIncidents,
    getSeverityColor,
    getSeverityIcon,
    getIncidentTypeLabel,
  } = useIncidents(vehiculoId);

  const handleClearIncidents = useCallback(() => {
    if (window.confirm("¿Estás seguro de que deseas limpiar el historial de incidentes?")) {
      clearIncidents();
    }
  }, [clearIncidents]);

  return (
    <div className="incidents-panel">
      <div className="panel-header">
        <h2>Panel de Incidentes</h2>
        <div className="panel-actions">
          <span className="incidents-count">
            {incidents.length} incidente{incidents.length !== 1 ? "s" : ""}
          </span>
          {incidents.length > 0 && (
            <button
              className="clear-btn"
              onClick={handleClearIncidents}
              title="Limpiar historial"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>Error cargando incidentes: {error}</p>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Cargando incidentes...</div>
      ) : incidents.length === 0 ? (
        <div className="empty-state">
          <p>✓ No hay incidentes reportados</p>
          <p style={{ fontSize: "0.9rem", color: "#10b981" }}>
            Todas las operaciones funcionando correctamente
          </p>
        </div>
      ) : (
        <div className="incidents-list">
          {incidents.map((incident, index) => (
            <IncidentItem
              key={incident.id_incidente || index}
              incident={incident}
              severityIcon={getSeverityIcon(incident.severidad)}
              severityColor={getSeverityColor(incident.severidad)}
              typeLabel={getIncidentTypeLabel(incident.tipo)}
            />
          ))}
        </div>
      )}

      {incidents.length > 0 && (
        <div className="incidents-stats">
          <div className="stat">
            <span className="stat-label">Críticos:</span>
            <span className="stat-value" style={{ color: "#ef4444" }}>
              {incidents.filter((i) => i.severidad === "critico").length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Advertencias:</span>
            <span className="stat-value" style={{ color: "#f59e0b" }}>
              {incidents.filter((i) => i.severidad === "advertencia").length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Informativos:</span>
            <span className="stat-value" style={{ color: "#3b82f6" }}>
              {incidents.filter((i) => i.severidad === "informativo").length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
