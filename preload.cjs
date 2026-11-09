const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('portal', {
  start: () => ipcRenderer.invoke('portal:start'),
  stop: () => ipcRenderer.invoke('portal:stop'),
  onSignal: (callback) => ipcRenderer.on('portal:signal', (_, state) => callback(state)),
});
