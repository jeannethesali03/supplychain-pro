const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/incidentesController");
const { authenticate } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

/**
 * @openapi
 * /api/incidentes:
 *   get:
 *     tags: [Incidentes]
 *     summary: Lista incidentes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de incidentes
 *   post:
 *     tags: [Incidentes]
 *     summary: Crear incidente (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Incidente creado
 * /api/incidentes/{id}:
 *   get:
 *     tags: [Incidentes]
 *     summary: Obtener incidente por id
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
 *         description: Incidente encontrado
 */
router.get("/", authenticate, ctrl.listIncidentes);
router.post("/", authenticate, requireRole("ADMIN"), ctrl.createIncidente);
router.get("/:id", authenticate, ctrl.getIncidente);

module.exports = router;
