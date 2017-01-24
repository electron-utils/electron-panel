'use strict';

const {app, BrowserWindow} = require('electron');
const protocols = require('electron-protocols');

let win;

protocols.register('app', protocols.basepath(app.getAppPath()));

app.on('ready', function () {
  win = new BrowserWindow({
    center: true,
    width: 400,
    height: 300,
    x: 100,
    y: 100,
  });
  win.loadURL('file://' + __dirname + '/index.html');
});
