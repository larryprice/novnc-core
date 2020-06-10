'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.supportsImageMetadata = exports.supportsCursorURIs = exports.dragThreshold = exports.isTouchDevice = undefined;
exports.isMac = isMac;
exports.isWindows = isWindows;
exports.isIOS = isIOS;
exports.isAndroid = isAndroid;
exports.isSafari = isSafari;
exports.isIE = isIE;
exports.isEdge = isEdge;
exports.isFirefox = isFirefox;

var _logging = require('./logging.js');

var Log = _interopRequireWildcard(_logging);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Touch detection
var isTouchDevice = exports.isTouchDevice = 'ontouchstart' in document.documentElement ||
// requried for Chrome debugger
document.ontouchstart !== undefined ||
// required for MS Surface
navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0; /*
                                                                 * noVNC: HTML5 VNC client
                                                                 * Copyright (C) 2018 The noVNC Authors
                                                                 * Licensed under MPL 2.0 (see LICENSE.txt)
                                                                 *
                                                                 * See README.md for usage and integration instructions.
                                                                 */

window.addEventListener('touchstart', function onFirstTouch() {
    exports.isTouchDevice = isTouchDevice = true;
    window.removeEventListener('touchstart', onFirstTouch, false);
}, false);

// The goal is to find a certain physical width, the devicePixelRatio
// brings us a bit closer but is not optimal.
var dragThreshold = exports.dragThreshold = 10 * (window.devicePixelRatio || 1);

var _supportsCursorURIs = false;

try {
    var target = document.createElement('canvas');
    target.style.cursor = 'url("data:image/x-icon;base64,AAACAAEACAgAAAIAAgA4AQAAFgAAACgAAAAIAAAAEAAAAAEAIAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAA==") 2 2, default';

    if (target.style.cursor) {
        Log.Info("Data URI scheme cursor supported");
        _supportsCursorURIs = true;
    } else {
        Log.Warn("Data URI scheme cursor not supported");
    }
} catch (exc) {
    Log.Error("Data URI scheme cursor test exception: " + exc);
}

var supportsCursorURIs = exports.supportsCursorURIs = _supportsCursorURIs;

var _supportsImageMetadata = false;
try {
    new ImageData(new Uint8ClampedArray(4), 1, 1);
    _supportsImageMetadata = true;
} catch (ex) {
    // ignore failure
}
var supportsImageMetadata = exports.supportsImageMetadata = _supportsImageMetadata;

function isMac() {
    return navigator && !!/mac/i.exec(navigator.platform);
}

function isWindows() {
    return navigator && !!/win/i.exec(navigator.platform);
}

function isIOS() {
    return navigator && (!!/ipad/i.exec(navigator.platform) || !!/iphone/i.exec(navigator.platform) || !!/ipod/i.exec(navigator.platform));
}

function isAndroid() {
    return navigator && !!/android/i.exec(navigator.userAgent);
}

function isSafari() {
    return navigator && navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
}

function isIE() {
    return navigator && !!/trident/i.exec(navigator.userAgent);
}

function isEdge() {
    return navigator && !!/edge/i.exec(navigator.userAgent);
}

function isFirefox() {
    return navigator && !!/firefox/i.exec(navigator.userAgent);
}