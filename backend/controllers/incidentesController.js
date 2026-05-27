const db = require('../config/db');
const { emitEvent } = require('../socket');

// Listar incidentes recientes con detalles de telemetría y envío
exports.listIncidentes = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        i.id_incidente,
        i.id_envio,
        i.id_registro_telemetria,
        i.tipo_incidente,
        i.valor_registrado,
        i.valor_limite,
        i.descripcion,
        i.origen_evento,
        i.metadata_json,
        i.fecha_creacion as fecha_incidente,
        e.codigo_rastreo,
        e.origen,
        e.destino,
        e.temp_min_permitida,
        e.temp_max_permitida,
        e.estado as estado_envio,
        ev.id_vehiculo,
        ev.placa AS vehiculo_placa,
        rt.latitud,
        rt.longitud,
        rt.temperatura as temp_registrada,
        rt.humedad,
        rt.porcentaje_bateria,
        rt.marca_tiempo_dispositivo
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
      ) ev ON ev.id_envio = e.id_envio
      LEFT JOIN registros_telemetria rt ON i.id_registro_telemetria = rt.id_registro_telemetria
      ORDER BY i.fecha_creacion DESC 
      LIMIT 200
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Crear incidente: vincula registro y envío. Se asume que la inmutabilidad se aplica vía roles/privilegios y no UPDATE
exports.createIncidente = async (req, res, next) => {
  try {
    const {
      id_envio,
      id_registro_telemetria = null,
      tipo_incidente,
      valor_registrado = null,
      valor_limite = null,
      descripcion = null,
      origen_evento = 'SIMULADOR',
      metadata_json = null,
    } = req.body;

    if (!id_envio) return res.status(400).json({ error: 'Falta id_envio' });
    if (!tipo_incidente) return res.status(400).json({ error: 'Falta tipo_incidente' });

    const metadataPayload =
      metadata_json === null || metadata_json === undefined
        ? null
        : (typeof metadata_json === 'string' ? metadata_json : JSON.stringify(metadata_json));

    const [result] = await db.query(
      'INSERT INTO incidentes (id_envio, id_registro_telemetria, tipo_incidente, valor_registrado, valor_limite, descripcion, origen_evento, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id_envio, id_registro_telemetria, tipo_incidente, valor_registrado, valor_limite, descripcion, origen_evento, metadataPayload]
    );
    emitEvent('incident:new', {
      id_incidente: result.insertId,
      id_envio,
      id_registro_telemetria,
      tipo_incidente,
      valor_registrado,
      valor_limite,
      descripcion,
      origen_evento,
      metadata_json: metadataPayload,
      server_timestamp: new Date().toISOString(),
    });
    res.status(201).json({ id_incidente: result.insertId });
  } catch (err) {
    next(err);
  }
};

exports.getIncidente = async (req, res, next) => {
  try {
    const id = req.params.id;
    const query = `
      SELECT 
        i.id_incidente,
        i.id_envio,
        i.id_registro_telemetria,
        i.tipo_incidente,
        i.valor_registrado,
        i.valor_limite,
        i.descripcion,
        i.origen_evento,
        i.metadata_json,
        i.fecha_creacion as fecha_incidente,
        e.codigo_rastreo,
        e.origen,
        e.destino,
        e.temp_min_permitida,
        e.temp_max_permitida,
        e.estado as estado_envio,
        ev.id_vehiculo,
        ev.placa AS vehiculo_placa,
        rt.latitud,
        rt.longitud,
        rt.temperatura as temp_registrada,
        rt.humedad,
        rt.porcentaje_bateria,
        rt.marca_tiempo_dispositivo
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
      ) ev ON ev.id_envio = e.id_envio
      LEFT JOIN registros_telemetria rt ON i.id_registro_telemetria = rt.id_registro_telemetria
      WHERE i.id_incidente = ?
    `;
    const [rows] = await db.query(query, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Incidente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};
