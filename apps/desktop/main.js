// Wandro desktop: an Electron shell around the web build (apps/mobile web export).
const { app, BrowserWindow, net, protocol, session, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { contentType, resolveFile } = require('./protocol');

const WEB_ROOT = path.join(__dirname, 'web');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
  },
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 900,
    minWidth: 360,
    minHeight: 600,
    title: 'Wandro',
    backgroundColor: '#0E5E4E',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Directions and other links open in the system browser (e.g. Google Maps).
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://')) {
      event.preventDefault();
      if (/^https?:/.test(url)) shell.openExternal(url);
    }
  });

  win.loadURL('app://wandro/');
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const file = resolveFile(WEB_ROOT, request.url, (p) => fs.existsSync(p));
    return net
      .fetch(pathToFileURL(file).toString())
      .then((res) => new Response(res.body, { headers: { 'content-type': contentType(file) } }));
  });

  // Location is only used while the window is open, like on phones.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'geolocation' || permission === 'notifications');
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
