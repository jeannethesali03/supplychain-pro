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
            <h4 style={{ margin: "0 0 8px 0", color: "#dc2626", fontSize: "0.85rem", fontWeight: 700 }}>Detalles de Incidentes ({allIncidents.length}):</h4>
            <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
              {allIncidents.map((inc, idx) => {
                const tipoUpper = (inc.tipo || inc.tipo_incidente || "").toString().toUpperCase();
                let label = inc.tipo || inc.tipo_incidente || "Incidente";
                let colorClass = "#7f1d1d";
                let valText = null;

                if (tipoUpper === "RUPTURA_CADENA_FRIO" || tipoUpper === "TEMPERATURA_CRITICA") {
                  label = "Ruptura de Frío";
                  valText = `Reg: ${inc.valor_registrado}°C (Límite: ${inc.valor_limite}°C)`;
                } else if (tipoUpper === "BATERIA_BAJA") {
                  label = "Batería Baja";
                  valText = `Reg: ${inc.valor_registrado}% (Límite: 10%)`;
                  colorClass = "#b45309";
                } else if (tipoUpper === "OUT_OF_BOUNDS" || tipoUpper === "GEOFENCE_VIOLATION" || tipoUpper === "VIOLACION_GEOFENCE") {
                  label = "Desvío de Ruta";
                  colorClass = "#4338ca";
                  valText = "Vehículo fuera del geofence";
                } else if (tipoUpper === "STORAGE_FULL" || tipoUpper === "VOLUMEN_LLENO") {
                  label = "Almacenamiento Lleno";
                  colorClass = "#b91c1c";
                  valText = "Almacenamiento al 100%";
                }

                return (
                  <div key={idx} style={{ background: "#fff", padding: "8px", borderRadius: "6px", border: "1px solid #fecaca", fontSize: "0.75rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", alignItems: "center" }}>
                      <strong style={{ color: colorClass }}>
                        ⚠️ {label}
                      </strong>
                      <span style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 600 }}>
                        {inc.timestamp || inc.fecha_creacion ? new Date(inc.timestamp || inc.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
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
