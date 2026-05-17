/**
 * TelemetryPanel - Panel de tarjetas de telemetría
 */

import { useEnvios } from "../hooks/useEnvios.js";
import { useTelemetry } from "../hooks/useTelemetry.js";
import "../styles/telemetry.css";

function TelemetryCard({ envio }) {
  const { telemetry, status, statusColor, statusText } = useTelemetry(envio.id_vehiculo);

  if (!envio) {
    return (
      <div className="telemetry-card loading">
        <div className="card-skeleton"></div>
      </div>
    );
  }

  return (
    <div className={`telemetry-card status-${status}`}>
      {/* Header de la tarjeta */}
      <div className="card-header">
        <div className="card-title">
          <span className="envio-id">Envío #{envio.id_envio}</span>
          <span className={`status-badge ${status}`} style={{ color: statusColor }}>
            {statusText}
          </span>
        </div>
        <div className="card-status-dot" style={{ backgroundColor: statusColor }}></div>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="card-content">
        {/* Información básica */}
        <div className="info-row">
          <span className="info-label">Mercancía:</span>
          <span className="info-value">{envio.tipo_mercancia || "No especificada"}</span>
        </div>

        {telemetry ? (
          <>
            {/* Temperatura */}
            <div className="metric-row">
              <div className="metric">
                <span className="metric-label">🌡️ Temperatura</span>
                <span className="metric-value" style={{ color: statusColor }}>
                  {telemetry.temperatura?.toFixed(1)}°C
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">💧 Humedad</span>
                <span className="metric-value">{telemetry.humedad?.toFixed(1)}%</span>
              </div>
            </div>

            {/* Velocidad y ubicación */}
            <div className="metric-row">
              <div className="metric">
                <span className="metric-label">🚀 Velocidad</span>
                <span className="metric-value">
                  {telemetry.velocidad?.toFixed(1)} km/h
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">📍 Ubicación</span>
                <span className="metric-value" style={{ fontSize: "0.85rem" }}>
                  {telemetry.latitud?.toFixed(4)}, {telemetry.longitud?.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Tiempo de viaje */}
            <div className="info-row">
              <span className="info-label">⏱️ Tiempo de viaje:</span>
              <span className="info-value">2h 45m</span>
            </div>

            {/* Última actualización */}
            <div className="info-row">
              <span className="info-label">🕐 Última actualización:</span>
              <span className="info-value" style={{ fontSize: "0.8rem" }}>
                {new Date(telemetry.timestamp).toLocaleTimeString("es-ES")}
              </span>
            </div>
          </>
        ) : (
          <div className="no-telemetry">
            <p>Sin datos de telemetría</p>
          </div>
        )}
      </div>

      {/* Footer de la tarjeta */}
      <div className="card-footer">
        <button className="card-button">Ver detalles →</button>
      </div>
    </div>
  );
}

export default function TelemetryPanel() {
  const { envios, loading: enviosLoading } = useEnvios();

  return (
    <div className="telemetry-panel">
      <div className="panel-header">
        <h2>Panel de Telemetría</h2>
        <span className="envios-count">
          {envios.length} envío{envios.length !== 1 ? "s" : ""} activo{envios.length !== 1 ? "s" : ""}
        </span>
      </div>

      {enviosLoading ? (
        <div className="loading-spinner">Cargando envíos...</div>
      ) : envios.length === 0 ? (
        <div className="empty-state">
          <p>No hay envíos activos</p>
        </div>
      ) : (
        <div className="telemetry-grid">
          {envios.map((envio) => (
            <TelemetryCard key={envio.id_envio} envio={envio} />
          ))}
        </div>
      )}
    </div>
  );
}
