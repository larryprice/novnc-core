"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * noVNC: HTML5 VNC client
 * Copyright (C) 2012 Joel Martin
 * Copyright (C) 2018 Samuel Mannehed for Cendio AB
 * Copyright (C) 2018 Pierre Ossman for Cendio AB
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * See README.md for usage and integration instructions.
 *
 */

var CopyRectDecoder = function () {
    function CopyRectDecoder() {
        _classCallCheck(this, CopyRectDecoder);
    }

    _createClass(CopyRectDecoder, [{
        key: "decodeRect",
        value: function decodeRect(x, y, width, height, sock, display, depth) {
            if (sock.rQwait("COPYRECT", 4)) {
                return false;
            }

            var deltaX = sock.rQshift16();
            var deltaY = sock.rQshift16();
            display.copyImage(deltaX, deltaY, x, y, width, height);

            return true;
        }
    }]);

    return CopyRectDecoder;
}();

exports.default = CopyRectDecoder;