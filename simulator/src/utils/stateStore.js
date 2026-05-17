const fs = require("fs");
const path = require("path");

const STATE_PATH = process.env.SIM_STATE_PATH || path.join(process.cwd(), "simulator_state.json");

function readState() {
  try {
    if (!fs.existsSync(STATE_PATH)) return null;
    const raw = fs.readFileSync(STATE_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error leyendo estado del simulador:", err.message);
    return null;
  }
}

function writeState(payload) {
  try {
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error("Error guardando estado del simulador:", err.message);
  }
}

module.exports = {
  readState,
  writeState,
};
