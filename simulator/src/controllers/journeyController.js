/**
 * Controlador de viajes
 */

const axios = require("axios");
const {
  calcularDistancia,
  interpolarPunto,
  randomBetween,
} = require("../utils/calculations");
const { generarTelemetria } = require("../utils/telemetry");
const { readState, writeState } = require("../utils/stateStore");
const { getStorageState, setStorageState } = require("../utils/storageMonitor");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const TELEMETRY_INTERVAL = 5000;

// Estado global de viajes
const activeJourneys = new Map();

function serializeJourney(journey) {
  return {
    id_envio: journey.id_envio,
    id_ruta: journey.id_ruta,
    waypoints: journey.waypoints,
    tempMin: journey.tempMin,
    tempMax: journey.tempMax,
    estado: journey.estado,
    startTime: journey.startTime,
    pausedTime: journey.pausedTime || null,
    duracionTotal: journey.duracionTotal,
    velocidadMetrosPorSegundo: journey.velocidadMetrosPorSegundo,
    distanciaTotal: journey.distanciaTotal,
    telemetria: journey.telemetria,
    incidentes: journey.incidentes,
    distanciaRecorrida: journey.distanciaRecorrida,
    ultimoIdRegistroTelemetria: journey.ultimoIdRegistroTelemetria,
    elapsedSeconds: journey.elapsedSeconds || 0,
    lastPosition: journey.lastPosition || null,
  };
}

function persistJourneys() {
  const payload = {
    updatedAt: new Date().toISOString(),
    storage: getStorageState(),
    journeys: Array.from(activeJourneys.values()).map(serializeJourney),
  };
  writeState(payload);
}

function restoreJourneys() {
  const stored = readState();
  if (!stored || !Array.isArray(stored.journeys)) return 0;

  if (stored.storage) {
    setStorageState(stored.storage);
  }

  stored.journeys.forEach((journey) => {
    const restored = {
      ...journey,
      telemetryInterval: null,
      lastPosition: journey.lastPosition || null,
    };
    activeJourneys.set(restored.id_envio, restored);
  });

  stored.journeys.forEach((journey) => {
    if (journey.estado === "EN_PROGRESO") {
      const restored = activeJourneys.get(journey.id_envio);
      const elapsed = Number.isFinite(restored.elapsedSeconds)
        ? restored.elapsedSeconds
        : Math.max(0, (Date.now() - restored.startTime) / 1000);
      restored.startTime = Date.now() - elapsed * 1000;
      iniciarTelemetria(restored.id_envio);
    }
  });

  return stored.journeys.length;
}

/**
 * Envía telemetría al backend
 */
async function enviarTelemetria(id_envio, posicion, telemetria, timestamp) {
  try {
    const payload = {
      id_envio,
      latitud: posicion.lat,
      longitud: posicion.lng,
      temperatura: telemetria.temperatura,
      humedad: telemetria.humedad,
      porcentaje_bateria: Math.round(telemetria.porcentaje_bateria),
      marca_tiempo_dispositivo: new Date(timestamp).toISOString(),
    };

    const response = await axios.post(`${BACKEND_URL}/api/registros`, payload);

    // Guardar el ID del registro para vincular con incidentes
    const journey = activeJourneys.get(id_envio);
    if (journey && response.data && response.data.id_registro_telemetria) {
      journey.ultimoIdRegistroTelemetria = response.data.id_registro_telemetria;
    }

    console.log(
      `📊 Telemetría enviada (${id_envio}): Temp=${telemetria.temperatura.toFixed(2)}°C, Bateria=${telemetria.porcentaje_bateria.toFixed(0)}%`,
    );

    return response.data;
  } catch (error) {
    console.error(`✗ Error enviando telemetría: ${error.message}`);
  }
}

/**
 * Inicia la generación periódica de telemetría
 */
