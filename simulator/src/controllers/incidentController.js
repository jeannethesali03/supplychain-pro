/**
 * Controlador de incidentes
 */

const axios = require('axios');
const { activeJourneys, persistJourneys } = require('./journeyController');
const { setOverridePercent, markAlertSent } = require('../utils/storageMonitor');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

let adminToken = null;

/**
 * Obtiene token de admin
 */
async function getAdminToken() {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      correo: process.env.ADMIN_EMAIL || 'admin@supplychain.com',
      contrasena: process.env.ADMIN_PASSWORD || 'admin123'
    });
    adminToken = response.data.token;
    console.log('✓ Token de admin obtenido');
    return adminToken;
  } catch (error) {
    console.error('✗ Error obteniendo token de admin:', error.message);
    return null;
  }
}

/**
 * Crea un incidente en el backend
 */
async function crearIncidente(id_envio, tipo, payload) {
  try {
    if (!adminToken) {
      await getAdminToken();
    }

    const response = await axios.post(`${BACKEND_URL}/api/incidentes`, payload, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const journey = activeJourneys.get(id_envio);
    if (journey) {
      journey.incidentes.push({
        tipo,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔴 Incidente de ${tipo} creado para envío ${id_envio}`);
    return response.data;
  } catch (error) {
    console.error('Error creando incidente:', error.message);
    throw error;
  }
}

/**
 * Incidente: Temperatura alta
 */
async function incidenteTemperaturaAlta(id_envio) {
  const journey = activeJourneys.get(id_envio);
  if (!journey) throw new Error('Viaje no encontrado');

  journey.telemetria.temperatura = 12;

  return crearIncidente(id_envio, 'RUPTURA_CADENA_FRIO', {
    id_envio,
    id_registro_telemetria: journey.ultimoIdRegistroTelemetria,
    tipo_incidente: 'RUPTURA_CADENA_FRIO',
    valor_registrado: journey.telemetria.temperatura,
    valor_limite: journey.tempMax,
    descripcion: 'Temperatura excedió el máximo permitido durante el transporte',
    origen_evento: 'SIMULADOR',
    metadata_json: {
      evento: 'temperatura_alta',
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Incidente: Batería baja
 */
async function incidenteBateriaBaja(id_envio) {
  const journey = activeJourneys.get(id_envio);
  if (!journey) throw new Error('Viaje no encontrado');

  journey.telemetria.porcentaje_bateria = 5;

  return crearIncidente(id_envio, 'BATERIA_BAJA', {
    id_envio,
    id_registro_telemetria: journey.ultimoIdRegistroTelemetria,
    tipo_incidente: 'BATERIA_BAJA',
    valor_registrado: journey.telemetria.porcentaje_bateria,
    valor_limite: 10,
    descripcion: 'El dispositivo de monitoreo tiene batería baja',
    origen_evento: 'SIMULADOR',
    metadata_json: {
      evento: 'bateria_baja',
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Incidente: Violación de geofence
 */
async function incidenteGeofenceViolation(id_envio) {
  const journey = activeJourneys.get(id_envio);
  if (!journey) throw new Error('Viaje no encontrado');

  const fallback = journey.waypoints?.length ? journey.waypoints[0] : null;
  const latitud = journey.lastPosition?.lat ?? journey.lastPosition?.latitud ?? fallback?.lat ?? null;
  const longitud = journey.lastPosition?.lng ?? journey.lastPosition?.longitud ?? fallback?.lng ?? null;

  return crearIncidente(id_envio, 'OUT_OF_BOUNDS', {
    id_envio,
    id_registro_telemetria: journey.ultimoIdRegistroTelemetria,
    tipo_incidente: 'OUT_OF_BOUNDS',
    descripcion: 'El vehiculo se encuentra fuera del perimetro autorizado',
    origen_evento: 'SIMULADOR',
    metadata_json: {
      evento: 'out_of_bounds',
      latitud,
      longitud,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Incidente: Volumen lleno
 */
async function incidenteVolumenLleno(id_envio, storageDetails = {}) {
  const journey = activeJourneys.get(id_envio);
  if (!journey) throw new Error('Viaje no encontrado');

  const percent = Number.isFinite(storageDetails.percent) ? storageDetails.percent : 100;
  const usedBytes = storageDetails.usedBytes ?? storageDetails.used_bytes ?? null;
  const maxBytes = storageDetails.maxBytes ?? storageDetails.max_bytes ?? null;

  setOverridePercent(percent);
  markAlertSent(true);
  persistJourneys();

  return crearIncidente(id_envio, 'STORAGE_FULL', {
    id_envio,
    id_registro_telemetria: journey.ultimoIdRegistroTelemetria,
    tipo_incidente: 'STORAGE_FULL',
    descripcion: 'El volumen de almacenamiento del dispositivo esta al 100%',
    origen_evento: 'SIMULADOR',
    metadata_json: {
      evento: 'storage_full',
      porcentaje: percent,
      used_bytes: usedBytes,
      max_bytes: maxBytes,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = {
  getAdminToken,
  crearIncidente,
  incidenteTemperaturaAlta,
  incidenteBateriaBaja,
  incidenteGeofenceViolation,
  incidenteVolumenLleno,
  setAdminToken: (token) => { adminToken = token; }
};
