/**
 * Hook useIncidents - Manejo de incidentes
 */

import { useEffect, useState, useCallback, useRef } from "react";
import apiService from "../services/apiService.js";
import socketService from "../services/socketService.js";
import storageService from "../services/storageService.js";

export function useIncidents(vehiculoId = null) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const unsubscribeRef = useRef(null);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError("");

    if (vehiculoId) {
      const result = await apiService.getIncidentesByVehiculo(vehiculoId);
      if (result.success) {
        setIncidents(result.data || []);
      } else {
        setError(result.error);
      }
    } else {
      const result = await apiService.getIncidentes();
      if (result.success) {
        setIncidents(result.data || []);
      } else {
        setError(result.error);
      }
    }

    setLoading(false);
  }, [vehiculoId]);

  const addIncident = useCallback((incident) => {
    setIncidents((prev) => [incident, ...prev]);
    storageService.addIncident(incident);
  }, []);

  // Cargar incidentes al montar
  useEffect(() => {
    loadIncidents();
    
    // Restaurar incidentes guardados
    const saved = storageService.getIncidents();
    if (saved && saved.length > 0) {
      setIncidents(saved);
    }
  }, [loadIncidents]);

  // Suscribirse a nuevos incidentes
  useEffect(() => {
    unsubscribeRef.current = socketService.onIncidentNew((incident) => {
      if (!vehiculoId || incident.id_vehiculo === vehiculoId) {
        addIncident(incident);
      }
    });

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [vehiculoId, addIncident]);

  const getSeverityColor = useCallback((severity) => {
    const colors = {
      critico: "#ef4444",
      advertencia: "#f59e0b",
      informativo: "#3b82f6",
    };
    return colors[severity?.toLowerCase()] || "#9ca3af";
  }, []);

  const getSeverityIcon = useCallback((severity) => {
    const icons = {
      critico: "⚠️",
      advertencia: "⚡",
      informativo: "ℹ️",
    };
    return icons[severity?.toLowerCase()] || "•";
  }, []);

  const getIncidentTypeLabel = useCallback((type) => {
    const labels = {
      temperatura_critica: "Temperatura Crítica",
      ruptura_cadena_frio: "Ruptura Cadena de Frío",
      geofencing: "Desvío de Ruta",
      bateria_baja: "Batería Baja",
      perdida_senal: "Pérdida de Señal",
      error_sensor: "Error de Sensor",
      humedad_critica: "Humedad Crítica",
    };
    return labels[type] || type || "Incidente Desconocido";
  }, []);

  const clearIncidents = useCallback(() => {
    setIncidents([]);
    storageService.clearIncidents();
  }, []);

  const refreshIncidents = useCallback(() => {
    return loadIncidents();
  }, [loadIncidents]);

  return {
    incidents,
    loading,
    error,
    addIncident,
    clearIncidents,
    refreshIncidents,
    getSeverityColor,
    getSeverityIcon,
    getIncidentTypeLabel,
  };
}
