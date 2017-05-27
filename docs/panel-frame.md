# Panel Frame Reference

A simple panel frame definition:

```javascript
module.exports = {
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
  `,

  template: `
    <h2>Hello World!</h2>
  `,

  ready () {
    console.log('Hello World!');
  },
};
```

## Lifecycle Callbacks

### ready()

Invoked after the panel has been loaded successfully and is ready to be shown

### beforeUnload()

Invoked before panel closed.

## Properties

### style (String)

LESS Styles to be accessible within panel.

The CSS Styles is defined under [Shadow DOM v1](https://developers.google.com/web/fundamentals/primers/shadowdom/), so it obey the style rules for shadow dom. For example, you can use the selector `:host` to represent the panel frame itself.

Since the panel frame is live in shadow dom, the style is isolated.

### template (String)

Raw HTML to be rendered as contents of panel.

### listeners (Object)

Mapping for DOM event definitions and their respective callbacks. The callback function will be executed whenever it's matching key is received by this package's listener.

Example:

```javascript
module.exports = {
  // ...
  listeners: {
    mousedown ( event ) {
      event.stopPropagation();
      Editor.log('on mousedown');
    },

    'panel-resize' ( event ) {
      event.stopPropagation();
      Editor.log('on panel resize');
    }
  }
};
```

### messages (Object)

Mapping for IPC message definitions and their respective callbacks.

Example:

```javascript
module.exports = {
  // ...
  messages: {
    // this is equal to `${panelID}:say-hello`
    'say-hello' ( event ) {
      console.log('Hello!');
    },
  }
};
```

### behaviors

TODO

### $

Mapping for DOM element by css selector.

For example, if your template HTML contained a selector `<span id="my_title">Title</span>`, when you define `myTile: '#my_title'` in `$` then could access its DOM node from
the code code using `$myTitle`:

```javascript
module.exports = {
  template: `
    <div><span id="my_title">Title</span></div>
  `,

  $: {
    myTitle: "#my_title"
  },

  ready () {
    let myTitleElm = this.$myTitle;
    // do something ...
  },
};
```

## Events

### name-changed

Trigger when `name` has been set.