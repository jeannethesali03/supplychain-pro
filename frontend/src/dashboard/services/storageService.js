/**
 * Storage Service - Persistencia de datos en localStorage
 * Mantiene estado de rutas, posiciones y datos históricos
 */

class StorageService {
  constructor() {
    this.prefix = "dashboard_logistico_";
  }

  /**
   * Genera clave con prefijo
   */
  key(name) {
    return `${this.prefix}${name}`;
  }

  /**
   * Guarda datos
   */
  set(name, data) {
    try {
      localStorage.setItem(this.key(name), JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("[Storage] Error guardando:", name, error);
      return false;
    }
  }

  /**
   * Obtiene datos
   */
  get(name, defaultValue = null) {
    try {
      const data = localStorage.getItem(this.key(name));
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error("[Storage] Error leyendo:", name, error);
      return defaultValue;
    }
  }

  /**
   * Elimina datos
   */
  remove(name) {
    localStorage.removeItem(this.key(name));
  }

  /**
   * Limpia todos los datos del dashboard
   */
  clear() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  // ====== Métodos específicos del Dashboard ======

  /**
   * Guarda la ruta actual del camión
   */
  setCurrentRoute(envioId, route) {
    this.set(`route_${envioId}`, {
      envioId,
      route,
      savedAt: new Date().toISOString(),
    });
  }

  /**
   * Obtiene la ruta guardada
   */
  getCurrentRoute(envioId) {
    return this.get(`route_${envioId}`);
  }

  /**
   * Guarda la posición actual
   */
  setCurrentPosition(vehiculoId, position) {
    this.set(`position_${vehiculoId}`, {
      vehiculoId,
      ...position,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Obtiene la posición actual
   */
  getCurrentPosition(vehiculoId) {
    return this.get(`position_${vehiculoId}`);
  }

  /**
   * Guarda el historial de incidentes
   */
  addIncident(incident) {
    const incidents = this.get("incidents_history", []);
    incidents.push({
      ...incident,
      savedAt: new Date().toISOString(),
    });
    // Mantener solo últimos 100 incidentes
    if (incidents.length > 100) {
      incidents.shift();
    }
    this.set("incidents_history", incidents);
  }

  /**
   * Obtiene historial de incidentes
   */
  getIncidents() {
    return this.get("incidents_history", []);
  }

  /**
   * Limpia incidentes
   */
  clearIncidents() {
    this.remove("incidents_history");
  }

  /**
   * Guarda último envío activo
   */
  setLastActiveEnvio(envioId) {
    this.set("last_active_envio", envioId);
  }

  /**
   * Obtiene último envío activo
   */
  getLastActiveEnvio() {
    return this.get("last_active_envio");
  }

  /**
   * Guarda estado del sidebar
   */
  setSidebarCollapsed(isCollapsed) {
    this.set("sidebar_collapsed", isCollapsed);
  }

  /**
   * Obtiene estado del sidebar
   */
  getSidebarCollapsed() {
    return this.get("sidebar_collapsed", false);
  }

  /**
   * Guarda filtros activos
   */
  setActiveFilters(filters) {
    this.set("active_filters", filters);
  }

  /**
   * Obtiene filtros activos
   */
  getActiveFilters() {
    return this.get("active_filters", {});
  }

  /**
   * Guarda estado de zoom del mapa
   */
  setMapZoom(zoom) {
    this.set("map_zoom", zoom);
  }

  /**
   * Obtiene zoom del mapa
   */
  getMapZoom() {
    return this.get("map_zoom", 1);
  }

  /**
   * Guarda centro del mapa
   */
  setMapCenter(center) {
    this.set("map_center", center);
  }

  /**
   * Obtiene centro del mapa
   */
  getMapCenter() {
    return this.get("map_center", { x: 0, y: 0 });
  }

  /**
   * Guarda dashboard preferences
   */
  setPreferences(prefs) {
    this.set("preferences", prefs);
  }

  /**
   * Obtiene dashboard preferences
   */
  getPreferences() {
    return this.get("preferences", {
      theme: "light",
      showNotifications: true,
      autoRefresh: true,
      refreshInterval: 5000,
    });
  }
}

export default new StorageService();
