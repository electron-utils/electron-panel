const {app, BrowserWindow} = require('electron');
const protocols = require('electron-protocols');
const ipcPlus = require('electron-ipc-plus');
const panel = require('../../../index.js');

let win;

protocols.register('app', protocols.basepath(app.getAppPath()));

function domReady () {
  panel.send('foo', 'app:say');
  panel.send('foo', 'app:say', 'hello');
  panel.send('foo', 'say');
  panel.send('foo', 'say', 'hello');
  ipcPlus.sendToWin(win, 'foo:say');
  ipcPlus.sendToWin(win, 'foo:say', 'hello');
}

app.on('ready', function () {
  win = new BrowserWindow({
    x: 100,
    y: 100,
    width: 200,
    height: 200
  });
  win.loadURL('file://' + __dirname + '/index.html');
  win.webContents.once('dom-ready', domReady);
});
