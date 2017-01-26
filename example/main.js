'use strict';

const {app, BrowserWindow, ipcMain} = require('electron');
const protocols = require('electron-protocols');
const Panel = require('../lib/main');

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

ipcMain.on('btn:click', (event, channel, msg) => {
  win.webContents.send(`${channel}:say`, msg);
});

ipcMain.on('btn-panel:click', (event, channel, msg) => {
  Panel.send(channel, 'say', msg);
});
