const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/usuariosController");
const { authenticate } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

/**
 * @openapi
 * /api/usuarios:
 *   get:
 *     tags: [Usuarios]
 *     summary: Lista usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *   post:
 *     tags: [Usuarios]
 *     summary: Crear usuario (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Usuario creado
 * /api/usuarios/{id}:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtener usuario por id
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
 *         description: Usuario encontrado
 *   put:
 *     tags: [Usuarios]
 *     summary: Actualizar usuario (ADMIN)
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
 *         description: Usuario actualizado
 */
router.get("/", authenticate, ctrl.listUsuarios);
router.get("/:id", authenticate, ctrl.getUsuario);
router.post("/", authenticate, requireRole("ADMIN"), ctrl.createUsuario);
router.put("/:id", authenticate, requireRole("ADMIN"), ctrl.updateUsuario);

module.exports = router;
