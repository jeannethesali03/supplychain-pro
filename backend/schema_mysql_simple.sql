-- SupplyChain Pro (versión simple)
-- En este esquema los INCIDENTES los crea el SIMULADOR (no se calculan por zonas/geofence en el backend).
-- Recomendado: MySQL 8.x

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS detalles_envio;
DROP TABLE IF EXISTS incidentes;
DROP TABLE IF EXISTS registros_telemetria;
DROP TABLE IF EXISTS envios_vehiculos;
DROP TABLE IF EXISTS vehiculos;
DROP TABLE IF EXISTS envios;
DROP TABLE IF EXISTS rutas;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS productos;

SET FOREIGN_KEY_CHECKS = 1;

-- 1) Rutas planificadas (sin tipos espaciales; el simulador solo necesita waypoints)
CREATE TABLE rutas (
  id_ruta INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  waypoints_json JSON NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Envíos (carga monitoreada)
CREATE TABLE envios (
  id_envio INT AUTO_INCREMENT PRIMARY KEY,
  codigo_rastreo VARCHAR(100) UNIQUE NOT NULL,
  origen VARCHAR(255) NOT NULL,
  destino VARCHAR(255) NOT NULL,
  id_ruta INT NULL,
  temp_max_permitida DECIMAL(5,2) NOT NULL,
  temp_min_permitida DECIMAL(5,2) NOT NULL,
  estado ENUM('EN_TRANSITO', 'ENTREGADO', 'INCIDENTE_REPORTADO', 'CANCELADO') DEFAULT 'EN_TRANSITO',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ruta) REFERENCES rutas(id_ruta) ON DELETE SET NULL
);

-- 3) Vehículos / camiones
CREATE TABLE vehiculos (
  id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
  placa VARCHAR(20) UNIQUE NOT NULL,
  activo BOOLEAN DEFAULT TRUE
);

-- 4) Asignación envío-vehículo
CREATE TABLE envios_vehiculos (
  id_envio_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
  id_envio INT NOT NULL,
  id_vehiculo INT NOT NULL,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_envio) REFERENCES envios(id_envio) ON DELETE CASCADE,
  FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo) ON DELETE CASCADE,
  UNIQUE KEY unica_envio_vehiculo (id_envio, id_vehiculo)
);

-- 5) Telemetría (alta frecuencia)
CREATE TABLE registros_telemetria (
  id_registro_telemetria BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_envio INT NOT NULL,
  latitud DECIMAL(10,8) NOT NULL,
  longitud DECIMAL(11,8) NOT NULL,
  temperatura DECIMAL(5,2) NOT NULL,
  humedad DECIMAL(5,2) NULL,
  porcentaje_bateria INT NULL,
  marca_tiempo_dispositivo TIMESTAMP NOT NULL,
  marca_tiempo_servidor TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_envio) REFERENCES envios(id_envio) ON DELETE CASCADE,
  CHECK (porcentaje_bateria IS NULL OR (porcentaje_bateria BETWEEN 0 AND 100))
);

CREATE INDEX idx_envio_tiempo_dispositivo ON registros_telemetria (id_envio, marca_tiempo_dispositivo DESC);

-- 6) Incidentes (creados por el simulador)
-- Nota: id_registro_telemetria es NULLABLE para permitir incidentes “por evento/botón” aunque no haya registro exacto.
CREATE TABLE incidentes (
  id_incidente BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_envio INT NOT NULL,
  id_registro_telemetria BIGINT NULL,
  tipo_incidente VARCHAR(60) NOT NULL,
  valor_registrado DECIMAL(10,2) NULL,
  valor_limite DECIMAL(10,2) NULL,
  descripcion TEXT,
  origen_evento ENUM('SIMULADOR') DEFAULT 'SIMULADOR',
  metadata_json JSON NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_envio) REFERENCES envios(id_envio) ON DELETE RESTRICT,
  FOREIGN KEY (id_registro_telemetria) REFERENCES registros_telemetria(id_registro_telemetria) ON DELETE SET NULL
);

CREATE INDEX idx_incidentes_envio_fecha ON incidentes (id_envio, fecha_creacion DESC);

DELIMITER //

CREATE TRIGGER trg_incidentes_no_update
BEFORE UPDATE ON incidentes
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Los incidentes son inmutables';
END//

