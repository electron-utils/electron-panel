'use strict';

const IpcListener = require('electron-ipc-listener');
const Mousetrap = require('mousetrap');
const protocols = require('electron-protocols');
const ipcPlus = require('electron-ipc-plus');
const fs = require('fs');
const _ = require('lodash');
const CleanCSS = require('clean-css');
const Less = require('less');

const panel = require('./panel');
const {resolveMessage} = require('../common');

// ==========================
// internals
// ==========================

let _cleanCSS = new CleanCSS({
  // options
});

let _commonStyle = `
  :host{
    overflow: hidden;
    display: block;
    outline: 0;
  }

  /* ==================== */
  /* flex layout */
  /* ==================== */

  .layout.horizontal,
  .layout.horizontal-reverse,
  .layout.vertical,
  .layout.vertical-reverse {
    display: flex;
  }
  .layout.inline { display: inline-flex; }
  .layout.horizontal { flex-direction: row; }
  .layout.horizontal-reverse { flex-direction: row-reverse; }
  .layout.vertical { flex-direction: column; }
  .layout.vertical-reverse { flex-direction: column-reverse; }
  .layout.wrap { flex-wrap: wrap; }
  .layout.wrap-reverse { flex-wrap: wrap-reverse; }
  .flex-auto { flex: 1 1 auto; }
  .flex-none { flex: none; }
  .flex, .flex-1 { flex: 1; }
  .flex-2 { flex: 2; }
  .flex-3 { flex: 3; }
  .flex-4 { flex: 4; }
  .flex-5 { flex: 5; }
  .flex-6 { flex: 6; }
  .flex-7 { flex: 7; }
  .flex-8 { flex: 8; }
  .flex-9 { flex: 9; }
  .flex-10 { flex: 10; }
  .flex-11 { flex: 11; }
  .flex-12 { flex: 12; }

  /* ==================== */
  /* alignment in cross axis */
  /* ==================== */

  .layout.start { align-items: flex-start; }
  .layout.center, .layout.center-center { align-items: center; }
  .layout.end { align-items: flex-end; }
  .layout.start-justified { justify-content: flex-start; }
  .layout.center-justified, .layout.center-center { justify-content: center; }
  .layout.end-justified { justify-content: flex-end; }
  .layout.around-justified { justify-content: space-around; }
  .layout.justified { justify-content: space-between; }

  /* ==================== */
  /* self alignment */
  /* ==================== */

  .self-start { align-self: flex-start; }
  .self-center { align-self: center; }
  .self-end { align-self: flex-end; }
  .self-stretch { align-self: stretch; }

  /* ==================== */
  /* other layout */
  /* ==================== */

  .block { display: block; }
  [hidden] { display: none !important; }
  .invisible { visibility: hidden !important; }
  .relative { position: relative; }
  .fit {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
  body.fullbleed {
    margin: 0;
    height: 100vh;
  }
  .scroll {
    -webkit-overflow-scrolling: touch;
    overflow: auto;
  }

  /* ==================== */
  /* fixed position */
  /* ==================== */

  .fixed-bottom,
  .fixed-left,
  .fixed-right,
  .fixed-top {
    position: fixed;
  }
  .fixed-top {
    top: 0;
    left: 0;
    right: 0;
  }
  .fixed-right {
    top: 0;
    right: 0;
    bottom: 0;
  }
  .fixed-bottom {
    right: 0;
    bottom: 0;
    left: 0;
  }
  .fixed-left {
    top: 0;
    bottom: 0;
    left: 0;
  }

  /* ==================== */
  /* mixins */
  /* ==================== */

  .fit() {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  .layout-vertical() {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
  }

  .layout-horizontal() {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
  }

  /**
   * @param {align-items} - start, end, center, stretch, baseline
   * @param {justify-content} - start, end, center, space-between, space-around
   */
  .layout-children(@align-items: center; @justify-content: center) {
    align-items: @align-items;
    justify-content: @justify-content;
  }

  .flex-auto() {
    flex: 1 1 auto;
  }

  .flex(@ratio) {
    flex: @ratio;
  }
`;

// ==========================
// exports
// ==========================

class PanelFrame extends window.HTMLElement {
  /**
   * @method createdCallback
   */
  constructor () {
    super();
    this._inited = false;
    this._loaded = false;
  }

  connectedCallback () {
    if ( this._inited ) {
      return;
    }

    this._inited = true;

    // NOTE: shadowRoot will be created after src required
    this.tabIndex = -1;

    // TODO: for focus-mgr ??
    // this._focusedElement = null;
    // this._lastFocusedElement = null;

    //
    this._width = 'auto';
    this._height = 'auto';
    this._minWidth = 100;
    this._minHeight = 100;
    this._maxWidth = 'auto';
    this._maxHeight = 'auto';

    //
    let src = this.getAttribute('src');
    if ( src !== null ) {
      this._load(src);
    }
  }

