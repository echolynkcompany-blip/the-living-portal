const { app, BrowserWindow, ipcMain, systemPreferences } = require('electron');
const path = require('node:path');
const {
  SmartSpectraSDK, CameraSelection, MetricType, ValidationCode, decodeMetrics,
} = require('@smartspectra/node-sdk');

let window;
let session;
let closing = false;

function send(state) {
  if (window && !window.isDestroyed()) window.webContents.send('portal:signal', state);
}

async function stopCamera() {
  const current = session;
  if (!current) return;
  current.stop ??= (async () => {
    current.active = false;
    try {
      if (current.sdk) {
        try {
          await current.sdk.stopAsync();
        } finally {
          await current.sdk.destroy();
        }
      }
    } finally {
      session = undefined;
    }
  })();
  return current.stop;
}

ipcMain.handle('portal:start', async (event) => {
  if (event.sender !== window.webContents || closing || session) return false;
  const apiKey = process.env.PRESAGE_API_KEY?.trim();
  if (!apiKey) throw new Error('Set PRESAGE_API_KEY before starting the app.');

  const current = { active: true, ready: false };
  session = current;
  try {
    if (process.platform === 'darwin' && !await systemPreferences.askForMediaAccess('camera')) {
      throw new Error('Camera access was denied. Check macOS Privacy & Security settings.');
    }
    if (!current.active) return false;

    const sdk = new SmartSpectraSDK({
      apiKey,
      requestedMetrics: [MetricType.CHEST_BREATHING],
      enableTelemetry: false,
      enableAccumulatedOutput: false,
    });
    current.sdk = sdk;
    sdk.on('validationStatus', (code, _, hint) => {
      if (!current.active) return;
      current.ready = code === ValidationCode.kOk;
      if (!current.ready) send({ type: 'waiting', hint });
    });
    sdk.on('metrics', (buffer) => {
      if (!current.active || !current.ready) return;
      const sample = decodeMetrics(buffer).breathing?.upperTrace?.at(-1)?.value;
      if (Number.isFinite(sample)) send({ type: 'sample', sample });
    });
    sdk.on('error', (code, _, retryable) => {
      if (!current.active) return;
      current.ready = false;
      if (retryable) {
        send({ type: 'waiting', hint: 'Waiting for SmartSpectra to recover.' });
        return;
      }
      stopCamera().then(
        () => send({ type: 'stopped', hint: `SmartSpectra stopped (code ${code}).` }),
        () => send({ type: 'stopped', hint: 'SmartSpectra reported a camera shutdown error.' }),
      );
    });
    sdk.useCamera(CameraSelection.default);
    sdk.start();
    return true;
  } catch (error) {
    await stopCamera();
    if (!current.sdk) throw error;
    throw new Error('SmartSpectra could not start. Check camera access and your Presage key.');
  }
});

ipcMain.handle('portal:stop', (event) => {
  if (event.sender === window.webContents) return stopCamera();
});

app.whenReady().then(() => {
  window = new BrowserWindow({
    width: 660,
    height: 640,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs') },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.on('close', (event) => {
    if (!session) return;
    event.preventDefault();
    closing = true;
    stopCamera().finally(() => window.destroy()).catch(() => {});
  });
  window.loadFile('index.html');
});

app.on('window-all-closed', () => app.quit());
