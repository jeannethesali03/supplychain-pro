const db = require('../config/db');
const { emitEvent } = require('../socket');

const toMysqlTimestamp = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

exports.createRegistro = async (req, res, next) => {
  try {
    const { id_envio, latitud, longitud, temperatura, humedad, porcentaje_bateria, marca_tiempo_dispositivo } = req.body;
    if (
      id_envio === undefined || id_envio === null ||
      latitud === undefined || latitud === null ||
      longitud === undefined || longitud === null ||
      temperatura === undefined || temperatura === null ||
      Number.isNaN(Number(temperatura))
    ) {
      return res.status(400).json({ error: 'Faltan campos obligatorios de telemetria' });
    }
    const timestamp = toMysqlTimestamp(marca_tiempo_dispositivo) || toMysqlTimestamp(new Date());
    const [result] = await db.query(
      'INSERT INTO registros_telemetria (id_envio, latitud, longitud, temperatura, humedad, porcentaje_bateria, marca_tiempo_dispositivo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_envio, latitud, longitud, temperatura, humedad, porcentaje_bateria, timestamp]
    );
    emitEvent('telemetry:new', {
      id_registro_telemetria: result.insertId,
      id_envio,
      latitud,
      longitud,
      temperatura,
      humedad,
      porcentaje_bateria,
      marca_tiempo_dispositivo,
      server_timestamp: new Date().toISOString(),
    });
    res.status(201).json({ id_registro_telemetria: result.insertId });
  } catch (err) { next(err); }
};

exports.getRegistro = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM registros_telemetria WHERE id_registro_telemetria = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.listRegistrosPorEnvio = async (req, res, next) => {
  try {
    const id = req.params.id;
    const limit = parseInt(req.query.limit || '100', 10);
    const since = req.query.since; // ISO timestamp optional
    let sql = 'SELECT * FROM registros_telemetria WHERE id_envio = ?';
    const params = [id];
    if (since) { sql += ' AND marca_tiempo_dispositivo >= ?'; params.push(since); }
    sql += ' ORDER BY marca_tiempo_dispositivo DESC LIMIT ?'; params.push(limit);
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};
