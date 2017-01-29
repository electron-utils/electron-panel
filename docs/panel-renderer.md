# Panel (renderer process)

## Methods

### panel.send (panelID, message[, ...args, callback, timeout])

 - `panelID` string - Panel ID.
 - `message` string - Ipc message.
 - `...args` ... - Whatever arguments the message needs.
 - `callback` function - You can specify a callback function to receive IPC reply at the last or the 2nd last argument.
 - `timeout` number - You can specify a timeout for the callback at the last argument. If no timeout specified, it will be 5000ms.

Send `message` with `...args` to panel defined in renderer process asynchronously. It is possible to add a callback as the last or the 2nd last argument to receive replies from the IPC receiver.

Example:

**Send IPC message (renderer process)**

```javascript
const panel = require('electron-panel');

panel.send('foobar', 'foobar:say-hello', err => {
  if ( err.code === 'ETIMEOUT' ) {
    console.error('Timeout for ipc message foobar:say-hello');
    return;
  }

  console.log('foobar replied');
});
```