CREATE TRIGGER trg_incidentes_no_delete
BEFORE DELETE ON incidentes
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Los incidentes son inmutables';
END//

DELIMITER ;

-- 7) Productos
CREATE TABLE productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  codigo_sku VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT
);

-- 8) Detalle / manifiesto de envío
CREATE TABLE detalles_envio (
  id_detalle_envio INT AUTO_INCREMENT PRIMARY KEY,
  id_producto INT NOT NULL,
  id_envio INT NOT NULL,
  cantidad INT NOT NULL,
  peso_kg DECIMAL(8,2) NOT NULL,
  FOREIGN KEY (id_envio) REFERENCES envios(id_envio) ON DELETE CASCADE,
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT,
  UNIQUE KEY unica_envio_producto (id_envio, id_producto)
);

-- 9) Roles (solo ADMIN y USUARIO)
CREATE TABLE roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(255)
);

-- 10) Usuarios
CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  id_rol INT NOT NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  correo VARCHAR(150) UNIQUE NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP NULL,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE RESTRICT
);

-- Seeds mínimos (opcional)
INSERT IGNORE INTO roles (id_rol, nombre, descripcion)
VALUES
  (1, 'ADMIN', 'Administrador (CRUD completo)'),
  (2, 'USUARIO', 'Usuario de solo lectura');

-- Seeds de demo (evitan duplicados por clave unica)
INSERT IGNORE INTO rutas (id_ruta, nombre, waypoints_json, fecha_creacion) VALUES
  (7, 'Ruta CA-4: San Salvador - Puerto de La Libertad (Prueba)', '[{"lat":13.68,"lng":-89.23},{"lat":13.675,"lng":-89.235},{"lat":13.67,"lng":-89.24},{"lat":13.665,"lng":-89.245},{"lat":13.66,"lng":-89.25},{"lat":13.655,"lng":-89.253},{"lat":13.65,"lng":-89.256},{"lat":13.645,"lng":-89.258},{"lat":13.64,"lng":-89.26},{"lat":13.63,"lng":-89.263},{"lat":13.62,"lng":-89.266},{"lat":13.61,"lng":-89.27}]', '2026-05-04 02:24:51'),
  (8, 'Ruta CA-4: San Salvador - Puerto de La Libertad (Prueba)', '[{"lat":13.68,"lng":-89.23},{"lat":13.675,"lng":-89.235},{"lat":13.67,"lng":-89.24},{"lat":13.665,"lng":-89.245},{"lat":13.66,"lng":-89.25},{"lat":13.655,"lng":-89.253},{"lat":13.65,"lng":-89.256},{"lat":13.645,"lng":-89.258},{"lat":13.64,"lng":-89.26},{"lat":13.63,"lng":-89.263},{"lat":13.62,"lng":-89.266},{"lat":13.61,"lng":-89.27}]', '2026-05-04 02:36:19'),
  (9, 'Ruta CA-4: San Salvador - Puerto de La Libertad (Prueba)', '[{"lat":13.68,"lng":-89.23},{"lat":13.675,"lng":-89.235},{"lat":13.67,"lng":-89.24},{"lat":13.665,"lng":-89.245},{"lat":13.66,"lng":-89.25},{"lat":13.655,"lng":-89.253},{"lat":13.65,"lng":-89.256},{"lat":13.645,"lng":-89.258},{"lat":13.64,"lng":-89.26},{"lat":13.63,"lng":-89.263},{"lat":13.62,"lng":-89.266},{"lat":13.61,"lng":-89.27}]', '2026-05-04 02:40:29'),
  (10, 'Ruta CA-4: San Salvador - Puerto de La Libertad (Prueba)', '[{"lat":13.68,"lng":-89.23},{"lat":13.675,"lng":-89.235},{"lat":13.67,"lng":-89.24},{"lat":13.665,"lng":-89.245},{"lat":13.66,"lng":-89.25},{"lat":13.655,"lng":-89.253},{"lat":13.65,"lng":-89.256},{"lat":13.645,"lng":-89.258},{"lat":13.64,"lng":-89.26},{"lat":13.63,"lng":-89.263},{"lat":13.62,"lng":-89.266},{"lat":13.61,"lng":-89.27}]', '2026-05-04 02:42:09'),
  (11, 'Ruta CA-4: San Salvador - Puerto de La Libertad (Prueba)', '[{"lat":13.68,"lng":-89.23},{"lat":13.675,"lng":-89.235},{"lat":13.67,"lng":-89.24},{"lat":13.665,"lng":-89.245},{"lat":13.66,"lng":-89.25},{"lat":13.655,"lng":-89.253},{"lat":13.65,"lng":-89.256},{"lat":13.645,"lng":-89.258},{"lat":13.64,"lng":-89.26},{"lat":13.63,"lng":-89.263},{"lat":13.62,"lng":-89.266},{"lat":13.61,"lng":-89.27}]', '2026-05-04 02:45:09'),
  (12, 'Ruta CA-4: San Salvador - Puerto de La Libertad (Prueba)', '[{"lat":13.68,"lng":-89.23},{"lat":13.675,"lng":-89.235},{"lat":13.67,"lng":-89.24},{"lat":13.665,"lng":-89.245},{"lat":13.66,"lng":-89.25},{"lat":13.655,"lng":-89.253},{"lat":13.65,"lng":-89.256},{"lat":13.645,"lng":-89.258},{"lat":13.64,"lng":-89.26},{"lat":13.63,"lng":-89.263},{"lat":13.62,"lng":-89.266},{"lat":13.61,"lng":-89.27}]', '2026-05-04 02:49:23');

