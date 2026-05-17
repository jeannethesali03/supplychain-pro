const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.SIMULATOR_PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const TELEMETRY_INTERVAL = 5000; // 5 segundos

// Middleware
app.use(express.json());

// ============================================
// Estado del simulador
// ============================================
const activeJourneys = new Map(); // id_envio -> { estado, detalles }

// Token JWT para el simulador (se obtiene al iniciar)
let adminToken = null;

// ============================================
// Funciones auxiliares
// ============================================

/**
 * Obtiene un token JWT de admin para el simulador
 */
async function getAdminToken() {
  try {
    // En desarrollo, el simulador puede usar credenciales de admin
    // En producción, esto debe ser más seguro
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      correo: process.env.ADMIN_EMAIL || "admin@supplychain.com",
      contrasena: process.env.ADMIN_PASSWORD || "admin123",
    });
    adminToken = response.data.token;
    console.log("✓ Token de admin obtenido");
    return adminToken;
  } catch (error) {
    console.error("✗ Error obteniendo token de admin:", error.message);
    return null;
  }
}

/**
 * Calcula la distancia entre dos puntos (haversine)
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;
  return distancia * 1000; // Convertir a metros
}

/**
 * Genera un número aleatorio entre min y max
 */
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Simula cambios en la telemetría
 */
function generarTelemetria(
  telemetriaAnterior,
  tempMinPermitida,
  tempMaxPermitida,
) {
  const temp =
    telemetriaAnterior?.temperatura ||
    randomBetween(tempMinPermitida, tempMaxPermitida);
  const humedad = telemetriaAnterior?.humedad || randomBetween(55, 75);
  const bateria =
    (telemetriaAnterior?.porcentaje_bateria || 100) - randomBetween(0, 0.5);

  return {
    temperatura: Math.max(
      tempMinPermitida - 5,
      Math.min(tempMaxPermitida + 5, temp + randomBetween(-0.5, 0.5)),
    ),
    humedad: Math.max(30, Math.min(95, humedad + randomBetween(-2, 2))),
    porcentaje_bateria: Math.max(0, Math.min(100, bateria)),
  };
}

/**
 * Interpola entre dos puntos geográficos
 */
function interpolarPunto(punto1, punto2, progreso) {
  return {
    lat: punto1.lat + (punto2.lat - punto1.lat) * progreso,
    lng: punto1.lng + (punto2.lng - punto1.lng) * progreso,
  };
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

  // Velocidad simulada: 50 km/h = 13.89 m/s
  // Pero para que dure al menos 10 segundos, asignamos una velocidad menor
  const velocidadMetrosPorSegundo = Math.max(distanciaTotal / 30, 5); // Mínimo 30 segundos
  const duracionTotalSegundos = distanciaTotal / velocidadMetrosPorSegundo;

  console.log(`  - Distancia total: ${(distanciaTotal / 1000).toFixed(2)} km`);
  console.log(
    `  - Duración estimada: ${duracionTotalSegundos.toFixed(1)} segundos`,
  );
  console.log(
    `  - Velocidad: ${(velocidadMetrosPorSegundo * 3.6).toFixed(1)} km/h`,
  );

  const journeyState = {
    id_envio,
    id_ruta,
    waypoints,
    tempMin,
    tempMax,
    estado: "EN_PROGRESO",
    startTime: Date.now(),
    duracionTotal: duracionTotalSegundos,
    velocidadMetrosPorSegundo,
    distanciaTotal,
    telemetria: {
      temperatura: randomBetween(tempMin, tempMax),
      humedad: randomBetween(60, 75),
      porcentaje_bateria: 100,
    },
    telemetryInterval: null,
    incidentes: [], // Incidentes disparados durante el viaje
    distanciaRecorrida: 0,
    puntosIntermedioscalculados: [],
    ultimoIdRegistroTelemetria: null, // Para vincular incidentes
  };

  activeJourneys.set(id_envio, journeyState);

  // Iniciar telemetría periódica
  iniciarTelemetria(id_envio);
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

        // Enviar telemetría al backend
        await enviarTelemetria(id_envio, posicion, journey.telemetria, ahora);
        break;
      }

      distanciaRestante -= distancia;
    }
  }, TELEMETRY_INTERVAL);

  console.log("  ✓ Sistema de telemetría iniciado");
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
 * Finaliza un viaje
 */
function finalizarViaje(id_envio) {
  const journey = activeJourneys.get(id_envio);
  if (!journey) return;

  if (journey.telemetryInterval) {
    clearInterval(journey.telemetryInterval);
  }

  journey.estado = "FINALIZADO";
  console.log(`\n✓ Viaje finalizado para envío ${id_envio}`);
}

// ============================================
// Rutas del simulador
// ============================================

/**
 * GET /api/simulator/health
 * Verificar salud del simulador
 */
