/**
 * Hook useEstadisticas - Manejo de estadísticas de incidentes
 */

import { useEffect, useState, useCallback } from "react";
import apiService from "../services/apiService.js";
import { getIncidentTypeLabel } from "../utils/formatters.js";

export function useEstadisticas(filters) {
  const [stats, setStats] = useState({
    vehiculos: [],
    rutas: [],
    tipos: [],
    ubicaciones: [],
    resumen: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { startDate, endDate, vehiculoId, rutaId, envioId } = filters || {};

  const loadEstadisticas = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await apiService.getIncidentesFiltrados({
        startDate,
        endDate,
        vehiculoId,
        rutaId,
        envioId
      });

      if (res.success && Array.isArray(res.data)) {
        const incidentesList = res.data;

        // 1. Resumen General
        const total = incidentesList.length;
        const tiposMapForResumen = {};
        incidentesList.forEach(inc => {
          const rawType = inc.tipo_incidente || "OTRO";
          const t = getIncidentTypeLabel(rawType);
          tiposMapForResumen[t] = (tiposMapForResumen[t] || 0) + 1;
        });
        const porTipo = Object.entries(tiposMapForResumen).map(([tipo, count]) => ({
          tipo_incidente: tipo,
          count
        }));
        const resumen = { total, porTipo };

        // 2. Incidentes por Vehículo
        const vehiculosMap = {};
        incidentesList.forEach(inc => {
          const key = inc.id_vehiculo || 0;
          const label = inc.vehiculo_placa || (inc.id_vehiculo ? `Vehículo #${inc.id_vehiculo}` : "Sin asignar");
          if (!vehiculosMap[key]) {
            vehiculosMap[key] = {
              id_vehiculo: key,
              vehiculo: label,
              total_incidentes: 0
            };
          }
          vehiculosMap[key].total_incidentes++;
        });
        const vehiculosData = Object.values(vehiculosMap).sort((a, b) => b.total_incidentes - a.total_incidentes);

        // 3. Incidentes por Ruta
        const rutasMap = {};
        incidentesList.forEach(inc => {
          const key = inc.nombre_ruta || "Sin ruta";
          if (!rutasMap[key]) {
            rutasMap[key] = {
              ruta: key,
              total_incidentes: 0
            };
          }
          rutasMap[key].total_incidentes++;
        });
        const rutasData = Object.values(rutasMap).sort((a, b) => b.total_incidentes - a.total_incidentes);

        // 4. Distribución por Tipo de Incidente
        const tiposDetalleMap = {};
        incidentesList.forEach(inc => {
          const rawType = inc.tipo_incidente || "OTRO";
          const t = getIncidentTypeLabel(rawType);
          const f = inc.fecha_incidente || inc.fecha_creacion;
          if (!tiposDetalleMap[t]) {
            tiposDetalleMap[t] = {
              tipo_incidente: t,
              total_incidentes: 0,
              primer_incidente: f,
              ultimo_incidente: f
            };
          }
          tiposDetalleMap[t].total_incidentes++;
          if (new Date(f) < new Date(tiposDetalleMap[t].primer_incidente)) {
            tiposDetalleMap[t].primer_incidente = f;
          }
          if (new Date(f) > new Date(tiposDetalleMap[t].ultimo_incidente)) {
            tiposDetalleMap[t].ultimo_incidente = f;
          }
        });
        const tiposData = Object.values(tiposDetalleMap).sort((a, b) => b.total_incidentes - a.total_incidentes);

        // 5. Ubicaciones Geográficas
        const ubicacionesMap = {};
        incidentesList.forEach(inc => {
          if (inc.latitud == null || inc.longitud == null) return;
          const lat = Number(inc.latitud);
          const lon = Number(inc.longitud);
          const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
          const vLabel = inc.vehiculo_placa || (inc.id_vehiculo ? `#${inc.id_vehiculo}` : "N/A");
          const tLabel = inc.tipo_incidente ? getIncidentTypeLabel(inc.tipo_incidente) : "";
          
          if (!ubicacionesMap[key]) {
            ubicacionesMap[key] = {
              latitud: lat,
              longitud: lon,
              total_incidentes: 0,
              tiposSet: new Set(),
              vehiculosSet: new Set(),
              incidentes: []
            };
          }
          ubicacionesMap[key].total_incidentes++;
          if (tLabel) ubicacionesMap[key].tiposSet.add(tLabel);
          if (vLabel) ubicacionesMap[key].vehiculosSet.add(vLabel);
          ubicacionesMap[key].incidentes.push(inc);
        });
        const ubicacionesData = Object.values(ubicacionesMap).map(u => ({
          ...u,
          tipos: Array.from(u.tiposSet).join(", "),
          vehiculos_afectados: Array.from(u.vehiculosSet).join(", ")
        })).sort((a, b) => b.total_incidentes - a.total_incidentes);

        setStats({
          vehiculos: vehiculosData,
          rutas: rutasData,
          tipos: tiposData,
          ubicaciones: ubicacionesData,
          resumen
        });
      } else {
        setError(res.error || "Error al procesar las estadísticas");
      }
    } catch (err) {
      console.error("Error en hook useEstadisticas:", err);
      setError(`Error al cargar estadísticas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, vehiculoId, rutaId, envioId]);

  useEffect(() => {
    loadEstadisticas();
  }, [loadEstadisticas]);

  return {
    ...stats,
    loading,
    error,
    refreshEstadisticas: loadEstadisticas
  };
}