  /**
   * @property root
   */
  get root () {
    if ( this.shadowRoot ) {
      return this.shadowRoot;
    }
    return this;
  }

  /**
   * @property src
   */
  get src () {
    return this.getAttribute('src');
  }
  set src (val) {
    let src = this.getAttribute('src');

    if ( src !== val ) {
      if ( this._loaded ) {
        console.warn('Can not change the src if panel is loaded');
        return;
      }

      this.setAttribute('src', val);

      // skip load the panel if it is not inited.
      if ( !this._inited ) {
        return;
      }

      this._load(val);
    }
  }

  /**
   * @property name
   */
  get name () {
    return this.getAttribute('name');
  }
  set name (val) {
    this.setAttribute('name', val);
  }

  /**
   * @property popupable
   */
  get popupable () {
    return this.hasAttribute('popupable');
  }
  set popupable (val) {
    if ( val ) {
      this.setAttribute('popupable', '');
    } else {
      this.removeAttribute('popupable');
    }
  }

  /**
   * @property width
   */
  get width () {
    let val = parseInt(this._width);
    if ( isNaN(val) ) {
      return 'auto';
    }

    return val;
  }

  /**
   * @property minWidth
   */
  get minWidth () {
    let val = parseInt(this._minWidth);
    if ( isNaN(val) ) {
      return 100;
    }

    return val;
  }

  /**
   * @property maxWidth
   */
  get maxWidth () {
    let val = parseInt(this._maxWidth);
    if ( isNaN(val) ) {
      return 'auto';
    }

    return val;
  }

  /**
   * @property height
   */
  get height () {
    let val = parseInt(this._height);
    if ( isNaN(val) ) {
      return 'auto';
    }

    return val;
  }

  /**
   * @property minHeight
   */
  get minHeight () {
    let val = parseInt(this._minHeight);
    if ( isNaN(val) ) {
      return 100;
    }

    return val;
  }

  /**
   * @property maxHeight
   */
  get maxHeight () {
    let val = parseInt(this._maxHeight);
    if ( isNaN(val) ) {
      return 'auto';
    }

    return val;
  }

  /**
   * @method queryID
   */
  queryID ( id ) {
    return this.root.getElementById(id);
  }

  /**
   * @method query
   */
  query ( selector ) {
    return this.root.querySelector(selector);
  }

  /**
   * @method queryAll
   */
  queryAll ( selector ) {
    return this.root.querySelectorAll(selector);
  }

  /**
   * @method close
   *
   * NOTE: you must explicit call this to remove a panel from document
   */
  close () {
    // invoke beforeUnload lifetime function
    // do not close a panel if it prevent unload itself
    if ( this.beforeUnload ) {
      let stopUnload = this.beforeUnload();
      if ( stopUnload ) {
        return;
      }
    }

    // handle unload
    if ( this._ipcListener ) {
      this._ipcListener.clear();
    }
    if ( this._mousetrapList ) {
      this._mousetrapList.forEach(mousetrap => {
        mousetrap.reset();
      });
    }
    this.remove();

    // remove it from panel list
    panel._remove(this);
  }

  /**
   * @method sendToPanel
   *
   * wrapper of panel.send
   */
  sendToPanel (...args) {
    return panel.send.apply(panel, args);
  }

  /**
   * @method sendToMain
   *
   * wrapper of ipcPlus.sendToMain
   */
  sendToMain (...args) {
    return ipcPlus.sendToMain.apply(ipcPlus, args);
  }

  /**
   * @method sendToAll
   *
   * wrapper of ipcPlus.sendToAll
   */
  sendToAll (...args) {
    ipcPlus.sendToAll.apply(ipcPlus, args);
  }

  /**
   * @method sendToWins
   *
   * wrapper of ipcPlus.sendToWins
   */
  sendToWins (...args) {
    ipcPlus.sendToWins.apply(ipcPlus, args);
  }

  /**
   * @method cancelRequest
   *
   * wrapper of ipcPlus.cancelRequest
   */
  cancelRequest (sessionId) {
    ipcPlus.cancelRequest.apply(ipcPlus, sessionId);
  }