INSERT IGNORE INTO envios (id_envio, codigo_rastreo, origen, destino, id_ruta, temp_max_permitida, temp_min_permitida, estado, fecha_creacion) VALUES
  (13, 'SHIP-1777861491808', 'San Salvador', 'Puerto de La Libertad', 7, 5.00, 0.00, 'EN_TRANSITO', '2026-05-04 02:24:51'),
  (14, 'SHIP-1777862179349', 'San Salvador', 'Puerto de La Libertad', 8, 5.00, 0.00, 'EN_TRANSITO', '2026-05-04 02:36:19'),
  (15, 'SHIP-1777862429452', 'San Salvador', 'Puerto de La Libertad', 9, 5.00, 0.00, 'EN_TRANSITO', '2026-05-04 02:40:29'),
  (16, 'SHIP-1777862529844', 'San Salvador', 'Puerto de La Libertad', 10, 5.00, 0.00, 'EN_TRANSITO', '2026-05-04 02:42:09'),
  (17, 'SHIP-1777862709295', 'San Salvador', 'Puerto de La Libertad', 11, 5.00, 0.00, 'EN_TRANSITO', '2026-05-04 02:45:09'),
  (18, 'SHIP-1777862963979', 'San Salvador', 'Puerto de La Libertad', 12, 5.00, 0.00, 'EN_TRANSITO', '2026-05-04 02:49:23');

INSERT IGNORE INTO vehiculos (id_vehiculo, placa, activo) VALUES
  (1, 'P-448787', 1),
  (2, 'P-737242', 1),
  (3, 'SV-4PAZ86', 1),
  (4, 'SV-DAUHI', 1),
  (5, 'SV-BYNSZK', 1),
  (6, 'SV-M8LO0J', 1),
  (7, 'SV-Q02BS', 1),
  (8, 'SV-MZB9QI', 1),
  (9, 'SV-8W17G', 1);

INSERT IGNORE INTO envios_vehiculos (id_envio_vehiculo, id_envio, id_vehiculo, fecha_asignacion) VALUES
  (4, 13, 4, '2026-05-04 02:24:51'),
  (5, 14, 5, '2026-05-04 02:36:19'),
  (6, 15, 6, '2026-05-04 02:40:29'),
  (7, 16, 7, '2026-05-04 02:42:09'),
  (8, 17, 8, '2026-05-04 02:45:09'),
  (9, 18, 9, '2026-05-04 02:49:24');

