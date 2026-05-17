/**
 * Rutas de viajes
 */

const express = require('express');
const router = express.Router();
const { activeJourneys, iniciarViaje, finalizarViaje, iniciarTelemetria, persistJourneys } = require('../controllers/journeyController');

/**
 * GET /api/simulator/health
 * Verificar salud del simulador
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    viajesActivos: activeJourneys.size,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/simulator/journeys/start
 * Inicia un viaje
 */
router.post('/start', async (req, res) => {
  try {
    const { id_envio, id_ruta, temp_min_permitida, temp_max_permitida, waypoints } = req.body;

    if (!id_envio || !waypoints || !Array.isArray(waypoints)) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    await iniciarViaje(id_envio, id_ruta, temp_min_permitida, temp_max_permitida, waypoints);

    res.json({
      success: true,
      id_envio,
      mensaje: 'Viaje iniciado'
    });
  } catch (error) {
    console.error('Error iniciando viaje:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/simulator/journeys
 * Lista viajes activos
 */
router.get('/', (req, res) => {
  const viajes = Array.from(activeJourneys.values()).map(j => ({
    id_envio: j.id_envio,
    estado: j.estado,
    distancia_km: (j.distanciaTotal / 1000).toFixed(2),
    temperatura: j.telemetria.temperatura.toFixed(2),
    bateria: Math.round(j.telemetria.porcentaje_bateria),
    incidentes: j.incidentes.length
  }));

  res.json({ viajes });
});

/**
 * GET /api/simulator/journeys/:id_envio
 * Obtiene detalles de un viaje
 */
router.get('/:id_envio', (req, res) => {
  const { id_envio } = req.params;
  const journey = activeJourneys.get(Number(id_envio));

  if (!journey) {
    return res.status(404).json({ error: 'Viaje no encontrado' });
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
    incidentes: journey.incidentes
  });
});

/**
 * POST /api/simulator/journeys/:id_envio/pause
 * Pausa un viaje
 */
router.post('/:id_envio/pause', (req, res) => {
  const { id_envio } = req.params;
  const journey = activeJourneys.get(Number(id_envio));

  if (!journey) {
    return res.status(404).json({ error: 'Viaje no encontrado' });
  }

  if (journey.telemetryInterval) {
    clearInterval(journey.telemetryInterval);
    journey.telemetryInterval = null;
    journey.pausedTime = Date.now();
    journey.elapsedSeconds = (journey.pausedTime - journey.startTime) / 1000;
  }

  journey.estado = 'PAUSADO';
  persistJourneys();
  console.log(`⏸ Viaje pausado: ${id_envio}`);

  res.json({ success: true, mensaje: 'Viaje pausado' });
});

/**
 * POST /api/simulator/journeys/:id_envio/resume
 * Reanuda un viaje
 */
router.post('/:id_envio/resume', (req, res) => {
  const { id_envio } = req.params;
  const journey = activeJourneys.get(Number(id_envio));

  if (!journey || journey.estado !== 'PAUSADO') {
    return res.status(404).json({ error: 'Viaje pausado no encontrado' });
  }

  if (journey.pausedTime) {
    journey.startTime = Date.now() - (journey.elapsedSeconds || 0) * 1000;
    journey.pausedTime = null;
  }

  journey.estado = 'EN_PROGRESO';
  persistJourneys();
  iniciarTelemetria(Number(id_envio));
  console.log(`▶ Viaje reanudado: ${id_envio}`);

  res.json({ success: true, mensaje: 'Viaje reanudado' });
});

/**
 * POST /api/simulator/journeys/:id_envio/stop
 * Detiene un viaje
 */
router.post('/:id_envio/stop', (req, res) => {
  const { id_envio } = req.params;
  const journey = activeJourneys.get(Number(id_envio));

  if (!journey) {
    return res.status(404).json({ error: 'Viaje no encontrado' });
  }

  finalizarViaje(Number(id_envio));
  activeJourneys.delete(Number(id_envio));
  persistJourneys();

  res.json({ success: true, mensaje: 'Viaje detenido' });
});

module.exports = router;
