/**
 * MonitoreoView - Monitoreo en tiempo real de envíos y vehículos
 */

import { useEffect, useMemo, useState } from "react";
import apiService from "../services/apiService.js";
import { useTelemetry } from "../hooks/useTelemetry.js";
import { useEnvios } from "../hooks/useEnvios.js";

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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", padding: isCritical ? "12px" : "0", background: isCritical ? "#ffe8e6" : "transparent", borderRadius: "12px", border: isCritical ? "1px solid #f5b3ac" : "none", marginTop: "16px" }}>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: "0.75rem", color: isCritical ? "#7d2c22" : "var(--muted)", textTransform: "uppercase" }}>Temp</span>
        <strong style={{ display: "block", marginTop: "4px", fontSize: "1.05rem", color: isCritical ? "#7d2c22" : "var(--ink-strong)" }}>
          {tempNum !== null ? `${tempNum.toFixed(1)}°C` : "--"}
        </strong>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: "0.75rem", color: isCritical ? "#7d2c22" : "var(--muted)", textTransform: "uppercase" }}>Humedad</span>
        <strong style={{ display: "block", marginTop: "4px", fontSize: "1.05rem", color: isCritical ? "#7d2c22" : "var(--ink-strong)" }}>
          {humedad !== null ? `${Number(humedad).toFixed(0)}%` : "--"}
        </strong>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: "0.75rem", color: isCritical ? "#7d2c22" : "var(--muted)", textTransform: "uppercase" }}>Batería</span>
        <strong style={{ display: "block", marginTop: "4px", fontSize: "1.05rem", color: isCritical ? "#7d2c22" : "var(--ink-strong)" }}>
          {bateria !== null ? `${Number(bateria).toFixed(0)}%` : "--"}
        </strong>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: "1.5rem", marginBottom: "4px" }}>Monitoreo de Vehículos</h2>
          <p className="muted">Estado en tiempo real por envío asignado</p>
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <input
            placeholder="Buscar por código, origen o destino"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '300px' }}
          />
        </div>
      </div>

      {(error || enviosError) && (
        <div className="alert error">
          <p>{error || enviosError}</p>
        </div>
      )}

      {(loading || enviosLoading) ? (
        <div className="panel-card" style={{ textAlign: "center", padding: "40px" }}><span className="muted">Cargando monitoreo...</span></div>
      ) : filtered.length === 0 ? (
        <div className="panel-card" style={{ textAlign: "center", padding: "40px" }}>
          <div className="info-banner">No hay envíos para mostrar</div>
        </div>
      ) : (
        <div className="simulation-layout" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
          {filtered.map((envio) => {
            const asignacion = envioVehiculoByEnvio.get(envio.id_envio);
            const vehiculo = asignacion ? vehiculoById.get(asignacion.id_vehiculo) : null;
            let statusClass = "status-pill reachable";
            if (envio.estado === "INCIDENTE_REPORTADO" || envio.estado === "CANCELADO") statusClass = "status-pill blocked";
            if (envio.estado === "EN_TRANSITO") statusClass = "status-pill";

            return (
              <div className="panel-card" key={envio.id_envio}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div className="card-title" style={{ marginBottom: "4px" }}>{envio.codigo_rastreo || `Envío #${envio.id_envio}`}</div>
                    <div className="muted" style={{ fontSize: "0.85rem" }}>{envio.origen} → {envio.destino}</div>
                  </div>
                  <span className={statusClass}>
                    {(envio.estado || "EN_TRANSITO").replace("_", " ")}
                  </span>
                </div>

                <div className="meta-grid">
                  <div>
                    <span>Vehículo</span>
                    <strong>{vehiculo?.placa || "No asignado"}</strong>
                  </div>
                  <div>
                    <span>Ruta</span>
                    <strong>{envio.id_ruta ? `#${envio.id_ruta}` : "—"}</strong>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span>Creado</span>
                    <strong>{envio.fecha_creacion ? new Date(envio.fecha_creacion).toLocaleDateString("es-ES") : "—"}</strong>
                  </div>
                </div>

                <TelemetryStatus
                  envioId={envio.id_envio}
                  tempMax={envio.temp_max_permitida}
                  tempMin={envio.temp_min_permitida}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
