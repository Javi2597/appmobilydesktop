const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1b1d23',
    title: 'Mobile + Desktop Viewer',
    webPreferences: {
      // Necesario para poder usar la etiqueta <webview>, que carga
      // cualquier URL como un navegador real (sin las restricciones
      // de X-Frame-Options / CSP que bloquean a los <iframe>).
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');

  // Descomenta para abrir DevTools al desarrollar:
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
