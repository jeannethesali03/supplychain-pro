const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/vehiculosController");
const { authenticate } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

/**
 * @openapi
 * /api/vehiculos:
 *   get:
 *     tags: [Vehiculos]
 *     summary: Lista vehículos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vehículos
 *   post:
 *     tags: [Vehiculos]
 *     summary: Crear vehículo (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Vehículo creado
 * /api/vehiculos/{id}:
 *   get:
 *     tags: [Vehiculos]
 *     summary: Obtener vehículo por id
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
 *         description: Vehículo encontrado
 *   put:
 *     tags: [Vehiculos]
 *     summary: Actualizar vehículo (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehículo actualizado
 *   delete:
 *     tags: [Vehiculos]
 *     summary: Eliminar vehículo (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Vehículo eliminado
 */
router.get("/", authenticate, ctrl.listVehiculos);
router.get("/:id", authenticate, ctrl.getVehiculo);
router.post("/", authenticate, requireRole("ADMIN"), ctrl.createVehiculo);
router.put("/:id", authenticate, requireRole("ADMIN"), ctrl.updateVehiculo);
router.delete("/:id", authenticate, requireRole("ADMIN"), ctrl.deleteVehiculo);

module.exports = router;
