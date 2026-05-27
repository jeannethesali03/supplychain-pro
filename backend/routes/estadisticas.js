const express = require('express');
const { authenticate } = require('../middlewares/auth');
const ctrl = require('../controllers/estadisticasController');

const router = express.Router();

// Middleware para normalizar las fechas de req.query a formato completo con horas
router.use((req, res, next) => {
  const query = { ...req.query };
  if (query.startDate && query.startDate.length === 10) {
    query.startDate += ' 00:00:00';
  }
  if (query.endDate && query.endDate.length === 10) {
    query.endDate += ' 23:59:59';
  }
  Object.defineProperty(req, 'query', {
    value: query,
    writable: true,
    configurable: true
  });
  next();
});

/**
 * @swagger
 * /api/estadisticas/vehiculos:
 *   get:
 *     tags: [Estadísticas]
 *     summary: Incidentes por vehículo
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Fecha inicio (ISO)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Fecha fin (ISO)
 */
router.get('/vehiculos', authenticate, ctrl.incidentesPorVehiculo);

/**
 * @swagger
 * /api/estadisticas/rutas:
 *   get:
 *     tags: [Estadísticas]
 *     summary: Incidentes por ruta
 */
router.get('/rutas', authenticate, ctrl.incidentesPorRuta);

/**
 * @swagger
 * /api/estadisticas/tipos:
 *   get:
 *     tags: [Estadísticas]
 *     summary: Incidentes por tipo
 */
router.get('/tipos', authenticate, ctrl.incidentesPorTipo);

/**
 * @swagger
 * /api/estadisticas/ubicaciones:
 *   get:
 *     tags: [Estadísticas]
 *     summary: Incidentes por ubicación geográfica
 */
router.get('/ubicaciones', authenticate, ctrl.incidentesPorUbicacion);

/**
 * @swagger
 * /api/estadisticas/incidentes:
 *   get:
 *     tags: [Estadísticas]
 *     summary: Incidentes filtrados con rango de fechas
 */
router.get('/incidentes', authenticate, ctrl.incidentes);

/**
 * @swagger
 * /api/estadisticas/resumen:
 *   get:
 *     tags: [Estadísticas]
 *     summary: Resumen general de estadísticas
 */
router.get('/resumen', authenticate, ctrl.resumen);

module.exports = router;