app.get("/api/simulator/health", (req, res) => {
  res.json({
    status: "ok",
    viajesActivos: activeJourneys.size,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/simulator/journeys/start
 * Inicia un viaje
 * Body: { id_envio, id_ruta, temp_min_permitida, temp_max_permitida, waypoints }
 */
app.post("/api/simulator/journeys/start", async (req, res) => {
  try {
    const {
      id_envio,
      id_ruta,
      temp_min_permitida,
      temp_max_permitida,
      waypoints,
    } = req.body;

    if (!id_envio || !waypoints || !Array.isArray(waypoints)) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    await iniciarViaje(
      id_envio,
      id_ruta,
      temp_min_permitida,
      temp_max_permitida,
      waypoints,
    );

    res.json({
      success: true,
      id_envio,
      mensaje: "Viaje iniciado",
    });
  } catch (error) {
    console.error("Error iniciando viaje:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulator/journeys/:id_envio/pause
 * Pausa un viaje en progreso
 */
app.post("/api/simulator/journeys/:id_envio/pause", (req, res) => {
  const { id_envio } = req.params;
  const journey = activeJourneys.get(Number(id_envio));

  if (!journey) {
    return res.status(404).json({ error: "Viaje no encontrado" });
  }

  if (journey.telemetryInterval) {
    clearInterval(journey.telemetryInterval);
    journey.telemetryInterval = null;
    journey.pausedTime = Date.now();
  }

  journey.estado = "PAUSADO";
  console.log(`⏸ Viaje pausado: ${id_envio}`);

  res.json({ success: true, mensaje: "Viaje pausado" });
});

/**
 * POST /api/simulator/journeys/:id_envio/resume
 * Reanuda un viaje pausado
 */
app.post("/api/simulator/journeys/:id_envio/resume", (req, res) => {
  const { id_envio } = req.params;
  const journey = activeJourneys.get(Number(id_envio));

  if (!journey || journey.estado !== "PAUSADO") {
    return res.status(404).json({ error: "Viaje pausado no encontrado" });
  }

  if (journey.pausedTime) {
    journey.startTime += Date.now() - journey.pausedTime;
    journey.pausedTime = null;
  }

  journey.estado = "EN_PROGRESO";
  iniciarTelemetria(Number(id_envio));
  console.log(`▶ Viaje reanudado: ${id_envio}`);

  res.json({ success: true, mensaje: "Viaje reanudado" });
});

/**
 * POST /api/simulator/journeys/:id_envio/stop
 * Detiene un viaje
 */
app.post("/api/simulator/journeys/:id_envio/stop", (req, res) => {
  const { id_envio } = req.params;
  const journey = activeJourneys.get(Number(id_envio));

  if (!journey) {
    return res.status(404).json({ error: "Viaje no encontrado" });
  }

  finalizarViaje(Number(id_envio));
  activeJourneys.delete(Number(id_envio));

  res.json({ success: true, mensaje: "Viaje detenido" });
});

/**
 * GET /api/simulator/journeys
 * Lista viajes activos
 */
app.get("/api/simulator/journeys", (req, res) => {
  const viajes = Array.from(activeJourneys.values()).map((j) => ({
    id_envio: j.id_envio,
    estado: j.estado,
    distancia_km: (j.distanciaTotal / 1000).toFixed(2),
    temperatura: j.telemetria.temperatura.toFixed(2),
    bateria: Math.round(j.telemetria.porcentaje_bateria),
    incidentes: j.incidentes.length,
  }));

  res.json({ viajes });
});

/**
 * GET /api/simulator/journeys/:id_envio
 * Obtiene detalles de un viaje
 */
app.get("/api/simulator/journeys/:id_envio", (req, res) => {
  const { id_envio } = req.params;
  const journey = activeJourneys.get(Number(id_envio));

  if (!journey) {
    return res.status(404).json({ error: "Viaje no encontrado" });
  }

  const tiempoTranscurrido = (Date.now() - journey.startTime) / 1000;
  const progreso = (tiempoTranscurrido / journey.duracionTotal) * 100;

  res.json({
    id_envio: journey.id_envio,
    estado: journey.estado,
    progreso: Math.min(progreso, 100),
    tiempo_transcurrido_seg: Math.round(tiempoTranscurrido),
    duracion_total_seg: Math.round(journey.duracionTotal),
    telemetria_actual: journey.telemetria,
    incidentes: journey.incidentes,
  });
});

/**
 * POST /api/simulator/incidents/:id_envio/temperatura-alta
 * Simula aumento de temperatura
 */
app.post(
  "/api/simulator/incidents/:id_envio/temperatura-alta",
  async (req, res) => {
    const { id_envio } = req.params;
    const journey = activeJourneys.get(Number(id_envio));

    if (!journey) {
      return res.status(404).json({ error: "Viaje no encontrado" });
    }

    // Elevar la temperatura
    journey.telemetria.temperatura = Math.min(journey.tempMax + 7, 25);

    // Crear incidente en el backend
    try {
      if (!adminToken) {
        await getAdminToken();
      }

      const payload = {
        id_envio: Number(id_envio),
        id_registro_telemetria: journey.ultimoIdRegistroTelemetria,
        tipo_incidente: "RUPTURA_CADENA_FRIO",
        valor_registrado: journey.telemetria.temperatura,
        valor_limite: journey.tempMax,
        descripcion:
          "Temperatura excedió el máximo permitido durante el transporte",
        origen_evento: "SIMULADOR",
        metadata_json: {
          evento: "temperatura_alta",
          timestamp: new Date().toISOString(),
        },
      };

      await axios.post(`${BACKEND_URL}/api/incidentes`, payload, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      journey.incidentes.push({
        tipo: "RUPTURA_CADENA_FRIO",
        timestamp: new Date().toISOString(),
      });

      console.log(
        `🔴 Incidente de temperatura alta creado para envío ${id_envio}`,
      );
      res.json({ success: true, mensaje: "Incidente creado" });
    } catch (error) {
      console.error("Error creando incidente:", error.message);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/simulator/incidents/:id_envio/bateria-baja
 * Simula batería baja
 */
app.post(
  "/api/simulator/incidents/:id_envio/bateria-baja",
  async (req, res) => {
    const { id_envio } = req.params;
    const journey = activeJourneys.get(Number(id_envio));

    if (!journey) {
      return res.status(404).json({ error: "Viaje no encontrado" });
    }

    // Reducir batería
    journey.telemetria.porcentaje_bateria = 5;

    try {
      if (!adminToken) {
        await getAdminToken();
      }

      const payload = {
        id_envio: Number(id_envio),
        id_registro_telemetria: journey.ultimoIdRegistroTelemetria,
        tipo_incidente: "BATERIA_BAJA",
        valor_registrado: journey.telemetria.porcentaje_bateria,
        valor_limite: 10,
        descripcion: "El dispositivo de monitoreo tiene batería baja",
        origen_evento: "SIMULADOR",
        metadata_json: {
          evento: "bateria_baja",
          timestamp: new Date().toISOString(),
        },
      };

      await axios.post(`${BACKEND_URL}/api/incidentes`, payload, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      journey.incidentes.push({
        tipo: "BATERIA_BAJA",
        timestamp: new Date().toISOString(),
      });

      console.log(`🔴 Incidente de batería baja creado para envío ${id_envio}`);
      res.json({ success: true, mensaje: "Incidente creado" });
    } catch (error) {
      console.error("Error creando incidente:", error.message);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/simulator/incidents/:id_envio/geofence-violation
 * Simula violación de geofence
 */
app.post(
  "/api/simulator/incidents/:id_envio/geofence-violation",
  async (req, res) => {
    const { id_envio } = req.params;
    const journey = activeJourneys.get(Number(id_envio));

    if (!journey) {
      return res.status(404).json({ error: "Viaje no encontrado" });
    }

    try {
      if (!adminToken) {
        await getAdminToken();
      }

      const payload = {
        id_envio: Number(id_envio),
        id_registro_telemetria: journey.ultimoIdRegistroTelemetria,
        tipo_incidente: "VIOLACION_GEOFENCE",
        descripcion: "El vehículo se encuentra fuera del perímetro autorizado",
        origen_evento: "SIMULADOR",
        metadata_json: {
          evento: "geofence_violation",
          timestamp: new Date().toISOString(),
        },
      };

      await axios.post(`${BACKEND_URL}/api/incidentes`, payload, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      journey.incidentes.push({
        tipo: "VIOLACION_GEOFENCE",
        timestamp: new Date().toISOString(),
      });

      console.log(`🔴 Incidente de geofence creado para envío ${id_envio}`);
      res.json({ success: true, mensaje: "Incidente creado" });
    } catch (error) {
      console.error("Error creando incidente:", error.message);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/simulator/incidents/:id_envio/volumen-lleno
 * Simula almacenamiento lleno
 */
app.post(
  "/api/simulator/incidents/:id_envio/volumen-lleno",
  async (req, res) => {
    const { id_envio } = req.params;
    const journey = activeJourneys.get(Number(id_envio));

    if (!journey) {
      return res.status(404).json({ error: "Viaje no encontrado" });
    }

    try {
      if (!adminToken) {
        await getAdminToken();
      }

      const payload = {
        id_envio: Number(id_envio),
        id_registro_telemetria: journey.ultimoIdRegistroTelemetria,
        tipo_incidente: "VOLUMEN_LLENO",
        descripcion:
          "El volumen de almacenamiento del dispositivo está al 100%",
        origen_evento: "SIMULADOR",
        metadata_json: {
          evento: "volumen_lleno",
          porcentaje: 100,
          timestamp: new Date().toISOString(),
        },
      };

      await axios.post(`${BACKEND_URL}/api/incidentes`, payload, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      journey.incidentes.push({
        tipo: "VOLUMEN_LLENO",
        timestamp: new Date().toISOString(),
      });

      console.log(
        `🔴 Incidente de volumen lleno creado para envío ${id_envio}`,
      );
      res.json({ success: true, mensaje: "Incidente creado" });
    } catch (error) {
      console.error("Error creando incidente:", error.message);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================
// Inicialización
// ============================================

async function iniciar() {
  app.listen(PORT, async () => {
    console.log(`\n🚀 Simulador de Camión iniciado en puerto ${PORT}`);
    console.log(`📡 Backend URL: ${BACKEND_URL}\n`);

    // Obtener token de admin
    await getAdminToken();
  });
}

iniciar();