function iniciarTelemetria(id_envio) {
  const journey = activeJourneys.get(id_envio);
  if (!journey || journey.telemetryInterval) {
    return;
  }

  journey.telemetryInterval = setInterval(async () => {
    const ahora = Date.now();
    const tiempoTranscurrido = (ahora - journey.startTime) / 1000; // segundos
    const progreso = tiempoTranscurrido / journey.duracionTotal;

    // Si el viaje termina
    if (progreso >= 1) {
      finalizarViaje(id_envio);
      return;
    }

    // Calcular posición actual
    let distanciaRestante = progreso * journey.distanciaTotal;

    for (let i = 0; i < journey.waypoints.length - 1; i++) {
      const distancia = calcularDistancia(
        journey.waypoints[i].lat,
        journey.waypoints[i].lng,
        journey.waypoints[i + 1].lat,
        journey.waypoints[i + 1].lng,
      );

      if (distanciaRestante <= distancia) {
        const interpolacion = distanciaRestante / distancia;
        const posicion = interpolarPunto(
          journey.waypoints[i],
          journey.waypoints[i + 1],
          interpolacion,
        );

        journey.telemetria = generarTelemetria(
          journey.telemetria,
          journey.tempMin,
          journey.tempMax,
        );
        journey.lastPosition = { lat: posicion.lat, lng: posicion.lng };
        journey.elapsedSeconds = tiempoTranscurrido;

        // Enviar telemetría al backend
        await enviarTelemetria(id_envio, posicion, journey.telemetria, ahora);
        persistJourneys();
        break;
      }

      distanciaRestante -= distancia;
    }
  }, TELEMETRY_INTERVAL);

  console.log("  ✓ Sistema de telemetría iniciado");
}

/**
 * Finaliza un viaje
 */
function finalizarViaje(id_envio) {
  const journey = activeJourneys.get(id_envio);
  if (!journey) return;

  if (journey.telemetryInterval) {
    clearInterval(journey.telemetryInterval);
  }

  journey.estado = "FINALIZADO";
  journey.elapsedSeconds = journey.duracionTotal;
  persistJourneys();
  console.log(`\n✓ Viaje finalizado para envío ${id_envio}`);
}

/**
 * Inicia el viaje de un envío
 */
async function iniciarViaje(id_envio, id_ruta, tempMin, tempMax, waypoints) {
  console.log(`\n📍 Iniciando viaje para envío ${id_envio}...`);

  if (activeJourneys.has(id_envio)) {
    console.log(`⚠ Viaje ya en progreso para envío ${id_envio}`);
    return;
  }

  // Calcular duración total del viaje
  let distanciaTotal = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    distanciaTotal += calcularDistancia(
      waypoints[i].lat,
      waypoints[i].lng,
      waypoints[i + 1].lat,
      waypoints[i + 1].lng,
    );
  }

  const velocidadMetrosPorSegundo = Math.max(distanciaTotal / 30, 5);
  const duracionTotalSegundos = distanciaTotal / velocidadMetrosPorSegundo;

  console.log(`  - Distancia total: ${(distanciaTotal / 1000).toFixed(2)} km`);
  console.log(
    `  - Duración estimada: ${duracionTotalSegundos.toFixed(1)} segundos`,
  );
  console.log(
    `  - Velocidad: ${(velocidadMetrosPorSegundo * 3.6).toFixed(1)} km/h`,
  );

  const tempMinValue = Number(tempMin);
  const tempMaxValue = Number(tempMax);
  const normalizedTempMin = Number.isFinite(tempMinValue) ? tempMinValue : 0;
  const normalizedTempMax = Number.isFinite(tempMaxValue)
    ? tempMaxValue
    : Math.max(5, normalizedTempMin + 1);

  const journeyState = {
    id_envio,
    id_ruta,
    waypoints,
    tempMin: normalizedTempMin,
    tempMax: normalizedTempMax,
    estado: "EN_PROGRESO",
    startTime: Date.now(),
    duracionTotal: duracionTotalSegundos,
    velocidadMetrosPorSegundo,
    distanciaTotal,
    lastPosition: waypoints?.length ? { lat: waypoints[0].lat, lng: waypoints[0].lng } : null,
    telemetria: {
      temperatura: randomBetween(normalizedTempMin, normalizedTempMax),
      humedad: randomBetween(60, 75),
      porcentaje_bateria: 100,
    },
    telemetryInterval: null,
    incidentes: [],
    distanciaRecorrida: 0,
    ultimoIdRegistroTelemetria: null,
    elapsedSeconds: 0,
  };

  activeJourneys.set(id_envio, journeyState);
  persistJourneys();
  iniciarTelemetria(id_envio);
}

module.exports = {
  activeJourneys,
  iniciarViaje,
  finalizarViaje,
  iniciarTelemetria,
  enviarTelemetria,
  persistJourneys,
  restoreJourneys,
};
