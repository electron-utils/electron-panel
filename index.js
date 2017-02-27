'use strict';

const platform = require('electron-platform');
const pkgJson = require('./package.json');

let panel;
let name = `__electron_panel__`;
let msg = `Failed to require ${pkgJson.name}@${pkgJson.version}:
  A different version of ${pkgJson.name} already running in the process, we will redirect to it.
  Please make sure your dependencies use the same version of ${pkgJson.name}.`;

if ( platform.isMainProcess ) {
  if (global[name]) {
    console.warn(msg);
    panel = global[name];
  } else {
    panel = global[name] = require('./lib/main');
  }
} else {
  if (window[name]) {
    console.warn(msg);
    panel = window[name];
  } else {
    panel = window[name] = require('./lib/renderer/index');
  }
}

// ==========================
// exports
// ==========================

module.exports = panel;
