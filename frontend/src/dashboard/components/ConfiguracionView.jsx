/**
 * ConfiguracionView - Preferencias del dashboard
 */

import { useEffect, useState } from "react";
import storageService from "../services/storageService.js";

export default function ConfiguracionView() {
  const [prefs, setPrefs] = useState({
    theme: "light",
    showNotifications: true,
    autoRefresh: true,
    refreshInterval: 5000,
  });

  useEffect(() => {
    const saved = storageService.getPreferences();
    setPrefs(saved);
  }, []);

  const updatePref = (key, value) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    storageService.setPreferences(updated);
  };

  return (
    <div className="control-panel">
      <div style={{ marginBottom: "20px" }}>
        <h2 className="card-title" style={{ fontSize: "1.5rem", marginBottom: "4px" }}>Configuración</h2>
        <p className="muted">Preferencias de visualización y alertas</p>
      </div>

      <div className="simulation-layout" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <div className="panel-card">
          <div className="card-title">Interfaz</div>
          <div className="form-row">
            <label>
              Tema
              <select
                value={prefs.theme}
                onChange={(e) => updatePref("theme", e.target.value)}
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
              </select>
            </label>
            <label style={{ flexDirection: "row", alignItems: "center", gap: "10px", marginTop: "12px" }}>
              <input
                type="checkbox"
                checked={prefs.showNotifications}
                onChange={(e) => updatePref("showNotifications", e.target.checked)}
                style={{ width: "auto" }}
              />
              Notificaciones
            </label>
          </div>
        </div>

        <div className="panel-card">
          <div className="card-title">Actualización</div>
          <div className="form-row">
            <label style={{ flexDirection: "row", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <input
                type="checkbox"
                checked={prefs.autoRefresh}
                onChange={(e) => updatePref("autoRefresh", e.target.checked)}
                style={{ width: "auto" }}
              />
              Auto refresco
            </label>
            <label>
              Intervalo (ms)
              <input
                type="number"
                min={1000}
                step={500}
                value={prefs.refreshInterval}
                onChange={(e) => updatePref("refreshInterval", Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="panel-card">
          <div className="card-title">Seguridad</div>
          <div className="meta-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div>
              <span>Sesión</span>
              <strong style={{ fontSize: "0.9rem", marginTop: "8px" }}>Se mantiene activa mientras el token sea válido.</strong>
            </div>
            <div>
              <span>Roles</span>
              <strong style={{ fontSize: "0.9rem", marginTop: "8px" }}>ADMIN y USUARIO definidos en backend.</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
