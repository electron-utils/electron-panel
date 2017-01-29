'use strict';

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

    #input {
      margin-right: 5px;
    }
  `,

  template: `
    <h2>Foo</h2>
    <div id="logs" class="flex-1"></div>
    <div class="layout horizontal center">
      <input id="input" class="flex-1"></input>
      <button id="btn">send to Bar</button>
      <button id="btn-reply">send-reply to Bar</button>
    </div>
  `,

  $: {
    logs: '#logs',
    btn: '#btn',
    btnReply: '#btn-reply',
    input: '#input',
  },

  ready () {
    this.$btn.addEventListener('click', () => {
      this.sendToPanel('bar', 'say', this.$input.value);
    });

    this.$btnReply.addEventListener('click', () => {
      this.sendToPanel('bar', 'say-and-reply', this.$input.value, (err, msg) => {
        let div = document.createElement('div');
        div.innerText = `[reply] ${msg}`;
        this.$logs.appendChild(div);
      });
    });
  },

  messages: {
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
