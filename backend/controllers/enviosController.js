const db = require('../config/db');
const { emitEvent } = require('../socket');

exports.listEnvios = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM envios ORDER BY fecha_creacion DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.getEnvio = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM envios WHERE id_envio = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Envío no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.createEnvio = async (req, res, next) => {
  try {
    const { codigo_rastreo, origen, destino, id_ruta = null, temp_max_permitida, temp_min_permitida } = req.body;
    const [result] = await db.query(
      'INSERT INTO envios (codigo_rastreo, origen, destino, id_ruta, temp_max_permitida, temp_min_permitida) VALUES (?, ?, ?, ?, ?, ?)',
      [codigo_rastreo, origen, destino, id_ruta, temp_max_permitida, temp_min_permitida]
    );
    const id_envio = result.insertId;
    emitEvent('envio:created', {
      id_envio,
      codigo_rastreo,
      origen,
      destino,
      id_ruta,
      temp_max_permitida,
      temp_min_permitida,
      estado: 'EN_TRANSITO'
    });
    res.status(201).json({ id_envio });
  } catch (err) {
    next(err);
  }
};

exports.updateEnvio = async (req, res, next) => {
  try {
    const id = req.params.id;
    const fields = req.body;
    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ error: 'No hay campos para actualizar' });
    const values = keys.map(k => fields[k]);
    const set = keys.map(k => `${k} = ?`).join(', ');
    await db.query(`UPDATE envios SET ${set} WHERE id_envio = ?`, [...values, id]);
    
    emitEvent('envio:updated', {
      id_envio: Number(id),
      ...fields
    });
    
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.deleteEnvio = async (req, res, next) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM envios WHERE id_envio = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

