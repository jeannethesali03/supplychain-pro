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

  const normalizeIncident = useCallback((incident) => {
    if (!incident) return incident;
    const tipo = incident.tipo || incident.tipo_incidente;
    const timestamp = incident.timestamp || incident.fecha || incident.fecha_creacion;

    const severityByType = {
      RUPTURA_CADENA_FRIO: "critico",
      TEMPERATURA_CRITICA: "critico",
      BATERIA_BAJA: "advertencia",
      GEOFENCE_VIOLATION: "advertencia",
      PERDIDA_SENAL: "advertencia",
      HUMEDAD_CRITICA: "critico",
      ERROR_SENSOR: "informativo",
    };

    const severity = incident.severidad
      || severityByType[(tipo || "").toString().toUpperCase()]
      || "informativo";

    return {
      ...incident,
      tipo,
      severidad: severity,
      timestamp,
    };
  }, []);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = vehiculoId
      ? await apiService.getIncidentesByEnvio(vehiculoId)
      : await apiService.getIncidentes();

    if (result.success) {
      const normalized = (result.data || []).map(normalizeIncident);
      setIncidents(normalized);
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, [vehiculoId, normalizeIncident]);

  const addIncident = useCallback((incident) => {
    const normalized = normalizeIncident(incident);
    setIncidents((prev) => [normalized, ...prev]);
    storageService.addIncident(normalized);
  }, [normalizeIncident]);

  // Cargar incidentes al montar
  useEffect(() => {
    loadIncidents();
    
    // Restaurar incidentes guardados
    const saved = storageService.getIncidents();
    if (saved && saved.length > 0) {
      const filtered = vehiculoId
        ? saved.filter((item) => String(item.id_envio) === String(vehiculoId))
        : saved;
      setIncidents(filtered);
    }
  }, [loadIncidents, vehiculoId]);

  // Suscribirse a nuevos incidentes
  useEffect(() => {
    unsubscribeRef.current = socketService.onIncidentNew((incident) => {
      if (!vehiculoId || incident.id_envio === vehiculoId) {
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
      RUPTURA_CADENA_FRIO: "Ruptura Cadena de Frío",
      BATERIA_BAJA: "Batería Baja",
      GEOFENCE_VIOLATION: "Desvío de Ruta",
      PERDIDA_SENAL: "Pérdida de Señal",
      ERROR_SENSOR: "Error de Sensor",
      HUMEDAD_CRITICA: "Humedad Crítica",
      TEMPERATURA_CRITICA: "Temperatura Crítica",
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
