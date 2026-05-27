/**
 * IncidentsPanel - Panel de incidentes
 */

import { useState, useEffect } from "react";
import { useIncidents } from "../hooks/useIncidents.js";
import { 
  formatShipmentId, 
  getIncidentTypeColor, 
  getIncidentTypeLabel, 
  getIncidentExplanation 
} from "../utils/formatters.js";

function IncidentDetailItem({
  incident,
  severityIcon,
  severityColor,
  typeLabel,
  onShowIncident,
  isSelected,
}) {
  const incidentTime = new Date(incident.fecha_incidente || incident.marca_tiempo_dispositivo).toLocaleTimeString(
    "es-ES",
    { hour: "2-digit", minute: "2-digit", second: "2-digit" }
  );
  const incidentDate = new Date(incident.fecha_incidente || incident.marca_tiempo_dispositivo).toLocaleDateString(
    "es-ES",
    { month: "short", day: "numeric" }
  );

  const severityTranslation = {
    "critico": "🔴 Crítico",
    "advertencia": "🟡 Advertencia",
    "informativo": "🔵 Informativo",
  };

  const explanation = getIncidentExplanation(incident);
  const shipmentId = formatShipmentId(incident.id_envio);
  const typeColor = getIncidentTypeColor(incident.tipo_incidente);
  const isLocationAvailable = incident.latitud && incident.longitud;

  return (
    <div
      id={incident.id_incidente ? `incident-card-${incident.id_incidente}` : undefined}
      style={{ 
        borderLeft: `5px solid ${typeColor}`, 
        background: isSelected ? "rgba(254, 226, 226, 0.95)" : "var(--color-bg-secondary)",
        padding: "16px",
        borderRadius: "10px",
        marginBottom: "16px",
        boxShadow: isSelected ? "0 0 0 2px rgba(239, 68, 68, 0.2)" : "none"
      }}
    >
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px" }}>
            <span>{severityIcon}</span>
            <span>{typeLabel}</span>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
            📅 {incidentDate} a las {incidentTime}
          </div>
        </div>
        <div style={{
          padding: "6px 12px",
          background: severityColor + "20",
          color: severityColor,
          borderRadius: "6px",
          fontWeight: 600,
          fontSize: "0.85rem",
          whiteSpace: "nowrap"
        }}>
          {severityTranslation[incident.severidad] || incident.severidad}
        </div>
      </div>

      {/* Botón Ver en Mapa */}
      {onShowIncident && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <button
            type="button"
            onClick={() => onShowIncident(incident)}
            disabled={!isLocationAvailable}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              background: isLocationAvailable ? "#ef4444" : "#9ca3af",
              color: "white",
              cursor: isLocationAvailable ? "pointer" : "not-allowed",
              fontWeight: 700,
              transition: "transform 0.15s ease",
            }}
          >
            {isLocationAvailable ? "📍 Ver en Mapa" : "Sin coordenadas"}
          </button>
        </div>
      )}

      {/* Envío */}
      <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
              📦 ID del Envío
            </span>
            <strong style={{ display: "block", marginTop: "6px", fontSize: "1.1rem", color: "var(--color-primary)" }}>
              {shipmentId}
            </strong>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)", display: "block", marginTop: "4px" }}>
              (#{incident.id_envio})
            </span>
          </div>
          <div style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
              🚚 Vehículo
            </span>
            <strong style={{ display: "block", marginTop: "6px", fontSize: "1rem" }}>
              {incident.vehiculo_placa
                ? incident.vehiculo_placa
                : incident.id_vehiculo
                ? `#${incident.id_vehiculo}`
                : "No asignado"}
            </strong>
            {incident.vehiculo_placa && incident.id_vehiculo && (
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", display: "block", marginTop: "4px" }}>
                ID interno: #{incident.id_vehiculo}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ruta y ubicación */}
      <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
              🗺️ Origen
            </span>
            <strong style={{ display: "block", marginTop: "6px", fontSize: "0.95rem" }}>
              {incident.origen || "—"}
            </strong>
          </div>
          <div style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
              📍 Destino
            </span>
            <strong style={{ display: "block", marginTop: "6px", fontSize: "0.95rem" }}>
              {incident.destino || "—"}
            </strong>
          </div>
        </div>
      </div>

      {/* Coordenadas del incidente */}
      {incident.latitud && incident.longitud && (
        <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "8px", display: "block" }}>
            📍 Ubicación del Incidente
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
                🧭 Latitud
              </span>
              <strong style={{ display: "block", marginTop: "6px", fontSize: "0.95rem", fontFamily: "monospace" }}>
                {Number(incident.latitud).toFixed(6)}°
              </strong>
            </div>
            <div style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
                🧭 Longitud
              </span>
              <strong style={{ display: "block", marginTop: "6px", fontSize: "0.95rem", fontFamily: "monospace" }}>
                {Number(incident.longitud).toFixed(6)}°
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Datos de telemetría si existen */}
      {(incident.temp_registrada || incident.humedad || incident.porcentaje_bateria) && (
        <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "8px", display: "block" }}>
            📊 Datos de Telemetría al Momento del Incidente
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
            {incident.temp_registrada && (
              <div style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
                  🌡️ Temperatura
                </span>
                <strong style={{ display: "block", marginTop: "6px", fontSize: "1.1rem", color: typeColor }}>
                  {Number(incident.temp_registrada).toFixed(1)}°C
                </strong>
                {incident.valor_limite && (
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)", display: "block", marginTop: "4px" }}>
                    Límite: {incident.valor_limite}°C
                  </span>
                )}
              </div>
            )}
            {incident.humedad && (
              <div style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
                  💧 Humedad
                </span>
                <strong style={{ display: "block", marginTop: "6px", fontSize: "1.1rem" }}>
                  {Number(incident.humedad).toFixed(0)}%
                </strong>
              </div>
            )}
            {incident.porcentaje_bateria && (
              <div style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
                  🔋 Batería
                </span>
                <strong style={{ display: "block", marginTop: "6px", fontSize: "1.1rem" }}>
                  {incident.porcentaje_bateria}%
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explicación del incidente */}
      <div style={{ 
        marginBottom: "12px", 
        padding: "14px", 
        background: "var(--color-bg)", 
        borderRadius: "8px", 
        borderLeft: `3px solid ${typeColor}`
      }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "8px" }}>
          📝 Explicación del Incidente
        </span>
        <div style={{ fontSize: "0.95rem", color: "var(--color-text)", lineHeight: "1.6" }}>
          {explanation}
        </div>
      </div>

      {/* Información adicional */}
      {incident.descripcion && incident.descripcion !== explanation && (
        <div style={{ 
          padding: "12px", 
          background: "var(--color-bg)", 
          borderRadius: "8px", 
          border: "1px solid var(--color-border)",
          fontSize: "0.9rem",
          color: "var(--color-text-secondary)"
        }}>
          <strong style={{ display: "block", marginBottom: "6px" }}>Notas Adicionales:</strong>
          {incident.descripcion}
        </div>
      )}
    </div>
  );
}

