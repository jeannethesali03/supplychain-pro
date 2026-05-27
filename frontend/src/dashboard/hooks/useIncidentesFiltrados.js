/**
 * Hook useIncidentesFiltrados - Manejo de incidentes con filtros
 */

import { useEffect, useState, useCallback } from "react";
import apiService from "../services/apiService.js";

export function useIncidentesFiltrados(filters = {}) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiService.getIncidentesFiltrados(filters);
      if (result.success) {
        setIncidents(result.data || []);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  return {
    incidents,
    loading,
    error,
    refreshIncidents: loadIncidents
  };
}
