/**
 * HistorialView - Historial de envíos con detalle
 */

import { useEffect, useMemo, useState } from "react";
import apiService from "../services/apiService.js";
import { useEnvios } from "../hooks/useEnvios.js";

// Funciones de utilidad
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

export default function HistorialView() {
  const { envios, loading: enviosLoading, error: enviosError } = useEnvios();
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const currentSelectedEnvio = selectedEnvio
    ? envios.find((e) => String(e.id_envio) === String(selectedEnvio.id_envio)) || selectedEnvio
    : null;

  useEffect(() => {
    let isMounted = true;

    const loadDetalles = async () => {
      if (!currentSelectedEnvio) return setDetalles([]);
      const res = await apiService.getDetallesEnvio(currentSelectedEnvio.id_envio);
      if (!isMounted) return;
      if (res.success) setDetalles(res.data || []);
      else setDetalles([]);
    };

    loadDetalles();
    return () => { isMounted = false; };
  }, [currentSelectedEnvio]);

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

  const totalPeso = useMemo(() => {
    return detalles.reduce((sum, item) => sum + (parseFloat(item.peso_kg) || 0), 0);
  }, [detalles]);

  return (
    <div className="control-panel">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: "1.5rem", marginBottom: "4px" }}>📜 Historial de Envíos</h2>
          <p className="muted">Consulta de envíos completados, en tránsito e incidentes</p>
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

      {enviosError && (
        <div style={{ 
          background: "var(--color-danger-light)", 
          border: "1px solid var(--color-danger)", 
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "16px",
          color: "var(--color-danger)"
        }}>
          <p style={{ margin: 0 }}>⚠️ {enviosError}</p>
        </div>
      )}

      {enviosLoading ? (
        <div className="panel-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <span className="muted">⏳ Cargando historial de envíos...</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
          {/* Lista de envíos */}
          <div className="panel-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "900px" }}>
            {/* Controles */}
            <div style={{ padding: "16px", background: "var(--color-bg-secondary)", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input
                  placeholder="🔍 Buscar código, origen o destino"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="all">📊 Todos los estados</option>
                <option value="EN_TRANSITO">🚚 En Tránsito</option>
                <option value="ENTREGADO">✅ Entregado</option>
                <option value="INCIDENTE_REPORTADO">⚠️ Incidente</option>
                <option value="CANCELADO">❌ Cancelado</option>
              </select>
            </div>

            {/* Encabezado de tabla */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr",
              gap: "12px",
              padding: "12px 16px", 
              background: "var(--color-bg-secondary)", 
              borderBottom: "1px solid var(--color-border)", 
              fontWeight: 700, 
              color: "var(--color-text-tertiary)", 
              fontSize: "0.75rem", 
              textTransform: "uppercase",
              position: "sticky",
              top: 0,
              zIndex: 10
            }}>
              <span>Código</span>
              <span>Origen</span>
              <span>Destino</span>
              <span style={{ textAlign: "right" }}>Estado</span>
            </div>

            {/* Lista scrolleable */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-tertiary)" }}>
                  📭 No hay envíos que coincidan con tu búsqueda
                </div>
              ) : (
                filtered.map((envio) => {
                  const isActive = currentSelectedEnvio?.id_envio === envio.id_envio;
                  const stateIcon = getStateIcon(envio.estado);
                  const stateColor = getStateColor(envio.estado);
                  
                  return (
                    <button
                      key={envio.id_envio}
                      onClick={() => setSelectedEnvio(envio)}
                      style={{
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr",
                        gap: "12px",
                        alignItems: "center",
                        padding: "14px 16px",
                        border: "none",
                        borderBottom: "1px solid var(--color-border)",
                        background: isActive ? "var(--color-primary-light)" : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        color: "var(--color-text)",
                        transition: "background 0.2s ease",
                        hover: { background: "var(--color-bg-secondary)" }
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{envio.codigo_rastreo || `#${envio.id_envio}`}</span>
                      <span style={{ fontSize: "0.9rem", color: "var(--color-text-tertiary)" }}>{envio.origen}</span>
                      <span style={{ fontSize: "0.9rem", color: "var(--color-text-tertiary)" }}>{envio.destino}</span>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px", alignItems: "center", fontSize: "0.85rem" }}>
                        <span>{stateIcon}</span>
                        <span style={{ color: stateColor, fontWeight: 600 }}>
                          {getStateLabel(envio.estado).split(" ")[0]}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Detalle del envío seleccionado */}
          <div className="panel-card">
            {currentSelectedEnvio ? (
              <>
                {/* Encabezado del detalle */}
                <div style={{ marginBottom: "20px", paddingBottom: "16px", borderBottom: "2px solid var(--color-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "2rem" }}>📦</span>
                    <div>
                      <div className="card-title" style={{ fontSize: "1.3rem", marginBottom: "4px" }}>
                        {currentSelectedEnvio.codigo_rastreo || `Envío #${currentSelectedEnvio.id_envio}`}
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                        📍 {currentSelectedEnvio.origen} → {currentSelectedEnvio.destino}
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    background: getStateColor(currentSelectedEnvio.estado) + "20",
                    color: getStateColor(currentSelectedEnvio.estado),
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    marginTop: "12px"
                  }}>
                    <span>{getStateIcon(currentSelectedEnvio.estado)}</span>
                    <span>{getStateLabel(currentSelectedEnvio.estado)}</span>
                  </div>
                </div>

                {/* Información del envío */}
                <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ padding: "12px", background: "var(--color-bg-secondary)", borderRadius: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
                        📅 Fecha de Creación
                      </span>
                      <strong style={{ display: "block", marginTop: "6px" }}>
                        {currentSelectedEnvio.fecha_creacion 
                          ? new Date(currentSelectedEnvio.fecha_creacion).toLocaleDateString("es-ES", { 
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            }) 
                          : "—"}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)", display: "block", marginTop: "4px" }}>
                        {currentSelectedEnvio.fecha_creacion 
                          ? new Date(currentSelectedEnvio.fecha_creacion).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : ""}
                      </span>
                    </div>
                    <div style={{ padding: "12px", background: "var(--color-bg-secondary)", borderRadius: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>
                        🌡️ Rango de Temperatura
                      </span>
                      <strong style={{ display: "block", marginTop: "6px" }}>
                        {currentSelectedEnvio.temp_min_permitida}°C a {currentSelectedEnvio.temp_max_permitida}°C
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)", display: "block", marginTop: "4px" }}>
                        Control de frío/calor
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detalle de carga */}
                <div>
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                      📋 Manifiesto de Carga ({detalles.length} artículo{detalles.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                  
                  {detalles.length === 0 ? (
                    <div style={{ 
                      padding: "24px", 
                      textAlign: "center", 
                      background: "var(--color-bg-secondary)",
                      borderRadius: "8px",
                      color: "var(--color-text-tertiary)",
                      fontSize: "0.95rem"
                    }}>
                      📦 No hay artículos asociados a este envío
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "10px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
                      {detalles.map((item, idx) => (
                        <div 
                          key={item.id_detalle_envio} 
                          style={{ 
                            background: "var(--color-bg-secondary)", 
                            padding: "12px", 
                            borderRadius: "8px",
                            borderLeft: "3px solid var(--color-primary)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start"
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, marginBottom: "4px", fontSize: "0.95rem" }}>
                              {idx + 1}. {item.nombre}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
                              📌 SKU: {item.codigo_sku}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", fontSize: "0.9rem" }}>
                            <div style={{ fontWeight: 600 }}>{item.cantidad} un.</div>
                            <div style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)", marginTop: "2px" }}>
                              ⚖️ {item.peso_kg} kg
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Resumen de peso */}
                      {detalles.length > 0 && (
                        <div style={{ 
                          marginTop: "12px", 
                          padding: "12px", 
                          background: "var(--color-primary-light)",
                          borderRadius: "8px",
                          fontWeight: 600,
                          color: "var(--color-primary-dark)",
                          textAlign: "right"
                        }}>
                          ⚖️ Peso Total: {totalPeso.toFixed(2)} kg
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                height: "100%", 
                color: "var(--color-text-tertiary)", 
                minHeight: "300px",
                textAlign: "center",
                fontSize: "1rem"
              }}>
                👈 Selecciona un envío para ver su detalle completo
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
