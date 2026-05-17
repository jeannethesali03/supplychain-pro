const axios = require("axios");

const SIMULATOR_URL = process.env.SIMULATOR_URL || "http://localhost:3001";
const SIMULATOR_API = `${SIMULATOR_URL}/api/simulator`;

async function forwardRequest(method, path, data) {
  const url = `${SIMULATOR_API}${path}`;
  const response = await axios({
    method,
    url,
    data,
    timeout: 10000,
  });
  return response;
}

exports.health = async (req, res, next) => {
  try {
    const response = await forwardRequest("get", "/health");
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.listJourneys = async (req, res, next) => {
  try {
    const response = await forwardRequest("get", "/journeys");
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.storageStatus = async (req, res, next) => {
  try {
    const idEnvio = req.query.id_envio ? String(req.query.id_envio) : "";
    const query = idEnvio ? `?id_envio=${encodeURIComponent(idEnvio)}` : "";
    const response = await forwardRequest("get", `/storage${query}`);
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.getJourney = async (req, res, next) => {
  try {
    const response = await forwardRequest("get", `/journeys/${req.params.id_envio}`);
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.startJourney = async (req, res, next) => {
  try {
    const response = await forwardRequest("post", "/journeys/start", req.body);
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.pauseJourney = async (req, res, next) => {
  try {
    const response = await forwardRequest("post", `/journeys/${req.params.id_envio}/pause`);
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.resumeJourney = async (req, res, next) => {
  try {
    const response = await forwardRequest("post", `/journeys/${req.params.id_envio}/resume`);
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.stopJourney = async (req, res, next) => {
  try {
    const response = await forwardRequest("post", `/journeys/${req.params.id_envio}/stop`);
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.temperaturaAlta = async (req, res, next) => {
  try {
    const response = await forwardRequest(
      "post",
      `/incidents/${req.params.id_envio}/temperatura-alta`
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.bateriaBaja = async (req, res, next) => {
  try {
    const response = await forwardRequest(
      "post",
      `/incidents/${req.params.id_envio}/bateria-baja`
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.geofenceViolation = async (req, res, next) => {
  try {
    const response = await forwardRequest(
      "post",
      `/incidents/${req.params.id_envio}/geofence-violation`
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.volumenLleno = async (req, res, next) => {
  try {
    const response = await forwardRequest(
      "post",
      `/incidents/${req.params.id_envio}/volumen-lleno`
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};
