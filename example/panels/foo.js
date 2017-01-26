'use strict';

module.exports = {
  style: `
    :host {
      padding: 5px;
      box-sizing: border-box;
    }

    h2 {
      color: #f90;
      text-align: center;
    }
  `,

  template: `
    <h2>Foo</h2>
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
  },
};
