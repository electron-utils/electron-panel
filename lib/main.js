'use strict';

const {ipcMain, BrowserWindow} = require('electron');
const ipcPlus = require('electron-ipc-plus');
const {ErrorNoPanel} = require('./common');

let _winID2panelIDs = {}; // BrowserWindow.id to panelIDs

/**
 * @module Panel
 *
 * Panel module for manipulate panels in main process
 */
let Panel = {};
module.exports = Panel;

/**
 * @method findWindow
 * @param {string} panelID - The panelID
 * @return {BrowserWindow}
 *
 * Find and return the BrowserWindow that contains the `panelID`.
 */
Panel.findWindow = function ( panelID ) {
  for ( let winID in _winID2panelIDs ) {
    let panelIDs = _winID2panelIDs[winID];
    if ( panelIDs.indexOf(panelID) !== -1 ) {
      return BrowserWindow.fromId(parseInt(winID));
    }
  }

  return null;
};

/**
 * @method send
 * @param {string} panelID - The panelID
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 * @param {function} [callback] - You can specify a callback function to receive IPC reply at the last or the 2nd last argument.
 * @param {number} [timeout] - You can specify a timeout for the callback at the last argument. If no timeout specified, it will be 5000ms.
 * @return {number} sessionID
 *
 * Send `message` with `...args` to panel defined in renderer process asynchronously. It is possible to add a callback as the last or the 2nd last argument to receive replies from the IPC receiver.
 *
 * Example:
 *
 * **Send IPC message (main process)**
 *
 * ```js
 * const panel = require('electron-panel');
 *
 * panel.send('foobar', 'say-hello', err => {
 *   if ( err.code === 'ETIMEOUT' ) {
 *     console.error('Timeout for ipc message foobar:say-hello');
 *     return;
 *   }
 *
 *   console.log('foobar replied');
 * });
 * ```
 *
 * **Receive and Reply IPC message (renderer process)**
 *
 * ```js
 * module.exports = {
 *   messages: {
 *     'say-hello' (event) {
 *       event.reply('Hi');
 *     }
 *   }
 * };
 * ```
 */
Panel.send = function (panelID, message, ...args) {
  let win = Panel.findWindow( panelID );
  if ( !win ) {
    let opts = ipcPlus.internal._popReplyAndTimeout(args);
    if ( opts ) {
      opts.reply( new ErrorNoPanel(panelID, message) );
    }

    return;
  }

  return _sendToPanel.apply( null, [win, panelID, message, ...args] );
};

// ========================================
// Internal
// ========================================

function _sendToPanel (win, panelID, message, ...args) {
  if ( typeof message !== 'string' ) {
    console.error(`The message "${message}" sent to panel "${panelID}" must be a string`);
    return;
  }

  let opts = ipcPlus.internal._popReplyAndTimeout(args);
  if ( !opts ) {
    args = ['ipc-plus:main2panel', panelID, message, ...args];
    if ( win.webContents.send.apply(win.webContents, args) === false ) {
      console.error(`Failed to send message "${message}" to panel "${panelID}", no response received.`);
    }
    return;
  }

  let sessionId = ipcPlus.internal._newSession(message, `${panelID}@main`, opts.reply, opts.timeout, this);

  //
  args = ['ipc-plus:main2panel', panelID, message, ...args, ipcPlus.option({
    sessionId: sessionId,
    waitForReply: true,
    timeout: opts.timeout, // this is only used as debug info
  })];
  win.webContents.send.apply(win.webContents, args);

  return sessionId;
}

function _renderer2panelOpts (event, panelID, message, ...args) {
  if ( args.length === 0 ) {
    Panel.send.apply( null, [panelID, message, ...args] );
    return;
  }

  // process waitForReply option
  let opts = ipcPlus.internal._popOptions(args);
  if ( opts && opts.waitForReply ) {
    // NOTE: do not directly use event, message in event.reply, it will cause Electron devtools crash
    let sender = event.sender;

    let sessionIdAtMain = ipcPlus.internal._newSession(message, `${panelID}@main`, function (...replyArgs) {
      // if the sender is invalid (destroyed)
      if ( sender.isDestroyed() ) {
        return;
      }

      let replyOpts = ipcPlus.option({
        sessionId: opts.sessionId
      });
      replyArgs = [`editor:ipc-reply`, ...replyArgs, replyOpts];
      return sender.send.apply( sender, replyArgs );
    }, opts.timeout);

    // refine the args
    args = [panelID, message, ...args, ipcPlus.option({
      sessionId: sessionIdAtMain,
      waitForReply: true,
      timeout: opts.timeout, // this is only used as debug info
    })];
  } else {
    // refine the args
    args = [panelID, message, ...args];
  }

  Panel.send.apply( null, args );
}

// ========================================
// Ipc
// ========================================

ipcMain.on('panel:add', (event, panelID) => {
  let browserWin = Panel.findWindow(panelID);
  if ( browserWin !== null ) {
    console.error(`The panel "${panelID}" already exists in window "${browserWin.id}"`);
    return;
  }

  browserWin = BrowserWindow.fromWebContents( event.sender );
  let winID = browserWin.id;

  let panelIDs = _winID2panelIDs[winID];
  if ( panelIDs === undefined ) {
    panelIDs = [];
    _winID2panelIDs[winID] = panelIDs;

    // make sure we clear out the panels when window closed
    browserWin.once('closed', () => {
      delete _winID2panelIDs[winID];
    });
  }

  //
  panelIDs.push(panelID);
});

ipcMain.on('ipc-plus:renderer2panel', (event, panelID, message, ...args) => {
  _renderer2panelOpts(event, panelID, message, ...args);
});
