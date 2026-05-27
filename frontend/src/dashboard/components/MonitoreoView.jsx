/**
 * MonitoreoView - Monitoreo en tiempo real de envíos y vehículos
 */

import { useEffect, useMemo, useState } from "react";
import apiService from "../services/apiService.js";
import { useTelemetry } from "../hooks/useTelemetry.js";
import { useEnvios } from "../hooks/useEnvios.js";

// Utilidades de formato
const getStateIcon = (estado) => {
  const icons = {
    EN_TRANSITO: "🚚",
    ENTREGADO: "✅",
    INCIDENTE_REPORTADO: "⚠️",
    CANCELADO: "❌",
  };
  return icons[estado] || "📦";
};

const getStateLabel = (estado) => {
  const labels = {
    EN_TRANSITO: "En Tránsito",
    ENTREGADO: "Entregado",
    INCIDENTE_REPORTADO: "Incidente Reportado",
    CANCELADO: "Cancelado",
  };
  return labels[estado] || estado;
};

const getStateColor = (estado) => {
  const colors = {
    EN_TRANSITO: "#3b82f6",
    ENTREGADO: "#10b981",
    INCIDENTE_REPORTADO: "#ef4444",
    CANCELADO: "#6b7280",
  };
  return colors[estado] || "#64748b";
};

function TelemetryStatus({ envioId, tempMax, tempMin }) {
  const { telemetry } = useTelemetry(envioId);

  const temp = telemetry?.temperatura ?? null;
  const humedad = telemetry?.humedad ?? null;
  const bateria = telemetry?.porcentaje_bateria ?? null;

  const tempNum = temp !== null ? Number(temp) : null;
  const maxNum = tempMax !== null ? Number(tempMax) : null;
  const minNum = tempMin !== null ? Number(tempMin) : null;

  const isCritical =
    tempNum !== null &&
    maxNum !== null &&
    minNum !== null &&
    (tempNum > maxNum || tempNum < minNum);

  const getTempStatus = () => {
    if (!tempNum || !maxNum || !minNum) return { label: "N/A", color: "var(--color-gray-dark)" };
    if (tempNum > maxNum) return { label: "Muy caliente", color: "var(--color-danger)" };
    if (tempNum < minNum) return { label: "Muy frío", color: "var(--color-primary)" };
    return { label: "Normal", color: "var(--color-success)" };
  };

  const batteryStatus = bateria ? (
    bateria < 20 ? "🪫 Baja" : bateria < 50 ? "🔋 Media" : "🔋 Buena"
  ) : "N/A";

  const tempStatus = getTempStatus();

  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: "repeat(3, 1fr)", 
      gap: "12px", 
      padding: "14px", 
      background: isCritical ? "var(--color-danger-light)" : "var(--color-bg-secondary)",
      borderRadius: "10px", 
      border: isCritical ? `2px solid var(--color-danger)` : "1px solid var(--color-border)",
      marginTop: "16px"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600, marginBottom: "6px" }}>
          🌡️ Temperatura
        </div>
        <strong style={{ display: "block", fontSize: "1.1rem", color: tempStatus.color }}>
          {tempNum !== null ? `${tempNum.toFixed(1)}°C` : "--"}
        </strong>
        <span style={{ fontSize: "0.75rem", color: tempStatus.color, fontWeight: 500 }}>
          {tempStatus.label}
        </span>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600, marginBottom: "6px" }}>
          💧 Humedad
        </div>
        <strong style={{ display: "block", fontSize: "1.1rem", color: "var(--color-text)" }}>
          {humedad !== null ? `${Number(humedad).toFixed(0)}%` : "--"}
        </strong>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
          {humedad && humedad < 30 ? "Seca" : humedad && humedad > 70 ? "Húmeda" : "Normal"}
        </span>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600, marginBottom: "6px" }}>
          🔋 Batería
        </div>
        <strong style={{ display: "block", fontSize: "1.1rem", color: "var(--color-text)" }}>
          {bateria !== null ? `${Number(bateria).toFixed(0)}%` : "--"}
        </strong>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
          {batteryStatus}
        </span>
      </div>
    </div>
  );
}

