'use strict';

const {app, BrowserWindow, ipcMain} = require('electron');
const protocols = require('electron-protocols');
const panel = require('../../index');

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
  panel.send(channel, 'say', msg);
});

ipcMain.on('btn-reply:click', (event, channel, msg) => {
  panel.send(channel, 'say-and-reply', msg, (err, msg2) => {
    console.log(`[main:say] ${msg2}`);
  });
});