export default function IncidentsPanel({ vehiculoId = null, onShowIncident, selectedIncident }) {
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

  useEffect(() => {
    if (selectedIncident?.id_incidente) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`incident-card-${selectedIncident.id_incidente}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedIncident]);

  const filteredIncidents = incidents.filter((inc) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (inc.descripcion || "").toLowerCase().includes(searchLower) ||
      (inc.tipo_incidente || "").toLowerCase().includes(searchLower) ||
      String(inc.id_envio || "").includes(searchLower) ||
      (formatShipmentId(inc.id_envio)).toLowerCase().includes(searchLower);
      
    const matchesSeverity = severityFilter === "all" || inc.severidad === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  // Estadísticas
  const criticalCount = incidents.filter((i) => i.severidad === "critico").length;
  const warningCount = incidents.filter((i) => i.severidad === "advertencia").length;
  const infoCount = incidents.filter((i) => i.severidad === "informativo").length;

  return (
    <div className="panel-card">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", gap: "16px" }}>
        <div>
          <h2 className="card-title" style={{ fontSize: "1.5rem", marginBottom: "4px" }}>⚠️ Panel de Incidentes Detallado</h2>
          <p className="muted">Detalles completos de todos los incidentes: coordenadas, telemetría y análisis</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {criticalCount > 0 && (
            <span style={{ 
              padding: "6px 12px", 
              background: "var(--color-danger-light)", 
              color: "var(--color-danger)", 
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.9rem"
            }}>
              🔴 {criticalCount} Crítico{criticalCount !== 1 ? "s" : ""}
            </span>
          )}
          {warningCount > 0 && (
            <span style={{ 
              padding: "6px 12px", 
              background: "var(--color-warning-light)", 
              color: "var(--color-warning)", 
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.9rem"
            }}>
              🟡 {warningCount} Advertencia{warningCount !== 1 ? "s" : ""}
            </span>
          )}
          {infoCount > 0 && (
            <span style={{ 
              padding: "6px 12px", 
              background: "var(--color-primary-light)", 
              color: "var(--color-primary)", 
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.9rem"
            }}>
              🔵 {infoCount} Informativo{infoCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input 
          type="text" 
          placeholder="🔍 Buscar por ID de envío, tipo o descripción..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: "1 1 300px" }}
        />
        <select 
          value={severityFilter} 
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="all">📊 Todas las severidades</option>
          <option value="critico">🔴 Crítico</option>
          <option value="advertencia">🟡 Advertencia</option>
          <option value="informativo">🔵 Informativo</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ 
          background: "var(--color-danger-light)", 
          border: "1px solid var(--color-danger)", 
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "16px",
          color: "var(--color-danger)"
        }}>
          <p style={{ margin: 0 }}>⚠️ Error cargando incidentes: {error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--color-text-tertiary)" }}>
          ⏳ Cargando detalles de incidentes...
        </div>
      ) : filteredIncidents.length === 0 ? (
        /* Empty State */
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px", 
          background: "var(--color-success-light)", 
          borderRadius: "10px", 
          border: "2px dashed var(--color-success)"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>✅</div>
          <div style={{ fontWeight: 600, marginBottom: "4px", color: "var(--color-success-dark)" }}>No hay incidentes que mostrar</div>
          <div style={{ color: "var(--color-text-tertiary)", fontSize: "0.95rem" }}>Sistema funcionando correctamente - Todos los envíos en buen estado</div>
        </div>
      ) : (
        /* Lista de incidentes */
        <div style={{ maxHeight: "800px", overflowY: "auto", paddingRight: "4px" }}>
          {filteredIncidents.map((incident, index) => (
            <IncidentDetailItem
              key={incident.id_incidente || index}
              incident={incident}
              severityIcon={getSeverityIcon(incident.severidad)}
              severityColor={getSeverityColor(incident.severidad)}
              typeLabel={getIncidentTypeLabel(incident.tipo_incidente)}
              onShowIncident={onShowIncident}
              isSelected={selectedIncident?.id_incidente === incident.id_incidente}
            />
          ))}
        </div>
      )}

      {/* Resumen si hay incidentes */}
      {incidents.length > 0 && filteredIncidents.length > 0 && (
        <div style={{ 
          marginTop: "24px", 
          paddingTop: "16px", 
          borderTop: "1px solid var(--color-border)",
          fontSize: "0.9rem",
          color: "var(--color-text-tertiary)"
        }}>
          📊 Mostrando {filteredIncidents.length} de {incidents.length} incidente{incidents.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
