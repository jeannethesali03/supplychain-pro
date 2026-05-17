/**
 * Navbar - Barra de navegación superior
 */

import { useCallback, useState } from "react";
import "../styles/navbar.css";
import { Link } from "react-router-dom";


const viewTitles = {
  dashboard: "Dashboard Logístico",
  monitoreo: "Monitoreo en Tiempo Real",
  incidentes: "Panel de Incidentes",
  historial: "Historial de Envíos",
  configuracion: "Configuración del Sistema",
};

export default function Navbar({
  user,
  onLogout,
  onToggleSidebar,
  currentView,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = useCallback(() => {
    setShowUserMenu(false);
    onLogout();
  }, [onLogout]);

  const toggleUserMenu = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  const viewTitle = viewTitles[currentView] || "Dashboard";

  return (
    <nav className="navbar">
      {/* Izquierda */}
      <div className="navbar-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title="Alternar sidebar"
        >
          ≡
        </button>
        <h1 className="navbar-title">{viewTitle}</h1>
      </div>

      {/* Centro - Nav + Indicador LIVE */}
<div className="navbar-center">
  <nav className="app-nav">
    <Link to="/" className="app-nav-link">⚙ Simulador</Link>
    <Link to="/dashboard" className="app-nav-link active">🗺 Dashboard</Link>
  </nav>
  <div className="live-indicator">
    <span className="live-dot"></span>
    <span className="live-text">EN VIVO</span>
  </div>
</div>

      {/* Derecha */}
      <div className="navbar-right">
        {/* Estado de conexión */}
        <div className="connection-status">
          <span className="status-icon">🔌</span>
          <span className="status-label">Conectado</span>
        </div>

        {/* Notificaciones */}
        <button className="navbar-button notification-btn" title="Notificaciones">
          🔔
        </button>

        {/* Usuario */}
        <div className="user-section">
          <button
            className="user-button"
            onClick={toggleUserMenu}
            title={user?.nombre_completo || "Usuario"}
          >
            <span className="user-avatar">{user?.nombre_completo?.charAt(0) || "U"}</span>
            <div className="user-info">
              <div className="user-name">{user?.nombre_completo || "Usuario"}</div>
              <div className="user-role">
                {user?.rol === "ADMIN"
                  ? "Administrador"
                  : "Operador Logístico"}
              </div>
            </div>
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="user-dropdown">
              <button
                className="dropdown-item logout-btn"
                onClick={handleLogout}
              >
                🚪 Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