  _load ( url ) {
    let path = protocols.path(url);
    if ( fs.existsSync(path) ) {
      let panelProto = null;
      try {
        if ( !this.id ) {
          throw new Error('Panel id not found.');
        }

        panelProto = require(path);
      } catch (e) {
        console.error(e);
        return;
      }

      // handle load
      this._apply(panelProto);
      this._loaded = true;

      // add it to panel list
      panel._add(this);

      // invoke ready lifetime function
      if ( this.ready ) {
        this.ready();
      }
    } else {
      // TODO: use http request
      console.warn('http request has not support yet');
    }
  }

  _apply ( proto ) {
    let mode = proto.mode; // can be 'light', 'shadow' and 'iframe', default is 'shadow'
    if ( mode === undefined ) {
      mode = 'shadow';
    }

    let selectors = proto.$;
    let behaviors = proto.behaviors;
    let listeners = proto.listeners;
    let messages = proto.messages;
    let shortcuts = proto.shortcuts;
    let style = proto.style;
    let template = proto.template;

    // NOTE: do not use delete to break the proto, we need to reuse proto since it is cached
    _.assignIn(this, _.omit(proto, [
      'mode',
      '$',
      'behaviors',
      'listeners',
      'messages',
      'shortcuts',
      'style',
      'template',
    ]));

    // create shadowRoot if request
    if ( mode === 'shadow' ) {
      this.attachShadow({
        mode: 'open'
      });
    } else {
      // light-dom, do nothing
    }

    let root = this.root;

    // addon behaviors
    if ( behaviors ) {
      behaviors.forEach(be => {
        _.assignInWith(this, be, (objVal, srcVal) => {
          return objVal !== undefined ? objVal : srcVal;
        });
      });
    }

    // update template
    if ( template ) {
      root.innerHTML = template;
    }

    // update style
    if ( style ) {
      let css = style;

      // if shadow-dom, insert common style to it.
      if ( mode === 'shadow' ) {
        css = _commonStyle + style;
      }

      // render less
      Less.render(css, (e, output) => {
        let minified = _cleanCSS.minify(output.css).styles;

        let styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        styleElement.textContent = minified;

        root.insertBefore( styleElement, root.firstChild );
      });
    }

    // register selectors
    if ( selectors ) {
      for ( let name in selectors ) {
        if ( this[`$${name}`] ) {
          console.warn(`failed to assign selector $${name}, already used.`);
          continue;
        }

        let el = root.querySelector(selectors[name]);
        if ( !el ) {
          console.warn(`failed to query selector ${selectors[name]} to $${name}.`);
          continue;
        }

        this[`$${name}`] = el;
      }
    }

    // register listeners
    if ( listeners ) {
      for ( let name in listeners ) {
        this.addEventListener(name, listeners[name].bind(this));
      }
    }

    // register ipc messages
    if ( messages ) {
      let ipcListener = new IpcListener();
      let msg2fn = {};

      for ( let name in messages ) {
        let fn = messages[name];

        if ( !fn || typeof fn !== 'function' ) {
          console.warn(
            `Failed to register ipc message ${name} in panel ${this.id}, function not provide.`
          );
          continue;
        }

        let fullMessage = resolveMessage(this.id, name);
        let fnBind = fn.bind(this);

        ipcListener.on(fullMessage, fnBind);
        msg2fn[fullMessage] = fnBind;
      }

      this._ipcListener = ipcListener;
      this._messages = msg2fn;
    }

    // register shortcuts
    if ( shortcuts ) {
      let mousetrapList = [];
      let mousetrap = new Mousetrap(this);
      mousetrapList.push(mousetrap);

      for ( let name in shortcuts ) {
        if ( name[0] !== '#' ) {
          let method = shortcuts[name];
          let fn = this[method];

          if ( !fn || typeof fn !== 'function' ) {
            console.warn(
              `Failed to register shortcut, cannot find method ${method} in panel ${this.id}.`
            );
            continue;
          }

          mousetrap.bind(name, fn.bind(this));

          continue;
        }

        // sub-shortcuts
        let subElement = root.querySelector(name);
        if ( !subElement ) {
          console.warn(`Failed to register shortcut for element ${name}, cannot find it.`);
          continue;
        }

        let subShortcuts = shortcuts[name];
        let subMousetrap = new Mousetrap(subElement);
        mousetrapList.push(subMousetrap);

        for ( let subShortcut in subShortcuts ) {
          let method = subShortcuts[subShortcut];
          let fn = this[method];

          if ( !fn || typeof fn !== 'function' ) {
            console.warn(
              `Failed to register shortcut, cannot find method ${method} in panel ${this.id}.`
            );
            continue;
          }

          subMousetrap.bind(subShortcut, fn.bind(this));
        }
      }

      this._mousetrapList = mousetrapList;
    }
  }
}

module.exports = PanelFrame;
