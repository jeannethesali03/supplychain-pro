require("dotenv").config(); //Cargar variables d entorno
const http = require("http");
const express = require("express"); //Crear servidor web
const cors = require("cors"); //Para permitir solicitudes desde otro dominio
const swaggerUi = require("swagger-ui-express");

const db = require("./config/db");
const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/auth");
const enviosRoutes = require("./routes/envios");
const vehiculosRoutes = require("./routes/vehiculos");
const enviosVehiculosRoutes = require("./routes/enviosVehiculos");
const registrosRoutes = require("./routes/registrosTelemetria");
const incidentesRoutes = require("./routes/incidentes");
const productosRoutes = require("./routes/productos");
const detallesEnvioRoutes = require("./routes/detallesEnvio");
const rolesRoutes = require("./routes/roles");
const usuariosRoutes = require("./routes/usuarios");
const rutasRoutes = require("./routes/rutas");
const simulatorRoutes = require("./routes/simulator");
const { initSocket } = require("./socket");

const app = express(); //Instancia del servidor
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5001,http://localhost:3000"
).split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir solicitudes sin origin (como curl o Postman)
      if (!origin) return callback(null, true);
      
      // En desarrollo, permitir cualquier origen para facilitar testing
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      
      // En producción, usar lista blanca
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("No permitido por CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    preflightContinue: false, // Responder a preflight requests
    optionsSuccessStatus: 204, // Código de éxito para OPTIONS
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json()); //Recibir los datos en JSON

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
  }),
);

/**
 * @openapi
 * /api-docs.json:
 *   get:
 *     tags: [Docs]
 *     summary: Devuelve la especificacion OpenAPI en formato JSON
 *     responses:
 *       200:
 *         description: Documento OpenAPI generado
 */
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Rutas de negocio del backend
app.use("/api/auth", authRoutes);
app.use("/api/envios", enviosRoutes);
app.use("/api/vehiculos", vehiculosRoutes);
app.use("/api/envios-vehiculos", enviosVehiculosRoutes);
app.use("/api/registros", registrosRoutes);
app.use("/api/incidentes", incidentesRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/detalles-envio", detallesEnvioRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/rutas", rutasRoutes);
app.use("/api/simulator", simulatorRoutes);

const verifyDbConnection = async () => {
  try {
    await db.query("SELECT 1 AS ok");
    console.log("Conectado a la base de datos MySQL");
  } catch (err) {
    console.error("Error conectando a la base de datos:", err);
    process.exit(1); // Sale de la aplicacion en caso de error
  }
};

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Verifica que el backend esta activo
 *     responses:
 *       200:
 *         description: Backend operativo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "backend",
    timestamp: new Date().toISOString(),
  });
});

/**
 * @openapi
 * /health/db:
 *   get:
 *     tags: [Health]
 *     summary: Verifica conectividad con MySQL
 *     responses:
 *       200:
 *         description: Base de datos disponible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DbStatusResponse'
 *       500:
 *         description: Error conectando a la base de datos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get("/health/db", async (req, res) => {
  try {
    await db.query("SELECT 1 AS ok");
    return res.status(200).json({
      ok: true,
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Database unavailable",
    });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
initSocket(httpServer, allowedOrigins);

httpServer.listen(PORT, async () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
  console.log(`Swagger UI disponible en /api-docs`);
  await verifyDbConnection();
});
