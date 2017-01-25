'use strict';

const {ipcRenderer} = require('electron');
const ipcPlus = require('electron-ipc-plus');
const {ErrorNoPanel, ErrorNoMsg} = require('./common');

/**
 * @module Panel
 *
 * Panel module for manipulate panels in renderer process
 */
let Panel = {};
module.exports = Panel;

Panel.send = function (panelID, message, ...args) {
  if ( typeof message !== 'string' ) {
    console.error(`The message "${message}" sent to panel "${panelID}" must be a string`);
    return;
  }

  let opts = ipcPlus.internal._popReplyAndTimeout(args);
  if ( !opts ) {
    args = ['ipc-plus:renderer2panel', panelID, message, ...args];
    ipcRenderer.send.apply( ipcRenderer, args );

    return;
  }

  let sessionId = ipcPlus.internal._newSession(message, `${panelID}@renderer`, opts.reply, opts.timeout);

  args = ['ipc-plus:renderer2panel', panelID, message, ...args, ipcPlus.option({
    sessionId: sessionId,
    waitForReply: true,
    timeout: opts.timeout, // this is used in main to start a transfer-session timeout
  })];

  ipcRenderer.send.apply( ipcRenderer, args );

  return sessionId;
};

// ========================================
// Internal
// ========================================

// _dispatch
function _dispatch (panelID, message, event, ...args) {
  let frameEL = _id2panelFrame[panelID]; // TODO
  if ( !frameEL ) {
    console.warn(`Failed to send ipc message ${message} to panel ${panelID}, panel not found`);

    if ( event.reply ) {
      event.reply( new ErrorNoPanel(panelID, message) );
    }

    return;
  }

  //
  if ( !frameEL.messages ) {
    return;
  }

  //
  let fn = frameEL.messages[message];
  if ( !fn || typeof fn !== 'function' ) {
    console.warn(`Failed to send ipc message ${message} to panel ${panelID}, message not found`);

    if ( event.reply ) {
      event.reply( new ErrorNoMsg(panelID, message) );
    }

    return;
  }

  fn.apply( frameEL, [event, ...args] );
}

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
  _dispatch.apply( null, args );
});
