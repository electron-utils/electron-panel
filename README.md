# electron-panel

[![Linux Build Status](https://travis-ci.org/electron-utils/electron-panel.svg?branch=master)](https://travis-ci.org/electron-utils/electron-panel)
[![Windows Build status](https://ci.appveyor.com/api/projects/status/xso2kaq1d4nyjjmm?svg=true)](https://ci.appveyor.com/project/jwu/electron-panel)
[![Dependency Status](https://david-dm.org/electron-utils/electron-panel.svg)](https://david-dm.org/electron-utils/electron-panel)
[![devDependency Status](https://david-dm.org/electron-utils/electron-panel/dev-status.svg)](https://david-dm.org/electron-utils/electron-panel#info=devDependencies)

Manipulate panels in window for Electron.

**NOTE**

This module use Custom Element v1 which only support in Electron 1.15.x or above version.

## Install

```bash
npm install --save electron-panel
```

## Run Examples

```bash
npm start examples/${name}
```

## Usage

**main process**

```javascript
// init panel in main process
const panel = require('electron-panel');
const protocols = require('electron-protocols');

// register a protocol so that the panel can load by it.
protocols.register('app', protocols.basepath(app.getAppPath()));
```

**renderer process**

**panel.js**

```javascript
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
  `,

  template: `
    <h2>Panel</h2>
  `,

  ready () {
    // do something
  },
};
```

**index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Panel Example</title>
  </head>

  <body>
    <ui-panel-frame id="foobar" src="app://panel.js"></ui-panel-frame>
  </body>
</html>
```

## Documentation

  - [Panel (main process)](docs/panel-main.md)
  - [Panel (renderer process)](docs/panel-renderer.md)
  - [Panel Frame](docs/panel-frame.md)

## TODO

  - [New Feature] Warnning/Error notification at panel-frame.
  - [New Feature] Out of date notification at panel-frame, and a reload button for user.
  - [Test] main2panel-reply
  - [Test] panel2panel-reply

## License

MIT © 2017 Johnny Wu
