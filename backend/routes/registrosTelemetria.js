const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/registrosTelemetriaController");
const { authenticate } = require("../middlewares/auth");

/**
 * @openapi
 * /api/registros:
 *   post:
 *     tags: [RegistrosTelemetria]
 *     summary: Insertar registro de telemetría (público)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Registro creado
 * /api/registros/envio/{id}:
 *   get:
 *     tags: [RegistrosTelemetria]
 *     summary: Obtener registros por envío
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
 *         description: Lista de registros
 * /api/registros/{id}:
 *   get:
 *     tags: [RegistrosTelemetria]
 *     summary: Obtener registro por id
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
 *         description: Registro encontrado
 */
router.post("/", ctrl.createRegistro);
router.get("/envio/:id", authenticate, ctrl.listRegistrosPorEnvio);
router.get("/:id", authenticate, ctrl.getRegistro);

module.exports = router;
