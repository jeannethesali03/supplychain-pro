const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/enviosController");
const { authenticate } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

/**
 * @openapi
 * /api/envios:
 *   get:
 *     tags: [Envios]
 *     summary: Lista envíos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de envíos
 *   post:
 *     tags: [Envios]
 *     summary: Crear nuevo envío (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Envío creado
 * /api/envios/{id}:
 *   get:
 *     tags: [Envios]
 *     summary: Obtener envío por id
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
 *         description: Envío encontrado
 *   put:
 *     tags: [Envios]
 *     summary: Actualizar envío (ADMIN)
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
 *         description: Envío actualizado
 *   delete:
 *     tags: [Envios]
 *     summary: Eliminar envío (ADMIN)
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
 *         description: Envío eliminado
 */
router.get("/", authenticate, ctrl.listEnvios);
router.get("/:id", authenticate, ctrl.getEnvio);
router.post("/", authenticate, requireRole("ADMIN"), ctrl.createEnvio);
router.put("/:id", authenticate, requireRole("ADMIN"), ctrl.updateEnvio);
router.delete("/:id", authenticate, requireRole("ADMIN"), ctrl.deleteEnvio);

module.exports = router;
