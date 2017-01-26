'use strict';

module.exports = {
  style: `
    :host {
      padding: 5px;
      box-sizing: border-box;
      background: #333;
      color: #888;
    }

    h2 {
      color: #f90;
      text-align: center;
    }
  `,

  template: `
    <h2>Bar</h2>
    <div id="logs"></div>
  `,

  $: {
    logs: '#logs'
  },

  ready () {
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
  },
};