export default function MonitoreoView() {
  const { envios, loading: enviosLoading, error: enviosError } = useEnvios();
  const [vehiculos, setVehiculos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      const [vehiculosRes, asignacionesRes] = await Promise.all([
        apiService.getVehiculos(),
        apiService.getEnviosVehiculos(),
      ]);

      if (!isMounted) return;

      if (!vehiculosRes.success) return setError(vehiculosRes.error || "Error cargando vehículos");
      if (!asignacionesRes.success) return setError(asignacionesRes.error || "Error cargando asignaciones");

      setVehiculos(vehiculosRes.data || []);
      setAsignaciones(asignacionesRes.data || []);
      setLoading(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const vehiculoById = useMemo(() => {
    const map = new Map();
    vehiculos.forEach((v) => map.set(v.id_vehiculo, v));
    return map;
  }, [vehiculos]);

  const envioVehiculoByEnvio = useMemo(() => {
    const map = new Map();
    asignaciones.forEach((a) => {
      if (!map.has(a.id_envio)) map.set(a.id_envio, a);
    });
    return map;
  }, [asignaciones]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return envios;
    return envios.filter((e) => {
      const codigo = e.codigo_rastreo?.toLowerCase() || "";
      const origen = e.origen?.toLowerCase() || "";
      const destino = e.destino?.toLowerCase() || "";
      return codigo.includes(term) || origen.includes(term) || destino.includes(term);
    });
  }, [envios, search]);

  return (
    <div className="control-panel">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: "1.5rem", marginBottom: "4px" }}>📍 Monitoreo en Tiempo Real</h2>
          <p className="muted">Estado actual de todos los envíos y vehículos en operación</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ 
            padding: "8px 12px", 
            background: "var(--color-primary-light)", 
            color: "var(--color-primary-dark)", 
            borderRadius: "6px",
            fontWeight: 600,
            fontSize: "0.9rem"
          }}>
            {filtered.length} envío{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          placeholder="🔍 Buscar por código, origen o destino..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '400px' }}
        />
      </div>

      {(error || enviosError) && (
        <div style={{ 
          background: "var(--color-danger-light)", 
          border: "1px solid var(--color-danger)", 
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "16px",
          color: "var(--color-danger)"
        }}>
          <p style={{ margin: 0 }}>⚠️ {error || enviosError}</p>
        </div>
      )}

      {(loading || enviosLoading) ? (
        <div className="panel-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <span className="muted">⏳ Cargando información en tiempo real...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel-card" style={{ textAlign: "center", padding: "60px 20px", background: "var(--color-bg-secondary)", border: "2px dashed var(--color-border)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📦</div>
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>No hay envíos para mostrar</div>
          <div className="muted">Intenta con otros términos de búsqueda</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          {filtered.map((envio) => {
            const asignacion = envioVehiculoByEnvio.get(envio.id_envio);
            const vehiculo = asignacion ? vehiculoById.get(asignacion.id_vehiculo) : null;
            const stateIcon = getStateIcon(envio.estado);
            const stateLabel = getStateLabel(envio.estado);
            const stateColor = getStateColor(envio.estado);
            const fechaCreacion = envio.fecha_creacion ? new Date(envio.fecha_creacion) : null;

            return (
              <div 
                className="panel-card" 
                key={envio.id_envio}
                style={{ 
                  borderLeft: `4px solid ${stateColor}`,
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Encabezado con estado */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ flex: 1 }}>
                    <div className="card-title" style={{ marginBottom: "6px", fontSize: "1.1rem" }}>
                      📦 {envio.codigo_rastreo || `Envío #${envio.id_envio}`}
                    </div>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      📍 {envio.origen} → {envio.destino}
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    background: stateColor + "20",
                    borderRadius: "8px",
                    color: stateColor,
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    whiteSpace: "nowrap"
                  }}>
                    <span>{stateIcon}</span>
                    <span>{stateLabel}</span>
                  </div>
                </div>

                {/* Información del vehículo */}
                <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", borderRadius: "8px" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
                        🚗 Vehículo
                      </span>
                      <strong style={{ display: "block", marginTop: "4px", fontSize: "1rem" }}>
                        {vehiculo?.placa || "No asignado"}
                      </strong>
                    </div>
                    <div style={{ padding: "10px 12px", background: "var(--color-bg-secondary)", borderRadius: "8px" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
                        🛣️ Ruta
                      </span>
                      <strong style={{ display: "block", marginTop: "4px", fontSize: "1rem" }}>
                        {envio.id_ruta ? `#${envio.id_ruta}` : "—"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Información de temperaturas */}
                <div style={{ marginBottom: "16px", padding: "12px", background: "var(--color-bg-secondary)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
                    🌡️ Rango de Temperatura Permitido
                  </span>
                  <strong style={{ display: "block", marginTop: "6px", fontSize: "0.95rem", color: stateColor }}>
                    {envio.temp_min_permitida}°C a {envio.temp_max_permitida}°C
                  </strong>
                </div>

                {/* Estado de telemetría */}
                <TelemetryStatus
                  envioId={envio.id_envio}
                  tempMax={envio.temp_max_permitida}
                  tempMin={envio.temp_min_permitida}
                />

                {/* Fecha de creación */}
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--color-border)", fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
                  ⏱️ {fechaCreacion ? `Creado: ${fechaCreacion.toLocaleDateString("es-ES")} a las ${fechaCreacion.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}` : "—"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
