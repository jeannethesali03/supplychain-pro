/**
 * Socket Service - Manejo de WebSocket en tiempo real
 * Se conecta al backend para recibir telemetría, incidentes y eventos en vivo
 */

import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001/api";
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, "");

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.connected = false;
  }

  connect(token) {
    if (this.socket && this.socket.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });

    // Eventos de conexión
    this.socket.on("connect", () => {
      this.connected = true;
      this.emit("connected");
      console.log("[Socket] Conectado");
    });

    this.socket.on("disconnect", () => {
      this.connected = true;
      this.emit("disconnected");
      console.log("[Socket] Desconectado");
    });

    this.socket.on("connect_error", (error) => {
      console.error("[Socket] Error de conexión:", error);
      this.emit("connection_error", error);
    });

    // Eventos de telemetría
    this.socket.on("telemetria:nueva", (data) => {
      this.emit("telemetry:new", data);
    });

    this.socket.on("telemetria:actualización", (data) => {
      this.emit("telemetry:update", data);
    });

    // Eventos de incidentes
    this.socket.on("incidente:nuevo", (data) => {
      this.emit("incident:new", data);
    });

    this.socket.on("incidente:resuelto", (data) => {
      this.emit("incident:resolved", data);
    });

    // Eventos de envíos
    this.socket.on("envio:estado", (data) => {
      this.emit("envio:status_change", data);
    });

    this.socket.on("envio:completado", (data) => {
      this.emit("envio:completed", data);
    });

    // Eventos del simulador
    this.socket.on("simulator:posicion", (data) => {
      this.emit("simulator:position", data);
    });

    this.socket.on("simulator:evento", (data) => {
      this.emit("simulator:event", data);
    });

    this.socket.on("simulator:estado", (data) => {
      this.emit("simulator:status", data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  /**
   * Registra un listener para un evento
   * @param {string} event - Nombre del evento
   * @param {function} callback - Función a ejecutar
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Retorna función para desuscribirse
    return () => {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Emite un evento a todos los listeners
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos a pasar
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener de ${event}:`, error);
        }
      });
    }
  }

  /**
   * Emite un evento al servidor
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos a enviar
   * @param {function} callback - Callback opcional
   */
  emit_to_server(event, data, callback) {
    if (this.socket && this.socket.connected) {
      if (callback) {
        this.socket.emit(event, data, callback);
      } else {
        this.socket.emit(event, data);
      }
    } else {
      console.warn("[Socket] No conectado, no se puede emitir:", event);
    }
  }

  // Helpers para suscribirse a eventos específicos
  onTelemetryNew(callback) {
    return this.on("telemetry:new", callback);
  }

  onTelemetryUpdate(callback) {
    return this.on("telemetry:update", callback);
  }

  onIncidentNew(callback) {
    return this.on("incident:new", callback);
  }

  onSimulatorPosition(callback) {
    return this.on("simulator:position", callback);
  }

  onSimulatorStatus(callback) {
    return this.on("simulator:status", callback);
  }

  onConnectionStatus(callback) {
    const unsubscribe1 = this.on("connected", () => callback(true));
    const unsubscribe2 = this.on("disconnected", () => callback(false));
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }
}

export default new SocketService();
