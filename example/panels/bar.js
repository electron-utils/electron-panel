'use strict';

const {ipcRenderer} = require('electron');

module.exports = {
  style: `
    :host {
      margin: 5px;
    }

    h1 {
      color: #f90;
    }
  `,

  template: `
    <h1>A dockable panel</h1>
    <ui-button id="btn">Send Message</ui-button>
  `,

  $: {
    btn: '#btn'
  },

  ready () {
    this.$btn.addEventListener('confirm', () => {
      ipcRenderer.send('simple:say-hello', 'Hello, this is simple panel');
    });
  }
};
