'use strict';

const ipcPlus = require('electron-ipc-plus');

module.exports = {
  style: `
    :host {
      .layout-vertical();

      padding: 5px;
      box-sizing: border-box;
      background: #333;
      color: #888;
    }

    h2 {
      color: #f90;
      text-align: center;
    }

    #logs {
      overflow: auto;
    }
  `,

  template: `
    <h2>Bar</h2>
    <div id="logs" class="flex-1"></div>
    <button id="btn">send & reply</button>
  `,

  $: {
    logs: '#logs',
    btn: '#btn',
  },

  ready () {
    let inputEL = document.getElementById('input');
    this.$btn.addEventListener('click', () => {
      ipcPlus.sendToMain('btn-reply:click', 'bar', inputEL.value);
    });
  },

  messages: {
    'app:say' ( event, message ) {
      let div = document.createElement('div');
      div.innerText = `[app:say] ${message}`;
      this.$logs.appendChild(div);
    },

    'foo:say' ( event, message ) {
      let div = document.createElement('div');
      div.innerText = `[foo:say] ${message}`;
      this.$logs.appendChild(div);
    },

    'say' ( event, message ) {
      let div = document.createElement('div');
      div.innerText = `[say] ${message}`;
      this.$logs.appendChild(div);
    },

    'say-and-reply' ( event, message ) {
      let div = document.createElement('div');
      div.innerText = `[say-and-reply] ${message}`;
      this.$logs.appendChild(div);

      event.reply(null, message + ' received! [bar]');
    },
  },
};
