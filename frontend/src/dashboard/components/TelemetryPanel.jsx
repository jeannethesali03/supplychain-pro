import { useTelemetry } from "../hooks/useTelemetry.js";
import { useIncidents } from "../hooks/useIncidents.js";
import "../styles/telemetry.css";

const TelemetryPanel = ({ selectedEnvio, rupturas = [] }) => {
  const { telemetry } = useTelemetry(selectedEnvio?.id_envio);
  const { incidents } = useIncidents(selectedEnvio?.id_envio);
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

  // Filtrar solo incidentes relacionados con temperatura
  const tempIncidents = incidents?.filter(
    (i) => i.tipo === "RUPTURA_CADENA_FRIO" || i.tipo === "TEMPERATURA_CRITICA"
  ) || [];

  return (
    <div className="telemetry-panel">
      <div className={panelClass}>
        <div className="card-header">
          <h3>{codigo_rastreo || `Envío #${id_envio}`}</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>
            {origen && destino ? `${origen} → ${destino}` : "Ruta no disponible"}
          </p>
          <button className="options-button">...</button>
        </div>
        <div className="card-body">
          <div className="telemetry-item">
            <span className="icon">🌡️</span>
            <p>{telemetry?.temperatura ?? "N/A"} °C</p>
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

        {/* Mostrar lista detallada de los incidentes térmicos registrados */}
        {tempIncidents.length > 0 && (
          <div className="card-footer incidents-list" style={{ marginTop: "10px", background: "#fff5f5", borderColor: "#fca5a5", padding: "10px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#dc2626", fontSize: "0.85rem" }}>Detalles de Incidentes:</h4>
            <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
              {tempIncidents.map((inc, idx) => (
                <div key={idx} style={{ background: "#fff", padding: "8px", borderRadius: "6px", border: "1px solid #fecaca", fontSize: "0.75rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", alignItems: "center" }}>
                    <strong style={{ color: "#7f1d1d" }}>
                      {inc.tipo === "RUPTURA_CADENA_FRIO" ? "Ruptura de Frío" : "Temp. Crítica"}
                    </strong>
                    <span style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 600 }}>
                      {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 6px 0", color: "#475569", lineHeight: "1.3" }}>
                    {inc.descripcion}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "4px 6px", borderRadius: "4px" }}>
                    <span style={{ color: "#dc2626", fontWeight: "bold" }}>Reg: {inc.valor_registrado}°C</span>
                    <span style={{ color: "#059669", fontWeight: "bold" }}>Límite: {inc.valor_limite}°C</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TelemetryPanel;
