'use strict';

const {ipcRenderer} = require('electron');
const ipcPlus = require('electron-ipc-plus');
const {ErrorNoPanel, ErrorNoMsg} = require('../common');

let _id2panelFrame = {};

/**
 * @module Panel
 *
 * Panel module for manipulate panels in renderer process
 */
let Panel = {};
module.exports = Panel;

/**
 * @method send
 */
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

/**
 * @property panels
 *
 * Get panels docked in current window
 */
Object.defineProperty(Panel, 'panels', {
  enumerable: true,
  get () {
    let results = [];

    for ( let id in _id2panelFrame ) {
      let frameEL = _id2panelFrame[id];
      results.push(frameEL);
    }

    return results;
  },
});

/**
 * @method _add
 */
Panel._add = function (frameEL) {
  let panelID = frameEL.id;
  _id2panelFrame[panelID] = frameEL;

  ipcRenderer.send('panel:add', panelID);
};

/**
 * @method _remove
 */
Panel._remove = function (frameEL) {
  let panelID = frameEL.id;
  delete _id2panelFrame[panelID];

  ipcRenderer.send('panel:remove', panelID);
};

/**
 * @method _dispatch
 */
Panel._dispatch = function (panelID, message, event, ...args) {
  let frameEL = _id2panelFrame[panelID];
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
};
