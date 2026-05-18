/**
 * IncidentsPanel - Panel de incidentes
 */

import { useState } from "react";
import { useIncidents } from "../hooks/useIncidents.js";

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
    <div className="incident-line" style={{ borderLeft: `4px solid ${severityColor}`, background: "#faf6f1" }}>
      <div className="incident-head">
        <span className="incident-type" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem" }}>
          <span>{severityIcon}</span>
          {typeLabel}
        </span>
        <span className="incident-meta" style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
          {`${incidentDate} a las ${incidentTime}`}
        </span>
      </div>
      <div className="incident-desc">
        <div className="meta-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginTop: "12px", background: "transparent", border: "none", padding: 0 }}>
          <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.6)" }}>
            <span>Severidad</span>
            <strong style={{ color: severityColor }}>{incident.severidad || "Media"}</strong>
          </div>
          {incident.id_vehiculo && (
            <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.6)" }}>
              <span>Vehículo</span>
              <strong>#{incident.id_vehiculo}</strong>
            </div>
          )}
          {incident.id_envio && (
            <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.6)" }}>
              <span>Envío</span>
              <strong>#{incident.id_envio}</strong>
            </div>
          )}
          {incident.descripcion && (
            <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.6)", gridColumn: "1 / -1" }}>
              <span>Descripción</span>
              <strong>{incident.descripcion}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IncidentsPanel({ vehiculoId = null }) {
  const {
    incidents,
    loading,
    error,
    getSeverityColor,
    getSeverityIcon,
    getIncidentTypeLabel,
  } = useIncidents(vehiculoId);

  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const filteredIncidents = incidents.filter((inc) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (inc.descripcion || "").toLowerCase().includes(searchLower) ||
      (inc.tipo || "").toLowerCase().includes(searchLower) ||
      String(inc.id_envio || "").includes(searchLower);
      
    const matchesSeverity = severityFilter === "all" || inc.severidad === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="panel-card">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", gap: "16px" }}>
        <div>
          <h2 className="card-title" style={{ fontSize: "1.5rem", marginBottom: "4px" }}>Panel de Incidentes</h2>
          <p className="muted">Monitoreo y registro de eventos críticos</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span className="status-pill">{filteredIncidents.length} incidente{filteredIncidents.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input 
          type="text" 
          placeholder="Buscar por descripción, tipo o envío..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: "1 1 200px", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}
        />
        <select 
          value={severityFilter} 
          onChange={(e) => setSeverityFilter(e.target.value)}
          style={{ padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0", backgroundColor: "#fff" }}
        >
          <option value="all">Todas las severidades</option>
          <option value="critico">Crítico</option>
          <option value="advertencia">Advertencia</option>
          <option value="informativo">Informativo</option>
        </select>
      </div>

      {error && (
        <div className="alert error">
          <p>Error cargando incidentes: {error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }} className="muted">Cargando incidentes...</div>
      ) : filteredIncidents.length === 0 ? (
        <div className="info-banner" style={{ textAlign: "center", padding: "40px", background: "#e9f7ec", borderColor: "#bfe7cb", color: "#1d5b35" }}>
          <div style={{ fontSize: "1.2rem", marginBottom: "8px", fontWeight: "bold" }}>✓ No hay incidentes que mostrar</div>
          <div>Intenta cambiar los filtros de búsqueda o severidad.</div>
        </div>
      ) : (
        <div className="incidents-list-card">
          <div style={{ display: "grid", gap: "12px" }}>
            {filteredIncidents.map((incident, index) => (
              <IncidentItem
                key={incident.id_incidente || index}
                incident={incident}
                severityIcon={getSeverityIcon(incident.severidad)}
                severityColor={getSeverityColor(incident.severidad)}
                typeLabel={getIncidentTypeLabel(incident.tipo)}
              />
            ))}
          </div>
        </div>
      )}

      {incidents.length > 0 && (
        <div className="meta-grid" style={{ marginTop: "24px", gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div style={{ background: "#ffe8e6", borderColor: "#f5b3ac", textAlign: "center" }}>
            <span style={{ color: "#7d2c22" }}>Críticos</span>
            <strong style={{ color: "#7d2c22", fontSize: "1.2rem" }}>
              {incidents.filter((i) => i.severidad === "critico").length}
            </strong>
          </div>
          <div style={{ background: "#fff4d7", borderColor: "#f6d6a6", textAlign: "center" }}>
            <span style={{ color: "#8a5a2d" }}>Advertencias</span>
            <strong style={{ color: "#8a5a2d", fontSize: "1.2rem" }}>
              {incidents.filter((i) => i.severidad === "advertencia").length}
            </strong>
          </div>
          <div style={{ background: "#e0f2fe", borderColor: "#bae6fd", textAlign: "center" }}>
            <span style={{ color: "#0369a1" }}>Informativos</span>
            <strong style={{ color: "#0369a1", fontSize: "1.2rem" }}>
              {incidents.filter((i) => i.severidad === "informativo").length}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
