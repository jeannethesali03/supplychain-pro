/**
 * Hook useEnvios - Manejo de datos de envíos
 */

import { useEffect, useState, useCallback } from "react";
import apiService from "../services/apiService.js";
import storageService from "../services/storageService.js";

export function useEnvios(autoLoad = true) {
  const [envios, setEnvios] = useState([]);
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadEnvios = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await apiService.getEnvios();

    if (result.success) {
      setEnvios(result.data || []);
      
      // Si hay un último envío activo, seleccionarlo
      const lastEnvio = storageService.getLastActiveEnvio();
      if (lastEnvio && result.data) {
        const found = result.data.find((e) => e.id_envio === parseInt(lastEnvio));
        if (found) {
          setSelectedEnvio(found);
        }
      }

      setError("");
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, []);

  // Cargar envíos al montar
  useEffect(() => {
    if (autoLoad) {
      loadEnvios();
    }
  }, [autoLoad, loadEnvios]);

  const selectEnvio = useCallback((envio) => {
    setSelectedEnvio(envio);
    if (envio) {
      storageService.setLastActiveEnvio(envio.id_envio);
    }
  }, []);

  const getEnvioById = useCallback(
    (id) => {
      return envios.find((e) => e.id_envio === parseInt(id));
    },
    [envios]
  );

  const refreshEnvios = useCallback(() => {
    return loadEnvios();
  }, [loadEnvios]);

  return {
    envios,
    selectedEnvio,
    loading,
    error,
    selectEnvio,
    getEnvioById,
    refreshEnvios,
  };
}
