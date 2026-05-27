/**
 * useTheme - Hook para gestionar el tema oscuro/claro globalmente
 */

import { useEffect, useState, useCallback } from "react";
import storageService from "../services/storageService.js";

export function useTheme() {
  const [theme, setTheme] = useState("light");

  // Cargar tema al montar el componente
  useEffect(() => {
    const prefs = storageService.getPreferences();
    const savedTheme = prefs.theme || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Aplicar tema al documento
  const applyTheme = useCallback((themeValue) => {
    document.documentElement.setAttribute("data-theme", themeValue);
    document.body.setAttribute("data-theme", themeValue);
    
    // Guardar en localStorage
    const prefs = storageService.getPreferences();
    storageService.setPreferences({ ...prefs, theme: themeValue });
  }, []);

  // Cambiar tema
  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
  }, [theme, applyTheme]);

  // Establecer tema específico
  const setThemeValue = useCallback((themeValue) => {
    if (themeValue === "light" || themeValue === "dark") {
      setTheme(themeValue);
      applyTheme(themeValue);
    }
  }, [applyTheme]);

  return {
    theme,
    toggleTheme,
    setTheme: setThemeValue,
  };
}
