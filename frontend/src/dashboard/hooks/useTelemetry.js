/**
 * Hook useTelemetry - Manejo de telemetría en tiempo real
 */

import { useEffect, useState, useCallback, useRef } from "react";
import apiService from "../services/apiService.js";
import socketService from "../services/socketService.js";

export function useTelemetry(vehiculoId) {
  const [telemetry, setTelemetry] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("unknown");
  const unsubscribeRef = useRef(null);
  const unsubscribePositionRef = useRef(null);

  const loadTelemetry = useCallback(async () => {
    if (!vehiculoId) return;

    setLoading(true);
    setError("");

    const result = await apiService.getUltimaTelemetria(vehiculoId);

    if (result.success && result.data) {
      setTelemetry(result.data);
      setHistory([result.data]);
    } else if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  }, [vehiculoId]);

  const addToHistory = useCallback((data) => {
    setHistory((prev) => {
      const updated = [data, ...prev];
      // Mantener solo últimos 100 registros
      return updated.slice(0, 100);
    });
  }, []);

  // Cargar telemetría inicial
  useEffect(() => {
    if (vehiculoId) {
      loadTelemetry();
    }
  }, [vehiculoId, loadTelemetry]);

  // Suscribirse a actualizaciones en tiempo real
  useEffect(() => {
    if (!vehiculoId) return;

    // Suscribirse a nuevas telemetrías
    unsubscribeRef.current = socketService.onTelemetryUpdate((data) => {
      if (data && data.id_vehiculo === parseInt(vehiculoId)) {
        setTelemetry(data);
        addToHistory(data);
      }
    });

    // Suscribirse a cambios de posición del simulador
    unsubscribePositionRef.current = socketService.onSimulatorPosition((data) => {
      if (data && data.id_vehiculo === parseInt(vehiculoId)) {
        setTelemetry((prev) => ({
          ...prev,
          ...data,
          timestamp: new Date().toISOString(),
        }));
        addToHistory({
          id_vehiculo: vehiculoId,
          ...data,
        });
      }
    });

    // Suscribirse al estado de conexión
    const unsubscribeConnection = socketService.onConnectionStatus((status) => {
      setConnectionStatus(status ? "connected" : "disconnected");
    });

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (unsubscribePositionRef.current) unsubscribePositionRef.current();
      if (unsubscribeConnection) unsubscribeConnection();
    };
  }, [vehiculoId, addToHistory]);

  const getStatus = useCallback(() => {
    if (!telemetry) return "sin_datos";

    const temp = telemetry.temperatura;
    const humidity = telemetry.humedad;

    // Rangos típicos para mercancía perecedera
    if (temp < -18 || temp > 8 || humidity > 85) {
      return "critico"
    }
    if (temp < -20 || temp > 10 || humidity > 90) {
      return "advertencia";
    }
    if (connectionStatus === "disconnected") {
      return "sin_conexion";
    }

    return "normal";
  }, [telemetry, connectionStatus]);

  const getStatusColor = useCallback(() => {
    const status = getStatus();
    const colors = {
      normal: "#10b981",
      advertencia: "#f59e0b",
      critico: "#ef4444",
      sin_conexion: "#9ca3af",
      sin_datos: "#9ca3af",
    };
    return colors[status] || "#9ca3af";
  }, [getStatus]);

  const getStatusText = useCallback(() => {
    const status = getStatus();
    const texts = {
      normal: "Normal",
      advertencia: "Advertencia",
      critico: "CRÍTICO",
      sin_conexion: "Sin conexión",
      sin_datos: "Sin datos",
    };
    return texts[status] || "Desconocido";
  }, [getStatus]);

  return {
    telemetry,
    history,
    loading,
    error,
    connectionStatus,
    status: getStatus(),
    statusColor: getStatusColor(),
    statusText: getStatusText(),
    refresh: loadTelemetry,
  };
}
