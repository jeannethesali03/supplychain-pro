/**
 * API Service - Consumidor de APIs del backend SupplyChain Pro
 * Maneja autenticación, headers, y todas las llamadas HTTP
 */

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001/api";

class ApiService {
  constructor() {
    this.baseUrl = API_BASE;
    this.token = localStorage.getItem("token") || "";
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.setToken("");
          throw new Error("No autenticado");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      return { success: false, error: error.message };
    }
  }

  // ====== Autenticación ======
  async login(correo, contrasena) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ correo, contrasena }),
    });
  }

  async logout() {
    this.setToken("");
    return { success: true };
  }

  // ====== Envíos ======
  async getEnvios(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/envios${query ? `?${query}` : ""}`;
    return this.request(endpoint);
  }

  async getEnvioById(id) {
    return this.request(`/envios/${id}`);
  }

  // ====== Vehículos ======
  async getVehiculos(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/vehiculos${query ? `?${query}` : ""}`;
    return this.request(endpoint);
  }

  async getVehiculoById(id) {
    return this.request(`/vehiculos/${id}`);
  }

  // ====== Telemetría ======
  async getTelemetria(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/registrosTelemetria${query ? `?${query}` : ""}`;
    return this.request(endpoint);
  }

  async getTelemetriaByVehiculo(vehiculoId) {
    return this.request(`/registrosTelemetria?id_vehiculo=${vehiculoId}`);
  }

  async getUltimaTelemetria(vehiculoId) {
    const result = await this.getTelemetriaByVehiculo(vehiculoId);
    if (result.success && result.data && result.data.length > 0) {
      return { success: true, data: result.data[0] };
    }
    return result;
  }

  // ====== Incidentes ======
  async getIncidentes(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/incidentes${query ? `?${query}` : ""}`;
    return this.request(endpoint);
  }

  async getIncidentesByVehiculo(vehiculoId) {
    return this.request(`/incidentes?id_vehiculo=${vehiculoId}`);
  }

  // ====== Rutas ======
  async getRutas(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/rutas${query ? `?${query}` : ""}`;
    return this.request(endpoint);
  }

  async getRutaById(id) {
    return this.request(`/rutas/${id}`);
  }

  // ====== Envios-Vehiculos ======
  async getEnviosVehiculos(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/envios-vehiculos${query ? `?${query}` : ""}`;
    return this.request(endpoint);
  }

  // ====== Detalles Envío ======
  async getDetallesEnvio(envioId) {
    return this.request(`/detallesEnvio/${envioId}`);
  }

  // ====== Simulator ======
  async getSimulatorHealth() {
    return this.request("/simulator/health");
  }

  async startSimulator() {
    return this.request("/simulator/start", { method: "POST" });
  }

  async stopSimulator() {
    return this.request("/simulator/stop", { method: "POST" });
  }
}

export default new ApiService();
