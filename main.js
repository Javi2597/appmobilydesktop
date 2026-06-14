const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Solo se permite navegar / abrir esquemas web. Bloquea file://, javascript:,
// data:, etc. tanto en las vistas como en las ventanas emergentes.
function isWebUrl(url) {
  try {
    const proto = new URL(url).protocol;
    return proto === 'http:' || proto === 'https:';
  } catch {
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1b1d23',
    title: 'Mobile + Desktop Viewer',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      // Necesario para poder usar la etiqueta <webview>, que carga
      // cualquier URL como un navegador real (sin las restricciones
      // de X-Frame-Options / CSP que bloquean a los <iframe>).
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
      // Aísla el proceso de render de la UI respecto del sistema operativo.
      sandbox: true
    }
  });

  win.loadFile('index.html');

  // Descomenta para abrir DevTools al desarrollar:
  // win.webContents.openDevTools();
}

// Endurecimiento global de TODO contenido web creado, incluida la UI y cada
// <webview>. Se aplica desde el proceso principal para no depender de los
// atributos del HTML (que el contenido remoto podría intentar manipular).
app.on('web-contents-created', (event, contents) => {
  // (1) Forzar configuración segura en cada <webview> al adjuntarse:
  //     nunca Node, siempre aislamiento y sandbox, sin preload inyectado.
  contents.on('will-attach-webview', (e, webPreferences) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
  });

  // (2 + 3) Control de navegación:
  //   - La UI (la ventana host) NUNCA navega fuera de index.html.
  //   - Las vistas web solo pueden navegar a http/https.
  contents.on('will-navigate', (e, url) => {
    if (contents.getType() === 'webview') {
      if (!isWebUrl(url)) e.preventDefault();
    } else {
      e.preventDefault();
    }
  });

  // (2) Ventanas emergentes:
  //   - Las de la UI se bloquean por completo.
  //   - Las de las vistas web (http/https) se abren en el navegador del
  //     sistema; cualquier otro esquema se descarta.
  contents.setWindowOpenHandler(({ url }) => {
    if (contents.getType() === 'webview' && isWebUrl(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
