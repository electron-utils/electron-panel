'use strict';

const {ipcRenderer} = require('electron');
const ipcPlus = require('electron-ipc-plus');
const {ErrorNoPanel, ErrorNoMsg, resolveMessage} = require('../common');

let _id2panelFrame = {};

/**
 * @module panel
 *
 * panel module for manipulate panels in renderer process
 */
let panel = {};
module.exports = panel;

/**
 * @method send
 */
panel.send = function (panelID, message, ...args) {
  if ( typeof message !== 'string' ) {
    console.error(`The message "${message}" sent to panel "${panelID}" must be a string`);
    return;
  }

  let opts = ipcPlus.internal._popReplyAndTimeout(args);
  if ( !opts ) {
    args = [`${ipcPlus.id}:renderer2panel`, panelID, message, ...args];
    ipcRenderer.send.apply( ipcRenderer, args );

    return;
  }

  let sessionId = ipcPlus.internal._newSession(message, `${panelID}@renderer`, opts.reply, opts.timeout);

  args = [`${ipcPlus.id}:renderer2panel`, panelID, message, ...args, ipcPlus.option({
    sessionId: sessionId,
    waitForReply: true,
    timeout: opts.timeout, // this is used in main to start a transfer-session timeout
  })];

  ipcRenderer.send.apply( ipcRenderer, args );

  return sessionId;
};

/**
 * @method contains
 * @param {HTMLElement} el
 * @return {boolean}
 *
 * Check if an element is a panel-frame or in a panel-frame
 */
panel.contains = function (el) {
  while (1) {
    if (!el) {
      return null;
    }

    if ( el.tagName === 'UI-PANEL-FRAME' ) {
      return el;
    }

    // get parent or shadow host
    el = el.parentNode;
    if (el && el.host) {
      el = el.host;
    }
  }
};

/**
 * @method find
 * @param {string} panelID - The panelID
 *
 * Find panel frame via `panelID`.
 */
panel.find = function ( panelID ) {
  let frameEL = _id2panelFrame[panelID];
  if ( !frameEL ) {
    return null;
  }
  return frameEL;
};

/**
 * @method closeAll
 *
 * Close all panels. If any of the panel cancel close, none of the panel will be closed.
 */
panel.closeAll = function () {
  let panelFrames = Object.values(_id2panelFrame);

  for ( let i = 0; i < panelFrames.length; ++i ) {
    let frameEL = panelFrames[i];
    if ( frameEL.beforeUnload ) {
      let stopUnload = frameEL.beforeUnload();
      if ( stopUnload ) {
        return false;
      }
    }
  }

  for ( let i = 0; i < panelFrames.length; ++i ) {
    let frameEL = panelFrames[i];
    frameEL._unload();
  }

  return true;
};

/**
 * @property panels
 *
 * Get panels docked in current window
 */
Object.defineProperty(panel, 'panels', {
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
panel._add = function (frameEL) {
  let panelID = frameEL.id;
  _id2panelFrame[panelID] = frameEL;

  ipcRenderer.send('electron-panel:add', panelID);
};

/**
 * @method _remove
 */
panel._remove = function (frameEL) {
  let panelID = frameEL.id;
  delete _id2panelFrame[panelID];

  ipcRenderer.send('electron-panel:remove', panelID);
};

/**
 * @method _dispatch
 */
panel._dispatch = function (panelID, message, event, ...args) {
  let frameEL = _id2panelFrame[panelID];
  if ( !frameEL ) {
    console.warn(`Failed to send ipc message ${message} to panel ${panelID}, panel not found`);

    if ( event.reply ) {
      event.reply( new ErrorNoPanel(panelID, message) );
    }

    return;
  }

  //
  if ( !frameEL._messages ) {
    return;
  }

  //
  let fullMessage = resolveMessage(panelID, message);
  let fn = frameEL._messages[fullMessage];
  if ( !fn || typeof fn !== 'function' ) {
    console.warn(`Failed to send ipc message ${message} to panel ${panelID}, message not found`);

    if ( event.reply ) {
      event.reply( new ErrorNoMsg(panelID, message) );
    }

    return;
  }

  fn.apply( frameEL, [event, ...args] );
};
