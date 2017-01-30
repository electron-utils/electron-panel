'use strict';

const platform = require('electron-platform');

let panel;

if ( platform.isMainProcess ) {
  panel = require('./lib/main');
} else {
  panel = require('./lib/renderer/index');
}

// ==========================
// exports
// ==========================

module.exports = panel;
