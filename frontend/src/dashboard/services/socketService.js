/**
 * Socket Service - Manejo de WebSocket en tiempo real
 * Se conecta al backend para recibir telemetría, incidentes y eventos en vivo
 */

import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE
  ? import.meta.env.VITE_API_BASE.replace(/\/api\/?$/, "")
  : "http://localhost:5001";

class SocketManager {
  constructor() {
    if (SocketManager.instance) {
      return SocketManager.instance;
    }
    this.socket = null;
    SocketManager.instance = this;
  }

  connect(token) {
    if (this.socket && this.socket.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("[Socket] Conectado");
    });

    this.socket.on("disconnect", () => {
      console.log("[Socket] Desconectado");
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket ? this.socket.connected : false;
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  _subscribe(event, callback) {
    if (!this.socket) return () => {};
    this.socket.on(event, callback);
    return () => this.socket.off(event, callback);
  }

  onTelemetryUpdate(callback) {
    return this._subscribe("telemetry:new", callback);
  }

  onIncidentNew(callback) {
    return this._subscribe("incident:new", callback);
  }

  onEnvioUpdated(callback) {
    return this._subscribe("envio:updated", callback);
  }

  onEnvioCreated(callback) {
    return this._subscribe("envio:created", callback);
  }

  onSimulatorPosition(callback) {
    return this._subscribe("simulator:posicion", callback);
  }

  onConnectionStatus(callback) {
    if (!this.socket) return () => {};
    const handleConnect = () => callback(true);
    const handleDisconnect = () => callback(false);
    this.socket.on("connect", handleConnect);
    this.socket.on("disconnect", handleDisconnect);
    callback(this.socket.connected);
    return () => {
      this.socket.off("connect", handleConnect);
      this.socket.off("disconnect", handleDisconnect);
    };
  }
}

const socketService = new SocketManager();
export default socketService;
