'use strict';

const {app, BrowserWindow} = require('electron');
const protocols = require('electron-protocols');
require('../../index'); // for init panel in main process

let winFoo, winBar;

protocols.register('app', protocols.basepath(app.getAppPath()));

app.on('ready', function () {
  winFoo = new BrowserWindow({
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  });
  winFoo.loadURL('file://' + __dirname + '/index-foo.html');

  winBar = new BrowserWindow({
    x: 510,
    y: 100,
    width: 400,
    height: 300,
  });
  winBar.loadURL('file://' + __dirname + '/index-bar.html');
});