INSERT IGNORE INTO registros_telemetria (id_registro_telemetria, id_envio, latitud, longitud, temperatura, humedad, porcentaje_bateria, marca_tiempo_dispositivo, marca_tiempo_servidor) VALUES
  (47, 13, 13.67022587, -89.23977413, 3.74, 71.76, 100, '2026-05-04 08:24:56', '2026-05-04 02:24:56'),
  (48, 13, 13.66044412, -89.24955588, 3.48, 72.16, 100, '2026-05-04 08:25:01', '2026-05-04 02:25:01'),
  (49, 13, 13.64865131, -89.25653948, 3.33, 73.32, 99, '2026-05-04 08:25:06', '2026-05-04 02:25:06'),
  (50, 13, 13.63582744, -89.26125177, 10.00, 72.57, 99, '2026-05-04 08:25:11', '2026-05-04 02:25:11'),
  (51, 13, 13.62271258, -89.26518623, 10.00, 72.79, 99, '2026-05-04 08:25:16', '2026-05-04 02:25:16'),
  (52, 14, 13.67021024, -89.23978976, 4.74, 70.84, 100, '2026-05-04 08:36:24', '2026-05-04 02:36:24'),
  (53, 14, 13.66039917, -89.24960083, 4.88, 69.99, 100, '2026-05-04 08:36:29', '2026-05-04 02:36:29'),
  (54, 14, 13.64858527, -89.25656589, 5.14, 68.71, 99, '2026-05-04 08:36:34', '2026-05-04 02:36:34'),
  (55, 14, 13.63573849, -89.26127845, 10.00, 69.83, 99, '2026-05-04 08:36:39', '2026-05-04 02:36:39'),
  (56, 14, 13.62264979, -89.26520506, 10.00, 71.22, 99, '2026-05-04 08:36:44', '2026-05-04 02:36:44'),
  (57, 15, 13.67022392, -89.23977608, 1.80, 62.85, 100, '2026-05-04 08:40:34', '2026-05-04 02:40:34'),
  (58, 15, 13.66043240, -89.24956760, 1.47, 62.69, 100, '2026-05-04 08:40:39', '2026-05-04 02:40:39'),
  (59, 15, 13.64863353, -89.25654659, 1.74, 64.40, 100, '2026-05-04 08:40:44', '2026-05-04 02:40:44'),
  (60, 15, 13.63578035, -89.26126589, 10.00, 66.08, 99, '2026-05-04 08:40:49', '2026-05-04 02:40:49'),
  (61, 15, 13.62266026, -89.26520192, 9.82, 64.60, 99, '2026-05-04 08:40:54', '2026-05-04 02:40:54'),
  (62, 16, 13.67020242, -89.23979758, 3.41, 63.11, 100, '2026-05-04 08:42:14', '2026-05-04 02:42:15'),
  (63, 16, 13.66040308, -89.24959692, 3.01, 63.28, 99, '2026-05-04 08:42:20', '2026-05-04 02:42:20'),
  (64, 16, 13.64858019, -89.25656792, 3.22, 62.14, 99, '2026-05-04 08:42:25', '2026-05-04 02:42:25'),
  (65, 16, 13.63572803, -89.26128159, 10.00, 63.41, 99, '2026-05-04 08:42:30', '2026-05-04 02:42:30'),
  (66, 16, 13.62261317, -89.26521605, 9.62, 63.86, 99, '2026-05-04 08:42:35', '2026-05-04 02:42:35'),
  (67, 17, 13.67021219, -89.23978781, 3.62, 61.40, 100, '2026-05-04 08:45:14', '2026-05-04 02:45:14'),
  (68, 17, 13.66041285, -89.24958715, 3.85, 62.57, 100, '2026-05-04 08:45:19', '2026-05-04 02:45:19'),
  (69, 17, 13.64859289, -89.25656284, 4.29, 61.63, 100, '2026-05-04 08:45:24', '2026-05-04 02:45:24'),
  (70, 17, 13.63576465, -89.26127060, 10.00, 62.41, 99, '2026-05-04 08:45:29', '2026-05-04 02:45:29'),
  (71, 17, 13.62266026, -89.26520192, 10.00, 62.58, 99, '2026-05-04 08:45:34', '2026-05-04 02:45:34'),
  (72, 18, 13.67022392, -89.23977608, 3.65, 63.12, 100, '2026-05-04 08:49:29', '2026-05-04 02:49:29'),
  (73, 18, 13.66044021, -89.24955979, 3.68, 62.86, 100, '2026-05-04 08:49:34', '2026-05-04 02:49:34'),
  (74, 18, 13.64863353, -89.25654659, 3.83, 61.68, 100, '2026-05-04 08:49:39', '2026-05-04 02:49:39'),
  (75, 18, 13.63579343, -89.26126197, 10.00, 62.61, 100, '2026-05-04 08:49:44', '2026-05-04 02:49:44'),
  (76, 18, 13.62269165, -89.26519250, 10.00, 61.20, 100, '2026-05-04 08:49:49', '2026-05-04 02:49:49');

