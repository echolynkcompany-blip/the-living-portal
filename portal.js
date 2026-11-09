const ring = document.querySelector('#ring');
const status = document.querySelector('#status');
const start = document.querySelector('#start');
const stop = document.querySelector('#stop');
const samples = [];
let signalTimeout;
let acceptingSignal = false;

function setStatus(text) {
  if (status.textContent !== text) status.textContent = text;
}

function clearSignal(text) {
  clearTimeout(signalTimeout);
  samples.length = 0;
  ring.classList.remove('live');
  setStatus(text);
}

function cameraOff(text) {
  acceptingSignal = false;
  clearSignal(text);
  ring.setAttribute('r', '89');
  start.disabled = false;
  stop.disabled = true;
}

window.portal.onSignal((state) => {
  if (!acceptingSignal) return;
  if (state.type === 'stopped') {
    cameraOff(state.hint);
    return;
  }
  if (state.type === 'waiting') {
    clearSignal(`Camera on · waiting for breathing signal. ${state.hint || ''}`.trim());
    return;
  }

  // Map the relative waveform to pixels using only recent in-memory samples.
  const now = performance.now();
  samples.push({ time: now, value: state.sample });
  while (samples[0].time < now - 12000) samples.shift();
  const values = samples.map(({ value }) => value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  if (high > low) ring.setAttribute('r', String(66 + 46 * (state.sample - low) / (high - low)));
  ring.classList.add('live');
  setStatus('Camera on · live SmartSpectra breathing signal');
  clearTimeout(signalTimeout);
  signalTimeout = setTimeout(() => clearSignal('Camera on · waiting for breathing signal'), 3000);
});

start.addEventListener('click', async () => {
  start.disabled = true;
  acceptingSignal = true;
  setStatus('Starting camera…');
  try {
    const started = await window.portal.start();
    if (started && acceptingSignal) {
      stop.disabled = false;
      if (status.textContent === 'Starting camera…') setStatus('Camera on · waiting for breathing signal');
    }
  } catch (error) {
    cameraOff(error.message);
  }
});

stop.addEventListener('click', async () => {
  acceptingSignal = false;
  stop.disabled = true;
  clearSignal('Stopping camera…');
  try {
    await window.portal.stop();
    cameraOff('Camera off');
  } catch {
    cameraOff('Camera shutdown reported an error. Close the app before retrying.');
    start.disabled = true;
  }
});
