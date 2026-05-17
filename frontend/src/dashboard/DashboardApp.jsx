/**
 * DashboardApp - Componente raíz del Dashboard Logístico
 * Maneja autenticación y renderizado del layout
 */

import { useCallback, useState } from "react";
import { useAuth } from "./hooks/useAuth.js";
import DashboardLayout from "./components/DashboardLayout.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import "../index.css";

export default function DashboardApp() {
  const {
    user,
    loading,
    error: authError,
    isAuthenticated,
    login,
    logout,
  } = useAuth();

  const [loginError, setLoginError] = useState("");

  const handleLogin = useCallback(
    async (correo, contrasena) => {
      setLoginError("");
      const success = await login(correo, contrasena);
      if (!success) {
        setLoginError("Credenciales inválidas");
      }
      return success;
    },
    [login]
  );

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Mostrar pantalla de login si no está autenticado
  if (!isAuthenticated || !user) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        loading={loading}
        error={loginError || authError}
      />
    );
  }

  // Mostrar dashboard si está autenticado
  return (
    <DashboardLayout
      user={user}
      onLogout={handleLogout}
    />
  );
}
