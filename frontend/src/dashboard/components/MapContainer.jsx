/**
 * MapContainer - Mapa logístico interactivo con rutas
 * Lógica original preservada · Leaflet reemplaza canvas · tarjetas de envío añadidas
 * CSS embebido directamente en el componente
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useEnvios } from "../hooks/useEnvios.js";
import { useTelemetry } from "../hooks/useTelemetry.js";

// ── CSS embebido - Professional SaaS Design ──────────────────────────────────
const MAP_STYLES = `
  .map-container {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
    background: #fff;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04);
    border: 1px solid #e2e8f0;
  }

  .map-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: linear-gradient(to right, #ffffff, #f8fafc);
    border-bottom: 1px solid #e2e8f0;
  }

  .map-header h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.3px;
  }

  .map-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .zoom-btn {
    width: 32px;
    height: 32px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #475569;
    transition: all 0.15s ease;
  }

  .zoom-btn:hover {
    background: #f8fafc;
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .zoom-level {
    font-size: 0.78rem;
    color: #64748b;
    font-weight: 600;
    min-width: 40px;
    text-align: center;
  }

  .clear-btn {
    padding: 6px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    color: #475569;
    transition: all 0.15s ease;
  }

  .clear-btn:hover {
    background: #fee2e2;
    border-color: #ef4444;
    color: #ef4444;
  }

  .map-canvas-wrapper {
    position: relative;
    width: 100%;
    flex-shrink: 0;
  }

  .leaflet-map-div {
    width: 100%;
    height: 320px;
    z-index: 0;
  }

  .map-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    color: #64748b;
    font-size: 0.95rem;
    font-weight: 500;
  }

  /* ── Tarjetas de envíos - Professional horizontal scroll ── */
  .envio-cards-row {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 16px 18px;
    background: linear-gradient(to bottom, #ffffff, #f9fafb);
    border-top: 1px solid #e2e8f0;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }

  .envio-cards-row::-webkit-scrollbar {
    height: 6px;
  }

  .envio-cards-row::-webkit-scrollbar-track {
    background: transparent;
  }

  .envio-cards-row::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  .envio-cards-row::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  .envio-card {
    flex: 0 0 240px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  }

  .envio-card:hover {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.12);
    border-color: #3b82f6;
    transform: translateY(-2px);
  }

  .envio-card--selected {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    background: linear-gradient(135deg, #ffffff 0%, #dbeafe 100%);
  }

  .envio-card--critical {
    border-color: #fecaca;
    background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
  }

  .envio-card--critical:hover {
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.12);
    border-color: #ef4444;
  }

  .envio-card--critical.envio-card--selected {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
  }

  .envio-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .envio-card__title-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .envio-card__id {
    font-weight: 700;
    font-size: 0.9rem;
    color: #0f172a;
    letter-spacing: -0.3px;
  }

  .envio-card__tipo {
    font-size: 0.73rem;
    color: #64748b;
    font-weight: 500;
  }

  .envio-card__incident-badge {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .envio-card__incident-badge--normal {
    background: #dbeafe;
    color: #0c4a6e;
  }

  .envio-card__incident-badge--critical {
    background: #fecaca;
    color: #7f1d1d;
    animation: pulse-critical 2s infinite;
  }

  @keyframes pulse-critical {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .envio-card__metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .envio-metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 8px;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #f1f5f9;
  }

  .envio-metric--alert {
    background: #fee2e2;
    border-color: #fecaca;
  }

  .envio-metric__icon {
    font-size: 1.1rem;
  }

  .envio-metric__value {
    font-size: 0.9rem;
    font-weight: 700;
    color: #0f172a;
  }

  .envio-metric--alert .envio-metric__value {
    color: #dc2626;
  }

  .envio-metric__label {
    font-size: 0.63rem;
    color: #64748b;
    text-align: center;
    line-height: 1.2;
    font-weight: 500;
  }

  .envio-card__location {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px;
    background: #f0fdf4;
    border: 1px solid #dcfce7;
    border-radius: 6px;
    font-size: 0.72rem;
    color: #166534;
  }

  .envio-card__location-icon {
    font-size: 0.9rem;
  }

  .envio-card__location-text {
    font-weight: 600;
  }

  .envio-card__alert {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    color: #7f1d1d;
    font-size: 0.68rem;
    font-weight: 700;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 7px 8px;
    line-height: 1.4;
    text-align: center;
  }

  .envio-card__footer {
    font-size: 0.7rem;
    color: #94a3b8;
    border-top: 1px solid #f1f5f9;
    padding-top: 8px;
    text-align: center;
    font-weight: 500;
  }

  /* ── Info detalle seleccionado ── */
  .map-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    padding: 14px 18px;
    background: linear-gradient(to bottom, #f8fafc, #ffffff);
    border-top: 1px solid #e2e8f0;
    font-size: 0.8rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .info-item strong {
    color: #0f172a;
    font-weight: 700;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: #64748b;
  }

  .info-item span {
    color: #0f172a;
    font-weight: 600;
  }

  /* ── Responsive Design ── */
  @media (max-width: 1400px) {
    .envio-card {
      flex: 0 0 220px;
    }
    
    .leaflet-map-div {
      height: 300px;
    }
  }

  @media (max-width: 1024px) {
    .map-container {
      border-radius: 8px;
    }

    .map-header {
      padding: 12px 16px;
    }

    .map-header h2 {
      font-size: 1rem;
    }

    .envio-card {
      flex: 0 0 200px;
      padding: 11px;
    }

    .leaflet-map-div {
      height: 280px;
    }

    .envio-cards-row {
      padding: 14px 16px;
      gap: 12px;
    }

    .map-info {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      padding: 12px 16px;
      gap: 10px;
      font-size: 0.75rem;
    }
  }

  @media (max-width: 768px) {
    .map-header {
      flex-direction: column;
      gap: 10px;
      align-items: flex-start;
      padding: 12px 14px;
    }

    .map-header h2 {
      font-size: 0.95rem;
    }

    .map-controls {
      width: 100%;
      justify-content: flex-start;
    }

    .envio-card {
      flex: 0 0 180px;
      padding: 10px;
      gap: 8px;
    }

    .envio-card__id {
      font-size: 0.85rem;
    }

    .envio-card__tipo {
      font-size: 0.7rem;
    }

    .envio-card__metrics {
      gap: 6px;
    }

    .envio-metric {
      padding: 6px;
    }

    .envio-metric__label {
      font-size: 0.6rem;
    }

    .leaflet-map-div {
      height: 250px;
    }

    .envio-cards-row {
      padding: 12px 14px;
      gap: 10px;
    }

    .map-info {
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      padding: 10px 14px;
      gap: 8px;
      font-size: 0.7rem;
    }

    .info-item strong {
      font-size: 0.65rem;
    }
  }

  @media (max-width: 480px) {
    .map-header {
      padding: 10px 12px;
    }

    .map-header h2 {
      font-size: 0.9rem;
    }

    .zoom-btn {
      width: 28px;
      height: 28px;
      font-size: 1rem;
    }

    .clear-btn {
      padding: 4px 8px;
      font-size: 0.75rem;
    }

    .zoom-level {
      font-size: 0.7rem;
      min-width: 35px;
    }

    .envio-card {
      flex: 0 0 160px;
      padding: 9px;
      gap: 7px;
    }

    .envio-card__id {
      font-size: 0.8rem;
    }

    .envio-card__tipo {
      font-size: 0.65rem;
    }

    .envio-card__metrics {
      gap: 5px;
    }

    .envio-metric {
      padding: 5px;
    }

    .envio-metric__icon {
      font-size: 0.95rem;
    }

    .envio-metric__value {
      font-size: 0.8rem;
    }

    .envio-metric__label {
      font-size: 0.55rem;
    }

    .envio-card__location {
      padding: 5px;
      font-size: 0.65rem;
    }

    .envio-card__alert {
      font-size: 0.6rem;
      padding: 5px 6px;
    }

    .envio-card__footer {
      font-size: 0.65rem;
      padding-top: 6px;
    }

    .leaflet-map-div {
      height: 220px;
    }

    .envio-cards-row {
      padding: 10px 12px;
      gap: 8px;
    }

    .map-info {
      grid-template-columns: 1fr;
      padding: 10px 12px;
      gap: 8px;
      font-size: 0.65rem;
    }

    .info-item {
      gap: 2px;
    }

    .info-item strong {
      font-size: 0.6rem;
    }
  }
`;

// ── Inyecta el CSS una sola vez en el <head> ──────────────────────────────────
function injectStyles() {
  if (document.getElementById("map-container-styles")) return;
  const style = document.createElement("style");
  style.id = "map-container-styles";
  style.textContent = MAP_STYLES;
  document.head.appendChild(style);
}

// ── Carga Leaflet desde CDN una sola vez ──────────────────────────────────────
function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(window.L); return; }
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (document.getElementById("leaflet-js")) {
      const t = setInterval(() => { if (window.L) { clearInterval(t); resolve(window.L); } }, 50);
      return;
    }
    const s = document.createElement("script");
    s.id = "leaflet-js";
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => resolve(window.L);
    document.head.appendChild(s);
  });
}

// ── Centro base: El Salvador ──────────────────────────────────────────────────
const BASE_LAT = 13.7942;
const BASE_LNG = -88.8965;

function toLatLng(x, y) {
  return {
    lat: BASE_LAT + (y - 100) * 0.004,
    lng: BASE_LNG + (x - 100) * 0.006,
  };
}

// ── Tarjeta individual - Professional Design ────────────────────────────────
function EnvioCard({ envio, isSelected, onSelect }) {
  const { telemetry } = useTelemetry(envio?.id_vehiculo);

  const temp      = telemetry?.temperatura ?? null;
  const humedad   = telemetry?.humedad     ?? null;
  const velocidad = telemetry?.velocidad   ?? null;
  const lat       = telemetry?.latitud     ?? null;
  const lng       = telemetry?.longitud    ?? null;

  const tempMax    = envio?.temp_max_permitida ?? 15;
  const tempMin    = envio?.temp_min_permitida ?? -5;
  const isCritical = temp !== null && (temp > tempMax || temp < tempMin);

  let cardClass = "envio-card";
  if (isSelected)  cardClass += " envio-card--selected";
  if (isCritical)  cardClass += " envio-card--critical";

  return (
    <div className={cardClass} onClick={() => onSelect(envio)}>
      {/* Encabezado con título e indicador de incidencia */}
      <div className="envio-card__header">
        <div className="envio-card__title-group">
          <span className="envio-card__id">
            {envio.codigo_rastreo || `Envío #${envio.id_envio}`}
          </span>
          <span className="envio-card__tipo">
            {envio.tipo_mercancia || "Carga General"}
          </span>
        </div>
        <div className={`envio-card__incident-badge envio-card__incident-badge--${isCritical ? "critical" : "normal"}`}>
          {isCritical ? "⚠" : "✓"}
        </div>
      </div>

      {/* Métricas: Temperatura y Humedad */}
      <div className="envio-card__metrics">
        <div className={`envio-metric${isCritical ? " envio-metric--alert" : ""}`}>
          <span className="envio-metric__icon">🌡️</span>
          <span className="envio-metric__value">
            {temp !== null ? `${temp.toFixed(1)}°` : "--"}
          </span>
          <span className="envio-metric__label">Temp</span>
        </div>

        <div className="envio-metric">
          <span className="envio-metric__icon">💧</span>
          <span className="envio-metric__value">
            {humedad !== null ? `${humedad.toFixed(0)}%` : "--"}
          </span>
          <span className="envio-metric__label">Humedad</span>
        </div>
      </div>

      {/* Ubicación GPS */}
      {(lat !== null && lng !== null) && (
        <div className="envio-card__location">
          <span className="envio-card__location-icon">📍</span>
          <span className="envio-card__location-text">
            {lat.toFixed(3)}, {lng.toFixed(3)}
          </span>
        </div>
      )}

      {/* Alerta crítica */}
      {isCritical && (
        <div className="envio-card__alert">
          ⚠️ TEMPERATURA CRÍTICA<br/>
          {temp?.toFixed(1)}°C (Límite: {temp > tempMax ? tempMax : tempMin}°C)
        </div>
      )}

      {/* Footer con información adicional */}
      <div className="envio-card__footer">
        {velocidad !== null && `${velocidad.toFixed(0)} km/h`}
        {velocidad !== null && " · "}En tránsito
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function MapContainer({ selectedEnvio, onSelectEnvio }) {
  const mapDivRef = useRef(null);
  const mapRef    = useRef(null);
  const layersRef = useRef([]);

  const { envios } = useEnvios();
  const [zoom, setZoom]               = useState(1);
  const [selectedForMap, setSelectedForMap] = useState(null);
  const [mapReady, setMapReady]       = useState(false);

  const vehiculoId = selectedEnvio?.id_vehiculo;
  const { telemetry } = useTelemetry(vehiculoId);

  // Inyectar estilos al montar
  useEffect(() => { injectStyles(); }, []);

  // ── generateRoute: EXACTAMENTE igual al original ──────────────────────────
  const generateRoute = useCallback((envio) => {
    if (!envio) return [];

    const startX = 50 + (envio.id_envio % 10) * 10;
    const startY = 50 + Math.floor(envio.id_envio / 10) * 10;

    const route = [
      { x: startX, y: startY, type: "inicio", label: "Origen" },
    ];

    for (let i = 1; i < 5; i++) {
      route.push({
        x: startX + i * 15 + Math.random() * 10,
        y: startY + Math.random() * 40 - 20,
        type: "checkpoint",
        label: `Checkpoint ${i}`,
      });
    }

    route.push({
      x: startX + 80,
      y: startY + 20,
      type: "fin",
      label: "Destino",
    });

    return route;
  }, []);

  // ── handleZoom: igual al original ────────────────────────────────────────
  const handleZoom = useCallback((direction) => {
    setZoom((prev) => {
      const newZoom = direction === "in" ? prev + 0.2 : Math.max(0.5, prev - 0.2);
      return Math.min(3, newZoom);
    });
    if (mapRef.current) {
      if (direction === "in") mapRef.current.zoomIn();
      else mapRef.current.zoomOut();
    }
  }, []);

  // ── Inicializar Leaflet ───────────────────────────────────────────────────
  useEffect(() => {
    loadLeaflet().then((L) => {
      if (!mapDivRef.current || mapRef.current) return;

      mapRef.current = L.map(mapDivRef.current, {
        center: [BASE_LAT, BASE_LNG],
        zoom: 9,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: 'Leaflet © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);

      setMapReady(true);
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // ── Dibujar rutas (misma lógica de colores del canvas original) ───────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const L = window.L;

    layersRef.current.forEach((l) => l.remove());
    layersRef.current = [];

    envios.forEach((envio) => {
      const route      = generateRoute(envio);
      const isSelected = selectedForMap?.id_envio === envio.id_envio;

      // Colores idénticos al canvas original
      const lineColor   = isSelected ? "#3b82f6" : "#d1d5db";
      const lineWeight  = isSelected ? 4 : 2;
      const lineOpacity = isSelected ? 1 : 0.5;

      const latLngs = route.map((p) => {
        const { lat, lng } = toLatLng(p.x, p.y);
        return [lat, lng];
      });

      const poly = L.polyline(latLngs, {
        color: lineColor, weight: lineWeight, opacity: lineOpacity,
      }).addTo(mapRef.current);
      layersRef.current.push(poly);

      // Puntos: mismos colores que el canvas original
      route.forEach((point) => {
        const { lat, lng } = toLatLng(point.x, point.y);
        let color, radius;
        if (point.type === "inicio")      { color = "#10b981"; radius = 8; }
        else if (point.type === "fin")    { color = "#ef4444"; radius = 8; }
        else                              { color = "#f59e0b"; radius = 5; }

        const circle = L.circleMarker([lat, lng], {
          radius, fillColor: color, fillOpacity: 1, color: "#fff", weight: 2,
        }).addTo(mapRef.current)
          .bindTooltip(`${point.label} — Envío #${envio.id_envio}`, { direction: "top" });

        // Hit-test equivalente al handleCanvasClick original
        circle.on("click", () => {
          setSelectedForMap(envio);
          onSelectEnvio(envio);
        });

        layersRef.current.push(circle);
      });

      // Posición actual (camión) al 70% — igual que el canvas original
      if (isSelected && telemetry) {
        const posIndex = Math.floor((route.length - 1) * 0.7);
        if (posIndex < route.length) {
          const pos = route[posIndex];
          const { lat, lng } = toLatLng(pos.x, pos.y);

          // Punto azul (equivale al arc azul del canvas)
          const truck = L.circleMarker([lat, lng], {
            radius: 10, fillColor: "#3b82f6", fillOpacity: 1, color: "#fff", weight: 2,
          }).addTo(mapRef.current).bindTooltip("Posición actual", { direction: "top" });
          layersRef.current.push(truck);

          // Aura (equivale al arc con globalAlpha 0.3)
          const aura = L.circleMarker([lat, lng], {
            radius: 16, fillColor: "#3b82f6", fillOpacity: 0.2, color: "#3b82f6", weight: 1,
          }).addTo(mapRef.current);
          layersRef.current.push(aura);
        }
      }
    });
  }, [mapReady, envios, selectedForMap, telemetry, generateRoute, onSelectEnvio]);

  // ── Si llega telemetría real con lat/lng, mover cámara ───────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !telemetry?.latitud || !telemetry?.longitud) return;
    mapRef.current.panTo([telemetry.latitud, telemetry.longitud]);
  }, [mapReady, telemetry]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="map-container">

      {/* Cabecera con controles originales */}
      <div className="map-header">
        <h2>Mapa Logístico</h2>
        <div className="map-controls">
          <button className="zoom-btn" onClick={() => handleZoom("in")} title="Zoom in">+</button>
          <span className="zoom-level">{(zoom * 100).toFixed(0)}%</span>
          <button className="zoom-btn" onClick={() => handleZoom("out")} title="Zoom out">−</button>
          {selectedForMap && (
            <button
              className="clear-btn"
              onClick={() => { setSelectedForMap(null); onSelectEnvio(null); }}
              title="Limpiar selección"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Mapa Leaflet */}
      <div className="map-canvas-wrapper">
        <div ref={mapDivRef} className="leaflet-map-div" />
        {!mapReady && <div className="map-loading">Cargando mapa...</div>}
      </div>

      {/* Tarjetas de envíos */}
      <div className="envio-cards-row">
        {envios.map((envio) => (
          <EnvioCard
            key={envio.id_envio}
            envio={envio}
            isSelected={selectedForMap?.id_envio === envio.id_envio}
            onSelect={(e) => { setSelectedForMap(e); onSelectEnvio(e); }}
          />
        ))}
      </div>

      {/* Info detalle seleccionado (lógica original) */}
      {selectedForMap && (
        <div className="map-info">
          <div className="info-item">
            <strong>Envío ID:</strong> {selectedForMap.id_envio}
          </div>
          <div className="info-item">
            <strong>Estado:</strong>{" "}
            <span style={{ color: "#10b981" }}>En tránsito</span>
          </div>
          {telemetry && (
            <>
              <div className="info-item">
                <strong>Temperatura:</strong> {telemetry.temperatura?.toFixed(1)}°C
              </div>
              <div className="info-item">
                <strong>Humedad:</strong> {telemetry.humedad?.toFixed(1)}%
              </div>
              <div className="info-item">
                <strong>Velocidad:</strong> {telemetry.velocidad?.toFixed(1)} km/h
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
