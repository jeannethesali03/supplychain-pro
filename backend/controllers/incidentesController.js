const db = require('../config/db');
const { emitEvent } = require('../socket');

// Listar incidentes recientes
exports.listIncidentes = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM incidentes ORDER BY fecha_creacion DESC LIMIT 200');
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
    const [rows] = await db.query('SELECT * FROM incidentes WHERE id_incidente = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Incidente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};
