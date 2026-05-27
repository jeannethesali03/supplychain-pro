/**
 * FiltersPanel - Componente de filtros para estadísticas
 * Permite filtrar por fecha, vehículo, ruta y envío
 */

import { useState, useEffect } from "react";
import { useEnvios } from "../hooks/useEnvios.js";
import apiService from "../services/apiService.js";
import "./styles/FiltersPanel.css";

export default function FiltersPanel({ onFiltersChange }) {
  const { envios } = useEnvios();
  const [filters, setFilters] = useState({
    startDate: getDefaultStartDate(),
    endDate: new Date().toISOString().split("T")[0],
    vehiculoId: "",
    rutaId: "",
    envioId: ""
  });

  const [vehiculos, setVehiculos] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(false);

  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  }

  useEffect(() => {
    loadVehiculos();
    loadRutas();
    onFiltersChange(filters);
  }, []);

  const loadVehiculos = async () => {
    try {
      const res = await apiService.getVehiculos();
      if (res.success) {
        setVehiculos(res.data || []);
      }
    } catch (err) {
      console.error("Error loading vehiculos:", err);
    }
  };

  const loadRutas = async () => {
    try {
      const res = await apiService.getRutas();
      if (res.success) {
        setRutas(res.data || []);
      }
    } catch (err) {
      console.error("Error loading rutas:", err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const defaultFilters = {
      startDate: getDefaultStartDate(),
      endDate: new Date().toISOString().split("T")[0],
      vehiculoId: "",
      rutaId: "",
      envioId: ""
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <div className="filters-panel">
      <div className="filters-header">
        <h3>🔍 Filtros</h3>
        <button className="reset-btn" onClick={handleReset}>
          ↻ Restablecer
        </button>
      </div>

      <div className="filters-grid">
        {/* Rango de Fechas */}
        <div className="filter-group">
          <label>Desde:</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </div>

        <div className="filter-group">
          <label>Hasta:</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>

        {/* Vehículos */}
        <div className="filter-group">
          <label>Vehículo:</label>
          <select
            name="vehiculoId"
            value={filters.vehiculoId}
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            {vehiculos.map((v) => (
              <option key={v.id_vehiculo} value={v.id_vehiculo}>
                {v.placa || `Vehículo ${v.id_vehiculo}`}
              </option>
            ))}
          </select>
        </div>

        {/* Rutas */}
        <div className="filter-group">
          <label>Ruta:</label>
          <select
            name="rutaId"
            value={filters.rutaId}
            onChange={handleFilterChange}
          >
            <option value="">Todas</option>
            {rutas.map((r) => (
              <option key={r.id_ruta} value={r.id_ruta}>
                {r.nombre || `Ruta ${r.id_ruta}`}
              </option>
            ))}
          </select>
        </div>

        {/* Envíos */}
        <div className="filter-group">
          <label>Envío:</label>
          <select
            name="envioId"
            value={filters.envioId}
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            {envios.map((e) => (
              <option key={e.id_envio} value={e.id_envio}>
                {e.codigo_rastreo || `Envío ${e.id_envio}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
