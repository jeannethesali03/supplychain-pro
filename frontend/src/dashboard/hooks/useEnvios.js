/**
 * Hook useEnvios - Manejo de datos de envíos
 */

import { useEffect, useState } from "react";
import apiService from "../services/apiService.js";
import socketService from "../services/socketService.js";

export function useEnvios() {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEnvios = async () => {
      try {
        const response = await apiService.getEnvios();
        if (response && Array.isArray(response.data)) {
          setEnvios(response.data);
        } else {
          // Handle cases where response.data is not an array or is missing
          console.warn("La respuesta de la API de envíos no es un array válido:", response);
          setEnvios([]);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnvios();

    const handleNewTelemetry = (data) => {
      setEnvios((prevEnvios) =>
        prevEnvios.map((envio) =>
          envio.id_envio === data.id_envio
            ? { ...envio, telemetria: data }
            : envio
        )
      );
    };

    const handleNewIncident = (data) => {
      setEnvios((prevEnvios) =>
        prevEnvios.map((envio) =>
          envio.id_envio === data.id_envio
            ? { ...envio, incidencia: data }
            : envio
        )
      );
    };

    const unsubscribeTelemetry = socketService.onTelemetryUpdate(handleNewTelemetry);
    const unsubscribeIncident = socketService.onIncidentNew(handleNewIncident);

    return () => {
      if (unsubscribeTelemetry) unsubscribeTelemetry();
      if (unsubscribeIncident) unsubscribeIncident();
    };
  }, []);

  return { envios, loading, error };
}
