'use strict';

const Panel = require('./panel');
const PanelFrame = require('./panel-frame');

module.exports = {
  Panel,
  PanelFrame
};

document.registerElement('ui-panel-frame', PanelFrame);
