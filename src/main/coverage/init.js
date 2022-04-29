const { BrowserWindow, app } = require('electron');

const attachDebuggerToWindow = require('./attach');

const url = process.argv.pop();

console.log('url: %s', url);

app
  .whenReady()
  .then(async () => {
    const win = new BrowserWindow({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false,
      },
    });

    win.loadURL(url);

    const { takeCoverageDelta } = await attachDebuggerToWindow(win);
    setInterval(takeCoverageDelta, 5000);
  })
  .catch((error) => {
    console.error(error);
  });
