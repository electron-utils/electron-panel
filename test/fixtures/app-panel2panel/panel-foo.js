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
      console.log(`[app:say] ${message}`);
    },

    'say' ( event, message ) {
      console.log(`[say] ${message}`);
    },
  },
};
