'use strict';

const {ipcRenderer} = require('electron');
const ipcPlus = require('electron-ipc-plus');
const Panel = require('./panel');
const PanelFrame = require('./panel-frame');

module.exports = {
  Panel,
  PanelFrame
};

document.registerElement('ui-panel-frame', PanelFrame);

// ========================================
// Ipc
// ========================================

ipcRenderer.on('ipc-plus:main2panel', (event, panelID, message, ...args) => {
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
      replyArgs = [`ipc-plus:reply`, ...replyArgs, replyOpts];
      return sender.send.apply( sender, replyArgs );
    };
  }

  // refine the args
  args = [panelID, message, event, ...args];
  Panel._dispatch.apply( Panel, args );
});
