"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tight = require("./tight.js");

var _tight2 = _interopRequireDefault(_tight);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * noVNC: HTML5 VNC client
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright (C) 2012 Joel Martin
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright (C) 2018 Samuel Mannehed for Cendio AB
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright (C) 2018 Pierre Ossman for Cendio AB
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under MPL 2.0 (see LICENSE.txt)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See README.md for usage and integration instructions.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var TightPNGDecoder = function (_TightDecoder) {
    _inherits(TightPNGDecoder, _TightDecoder);

    function TightPNGDecoder() {
        _classCallCheck(this, TightPNGDecoder);

        return _possibleConstructorReturn(this, (TightPNGDecoder.__proto__ || Object.getPrototypeOf(TightPNGDecoder)).apply(this, arguments));
    }

    _createClass(TightPNGDecoder, [{
        key: "_pngRect",
        value: function _pngRect(x, y, width, height, sock, display, depth) {
            var data = this._readData(sock);
            if (data === null) {
                return false;
            }

            display.imageRect(x, y, "image/png", data);

            return true;
        }
    }, {
        key: "_basicRect",
        value: function _basicRect(ctl, x, y, width, height, sock, display, depth) {
            throw new Error("BasicCompression received in TightPNG rect");
        }
    }]);

    return TightPNGDecoder;
}(_tight2.default);

exports.default = TightPNGDecoder;