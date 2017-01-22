'use strict';

const {app, BrowserWindow} = require('electron');

let win;

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