INSERT IGNORE INTO incidentes (id_incidente, id_envio, id_registro_telemetria, tipo_incidente, valor_registrado, valor_limite, descripcion, origen_evento, metadata_json, fecha_creacion) VALUES
  (3, 14, NULL, 'RUPTURA_CADENA_FRIO', 12.00, 5.00, 'Temperatura excedio el maximo permitido durante el transporte', 'SIMULADOR', '{"evento":"temperatura_alta","timestamp":"2026-05-04T02:36:34.529Z"}', '2026-05-04 02:36:34'),
  (4, 14, NULL, 'BATERIA_BAJA', 5.00, 10.00, 'El dispositivo de monitoreo tiene bateria baja', 'SIMULADOR', '{"evento":"bateria_baja","timestamp":"2026-05-04T02:36:44.575Z"}', '2026-05-04 02:36:44'),
  (5, 15, NULL, 'RUPTURA_CADENA_FRIO', 12.00, 5.00, 'Temperatura excedio el maximo permitido durante el transporte', 'SIMULADOR', '{"evento":"temperatura_alta","timestamp":"2026-05-04T02:40:44.608Z"}', '2026-05-04 02:40:44'),
  (6, 15, NULL, 'BATERIA_BAJA', 5.00, 10.00, 'El dispositivo de monitoreo tiene bateria baja', 'SIMULADOR', '{"evento":"bateria_baja","timestamp":"2026-05-04T02:40:54.646Z"}', '2026-05-04 02:40:54'),
  (7, 16, 63, 'RUPTURA_CADENA_FRIO', 12.00, 5.00, 'Temperatura excedio el maximo permitido durante el transporte', 'SIMULADOR', '{"evento":"temperatura_alta","timestamp":"2026-05-04T02:42:25.026Z"}', '2026-05-04 02:42:25'),
  (8, 16, 66, 'BATERIA_BAJA', 5.00, 10.00, 'El dispositivo de monitoreo tiene bateria baja', 'SIMULADOR', '{"evento":"bateria_baja","timestamp":"2026-05-04T02:42:35.066Z"}', '2026-05-04 02:42:35'),
  (9, 17, 68, 'RUPTURA_CADENA_FRIO', 12.00, 5.00, 'Temperatura excedio el maximo permitido durante el transporte', 'SIMULADOR', '{"evento":"temperatura_alta","timestamp":"2026-05-04T02:45:24.466Z"}', '2026-05-04 02:45:24'),
  (10, 17, 71, 'BATERIA_BAJA', 5.00, 10.00, 'El dispositivo de monitoreo tiene bateria baja', 'SIMULADOR', '{"evento":"bateria_baja","timestamp":"2026-05-04T02:45:34.495Z"}', '2026-05-04 02:45:34'),
  (11, 18, 74, 'RUPTURA_CADENA_FRIO', 12.00, 5.00, 'Temperatura excedio el maximo permitido durante el transporte', 'SIMULADOR', '{"evento":"temperatura_alta","timestamp":"2026-05-04T02:49:39.152Z"}', '2026-05-04 02:49:39'),
  (12, 18, 76, 'BATERIA_BAJA', 5.00, 10.00, 'El dispositivo de monitoreo tiene bateria baja', 'SIMULADOR', '{"evento":"bateria_baja","timestamp":"2026-05-04T02:49:49.180Z"}', '2026-05-04 02:49:49');

INSERT IGNORE INTO usuarios (id_usuario, id_rol, nombre_completo, correo, contrasena_hash, activo, fecha_creacion, ultimo_acceso) VALUES
  (1, 1, 'Admin Inicial', 'admin@local.test', '$2b$10$6NoCzRsPtxM7whJHRgjmJOhOLZdSx7sct3Kz19SUghLER0fZOLI9.', 1, '2026-05-03 23:57:00', NULL),
  (2, 1, 'Test Admin', 'test@admin.com', '$2b$10$LNoHiCWHsaiYi3QcN.c2yuZFbEvrS5yptNaROZ8jN0DuF/MUTkToy', 1, '2026-05-03 23:58:00', NULL);
