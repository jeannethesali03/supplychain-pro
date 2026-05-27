/**
 * Utilidades de formato para el dashboard
 */

/**
 * Formatea un ID de envío a formato humanizado
 * Ejemplo: 1 -> ENV-NEW-0001
 */
export function formatShipmentId(id) {
  if (!id) return "ENV-NEW-0000";
  const numStr = String(id).padStart(4, "0");
  return `ENV-NEW-${numStr}`;
}

/**
 * Genera un color según tipo de incidente
 */
export function getIncidentTypeColor(tipo) {
  const colors = {
    RUPTURA_CADENA_FRIO: "#ef4444",
    TEMPERATURA_CRITICA: "#dc2626",
    BATERIA_BAJA: "#f59e0b",
    GEOFENCE_VIOLATION: "#f97316",
    VIOLACION_GEOFENCE: "#f97316",
    OUT_OF_BOUNDS: "#6366f1",
    DESVIO_RUTA: "#6366f1",
    STORAGE_FULL: "#8b5cf6",
    VOLUMEN_LLENO: "#8b5cf6",
    PERDIDA_SENAL: "#64748b",
    HUMEDAD_CRITICA: "#0ea5e9",
    ERROR_SENSOR: "#a855f7",
  };
  return colors[(tipo || "").toString().toUpperCase()] || "#64748b";
}

/**
 * Obtiene etiqueta traducida del tipo de incidente
 */
export function getIncidentTypeLabel(tipo) {
  const labels = {
    RUPTURA_CADENA_FRIO: "🥶 Ruptura de Cadena de Frío",
    TEMPERATURA_CRITICA: "🌡️ Temperatura Crítica",
    BATERIA_BAJA: "🔋 Batería Baja",
    GEOFENCE_VIOLATION: "🗺️ Violación de Geofence",
    VIOLACION_GEOFENCE: "🗺️ Violación de Geofence",
    OUT_OF_BOUNDS: "🗺️ Fuera de Perímetro (Geofence)",
    DESVIO_RUTA: "🗺️ Desvío de Ruta",
    STORAGE_FULL: "📦 Almacenamiento Lleno",
    VOLUMEN_LLENO: "📦 Almacenamiento Lleno",
    PERDIDA_SENAL: "📡 Pérdida de Señal",
    HUMEDAD_CRITICA: "💧 Humedad Crítica",
    ERROR_SENSOR: "⚙️ Error de Sensor",
  };
  return labels[(tipo || "").toString().toUpperCase()] || tipo || "Incidente";
}

/**
 * Obtiene explicación detallada del incidente
 */
export function getIncidentExplanation(incident) {
  const tipo = (incident.tipo_incidente || "").toString().toUpperCase();
  const valorReg = incident.valor_registrado;
  const valorLim = incident.valor_limite;

  const explanations = {
    RUPTURA_CADENA_FRIO: `Ruptura de la cadena de frío detectada. Temperatura registrada: ${valorReg}°C. Límite permitido: ${valorLim}°C.`,
    TEMPERATURA_CRITICA: `Temperatura crítica detectada en el envío. Se registró ${valorReg}°C cuando el límite es ${valorLim}°C.`,
    BATERIA_BAJA: `Batería del dispositivo de telemetría baja. Nivel: ${valorReg}%.`,
    GEOFENCE_VIOLATION: `El vehículo se salió de la zona permitida (geofence).`,
    VIOLACION_GEOFENCE: `El vehículo se salió de la zona permitida (geofence).`,
    OUT_OF_BOUNDS: `El vehículo se encuentra fuera del perímetro geográfico autorizado (geofence).`,
    DESVIO_RUTA: `El vehículo se ha desviado de la ruta planificada.`,
    STORAGE_FULL: `El volumen de almacenamiento del dispositivo o contenedor de carga está al 100% de capacidad.`,
    VOLUMEN_LLENO: `El volumen de almacenamiento del dispositivo o contenedor de carga está al 100% de capacidad.`,
    PERDIDA_SENAL: `Pérdida de señal del dispositivo de telemetría.`,
    HUMEDAD_CRITICA: `Humedad crítica detectada. Nivel: ${valorReg}%.`,
    ERROR_SENSOR: `Error en uno o más sensores del dispositivo.`,
  };

  return explanations[tipo] || incident.descripcion || "Incidente registrado en el sistema.";
}
