const fs = require("fs");
const path = require("path");

const STATE_PATH = process.env.SIM_STATE_PATH || path.join(process.cwd(), "simulator_state.json");
const STORAGE_MAX_BYTES = Number(process.env.SIM_STORAGE_MAX_BYTES || 50 * 1024 * 1024);

let storageState = {
  overridePercent: null,
  alertSent: false,
};

function setStorageState(state) {
  if (!state) return;
  storageState = {
    ...storageState,
    ...state,
  };
}

function getStorageState() {
  return { ...storageState };
}

function setOverridePercent(percent) {
  if (percent === null || percent === undefined) {
    storageState.overridePercent = null;
    return;
  }
  const normalized = Number(percent);
  if (Number.isFinite(normalized)) {
    storageState.overridePercent = Math.max(0, Math.min(100, normalized));
  }
}

function markAlertSent(value) {
  storageState.alertSent = Boolean(value);
}

function wasAlertSent() {
  return storageState.alertSent;
}

function getStorageUsage() {
  let usedBytes = 0;
  try {
    if (fs.existsSync(STATE_PATH)) {
      usedBytes = fs.statSync(STATE_PATH).size;
    }
  } catch (err) {
    usedBytes = 0;
  }

  const maxBytes = STORAGE_MAX_BYTES > 0 ? STORAGE_MAX_BYTES : Math.max(usedBytes, 1);
  let percent = (usedBytes / maxBytes) * 100;

  if (storageState.overridePercent !== null && storageState.overridePercent !== undefined) {
    percent = storageState.overridePercent;
  }

  return {
    usedBytes,
    maxBytes,
    percent: Math.max(0, Math.min(100, Number(percent.toFixed(2)))),
  };
}

module.exports = {
  getStorageUsage,
  getStorageState,
  setStorageState,
  setOverridePercent,
  markAlertSent,
  wasAlertSent,
};
