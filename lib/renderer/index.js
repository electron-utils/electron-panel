'use strict';

const {ipcRenderer} = require('electron');
const ipcPlus = require('electron-ipc-plus');
const panel = require('./panel');
const PanelFrame = require('./panel-frame');

module.exports = panel;

// ========================================
// dom events
// ========================================

window.addEventListener('beforeunload', event => {
  let frameELs = panel.panels;
  let stopUnload = false;

  for ( let i = 0; i < frameELs.length; ++i ) {
    let el = frameELs[i];
    if ( el.beforeUnload ) {
      stopUnload = el.beforeUnload();
    }

    if ( stopUnload ) {
      event.returnValue = true;
      break;
    }
  }

  ipcRenderer.send('electron-panel:clear');
});

// ==========================
// custom elements
// ==========================

document.addEventListener('readystatechange', () => {
  if ( document.readyState === 'interactive' ) {
    window.customElements.define('ui-panel-frame', PanelFrame);
  }
});

// ========================================
// ipc messages
// ========================================

ipcRenderer.on(`${ipcPlus.id}:main2panel`, (event, panelID, message, ...args) => {
  // process waitForReply option
  let opts = ipcPlus.internal._popOptions(args);
  if ( opts && opts.waitForReply ) {
    // NOTE: do not directly use event, message in event.reply, it will cause Electron devtools crash
    let sender = event.sender;
    let msg = message;
    event.reply = function (...replyArgs) {
      if ( ipcPlus.internal._wrapError(replyArgs) === false ) {
        console.warn(`Invalid argument for event.reply of "${msg}": the first argument must be an instance of Error or null`);
        // return; // TEMP DISABLE
      }

      let replyOpts = ipcPlus.option({
        sessionId: opts.sessionId
      });
      replyArgs = [`${ipcPlus.id}:reply`, ...replyArgs, replyOpts];
      return sender.send.apply( sender, replyArgs );
    };
  }

  // refine the args
  args = [panelID, message, event, ...args];
  panel._dispatch.apply( panel, args );
});
