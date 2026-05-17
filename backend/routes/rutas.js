const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/rutasController");
const { authenticate } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

/**
 * @openapi
 * /api/rutas:
 *   get:
 *     tags: [Rutas]
 *     summary: Lista rutas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de rutas
 *   post:
 *     tags: [Rutas]
 *     summary: Crear ruta (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Ruta creada
 * /api/rutas/{id}:
 *   get:
 *     tags: [Rutas]
 *     summary: Obtener ruta por id
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
 *         description: Ruta encontrada
 */
router.get("/", authenticate, ctrl.listRutas);
router.post("/", authenticate, requireRole("ADMIN"), ctrl.createRuta);
router.get("/:id", authenticate, ctrl.getRuta);

module.exports = router;
