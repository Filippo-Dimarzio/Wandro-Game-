// Lets the web app know it runs inside the desktop shell (e.g. to hide the install banner).
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('wandroDesktop', { isDesktop: true, platform: process.platform });
