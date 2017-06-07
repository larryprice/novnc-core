This is the result of running the following command on [noVNC](https://github.com/novnc/noVNC.git):

``` bash
./utils/use_require.js --as commonjs
```

The long-term goal is to automatically publish this package as the master branch of noVNC is updated.

### Usage ###

To install:

``` bash
$ npm install --save novnc-core
```

To use:

``` javascript
import RFB from 'novnc-browser'


```

### Copyright ###

See [LICENSE.txt](LICENSE.txt) for a full accounting of the licensing of the core files. Assume that this repository/package is _Copyright (C) 2017 Larry Price_ under the Mozilla Public License 2.0, but the code itself retains the copyrights of the parent codebase.

### Version History ###

* 0.1.0
 * Maps to noVNC/noVNC a5c366b
