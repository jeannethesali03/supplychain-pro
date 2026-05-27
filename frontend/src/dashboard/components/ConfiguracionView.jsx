/**
 * EstadísticasView - Dashboard de Estadísticas Avanzado
 * Muestra gráficas interactivas sobre vehículos, rutas, ubicaciones e incidentes
 * Permite navegar al mapa haciendo clic en los datos
 */

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from "recharts";
import { useEstadisticas } from "../hooks/useEstadisticas.js";
import FiltersPanel from "./FiltersPanel.jsx";
import "./styles/ConfiguracionView.css";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8"
];

export default function EstadísticasView({ onNavigateToMap }) {
  const [filters, setFilters] = useState({
    startDate: getDefaultStartDate(),
    endDate: new Date().toISOString().split("T")[0],
    vehiculoId: "",
    rutaId: "",
    envioId: ""
  });

  const [selectedIncident, setSelectedIncident] = useState(null);

  const { vehiculos, rutas, tipos, ubicaciones, resumen, loading, error, refreshEstadisticas } = useEstadisticas(filters);

  const sanitizedUbicaciones = ubicaciones?.map((item) => ({
    ...item,
    latitud: item.latitud != null ? Number(item.latitud) : null,
    longitud: item.longitud != null ? Number(item.longitud) : null
  })) || [];

  const formatCoord = (value) => {
    return Number.isFinite(value) ? value.toFixed(4) : "N/A";
  };

  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleChartClick = (data, type) => {
    if (onNavigateToMap) {
      onNavigateToMap({ data, type });
    }
  };

  const handleUbicacionClick = (location) => {
    if (onNavigateToMap) {
      if (location.incidentes && location.incidentes.length > 0) {
        onNavigateToMap({
          type: "incident",
          incident: location.incidentes[0]
        });
      } else {
        onNavigateToMap({
          type: "ubicacion",
          latitude: location.latitud,
          longitude: location.longitud,
          incidentes: location.total_incidentes
        });
      }
    }
  };

  if (loading && !vehiculos?.length) {
    return (
      <div className="config-view-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="config-view-container">
      {/* Panel de Filtros */}
      <FiltersPanel onFiltersChange={handleFiltersChange} />

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={refreshEstadisticas} className="retry-btn">
            Reintentar
          </button>
        </div>
      )}

      {/* Resumen General */}
      {resumen && (
        <div className="summary-cards">
          <div className="card">
            <h3>Total Incidentes</h3>
            <p className="big-number">{resumen.total}</p>
          </div>
          <div className="card">
            <h3>Tipos Registrados</h3>
            <p className="big-number">{resumen.porTipo?.length || 0}</p>
          </div>
          <div className="card">
            <h3>Vehículos Afectados</h3>
            <p className="big-number">{vehiculos?.length || 0}</p>
          </div>
          <div className="card">
            <h3>Rutas Afectadas</h3>
            <p className="big-number">{rutas?.length || 0}</p>
          </div>
          <div className="card">
            <h3>Ubicaciones Críticas</h3>
            <p className="big-number">{ubicaciones?.length || 0}</p>
          </div>
        </div>
      )}

      {/* Gráficas */}
      <div className="charts-grid">
        {/* Gráfica de Vehículos */}
        <div className="chart-container clickable">
          <h3>📦 Incidentes por Vehículo</h3>
          {vehiculos?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={vehiculos}
                onClick={(state) => {
                  if (state.activeTooltipIndex !== undefined) {
                    handleChartClick(vehiculos[state.activeTooltipIndex], "vehiculo");
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="vehiculo"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />
                <Bar
                  dataKey="total_incidentes"
                  fill="#0088FE"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => handleChartClick(data, "vehiculo")}
                  style={{ cursor: "pointer" }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-message">Sin datos disponibles</p>
          )}
          <p className="hint-text">💡 Haz clic en una barra para ver detalles en el mapa</p>
        </div>

        {/* Gráfica de Rutas */}
        <div className="chart-container clickable">
          <h3>🛣️ Incidentes por Ruta</h3>
          {rutas?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={rutas}
                onClick={(state) => {
                  if (state.activeTooltipIndex !== undefined) {
                    handleChartClick(rutas[state.activeTooltipIndex], "ruta");
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ruta"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />
                <Bar
                  dataKey="total_incidentes"
                  fill="#00C49F"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => handleChartClick(data, "ruta")}
                  style={{ cursor: "pointer" }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-message">Sin datos disponibles</p>
          )}
          <p className="hint-text">💡 Haz clic en una barra para ver detalles en el mapa</p>
        </div>

        {/* Gráfica de Tipos de Incidentes */}
        <div className="chart-container">
          <h3>⚠️ Distribución por Tipo</h3>
          {tipos?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tipos}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tipo_incidente, total_incidentes }) =>
                    `${tipo_incidente}: ${total_incidentes}`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_incidentes"
                >
                  {tipos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-message">Sin datos disponibles</p>
          )}
        </div>

        {/* Gráfica de Ubicaciones */}
        <div className="chart-container clickable full-width">
          <h3>📍 Incidentes por Ubicación Geográfica</h3>
          {sanitizedUbicaciones.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="longitud"
                  name="Longitud"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="latitud"
                  name="Latitud"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="custom-tooltip">
                          <p><strong>Lat:</strong> {formatCoord(data.latitud)}</p>
                          <p><strong>Lon:</strong> {formatCoord(data.longitud)}</p>
                          <p><strong>Incidentes:</strong> {data.total_incidentes}</p>
                          <p><strong>Tipos:</strong> {data.tipos}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  name="Ubicaciones"
                  data={sanitizedUbicaciones}
                  fill="#FF8042"
                  onClick={(state) => {
                    if (state.payload) {
                      handleUbicacionClick(state.payload);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {sanitizedUbicaciones.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity={0.7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-message">Sin datos de ubicación disponibles</p>
          )}
          <p className="hint-text">💡 Haz clic en un punto para ver esa ubicación en el mapa</p>
        </div>
      </div>

      {/* Tabla Detallada de Tipos */}
      <div className="details-section">
        <h3>📋 Detalle de Tipos de Incidentes</h3>
        {tipos?.length > 0 ? (
          <div className="table-wrapper">
            <table className="details-table">
              <thead>
                <tr>
                  <th>Tipo de Incidente</th>
                  <th>Total</th>
                  <th>Primer Incidente</th>
                  <th>Último Incidente</th>
                </tr>
              </thead>
              <tbody>
                {tipos.map((tipo, idx) => (
                  <tr key={idx}>
                    <td>{tipo.tipo_incidente}</td>
                    <td className="number">{tipo.total_incidentes}</td>
                    <td>{new Date(tipo.primer_incidente).toLocaleDateString()}</td>
                    <td>{new Date(tipo.ultimo_incidente).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-message">Sin datos disponibles</p>
        )}
      </div>

      {/* Tabla de Ubicaciones */}
      <div className="details-section">
        <h3>📍 Ubicaciones con Incidentes</h3>
        {sanitizedUbicaciones.length > 0 ? (
          <div className="table-wrapper">
            <table className="details-table">
              <thead>
                <tr>
                  <th>Latitud</th>
                  <th>Longitud</th>
                  <th>Total Incidentes</th>
                  <th>Tipos</th>
                  <th>Vehículos</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {sanitizedUbicaciones.slice(0, 10).map((ubicacion, idx) => (
                  <tr key={idx}>
                    <td>{formatCoord(ubicacion.latitud)}</td>
                    <td>{formatCoord(ubicacion.longitud)}</td>
                    <td className="number">{ubicacion.total_incidentes}</td>
                    <td className="small-text">{ubicacion.tipos}</td>
                    <td className="small-text">{ubicacion.vehiculos_afectados}</td>
                    <td>
                      <button
                        className="map-btn"
                        onClick={() => handleUbicacionClick(ubicacion)}
                      >
                        Ver en Mapa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-message">Sin datos de ubicación disponibles</p>
        )}
      </div>
    </div>
  );
}

