"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * noVNC: HTML5 VNC client
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (C) 2012 Joel Martin
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (C) 2018 Samuel Mannehed for Cendio AB
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (C) 2018 Pierre Ossman for Cendio AB
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Licensed under MPL 2.0 (see LICENSE.txt)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * See README.md for usage and integration instructions.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _logging = require("../util/logging.js");

var Log = _interopRequireWildcard(_logging);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HextileDecoder = function () {
    function HextileDecoder() {
        _classCallCheck(this, HextileDecoder);

        this._tiles = 0;
        this._lastsubencoding = 0;
    }

    _createClass(HextileDecoder, [{
        key: "decodeRect",
        value: function decodeRect(x, y, width, height, sock, display, depth) {
            if (this._tiles === 0) {
                this._tiles_x = Math.ceil(width / 16);
                this._tiles_y = Math.ceil(height / 16);
                this._total_tiles = this._tiles_x * this._tiles_y;
                this._tiles = this._total_tiles;
            }

            while (this._tiles > 0) {
                var bytes = 1;

                if (sock.rQwait("HEXTILE", bytes)) {
                    return false;
                }

                var rQ = sock.rQ;
                var rQi = sock.rQi;

                var subencoding = rQ[rQi]; // Peek
                if (subencoding > 30) {
                    // Raw
                    throw new Error("Illegal hextile subencoding (subencoding: " + subencoding + ")");
                }

                var curr_tile = this._total_tiles - this._tiles;
                var tile_x = curr_tile % this._tiles_x;
                var tile_y = Math.floor(curr_tile / this._tiles_x);
                var tx = x + tile_x * 16;
                var ty = y + tile_y * 16;
                var tw = Math.min(16, x + width - tx);
                var th = Math.min(16, y + height - ty);

                // Figure out how much we are expecting
                if (subencoding & 0x01) {
                    // Raw
                    bytes += tw * th * 4;
                } else {
                    if (subencoding & 0x02) {
                        // Background
                        bytes += 4;
                    }
                    if (subencoding & 0x04) {
                        // Foreground
                        bytes += 4;
                    }
                    if (subencoding & 0x08) {
                        // AnySubrects
                        bytes++; // Since we aren't shifting it off

                        if (sock.rQwait("HEXTILE", bytes)) {
                            return false;
                        }

                        var subrects = rQ[rQi + bytes - 1]; // Peek
                        if (subencoding & 0x10) {
                            // SubrectsColoured
                            bytes += subrects * (4 + 2);
                        } else {
                            bytes += subrects * 2;
                        }
                    }
                }

                if (sock.rQwait("HEXTILE", bytes)) {
                    return false;
                }

                // We know the encoding and have a whole tile
                rQi++;
                if (subencoding === 0) {
                    if (this._lastsubencoding & 0x01) {
                        // Weird: ignore blanks are RAW
                        Log.Debug("     Ignoring blank after RAW");
                    } else {
                        display.fillRect(tx, ty, tw, th, this._background);
                    }
                } else if (subencoding & 0x01) {
                    // Raw
                    display.blitImage(tx, ty, tw, th, rQ, rQi);
                    rQi += bytes - 1;
                } else {
                    if (subencoding & 0x02) {
                        // Background
                        this._background = [rQ[rQi], rQ[rQi + 1], rQ[rQi + 2], rQ[rQi + 3]];
                        rQi += 4;
                    }
                    if (subencoding & 0x04) {
                        // Foreground
                        this._foreground = [rQ[rQi], rQ[rQi + 1], rQ[rQi + 2], rQ[rQi + 3]];
                        rQi += 4;
                    }

                    display.startTile(tx, ty, tw, th, this._background);
                    if (subencoding & 0x08) {
                        // AnySubrects
                        var _subrects = rQ[rQi];
                        rQi++;

                        for (var s = 0; s < _subrects; s++) {
                            var color = void 0;
                            if (subencoding & 0x10) {
                                // SubrectsColoured
                                color = [rQ[rQi], rQ[rQi + 1], rQ[rQi + 2], rQ[rQi + 3]];
                                rQi += 4;
                            } else {
                                color = this._foreground;
                            }
                            var xy = rQ[rQi];
                            rQi++;
                            var sx = xy >> 4;
                            var sy = xy & 0x0f;

                            var wh = rQ[rQi];
                            rQi++;
                            var sw = (wh >> 4) + 1;
                            var sh = (wh & 0x0f) + 1;

                            display.subTile(sx, sy, sw, sh, color);
                        }
                    }
                    display.finishTile();
                }
                sock.rQi = rQi;
                this._lastsubencoding = subencoding;
                this._tiles--;
            }

            return true;
        }
    }]);

    return HextileDecoder;
}();

exports.default = HextileDecoder;