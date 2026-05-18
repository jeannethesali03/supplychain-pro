/**
 * HistorialView - Historial de envíos con detalle
 */

import { useEffect, useMemo, useState } from "react";
import apiService from "../services/apiService.js";

export default function HistorialView() {
  const [envios, setEnvios] = useState([]);
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      const res = await apiService.getEnvios();
      if (!isMounted) return;

      if (res.success) {
        setEnvios(res.data || []);
      } else {
        setError(res.error || "Error cargando envíos");
      }
      setLoading(false);
    };

    load();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDetalles = async () => {
      if (!selectedEnvio) return setDetalles([]);
      const res = await apiService.getDetallesEnvio(selectedEnvio.id_envio);
      if (!isMounted) return;
      if (res.success) setDetalles(res.data || []);
      else setDetalles([]);
    };

    loadDetalles();
    return () => { isMounted = false; };
  }, [selectedEnvio]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return envios.filter((e) => {
      const matchesStatus = status === "all" || e.estado === status;
      if (!matchesStatus) return false;
      if (!term) return true;
      const codigo = e.codigo_rastreo?.toLowerCase() || "";
      const origen = e.origen?.toLowerCase() || "";
      const destino = e.destino?.toLowerCase() || "";
      return codigo.includes(term) || origen.includes(term) || destino.includes(term);
    });
  }, [envios, search, status]);

  return (
    <div className="control-panel">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: "1.5rem", marginBottom: "4px" }}>Historial de Envíos</h2>
          <p className="muted">Consulta de envíos y manifiesto de carga</p>
        </div>
        <div className="form-row" style={{ marginBottom: 0, alignItems: 'center', display: 'flex' }}>
          <input
            placeholder="Buscar por código, origen o destino"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '280px' }}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="EN_TRANSITO">En tránsito</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="INCIDENTE_REPORTADO">Incidente</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert error">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="panel-card" style={{ textAlign: "center", padding: "40px" }}><span className="muted">Cargando historial...</span></div>
      ) : (
        <div className="simulation-layout" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="panel-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "800px" }}>
            <div style={{ display: "flex", padding: "12px 16px", background: "#f7f2ec", borderBottom: "1px solid var(--border)", fontWeight: 600, color: "#6a5c4f", fontSize: "0.85rem", textTransform: "uppercase" }}>
              <span style={{ flex: 1 }}>Código</span>
              <span style={{ flex: 1 }}>Origen</span>
              <span style={{ flex: 1 }}>Destino</span>
              <span style={{ width: "100px", textAlign: "right" }}>Estado</span>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filtered.map((envio) => {
                const isActive = selectedEnvio?.id_envio === envio.id_envio;
                let statusClass = "status-pill reachable";
                if (envio.estado === "INCIDENTE_REPORTADO" || envio.estado === "CANCELADO") statusClass = "status-pill blocked";
                if (envio.estado === "EN_TRANSITO") statusClass = "status-pill";
                
                return (
                  <button
                    key={envio.id_envio}
                    onClick={() => setSelectedEnvio(envio)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      padding: "16px",
                      border: "none",
                      borderBottom: "1px solid var(--border)",
                      background: isActive ? "var(--accent-soft)" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      color: "var(--ink)",
                      transition: "background 0.2s ease"
                    }}
                  >
                    <span style={{ flex: 1, fontWeight: 600 }}>{envio.codigo_rastreo}</span>
                    <span style={{ flex: 1 }}>{envio.origen}</span>
                    <span style={{ flex: 1 }}>{envio.destino}</span>
                    <span style={{ width: "100px", textAlign: "right" }}>
                      <span className={statusClass} style={{ fontSize: "0.7rem", padding: "4px 8px" }}>
                        {(envio.estado || "EN_TRANSITO").replace("_", " ")}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel-card">
            {selectedEnvio ? (
              <>
                <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "16px", marginBottom: "16px" }}>
                  <div className="card-title" style={{ fontSize: "1.3rem", marginBottom: "4px" }}>{selectedEnvio.codigo_rastreo}</div>
                  <div className="muted">{selectedEnvio.origen} → {selectedEnvio.destino}</div>
                </div>

                <div className="meta-grid" style={{ marginBottom: "20px" }}>
                  <div>
                    <span>Estado</span>
                    <strong>{selectedEnvio.estado || "EN_TRANSITO"}</strong>
                  </div>
                  <div>
                    <span>Rango temp</span>
                    <strong>{selectedEnvio.temp_min_permitida}°C / {selectedEnvio.temp_max_permitida}°C</strong>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span>Creado</span>
                    <strong>
                      {selectedEnvio.fecha_creacion ? new Date(selectedEnvio.fecha_creacion).toLocaleString("es-ES") : "—"}
                    </strong>
                  </div>
                </div>

                <div className="card-title">Detalle de carga</div>
                {detalles.length === 0 ? (
                  <div className="info-banner">No hay detalles asociados a este envío.</div>
                ) : (
                  <div style={{ display: "grid", gap: "12px", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
                    {detalles.map((item) => (
                      <div key={item.id_detalle_envio} style={{ background: "#f7f2ec", padding: "12px", borderRadius: "12px", border: "1px dashed #e3d8cc" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <strong style={{ color: "var(--ink-strong)" }}>{item.nombre}</strong>
                          <span className="muted" style={{ fontSize: "0.85rem" }}>SKU: {item.codigo_sku}</span>
                        </div>
                        <div className="meta-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                          <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.6)" }}><span>Cantidad</span><strong>{item.cantidad}</strong></div>
                          <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.6)" }}><span>Peso</span><strong>{item.peso_kg} kg</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)", minHeight: "200px" }}>
                Selecciona un envío para ver su detalle
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
