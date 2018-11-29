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
import RFB from 'novnc-core'

/*
try {
  var rfb = new RFB(document.getElementById('noVNC-canvas'), url);
} catch (exc) {
    console.log('Unable to create RFB client -- ' + exc, 'error');
    return;
}

/* Listen for updates by attaching event listeners for the following events:
 * connect
 * disconnect
 * credentialsrequired
 * securityfailure
 * clipboard
 * bell
 * desktopname
 * capabilities
 */

// Full documentation can be found at https://github.com/novnc/noVNC/blob/35dd3c2299b3e13e2b57a2a34be723fb01014ee3/docs/API.md

```

### Copyright ###

See [LICENSE.txt](LICENSE.txt) for a full accounting of the licensing of the core files. Assume that this repository/package is _Copyright (C) 2017-2018 Larry Price_ under the Mozilla Public License 2.0, but the code itself retains the copyrights listed in the original repository (and LICENSE.txt file).

### Version History ###

* v0.1.0
  * Maps to noVNC/noVNC a5c366b834cbeb8e89406e0374e2a0903cedfbe8
* v0.1.1
  * Maps to noVNC/noVNC 55b459b47961e2ca2eb125408a1ddc60d0251457
* v0.2.0
  * Maps to noVNC/noVNC 35dd3c2299b3e13e2b57a2a34be723fb01014ee3
* v0.2.1
  * Modify v0.2.0 to remove let keyword
* v0.2.2
  * Maps to noVNC/noVNC 18439b0680811f175e39ce381d0faa138f868d3c
