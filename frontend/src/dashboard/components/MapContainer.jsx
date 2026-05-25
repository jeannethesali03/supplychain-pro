/**
 * MapContainer - Mapa logístico interactivo con rutas
 * Lógica original preservada · MapLibre GL reemplaza Leaflet · Rutas siguen calles reales de El Salvador
 * División dinámica de recorrido: negro (recorrido) y gris (restante)
 * CSS embebido directamente en el componente
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useTelemetry } from "../hooks/useTelemetry.js";
import apiService from "../services/apiService.js";

// ── CSS embebido - Professional SaaS Design & MapCN Overrides ──────────────────
const MAP_STYLES = `
  .map-container {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
    background: #ffffff;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .map-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: linear-gradient(to right, #ffffff, #f9fafb);
    border-bottom: 1px solid #e5e7eb;
  }

  .map-header h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1f2937;
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
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #f9fafb;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #374151;
    transition: all 0.15s ease;
  }

  .zoom-btn:hover {
    background: #f3f4f6;
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .zoom-level {
    font-size: 0.78rem;
    color: #6b7280;
    font-weight: 600;
    min-width: 40px;
    text-align: center;
  }

  .clear-btn {
    padding: 6px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #f9fafb;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
    transition: all 0.15s ease;
  }

  .clear-btn:hover {
    background: #fee2e2;
    border-color: #ef4444;
    color: #991b1b;
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
    background: #ffffff;
    color: #6b7280;
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
    border-top: 1px solid #e5e7eb;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: #d1d5db transparent;
  }

  .envio-cards-row::-webkit-scrollbar {
    height: 6px;
  }

  .envio-cards-row::-webkit-scrollbar-track {
    background: transparent;
  }

  .envio-cards-row::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }

  .envio-cards-row::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }

  .envio-card {
    flex: 0 0 240px;
    background: #ffffff;
    border: 1.5px solid #d1d5db;
    border-radius: 10px;
    padding: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .envio-card:hover {
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
    border-color: #3b82f6;
    transform: translateY(-2px);
  }

  .envio-card--selected {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  }

  .envio-card--critical {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  }

  .envio-card--critical:hover {
    box-shadow: 0 4px 20px rgba(239, 68, 68, 0.25);
    border-color: #ef4444;
  }

  .envio-card--critical.envio-card--selected {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
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
    color: #1f2937;
    letter-spacing: -0.3px;
  }

  .envio-card__tipo {
    font-size: 0.73rem;
    color: #6b7280;
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
    color: #1e40af;
  }

  .envio-card__incident-badge--critical {
    background: #fee2e2;
    color: #991b1b;
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
    background: #f9fafb;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .envio-metric--alert {
    background: #fef2f2;
    border-color: #fecaca;
  }

  .envio-metric__icon {
    font-size: 1.1rem;
  }

  .envio-metric__value {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1f2937;
  }

  .envio-metric--alert .envio-metric__value {
    color: #991b1b;
  }

  .envio-metric__label {
    font-size: 0.63rem;
    color: #6b7280;
    text-align: center;
    line-height: 1.2;
    font-weight: 500;
  }

  .envio-card__location {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px;
    background: #064e3b;
    border: 1px solid #065f46;
    border-radius: 6px;
    font-size: 0.72rem;
    color: #6ee7b7;
  }

  .envio-card__location-icon {
    font-size: 0.9rem;
  }

  .envio-card__location-text {
    font-weight: 600;
  }

  .envio-card__alert {
    background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%);
    color: #fecaca;
    font-size: 0.68rem;
    font-weight: 700;
    border: 1px solid #991b1b;
    border-radius: 6px;
    padding: 7px 8px;
    line-height: 1.4;
    text-align: center;
  }

  .envio-card__footer {
    font-size: 0.7rem;
    color: #64748b;
    border-top: 1px solid #1e293b;
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
    background: linear-gradient(to bottom, #1e293b, #0f172a);
    border-top: 1px solid #1e293b;
    font-size: 0.8rem;
    color: #f8fafc;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .info-item strong {
    font-weight: 700;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: #f8fafc;
  }

  .info-item span {
    color: #f8fafc;
    font-weight: 600;
  }

  /* ── Custom MapCN / MapLibre DOM Markers & Popups Styling ── */
  .custom-marker {
    border-radius: 50%;
    border: 2px solid #0f172a;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .custom-marker:hover {
    transform: scale(1.2);
  }

  .marker-origen {
    background-color: #10b981;
    width: 16px;
    height: 16px;
  }

  .marker-checkpoint {
    background-color: #f59e0b;
    width: 10px;
    height: 10px;
  }

  .marker-destino {
    background-color: #ef4444;
    width: 16px;
    height: 16px;
  }

  .marker-truck-wrapper {
    position: relative;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .marker-truck {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #0f172a;
    background-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    z-index: 2;
  }

  .marker-truck-pulse {
    position: absolute;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: rgba(59, 130, 246, 0.4);
    z-index: 1;
    animation: truck-pulsing 2s infinite ease-out;
    pointer-events: none;
  }

  @keyframes truck-pulsing {
    0% {
      transform: scale(0.5);
      opacity: 1;
    }
    100% {
      transform: scale(1.2);
      opacity: 0;
    }
  }

  .marker-ruptura-wrapper {
    position: relative;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .marker-ruptura {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #0f172a;
    background-color: #dc2626;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    z-index: 2;
  }

  .marker-ruptura-pulse {
    position: absolute;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: rgba(220, 38, 38, 0.4);
    z-index: 1;
    animation: ruptura-pulsing 1.8s infinite ease-out;
    pointer-events: none;
  }

  @keyframes ruptura-pulsing {
    0% {
      transform: scale(0.5);
      opacity: 1;
    }
    100% {
      transform: scale(1.3);
      opacity: 0;
    }
  }

  /* Custom MapLibre Popups */
  .maplibregl-popup-content {
    border-radius: 10px !important;
    padding: 0 !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3) !important;
    border: 1px solid #334155 !important;
    background-color: #1e293b !important;
    color: #f8fafc !important;
    overflow: hidden;
    font-family: inherit;
  }

  .maplibregl-popup-close-button {
    color: #94a3b8 !important;
    padding: 6px 10px !important;
    font-size: 1.1rem !important;
    outline: none !important;
  }

  .maplibregl-popup-close-button:hover {
    background-color: rgba(255,255,255,0.05) !important;
    color: #ffffff !important;
  }

  .custom-tooltip-content {
    padding: 6px 10px;
    background: #0f172a;
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 6px;
    pointer-events: none;
    border: 1px solid #1e293b;
    white-space: nowrap;
  }

  .tooltip-popup .maplibregl-popup-content {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
  }

  .tooltip-popup .maplibregl-popup-tip {
    display: none !important;
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

// ── Carga MapLibre GL desde CDN una sola vez ──────────────────────────────────
function loadMaplibre() {
  return new Promise((resolve) => {
    if (window.maplibregl) { resolve(window.maplibregl); return; }
    if (!document.getElementById("maplibre-css")) {
      const link = document.createElement("link");
      link.id = "maplibre-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@5.2.0/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }
    if (document.getElementById("maplibre-js")) {
      const t = setInterval(() => { if (window.maplibregl) { clearInterval(t); resolve(window.maplibregl); } }, 50);
      return;
    }
    const s = document.createElement("script");
    s.id = "maplibre-js";
    s.src = "https://unpkg.com/maplibre-gl@5.2.0/dist/maplibre-gl.js";
    s.onload = () => resolve(window.maplibregl);
    document.head.appendChild(s);
  });
}

// ── Centro base: El Salvador ──────────────────────────────────────────────────
const BASE_LAT = 13.7942;
const BASE_LNG = -88.8965;

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function toLatLng(x, y) {
  return {
    lat: BASE_LAT + (y - 100) * 0.004,
    lng: BASE_LNG + (x - 100) * 0.006,
  };
}

// ── splitRoute: divide la ruta de calles en segmento recorrido y segmento restante ──
function splitRoute(coords, targetLng, targetLat) {
  if (!coords || coords.length === 0) return { traveled: [], remaining: [] };
  if (coords.length === 1) return { traveled: coords, remaining: coords };

  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < coords.length; i++) {
    const lngDiff = coords[i][0] - targetLng;
    const latDiff = coords[i][1] - targetLat;
    const dist = lngDiff * lngDiff + latDiff * latDiff;
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
    }
  }

  // Trazo recorrido (negro): del inicio al nodo más cercano, cerrando exactamente en el camión
  const traveled = [...coords.slice(0, closestIndex + 1), [targetLng, targetLat]];
  // Trazo restante (gris): parte exactamente desde el camión, y sigue los nodos restantes
  const remaining = [[targetLng, targetLat], ...coords.slice(closestIndex)];

  return { traveled, remaining };
}

// ── Tarjeta individual - Professional Design ────────────────────────────────
function EnvioCard({ envio, isSelected, onSelect }) {
  const { telemetry } = useTelemetry(envio?.id_envio);

  const temp      = toNumber(telemetry?.temperatura);
  const humedad   = toNumber(telemetry?.humedad);
  const lat       = toNumber(telemetry?.latitud);
  const lng       = toNumber(telemetry?.longitud);

  const tempMax    = toNumber(envio?.temp_max_permitida) ?? 15;
  const tempMin    = toNumber(envio?.temp_min_permitida) ?? -5;
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
        {envio?.estado === "ENTREGADO"
          ? "Entregado"
          : envio?.estado === "CANCELADO"
            ? "Cancelado"
            : envio?.estado === "INCIDENTE_REPORTADO"
              ? "Incidente"
              : "En tránsito"}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function MapContainer({ selectedEnvio, onSelectEnvio, rupturas = [], envios = [] }) {
  const mapDivRef = useRef(null);
  const mapRef    = useRef(null);
  const markersRef = useRef([]);
  const routeCache = useRef({});

  const [zoom, setZoom]               = useState(1);
  const selectedForMap = selectedEnvio;
  const [mapReady, setMapReady]       = useState(false);
  const [mapLoaded, setMapLoaded]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rutas, setRutas]             = useState([]);
  const [roadRoutes, setRoadRoutes]   = useState({});

  const envioId = selectedEnvio?.id_envio;
  const { telemetry } = useTelemetry(envioId);
  const statusTextColor = selectedForMap?.estado === "ENTREGADO" ? "#86efac" : "#f8fafc";

  // Inyectar estilos al montar
  useEffect(() => { injectStyles(); }, []);

  // Cargar catálogo de rutas para usar coordenadas reales
  useEffect(() => {
    async function loadRutas() {
      try {
        const res = await apiService.getRutas();
        if (res.success && Array.isArray(res.data)) {
          setRutas(res.data);
        }
      } catch (err) {
        console.error("Error loading routes in MapContainer:", err);
      }
    }
    loadRutas();
  }, []);

  // ── generateRoute: usa rutas reales de la DB si están disponibles ───────────
  const generateRoute = useCallback((envio) => {
    if (!envio) return [];

    if (envio.id_ruta && rutas.length > 0) {
      const rutaEncontrada = rutas.find((r) => r.id_ruta === envio.id_ruta);
      if (rutaEncontrada) {
        try {
          const waypoints = typeof rutaEncontrada.waypoints_json === "string"
            ? JSON.parse(rutaEncontrada.waypoints_json)
            : rutaEncontrada.waypoints_json;

          if (Array.isArray(waypoints) && waypoints.length > 0) {
            return waypoints.map((wp, idx) => {
              let type = "checkpoint";
              let label = `Checkpoint ${idx}`;
              if (idx === 0) {
                type = "inicio";
                label = "Origen";
              } else if (idx === waypoints.length - 1) {
                type = "fin";
                label = "Destino";
              }
              return {
                lat: wp.lat,
                lng: wp.lng,
                type,
                label,
              };
            });
          }
        } catch (e) {
          console.error("Error al parsear waypoints_json:", e);
        }
      }
    }

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
  }, [rutas]);

  // ── fetchOSRMRoute: consulta OSRM y almacena en caché para evitar sobrecargar ─
  const fetchOSRMRoute = useCallback(async (points) => {
    if (points.length < 2) return points.map(p => [p.lng, p.lat]);

    const cacheKey = points.map(p => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`).join(";");
    if (routeCache.current[cacheKey]) {
      return routeCache.current[cacheKey];
    }

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${cacheKey}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.code === "Ok" && data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates; // [[lng, lat], ...]
          routeCache.current[cacheKey] = coords;
          return coords;
        }
      }
    } catch (e) {
      console.warn("La consulta de OSRM falló, se usará la línea recta como fallback:", e);
    }

    return points.map(p => [p.lng, p.lat]);
  }, []);

  // ── Resolver recorridos asíncronamente por carreteras reales ────────────────
  useEffect(() => {
    let active = true;
    async function resolveAllRoutes() {
      const resolved = {};
      for (const envio of envios) {
        const route = generateRoute(envio);
        const points = route.map((p) => {
          if (p.lat !== undefined && p.lng !== undefined) {
            return { lat: p.lat, lng: p.lng };
          }
          const { lat, lng } = toLatLng(p.x, p.y);
          return { lat, lng };
        });

        if (points.length >= 2) {
          const coords = await fetchOSRMRoute(points);
          resolved[envio.id_envio] = coords;
        } else {
          resolved[envio.id_envio] = points.map(p => [p.lng, p.lat]);
        }
      }
      if (active) {
        setRoadRoutes(resolved);
      }
    }
    if (envios.length > 0) {
      resolveAllRoutes();
    }
    return () => { active = false; };
  }, [envios, generateRoute, fetchOSRMRoute]);

  // ── handleZoom: igual al original adaptado a MapLibre ───────────────────────
  const handleZoom = useCallback((direction) => {
    if (mapRef.current) {
      if (direction === "in") mapRef.current.zoomIn();
      else mapRef.current.zoomOut();
    }
  }, []);

  // ── Inicializar MapLibre GL ────────────────────────────────────────────────
  useEffect(() => {
    loadMaplibre().then((maplibregl) => {
      if (!mapDivRef.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: mapDivRef.current,
        style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
        center: [BASE_LNG, BASE_LAT],
        zoom: 9,
        zoomControl: false,
        attributionControl: false
      });

      map.addControl(new maplibregl.AttributionControl({ compact: true }));

      mapRef.current = map;

      map.on("load", () => {
        setMapLoaded(true);
        setMapReady(true);
      });

      map.on("zoom", () => {
        const rawZoom = map.getZoom();
        setZoom(rawZoom / 9);
      });
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // ── Dibujar rutas (nativos GeoJSON layers) y marcadores interactivos (DOM) ────
  useEffect(() => {
    if (!mapReady || !mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    // ── 1. Dibujar rutas como polilíneas viales vectoriales (Recorrido negro, Restante gris) ──
    const features = [];
    envios.forEach((envio) => {
      const coords = roadRoutes[envio.id_envio];
      if (!coords || coords.length === 0) return;

      const isSelected = selectedForMap?.id_envio === envio.id_envio;

      if (isSelected) {
        // Encontrar coordenadas del camión
        let truckLng = null;
        let truckLat = null;

        const telemetryLat = toNumber(telemetry?.latitud);
        const telemetryLng = toNumber(telemetry?.longitud);

        if (telemetryLat !== null && telemetryLng !== null) {
          truckLng = telemetryLng;
          truckLat = telemetryLat;
        } else {
          // Fallback a posición en el 70% de la ruta
          const posIndex = Math.floor((coords.length - 1) * 0.7);
          if (posIndex < coords.length) {
            truckLng = coords[posIndex][0];
            truckLat = coords[posIndex][1];
          }
        }

        if (truckLng !== null && truckLat !== null) {
          // Dividir la ruta en tramo recorrido (traveled) y restante (remaining) sin huecos
          const { traveled, remaining } = splitRoute(coords, truckLng, truckLat);

          if (traveled.length > 0) {
            features.push({
              type: "Feature",
              properties: {
                id_envio: envio.id_envio,
                status: "traveled",
                isSelected: true
              },
              geometry: {
                type: "LineString",
                coordinates: traveled
              }
            });
          }

          if (remaining.length > 0) {
            features.push({
              type: "Feature",
              properties: {
                id_envio: envio.id_envio,
                status: "remaining",
                isSelected: true
              },
              geometry: {
                type: "LineString",
                coordinates: remaining
              }
            });
          }
        } else {
          // Fallback en caso de no poder calcular posición: todo restante
          features.push({
            type: "Feature",
            properties: {
              id_envio: envio.id_envio,
              status: "remaining",
              isSelected: true
            },
            geometry: {
              type: "LineString",
              coordinates: coords
            }
          });
        }
      } else {
        // Envío no seleccionado se dibuja como ruta gris claro y delgada
        features.push({
          type: "Feature",
          properties: {
            id_envio: envio.id_envio,
            status: "unselected",
            isSelected: false
          },
          geometry: {
            type: "LineString",
            coordinates: coords
          }
        });
      }
    });

    const routesGeoJSON = {
      type: "FeatureCollection",
      features: features
    };

    const source = map.getSource("routes-source");
    if (source) {
      source.setData(routesGeoJSON);
    } else {
      map.addSource("routes-source", {
        type: "geojson",
        data: routesGeoJSON
      });

      // Capa para envíos NO seleccionados (Gris oscuro/azul muy atenuado)
      map.addLayer({
        id: "routes-layer-unselected",
        type: "line",
        source: "routes-source",
        paint: {
          "line-color": "#475569",
          "line-width": 2.5,
          "line-opacity": 0.4
        },
        filter: ["==", ["get", "status"], "unselected"]
      });

      // Capa para recorrido RESTANTE del envío seleccionado (Gris claro / plata viales de alto contraste)
      map.addLayer({
        id: "routes-layer-remaining",
        type: "line",
        source: "routes-source",
        paint: {
          "line-color": "#cbd5e1",
          "line-width": 4.5,
          "line-opacity": 0.95
        },
        filter: ["==", ["get", "status"], "remaining"]
      });

      // Capa base/casing para recorrido YA REALIZADO (borde neon cian tecnológico para dar contraste premium al negro)
      map.addLayer({
        id: "routes-layer-traveled-casing",
        type: "line",
        source: "routes-source",
        paint: {
          "line-color": "#38bdf8",
          "line-width": 7,
          "line-opacity": 0.9
        },
        filter: ["==", ["get", "status"], "traveled"]
      });

      // Capa principal para recorrido YA REALIZADO (Negro puro sobre el casing cian)
      map.addLayer({
        id: "routes-layer-traveled",
        type: "line",
        source: "routes-source",
        paint: {
          "line-color": "#000000",
          "line-width": 4,
          "line-opacity": 1
        },
        filter: ["==", ["get", "status"], "traveled"]
      });
    }

    // ── 2. Limpiar marcadores DOM antiguos ──
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // ── 3. Dibujar nuevos marcadores (Checkpoints, Camión y Rupturas) ──
    envios.forEach((envio) => {
      const route = generateRoute(envio);
      const isSelected = selectedForMap?.id_envio === envio.id_envio;

      // Puntos de la ruta
      route.forEach((point) => {
        const lat = point.lat !== undefined ? point.lat : toLatLng(point.x, point.y).lat;
        const lng = point.lng !== undefined ? point.lng : toLatLng(point.x, point.y).lng;

        const markerEl = document.createElement("div");
        markerEl.className = "custom-marker";
        if (point.type === "inicio") {
          markerEl.classList.add("marker-origen");
        } else if (point.type === "fin") {
          markerEl.classList.add("marker-destino");
        } else {
          markerEl.classList.add("marker-checkpoint");
        }

        const tooltip = new window.maplibregl.Popup({
          offset: 10,
          closeButton: false,
          closeOnClick: false,
          className: "tooltip-popup"
        });

        markerEl.addEventListener("mouseenter", () => {
          tooltip.setLngLat([lng, lat])
            .setHTML(`<div class="custom-tooltip-content">${point.label} — Envío #${envio.id_envio}</div>`)
            .addTo(map);
        });
        markerEl.addEventListener("mouseleave", () => {
          tooltip.remove();
        });

        // Evento click para seleccionar envío
        markerEl.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectEnvio(envio);
        });

        const markerObj = new window.maplibregl.Marker({ element: markerEl })
          .setLngLat([lng, lat])
          .addTo(map);
        markersRef.current.push(markerObj);
      });

      // Camión logístico en tránsito (solo para el envío seleccionado)
      if (isSelected) {
        const telemetryLat = toNumber(telemetry?.latitud);
        const telemetryLng = toNumber(telemetry?.longitud);

        if (telemetryLat !== null && telemetryLng !== null) {
          const wrapper = document.createElement("div");
          wrapper.className = "marker-truck-wrapper";

          const pulse = document.createElement("div");
          pulse.className = "marker-truck-pulse";

          const truck = document.createElement("div");
          truck.className = "marker-truck";

          wrapper.appendChild(pulse);
          wrapper.appendChild(truck);

          const tooltip = new window.maplibregl.Popup({
            offset: 14,
            closeButton: false,
            closeOnClick: false,
            className: "tooltip-popup"
          });

          wrapper.addEventListener("mouseenter", () => {
            tooltip.setLngLat([telemetryLng, telemetryLat])
              .setHTML(`<div class="custom-tooltip-content">Posición actual</div>`)
              .addTo(map);
          });
          wrapper.addEventListener("mouseleave", () => {
            tooltip.remove();
          });

          const markerObj = new window.maplibregl.Marker({ element: wrapper })
            .setLngLat([telemetryLng, telemetryLat])
            .addTo(map);
          markersRef.current.push(markerObj);
        } else {
          // Fallback a posicionamiento por porcentaje estático (70%) de la ruta
          const posIndex = Math.floor((route.length - 1) * 0.7);
          if (posIndex < route.length) {
            const pos = route[posIndex];
            const fallbackLat = pos.lat !== undefined ? pos.lat : toLatLng(pos.x, pos.y).lat;
            const fallbackLng = pos.lng !== undefined ? pos.lng : toLatLng(pos.x, pos.y).lng;

            const wrapper = document.createElement("div");
            wrapper.className = "marker-truck-wrapper";

            const pulse = document.createElement("div");
            pulse.className = "marker-truck-pulse";

            const truck = document.createElement("div");
            truck.className = "marker-truck";

            wrapper.appendChild(pulse);
            wrapper.appendChild(truck);

            const tooltip = new window.maplibregl.Popup({
              offset: 14,
              closeButton: false,
              closeOnClick: false,
              className: "tooltip-popup"
            });

            wrapper.addEventListener("mouseenter", () => {
              tooltip.setLngLat([fallbackLng, fallbackLat])
                .setHTML(`<div class="custom-tooltip-content">Posición actual (Simulado)</div>`)
                .addTo(map);
            });
            wrapper.addEventListener("mouseleave", () => {
              tooltip.remove();
            });

            const markerObj = new window.maplibregl.Marker({ element: wrapper })
              .setLngLat([fallbackLng, fallbackLat])
              .addTo(map);
            markersRef.current.push(markerObj);
          }
        }

        // ── Marcadores de incidentes de temperatura (Rupturas) ──
        if (rupturas && rupturas.length > 0) {
          rupturas.forEach((r) => {
            const lat = toNumber(r.latitud);
            const lng = toNumber(r.longitud);
            if (lat !== null && lng !== null) {
              const temp = toNumber(r.temperatura)?.toFixed(1);
              const dateObj = new Date(r.marca_tiempo_dispositivo || r.marca_tiempo_servidor);
              const time = dateObj.toLocaleTimeString();
              const dateStr = dateObj.toLocaleDateString();
              const bateria = r.porcentaje_bateria ?? "N/A";
              const humedad = r.humedad ?? "N/A";

              const popupContent = `
                <div style="font-family: inherit; min-width: 160px; padding: 10px;">
                  <h4 style="margin: 0 0 8px 0; color: #dc2626; border-bottom: 1px solid #fecaca; padding-bottom: 4px; font-size: 0.9rem; font-weight: bold;">
                    ⚠️ Detalle de Incidente
                  </h4>
                  <div style="font-size: 0.8rem; color: #334155; display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; gap: 8px;">
                      <strong>Temperatura:</strong> <span style="color: #dc2626; font-weight: bold;">${temp}°C</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 8px;">
                      <strong>Humedad:</strong> <span>${humedad}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 8px;">
                      <strong>Batería:</strong> <span>${bateria}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 4px; border-top: 1px dashed #cbd5e1; padding-top: 4px; gap: 8px;">
                      <strong>Fecha:</strong> <span>${dateStr}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 8px;">
                      <strong>Hora:</strong> <span>${time}</span>
                    </div>
                  </div>
                </div>
              `;

              const wrapper = document.createElement("div");
              wrapper.className = "marker-ruptura-wrapper";

              const pulse = document.createElement("div");
              pulse.className = "marker-ruptura-pulse";

              const marker = document.createElement("div");
              marker.className = "marker-ruptura";

              wrapper.appendChild(pulse);
              wrapper.appendChild(marker);

              const popup = new window.maplibregl.Popup({ offset: 12 })
                .setHTML(popupContent);

              const tooltip = new window.maplibregl.Popup({
                offset: 12,
                closeButton: false,
                closeOnClick: false,
                className: "tooltip-popup"
              });

              wrapper.addEventListener("mouseenter", () => {
                tooltip.setLngLat([lng, lat])
                  .setHTML(`<div class="custom-tooltip-content">Ruptura Temp: ${temp}°C</div>`)
                  .addTo(map);
              });
              wrapper.addEventListener("mouseleave", () => {
                tooltip.remove();
              });

              const markerObj = new window.maplibregl.Marker({ element: wrapper })
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(map);
              markersRef.current.push(markerObj);
            }
          });
        }
      }
    });
  }, [mapReady, mapLoaded, envios, selectedForMap, telemetry, generateRoute, onSelectEnvio, rupturas, roadRoutes]);

  // ── Si llega telemetría real con lat/lng, mover cámara suavemente ────────────
  useEffect(() => {
    const lat = toNumber(telemetry?.latitud);
    const lng = toNumber(telemetry?.longitud);
    if (!mapReady || !mapRef.current || lat === null || lng === null) return;
    mapRef.current.panTo([lng, lat]);
  }, [mapReady, telemetry]);

  // Filtramos los envíos por el término de búsqueda
  const filteredEnvios = envios.filter((envio) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      String(envio.id_envio || "").includes(searchLower) ||
      (envio.codigo_rastreo && envio.codigo_rastreo.toLowerCase().includes(searchLower)) ||
      (envio.tipo_mercancia && envio.tipo_mercancia.toLowerCase().includes(searchLower)) ||
      (envio.origen && envio.origen.toLowerCase().includes(searchLower)) ||
      (envio.destino && envio.destino.toLowerCase().includes(searchLower))
    );
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="map-container">

      {/* Cabecera con controles originales y el buscador */}
      <div className="map-header">
        <h2 style={{ whiteSpace: "nowrap" }}>Mapa Logístico</h2>
        
        <div style={{ flex: 1, margin: "0 16px", maxWidth: "400px" }}>
          <input
            type="text"
            placeholder="Buscar por ID, código, origen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "7px 14px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#f8fafc", color: "#1f2937", fontSize: "0.85rem", outline: "none" }}
          />
        </div>

        <div className="map-controls">
          <button className="zoom-btn" onClick={() => handleZoom("in")} title="Zoom in">+</button>
          <span className="zoom-level">{(zoom * 100).toFixed(0)}%</span>
          <button className="zoom-btn" onClick={() => handleZoom("out")} title="Zoom out">−</button>
          {selectedForMap && (
            <button
              className="clear-btn"
              onClick={() => { onSelectEnvio(null); }}
              title="Limpiar selección"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Contenedor del Mapa MapLibre GL */}
      <div className="map-canvas-wrapper">
        <div ref={mapDivRef} className="leaflet-map-div" />
        {!mapReady && <div className="map-loading">Cargando mapa...</div>}
      </div>

      {/* Tarjetas de envíos */}
      <div className="envio-cards-row">
        {filteredEnvios.map((envio) => (
          <EnvioCard
            key={envio.id_envio}
            envio={envio}
            isSelected={selectedForMap?.id_envio === envio.id_envio}
            onSelect={onSelectEnvio}
          />
        ))}
        {filteredEnvios.length === 0 && (
          <div style={{ padding: "10px 20px", color: "#64748b", fontSize: "0.9rem", fontStyle: "italic" }}>
            No se encontraron envíos para tu búsqueda.
          </div>
        )}
      </div>

      {/* Info detalle seleccionado (lógica original) */}
      {selectedForMap && (
        <div className="map-info">
          <div className="info-item">
            <strong>Envío ID:</strong> {selectedForMap.id_envio}
          </div>
          <div className="info-item">
            <strong>Estado:</strong>{" "}
            <span style={{
              color: statusTextColor,
              fontWeight: "bold"
            }}>
              {selectedForMap.estado === "ENTREGADO"
                ? "Entregado"
                : selectedForMap.estado === "CANCELADO"
                  ? "Cancelado"
                  : selectedForMap.estado === "INCIDENTE_REPORTADO"
                    ? "Incidente"
                    : "En tránsito"}
            </span>
          </div>
          {telemetry && (
            <>
              <div className="info-item">
                <strong>Temperatura:</strong> {toNumber(telemetry.temperatura)?.toFixed(1)}°C
              </div>
              <div className="info-item">
                <strong>Humedad:</strong> {toNumber(telemetry.humedad)?.toFixed(1)}%
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
