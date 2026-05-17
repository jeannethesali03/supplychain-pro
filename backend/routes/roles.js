const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/rolesController");
const { authenticate } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

/**
 * @openapi
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: Lista roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles
 *   post:
 *     tags: [Roles]
 *     summary: Crear rol (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Rol creado
 */
router.get("/", authenticate, ctrl.listRoles);
router.post("/", authenticate, requireRole("ADMIN"), ctrl.createRol);

module.exports = router;
