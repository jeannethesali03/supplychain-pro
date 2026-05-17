/**
 * Hook useAuth - Manejo de autenticación
 */

import { useEffect, useState } from "react";
import apiService from "../services/apiService.js";
import socketService from "../services/socketService.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Restaurar usuario si hay token
  useEffect(() => {
    if (token) {
      const stored = localStorage.getItem("supplychain-user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    }
  }, [token]);

  // Conectar socket cuando el usuario se autentica
  useEffect(() => {
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }
  }, [token]);

  const login = async (correo, contrasena) => {
    setLoading(true);
    setError("");

    const result = await apiService.login(correo, contrasena);

    if (result.success) {
      const { token: newToken, user: newUser } = result.data;
      
      setToken(newToken);
      setUser(newUser);
      
      apiService.setToken(newToken);
      localStorage.setItem("supplychain-user", JSON.stringify(newUser));
      
      // Conectar socket
      socketService.connect(newToken);
      
      setLoading(false);
      return true;
    } else {
      setError(result.error);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setToken("");
    setUser(null);
    apiService.setToken("");
    socketService.disconnect();
    localStorage.removeItem("token");
    localStorage.removeItem("supplychain-user");
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.rol === "ADMIN";

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    logout,
  };
}
