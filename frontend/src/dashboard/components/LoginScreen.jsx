/**
 * LoginScreen - Pantalla de login para el dashboard
 */

import { useCallback, useState } from "react";
import "../styles/login.css";

export default function LoginScreen({ onLogin, loading, error }) {
  const [correo, setCorreo] = useState("admin@local.test");
  const [contrasena, setContrasena] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (correo && contrasena) {
        onLogin(correo, contrasena);
      }
    },
    [correo, contrasena, onLogin]
  );

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Logo */}
        <div className="login-header">
          <div className="login-logo">📦</div>
          <h1>SUPPLYCHAIN PRO</h1>
          <p className="login-subtitle">Trazabilidad de Carga</p>
        </div>

        {/* Mensaje introductorio */}
        <p className="login-intro">
          Sistema de Monitoreo Logístico en Tiempo Real
        </p>

        {/* Formulario de login */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email */}
          <div className="form-group">
            <label htmlFor="correo" className="form-label">
              Correo Electrónico
            </label>
            <input
              id="correo"
              type="email"
              className="form-input"
              placeholder="admin@local.test"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label htmlFor="contrasena" className="form-label">
              Contraseña
            </label>
            <div className="password-input-group">
              <input
                id="contrasena"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <div className="error-message">{error}</div>}

          {/* Botón de envío */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Conectando..." : "Iniciar Sesión"}
          </button>
        </form>

        {/* Credenciales de prueba */}
        <div className="login-footer">
          <p className="demo-credentials">
            <strong>Demostración:</strong><br/>
            admin@local.test / admin123
          </p>
        </div>
      </div>

      {/* Fondo decorativo */}
      <div className="login-background">
        <div className="floating-element element-1">📦</div>
        <div className="floating-element element-2">🚚</div>
        <div className="floating-element element-3">📍</div>
      </div>
    </div>
  );
}
