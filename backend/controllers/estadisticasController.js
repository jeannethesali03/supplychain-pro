const db = require('../config/db');

/**
 * Obtener estadísticas de incidentes por vehículo en un rango de fechas
 * Query params: startDate, endDate (ISO format)
 */
exports.incidentesPorVehiculo = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = startDate && endDate
      ? `WHERE i.fecha_creacion BETWEEN ? AND ?`
      : '';
    const params = (startDate && endDate) ? [startDate, endDate] : [];

    const query = `
      SELECT 
        COALESCE(v.placa, 'Sin asignar') AS vehiculo,
        v.id_vehiculo,
        COUNT(i.id_incidente) AS total_incidentes
      FROM incidentes i
      LEFT JOIN envios e ON i.id_envio = e.id_envio
      LEFT JOIN (
        SELECT ev1.id_envio, ev1.id_vehiculo, v.placa
        FROM envios_vehiculos ev1
        JOIN (
          SELECT id_envio, MAX(fecha_asignacion) AS fecha_asignacion
          FROM envios_vehiculos
          GROUP BY id_envio
        ) latest ON ev1.id_envio = latest.id_envio AND ev1.fecha_asignacion = latest.fecha_asignacion
        JOIN vehiculos v ON ev1.id_vehiculo = v.id_vehiculo
      ) v ON v.id_envio = e.id_envio
      ${whereClause}
      GROUP BY v.id_vehiculo, v.placa
      ORDER BY total_incidentes DESC
      LIMIT 20
    `;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Obtener estadísticas de incidentes por ruta
 */
exports.incidentesPorRuta = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = startDate && endDate
      ? `WHERE i.fecha_creacion BETWEEN ? AND ?`
      : '';
    const params = (startDate && endDate) ? [startDate, endDate] : [];

    const query = `
      SELECT 
        COALESCE(r.nombre, 'Sin ruta') AS ruta,
        COALESCE(r.id_ruta, 0) AS id_ruta,
        COUNT(i.id_incidente) AS total_incidentes
      FROM incidentes i
      LEFT JOIN envios e ON i.id_envio = e.id_envio
      LEFT JOIN rutas r ON e.id_ruta = r.id_ruta
      ${whereClause}
      GROUP BY COALESCE(r.id_ruta, 0), COALESCE(r.nombre, 'Sin ruta')
      ORDER BY total_incidentes DESC
      LIMIT 20
    `;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Obtener estadísticas de tipos de incidentes
 */
exports.incidentesPorTipo = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = startDate && endDate
      ? `WHERE i.fecha_creacion BETWEEN ? AND ?`
      : '';
    const params = (startDate && endDate) ? [startDate, endDate] : [];

    const query = `
      SELECT 
        i.tipo_incidente,
        COUNT(i.id_incidente) AS total_incidentes,
        MIN(i.fecha_creacion) AS primer_incidente,
        MAX(i.fecha_creacion) AS ultimo_incidente
      FROM incidentes i
      ${whereClause}
      GROUP BY i.tipo_incidente
      ORDER BY total_incidentes DESC
    `;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Obtener incidentes filtrados por vehículo, ruta, envío, con rango de fechas
 */
