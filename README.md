This is the result of running the following command on [noVNC](https://github.com/novnc/noVNC.git):

``` bash
./utils/use_require.js --as commonjs
```

Updates are automatically published weekly (as necessary, when my computer is on) using [noVNC-core-autopublish](https://github.com/larryprice/novnc-core-autopublish).

### Usage ###

To install:

``` bash
$ npm install --save novnc-core
```

To use:

``` javascript
import RFB from 'novnc-browser'

/*
 RFB supports the following values on init with the given defaults:
  * target: 'null'           // VNC display rendering Canvas object
  * focusContainer: document // DOM element that captures keyboard input
  * encrypt: false           // Use TLS/SSL/wss encryption
  * local_cursor: false      // Request locally rendered cursor
  * shared: true             // Request shared mode
  * view_only: false         // Disable client mouse/keyboard
  * xvp_password_sep: '@'    // Separator for XVP password fields
  * disconnectTimeout: 3     // Time (s) to wait for disconnection
  * wsProtocols: ['binary']  // Protocols to use in the WebSocket connection
  * repeaterID: ''           // [UltraVNC] RepeaterID to connect to
  * viewportDrag: false      // Move the viewport on mouse drags

  * // Callback functions
  * onUpdateState: function() {}      // onUpdateState(rfb, state, oldstate): connection state change
  * onNotification: function() {}     // onNotification(rfb, msg, level, options): notification for UI
  * onDisconnected: function() {}     // onDisconnected(rfb, reason): disconnection finished
  * onPasswordRequired: function() {} // onPasswordRequired(rfb, msg): VNC password is required
  * onClipboard: function() {}        // onClipboard(rfb, text): RFB clipboard contents received
  * onBell: function() {}             // onBell(rfb): RFB Bell message received
  * onFBUReceive: function() {}       // onFBUReceive(rfb, fbu): RFB FBU received but not yet processed
  * onFBUComplete: function() {}      // onFBUComplete(rfb, fbu): RFB FBU received and processed
  * onFBResize: function() {}         // onFBResize(rfb, width, height): frame buffer resized
  * onDesktopName: function() {}      // onDesktopName(rfb, name): desktop name received
  * onXvpInit: function() {}           // onXvpInit(version): XVP extensions active for this connection
*/
try {
  var rfb = new RFB({
      'target':             document.getElementById('noVNC-canvas'),
      'encrypt':            false,
      'onUpdateState':      onUpdateState,
      'onDisconnected':     onDisconnected,
      'onPasswordRequired': onPasswordRequired,
      'onFBResize':         onFBResize,
      'onDesktopName':      onDesktopName,
  });
} catch (exc) {
    console.log('Unable to create RFB client -- ' + exc, 'error');
    return;
}

// Create the connection with the given address (the server address/hostname)
// and port (the port hosting the VNC connection on the server)
rfb.connect(address, port);

/*
 An rfb has the following public methods (see lib/rfb.js for more details):
  * connect(host, port, password, path)
  * disconnect()
  * sendPassword(passwd)
  * sendCtrlAltDel()
  * xvpOp(ver, op)
  * xvpShutdown()
  * xvpReboot()
  * xvpReset()
  * sendKey(keysym, code, down)
  * clipboardPasteFrom(text)
  * requestDesktopSize(width, height)
*/
```

### Copyright ###

See [LICENSE.txt](LICENSE.txt) for a full accounting of the licensing of the core files. Assume that this repository/package is _Copyright (C) 2017 Larry Price_ under the Mozilla Public License 2.0, but the code itself retains the copyrights listed in the original repository (and LICENSE.txt file).

### Version History ###

* v0.1.0
  * Maps to noVNC/noVNC a5c366b834cbeb8e89406e0374e2a0903cedfbe8
* v0.1.1
  * Maps to noVNC/noVNC 55b459b47961e2ca2eb125408a1ddc60d0251457
