'use strict';

const {app, BrowserWindow, ipcMain} = require('electron');
const protocols = require('electron-protocols');

let win;

protocols.register('app', protocols.basepath(app.getAppPath()));

app.on('ready', function () {
  win = new BrowserWindow({
    center: true,
    width: 400,
    height: 600,
  });
  win.loadURL('file://' + __dirname + '/index.html');
});

ipcMain.on('btn:click', (event, msg) => {
  win.webContents.send('app:say', msg);
});
