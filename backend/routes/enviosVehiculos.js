const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/enviosVehiculosController");
const { authenticate } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

/**
 * @openapi
 * /api/envios-vehiculos:
 *   get:
 *     tags: [EnviosVehiculos]
 *     summary: Lista asignaciones envío-vehículo
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de asignaciones
 *   post:
 *     tags: [EnviosVehiculos]
 *     summary: Crear asignación (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Asignación creada
 * /api/envios-vehiculos/{id}:
 *   get:
 *     tags: [EnviosVehiculos]
 *     summary: Obtener asignación por id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Asignación encontrada
 */
router.get("/", authenticate, ctrl.listAsignaciones);
router.post("/", authenticate, requireRole("ADMIN"), ctrl.createAsignacion);
router.get("/:id", authenticate, ctrl.getAsignacion);

module.exports = router;
