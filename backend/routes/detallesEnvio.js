const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/detallesEnvioController");
const { authenticate } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

/**
 * @openapi
 * /api/detalles-envio:
 *   get:
 *     tags: [DetallesEnvio]
 *     summary: Lista detalles por envío
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de detalles
 *   post:
 *     tags: [DetallesEnvio]
 *     summary: Crear detalle (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Detalle creado
 * /api/detalles-envio/{id}:
 *   delete:
 *     tags: [DetallesEnvio]
 *     summary: Eliminar detalle (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Detalle eliminado
 */
router.get("/", authenticate, ctrl.listDetalles);
router.post("/", authenticate, requireRole("ADMIN"), ctrl.createDetalle);
router.delete("/:id", authenticate, requireRole("ADMIN"), ctrl.deleteDetalle);

module.exports = router;
