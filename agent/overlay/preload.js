const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('jarvis', {
  onStatus: (cb) => ipcRenderer.on('status', (_event, data) => cb(data)),
})
