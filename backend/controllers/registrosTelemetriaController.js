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

    // Validación automática del backend para generar Tickets de Incidencia Inmutables
    try {
      const [envioRows] = await db.query(
        'SELECT temp_min_permitida, temp_max_permitida, estado FROM envios WHERE id_envio = ?',
        [id_envio]
      );
      if (envioRows.length > 0) {
        const envio = envioRows[0];
        const tMin = Number(envio.temp_min_permitida);
        const tMax = Number(envio.temp_max_permitida);
        const tempVal = Number(temperatura);

        // Caso 1: Ruptura de cadena de frío
        if (tempVal < tMin || tempVal > tMax) {
          const [existingIncident] = await db.query(
            'SELECT id_incidente FROM incidentes WHERE id_envio = ? AND tipo_incidente = ? AND ABS(valor_registrado - ?) < 0.01',
            [id_envio, 'RUPTURA_CADENA_FRIO', tempVal]
          );
          if (existingIncident.length === 0) {
            const [incResult] = await db.query(
              'INSERT INTO incidentes (id_envio, id_registro_telemetria, tipo_incidente, valor_registrado, valor_limite, descripcion, origen_evento) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [id_envio, result.insertId, 'RUPTURA_CADENA_FRIO', tempVal, tempVal > tMax ? tMax : tMin, 'Temperatura excedió los límites permitidos (Generado por el Backend)', 'SISTEMA']
            );
            if (envio.estado !== 'INCIDENTE_REPORTADO') {
              await db.query('UPDATE envios SET estado = ? WHERE id_envio = ?', ['INCIDENTE_REPORTADO', id_envio]);
              emitEvent('envio:updated', { id_envio, estado: 'INCIDENTE_REPORTADO' });
            }
            emitEvent('incident:new', {
              id_incidente: incResult.insertId,
              id_envio,
              id_registro_telemetria: result.insertId,
              tipo_incidente: 'RUPTURA_CADENA_FRIO',
              valor_registrado: tempVal,
              valor_limite: tempVal > tMax ? tMax : tMin,
              descripcion: 'Temperatura excedió los límites permitidos (Generado por el Backend)',
              origen_evento: 'SISTEMA',
              server_timestamp: new Date().toISOString()
            });
          }
        }

        // Caso 2: Batería crítica
        if (porcentaje_bateria !== undefined && porcentaje_bateria !== null) {
          const batVal = Number(porcentaje_bateria);
          if (batVal <= 5) {
            const [existingBatIncident] = await db.query(
              'SELECT id_incidente FROM incidentes WHERE id_envio = ? AND tipo_incidente = ? AND valor_registrado = ?',
              [id_envio, 'BATERIA_BAJA', batVal]
            );
            if (existingBatIncident.length === 0) {
              const [incResult] = await db.query(
                'INSERT INTO incidentes (id_envio, id_registro_telemetria, tipo_incidente, valor_registrado, valor_limite, descripcion, origen_evento) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id_envio, result.insertId, 'BATERIA_BAJA', batVal, 10, 'Batería baja en dispositivo de monitoreo (Generado por el Backend)', 'SISTEMA']
              );
              if (envio.estado !== 'INCIDENTE_REPORTADO') {
                await db.query('UPDATE envios SET estado = ? WHERE id_envio = ?', ['INCIDENTE_REPORTADO', id_envio]);
                emitEvent('envio:updated', { id_envio, estado: 'INCIDENTE_REPORTADO' });
              }
              emitEvent('incident:new', {
                id_incidente: incResult.insertId,
                id_envio,
                id_registro_telemetria: result.insertId,
                tipo_incidente: 'BATERIA_BAJA',
                valor_registrado: batVal,
                valor_limite: 10,
                descripcion: 'Batería baja en dispositivo de monitoreo (Generado por el Backend)',
                origen_evento: 'SISTEMA',
                server_timestamp: new Date().toISOString()
              });
            }
          }
        }
      }
    } catch (errCheck) {
      console.error('Error al realizar validaciones de incidentes automáticas en el backend:', errCheck);
    }

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
