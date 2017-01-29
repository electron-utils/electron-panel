'use strict';

/**
 * @class ErrorNoPanel
 */
class ErrorNoPanel extends Error {
  /**
   * @param {string} panelID
   * @param {string} message
   */
  constructor ( panelID, message ) {
    super(`Failed to send ipc message "${message}" to panel "${panelID}".`);

    this.code = 'ENOPANEL';
    this.ipc = message;
    this.panelID = panelID;
  }
}

/**
 * @class ErrorNoMsg
 */
class ErrorNoMsg extends Error {
  /**
   * @param {string} message
   * @param {string} panelID
   */
  constructor ( panelID, message ) {
    super(`ipc failed to send, message not found. panel: ${panelID}, message: ${message}`);

    this.code = 'ENOMSG';
    this.ipc = message;
    this.panelID = panelID;
  }
}

function resolveMessage ( panelID, messageName ) {
  if ( messageName.indexOf(':') === -1 ) {
    return `${panelID}:${messageName}`;
  }
  return messageName;
}

module.exports = {
  ErrorNoPanel,
  ErrorNoMsg,
  resolveMessage,
};
