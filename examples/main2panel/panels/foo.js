'use strict';

const ipcPlus = require('electron-ipc-plus');

module.exports = {
  style: `
    :host {
      .layout-vertical();

      padding: 5px;
      box-sizing: border-box;
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
    <h2>Foo</h2>
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
      ipcPlus.sendToMain('btn-reply:click', 'foo', inputEL.value);
    });
  },

  messages: {
    'app:say' ( event, message ) {
      let div = document.createElement('div');
      div.innerText = `[app:say] ${message}`;
      this.$logs.appendChild(div);
    },

    'bar:say' ( event, message ) {
      let div = document.createElement('div');
      div.innerText = `[bar:say] ${message}`;
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

      event.reply(null, message + ' received! [foo]');
    },
  },
};
