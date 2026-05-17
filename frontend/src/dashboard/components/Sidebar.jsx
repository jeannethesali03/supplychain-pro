/**
 * Sidebar - Menú lateral de navegación
 */

import { useCallback } from "react";
import "../styles/sidebar.css";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "monitoreo", label: "Monitoreo", icon: "🚚" },
  { id: "incidentes", label: "Incidentes", icon: "⚠️" },
  { id: "historial", label: "Historial", icon: "📋" },
  { id: "configuracion", label: "Configuración", icon: "⚙️" },
];

export default function Sidebar({ collapsed, onToggle, activeView, onViewChange }) {
  const handleMenuClick = useCallback(
    (viewId) => {
      onViewChange(viewId);
    },
    [onViewChange]
  );

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Header del Sidebar */}
      <div className="sidebar-header">
        <div className="logo-container">
          {!collapsed && (
            <>
              <span className="logo-icon">📦</span>
              <div className="logo-text">
                <div className="logo-title">SUPPLYCHAIN PRO</div>
                <div className="logo-subtitle">Trazabilidad de Carga</div>
              </div>
            </>
          )}
        </div>
        <button
          className="toggle-btn"
          onClick={onToggle}
          title={collapsed ? "Expandir" : "Contraer"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${activeView === item.id ? "active" : ""}`}
            onClick={() => handleMenuClick(item.id)}
            title={item.label}
          >
            <span className="menu-icon">{item.icon}</span>
            {!collapsed && <span className="menu-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer del sidebar */}
      <div className="sidebar-footer">
        <div className="status-indicator">
          <span className="status-dot"></span>
          {!collapsed && <span className="status-text">En línea</span>}
        </div>
      </div>
    </aside>
  );
}
