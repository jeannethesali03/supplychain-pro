const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/productosController");
const { authenticate } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

/**
 * @openapi
 * /api/productos:
 *   get:
 *     tags: [Productos]
 *     summary: Lista productos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos
 *   post:
 *     tags: [Productos]
 *     summary: Crear producto (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Producto creado
 * /api/productos/{id}:
 *   get:
 *     tags: [Productos]
 *     summary: Obtener producto por id
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
 *         description: Producto encontrado
 *   put:
 *     tags: [Productos]
 *     summary: Actualizar producto (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Producto actualizado
 *   delete:
 *     tags: [Productos]
 *     summary: Eliminar producto (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Producto eliminado
 */
router.get("/", authenticate, ctrl.listProductos);
router.get("/:id", authenticate, ctrl.getProducto);
router.post("/", authenticate, requireRole("ADMIN"), ctrl.createProducto);
router.put("/:id", authenticate, requireRole("ADMIN"), ctrl.updateProducto);
router.delete("/:id", authenticate, requireRole("ADMIN"), ctrl.deleteProducto);

module.exports = router;
