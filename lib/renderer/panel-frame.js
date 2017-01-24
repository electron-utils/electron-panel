'use strict';

const Mousetrap = require('mousetrap');
const IpcListener = require('electron-ipc-listener');
const protocols = require('electron-protocols');
const fs = require('fs');
const _ = require('lodash');
const CleanCSS = require('clean-css');

let _css = new CleanCSS({
  // options
});

// ==========================
// exports
// ==========================

class PanelFrame extends window.HTMLElement {
  /**
   * @method createdCallback
   */
  createdCallback () {
    // NOTE: shadowRoot will be created after src required
    this.classList.add('fit');
    this.tabIndex = -1;

    // for focus-mgr
    this._focusedElement = null;
    this._lastFocusedElement = null;

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
      this.setAttribute('src', val);
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

  _load ( url ) {
    let path = protocols.path(url);
    if ( fs.existsSync(path) ) {
      let panelProto = null;
      try {
        if ( !this.id ) {
          throw new Error('Invalid panel id.');
        }

        panelProto = require(path);
      } catch (e) {
        console.error(e);
        return;
      }

      this._apply(panelProto);
    } else {
      // TODO: use http request
      console.warn('http request not support yet');
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
    let shortcuts = proto.shortcuts;
    let style = proto.style;
    let template = proto.template;

    // NOTE: do not use delete to break the proto, we need to reuse proto since it is cached
    _.assignIn(this, _.omit(proto, [
      'mode',
      '$',
      'behaviors',
      'listeners',
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
      // minify styles
      style = _css.minify(style).styles;

      let styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.textContent = style;

      root.insertBefore( styleElement, root.firstChild );
    }

    if ( mode === 'shadow' ) {
      style = ':host{overflow:hidden;display:block;outline:0;}';

      let styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.textContent = style;

      root.insertBefore( styleElement, root.firstChild );
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
    if ( this.messages ) {
      let ipcListener = new IpcListener();

      for ( let name in this.messages ) {
        let fn = this.messages[name];

        if ( !fn || typeof fn !== 'function' ) {
          console.warn(
            `Failed to register ipc message ${name} in panel ${this.id}, function not provide.`
          );
          continue;
        }

        ipcListener.on(name, (event, ...args) => {
          fn.apply( this, [event, ...args] );
        });
      }

      this._ipcListener = ipcListener;
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
