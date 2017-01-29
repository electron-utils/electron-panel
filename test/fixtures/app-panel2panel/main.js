const {app, BrowserWindow} = require('electron');
const protocols = require('electron-protocols');
const ipcPlus = require('electron-ipc-plus');

let winFoo, winBar;
let readyCnt = 0;

protocols.register('app', protocols.basepath(app.getAppPath()));

function domReady () {
  ++readyCnt;

  if ( readyCnt === 2 ) {
    ipcPlus.sendToWin(winFoo, 'ready-to-send');
  }
}

app.on('ready', function () {
  winFoo = new BrowserWindow({
    x: 100,
    y: 100,
    width: 200,
    height: 200
  });
  winFoo.loadURL('file://' + __dirname + '/index-foo.html');
  winFoo.webContents.once('dom-ready', domReady);

  winBar = new BrowserWindow({
    x: 100 + 210,
    y: 100,
    width: 200,
    height: 200
  });
  winBar.loadURL('file://' + __dirname + '/index-bar.html');
  winBar.webContents.once('dom-ready', domReady);
});