exports.incidentes = async (req, res, next) => {
  try {
    const { vehiculoId, rutaId, envioId, startDate, endDate } = req.query;
    console.log("STATS_DEBUG - query params:", { startDate, endDate, vehiculoId, rutaId, envioId });
    let whereConditions = [];
    let params = [];

    if (startDate && endDate) {
      whereConditions.push('i.fecha_creacion BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }
    if (vehiculoId) {
      whereConditions.push('v.id_vehiculo = ?');
      params.push(vehiculoId);
    }
    if (rutaId) {
      whereConditions.push('r.id_ruta = ?');
      params.push(rutaId);
    }
    if (envioId) {
      whereConditions.push('i.id_envio = ?');
      params.push(envioId);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const query = `
      SELECT 
        i.id_incidente,
        i.id_envio,
        i.tipo_incidente,
        i.valor_registrado,
        i.valor_limite,
        i.descripcion,
        i.fecha_creacion as fecha_incidente,
        e.codigo_rastreo,
        e.origen,
        e.destino,
        r.nombre AS nombre_ruta,
        v.id_vehiculo,
        v.placa AS vehiculo_placa,
        rt.latitud,
        rt.longitud,
        rt.temperatura as temp_registrada,
        rt.humedad,
        rt.porcentaje_bateria,
        rt.marca_tiempo_dispositivo
      FROM incidentes i
      LEFT JOIN envios e ON i.id_envio = e.id_envio
      LEFT JOIN rutas r ON e.id_ruta = r.id_ruta
      LEFT JOIN (
        SELECT ev1.id_envio, ev1.id_vehiculo, v.placa
        FROM envios_vehiculos ev1
        JOIN (
          SELECT id_envio, MAX(fecha_asignacion) AS fecha_asignacion
          FROM envios_vehiculos
          GROUP BY id_envio
        ) latest ON ev1.id_envio = latest.id_envio AND ev1.fecha_asignacion = latest.fecha_asignacion
        JOIN vehiculos v ON ev1.id_vehiculo = v.id_vehiculo
      ) v ON v.id_envio = e.id_envio
      LEFT JOIN registros_telemetria rt ON i.id_registro_telemetria = rt.id_registro_telemetria
      ${whereClause}
      ORDER BY i.fecha_creacion DESC
      LIMIT 500
    `;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Obtener incidentes agrupados por ubicación (latitud/longitud)
 */
exports.incidentesPorUbicacion = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = startDate && endDate
      ? `WHERE i.fecha_creacion BETWEEN ? AND ?`
      : '';
    const params = (startDate && endDate) ? [startDate, endDate] : [];

    const query = `
      SELECT 
        rt.latitud,
        rt.longitud,
        COUNT(i.id_incidente) AS total_incidentes,
        GROUP_CONCAT(DISTINCT i.tipo_incidente SEPARATOR ', ') AS tipos,
        MIN(i.fecha_creacion) AS primer_incidente,
        MAX(i.fecha_creacion) AS ultimo_incidente,
        GROUP_CONCAT(DISTINCT v.placa SEPARATOR ', ') AS vehiculos_afectados
      FROM incidentes i
      LEFT JOIN registros_telemetria rt ON i.id_registro_telemetria = rt.id_registro_telemetria
      LEFT JOIN envios e ON i.id_envio = e.id_envio
      LEFT JOIN (
        SELECT ev1.id_envio, ev1.id_vehiculo, v.placa
        FROM envios_vehiculos ev1
        JOIN (
          SELECT id_envio, MAX(fecha_asignacion) AS fecha_asignacion
          FROM envios_vehiculos
          GROUP BY id_envio
        ) latest ON ev1.id_envio = latest.id_envio AND ev1.fecha_asignacion = latest.fecha_asignacion
        JOIN vehiculos v ON ev1.id_vehiculo = v.id_vehiculo
      ) v ON v.id_envio = e.id_envio
      ${whereClause}
      GROUP BY rt.latitud, rt.longitud
      HAVING rt.latitud IS NOT NULL AND rt.longitud IS NOT NULL
      ORDER BY total_incidentes DESC
      LIMIT 50
    `;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Obtener resumen general de estadísticas
 */
exports.resumen = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = startDate && endDate
      ? `WHERE fecha_creacion BETWEEN ? AND ?`
      : '';
    const params = (startDate && endDate) ? [startDate, endDate] : [];

    const [stats] = await db.query(
      `SELECT COUNT(*) as total FROM incidentes ${whereClause}`,
      params
    );

    const [byType] = await db.query(
      `
        SELECT tipo_incidente, COUNT(*) as count 
        FROM incidentes 
        ${whereClause}
        GROUP BY tipo_incidente
      `,
      params
    );

    res.json({
      total: stats[0]?.total || 0,
      porTipo: byType || []
    });
  } catch (err) {
    next(err);
  }
};
