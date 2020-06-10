'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Websock: high-performance binary WebSockets
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (C) 2018 The noVNC Authors
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Licensed under MPL 2.0 (see LICENSE.txt)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Websock is similar to the standard WebSocket object but with extra
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * buffer handling.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Websock has built-in receive queue buffering; the message event
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * does not contain actual data but is simply a notification that
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * there is new data available. Several rQ* methods are available to
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * read binary data off of the receive queue.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _logging = require('./util/logging.js');

var Log = _interopRequireWildcard(_logging);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// this has performance issues in some versions Chromium, and
// doesn't gain a tremendous amount of performance increase in Firefox
// at the moment.  It may be valuable to turn it on in the future.
var ENABLE_COPYWITHIN = false;
var MAX_RQ_GROW_SIZE = 40 * 1024 * 1024; // 40 MiB

var Websock = function () {
    function Websock() {
        _classCallCheck(this, Websock);

        this._websocket = null; // WebSocket object

        this._rQi = 0; // Receive queue index
        this._rQlen = 0; // Next write position in the receive queue
        this._rQbufferSize = 1024 * 1024 * 4; // Receive queue buffer size (4 MiB)
        this._rQmax = this._rQbufferSize / 8;
        // called in init: this._rQ = new Uint8Array(this._rQbufferSize);
        this._rQ = null; // Receive queue

        this._sQbufferSize = 1024 * 10; // 10 KiB
        // called in init: this._sQ = new Uint8Array(this._sQbufferSize);
        this._sQlen = 0;
        this._sQ = null; // Send queue

        this._eventHandlers = {
            message: function message() {},
            open: function open() {},
            close: function close() {},
            error: function error() {}
        };
    }

    // Getters and Setters


    _createClass(Websock, [{
        key: 'rQpeek8',
        value: function rQpeek8() {
            return this._rQ[this._rQi];
        }
    }, {
        key: 'rQskipBytes',
        value: function rQskipBytes(bytes) {
            this._rQi += bytes;
        }
    }, {
        key: 'rQshift8',
        value: function rQshift8() {
            return this._rQshift(1);
        }
    }, {
        key: 'rQshift16',
        value: function rQshift16() {
            return this._rQshift(2);
        }
    }, {
        key: 'rQshift32',
        value: function rQshift32() {
            return this._rQshift(4);
        }

        // TODO(directxman12): test performance with these vs a DataView

    }, {
        key: '_rQshift',
        value: function _rQshift(bytes) {
            var res = 0;
            for (var byte = bytes - 1; byte >= 0; byte--) {
                res += this._rQ[this._rQi++] << byte * 8;
            }
            return res;
        }
    }, {
        key: 'rQshiftStr',
        value: function rQshiftStr(len) {
            if (typeof len === 'undefined') {
                len = this.rQlen;
            }
            var str = "";
            // Handle large arrays in steps to avoid long strings on the stack
            for (var i = 0; i < len; i += 4096) {
                var part = this.rQshiftBytes(Math.min(4096, len - i));
                str += String.fromCharCode.apply(null, part);
            }
            return str;
        }
    }, {
        key: 'rQshiftBytes',
        value: function rQshiftBytes(len) {
            if (typeof len === 'undefined') {
                len = this.rQlen;
            }
            this._rQi += len;
            return new Uint8Array(this._rQ.buffer, this._rQi - len, len);
        }
    }, {
        key: 'rQshiftTo',
        value: function rQshiftTo(target, len) {
            if (len === undefined) {
                len = this.rQlen;
            }
            // TODO: make this just use set with views when using a ArrayBuffer to store the rQ
            target.set(new Uint8Array(this._rQ.buffer, this._rQi, len));
            this._rQi += len;
        }
    }, {
        key: 'rQslice',
        value: function rQslice(start) {
            var end = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.rQlen;

            return new Uint8Array(this._rQ.buffer, this._rQi + start, end - start);
        }

        // Check to see if we must wait for 'num' bytes (default to FBU.bytes)
        // to be available in the receive queue. Return true if we need to
        // wait (and possibly print a debug message), otherwise false.

    }, {
        key: 'rQwait',
        value: function rQwait(msg, num, goback) {
            if (this.rQlen < num) {
                if (goback) {
                    if (this._rQi < goback) {
                        throw new Error("rQwait cannot backup " + goback + " bytes");
                    }
                    this._rQi -= goback;
                }
                return true; // true means need more data
            }
            return false;
        }

        // Send Queue

    }, {
        key: 'flush',
        value: function flush() {
            if (this._sQlen > 0 && this._websocket.readyState === WebSocket.OPEN) {
                this._websocket.send(this._encode_message());
                this._sQlen = 0;
            }
        }
    }, {
        key: 'send',
        value: function send(arr) {
            this._sQ.set(arr, this._sQlen);
            this._sQlen += arr.length;
            this.flush();
        }
    }, {
        key: 'send_string',
        value: function send_string(str) {
            this.send(str.split('').map(function (chr) {
                return chr.charCodeAt(0);
            }));
        }

        // Event Handlers

    }, {
        key: 'off',
        value: function off(evt) {
            this._eventHandlers[evt] = function () {};
        }
    }, {
        key: 'on',
        value: function on(evt, handler) {
            this._eventHandlers[evt] = handler;
        }
    }, {
        key: '_allocate_buffers',
        value: function _allocate_buffers() {
            this._rQ = new Uint8Array(this._rQbufferSize);
            this._sQ = new Uint8Array(this._sQbufferSize);
        }
    }, {
        key: 'init',
        value: function init() {
            this._allocate_buffers();
            this._rQi = 0;
            this._websocket = null;
        }
    }, {
        key: 'open',
        value: function open(uri, protocols) {
            var _this = this;

            this.init();

            this._websocket = new WebSocket(uri, protocols);
            this._websocket.binaryType = 'arraybuffer';

            this._websocket.onmessage = this._recv_message.bind(this);
            this._websocket.onopen = function () {
                Log.Debug('>> WebSock.onopen');
                if (_this._websocket.protocol) {
                    Log.Info("Server choose sub-protocol: " + _this._websocket.protocol);
                }

                _this._eventHandlers.open();
                Log.Debug("<< WebSock.onopen");
            };
            this._websocket.onclose = function (e) {
                Log.Debug(">> WebSock.onclose");
                _this._eventHandlers.close(e);
                Log.Debug("<< WebSock.onclose");
            };
            this._websocket.onerror = function (e) {
                Log.Debug(">> WebSock.onerror: " + e);
                _this._eventHandlers.error(e);
                Log.Debug("<< WebSock.onerror: " + e);
            };
        }
    }, {
        key: 'close',
        value: function close() {
            if (this._websocket) {
                if (this._websocket.readyState === WebSocket.OPEN || this._websocket.readyState === WebSocket.CONNECTING) {
                    Log.Info("Closing WebSocket connection");
                    this._websocket.close();
                }

                this._websocket.onmessage = function () {};
            }
        }

        // private methods

    }, {
        key: '_encode_message',
        value: function _encode_message() {
            // Put in a binary arraybuffer
            // according to the spec, you can send ArrayBufferViews with the send method
            return new Uint8Array(this._sQ.buffer, 0, this._sQlen);
        }
    }, {
        key: '_expand_compact_rQ',
        value: function _expand_compact_rQ(min_fit) {
            var resizeNeeded = min_fit || this.rQlen > this._rQbufferSize / 2;
            if (resizeNeeded) {
                if (!min_fit) {
                    // just double the size if we need to do compaction
                    this._rQbufferSize *= 2;
                } else {
                    // otherwise, make sure we satisy rQlen - rQi + min_fit < rQbufferSize / 8
                    this._rQbufferSize = (this.rQlen + min_fit) * 8;
                }
            }

            // we don't want to grow unboundedly
            if (this._rQbufferSize > MAX_RQ_GROW_SIZE) {
                this._rQbufferSize = MAX_RQ_GROW_SIZE;
                if (this._rQbufferSize - this.rQlen < min_fit) {
                    throw new Error("Receive Queue buffer exceeded " + MAX_RQ_GROW_SIZE + " bytes, and the new message could not fit");
                }
            }

            if (resizeNeeded) {
                var old_rQbuffer = this._rQ.buffer;
                this._rQmax = this._rQbufferSize / 8;
                this._rQ = new Uint8Array(this._rQbufferSize);
                this._rQ.set(new Uint8Array(old_rQbuffer, this._rQi));
            } else {
                if (ENABLE_COPYWITHIN) {
                    this._rQ.copyWithin(0, this._rQi);
                } else {
                    this._rQ.set(new Uint8Array(this._rQ.buffer, this._rQi));
                }
            }

            this._rQlen = this._rQlen - this._rQi;
            this._rQi = 0;
        }
    }, {
        key: '_decode_message',
        value: function _decode_message(data) {
            // push arraybuffer values onto the end
            var u8 = new Uint8Array(data);
            if (u8.length > this._rQbufferSize - this._rQlen) {
                this._expand_compact_rQ(u8.length);
            }
            this._rQ.set(u8, this._rQlen);
            this._rQlen += u8.length;
        }
    }, {
        key: '_recv_message',
        value: function _recv_message(e) {
            this._decode_message(e.data);
            if (this.rQlen > 0) {
                this._eventHandlers.message();
                // Compact the receive queue
                if (this._rQlen == this._rQi) {
                    this._rQlen = 0;
                    this._rQi = 0;
                } else if (this._rQlen > this._rQmax) {
                    this._expand_compact_rQ();
                }
            } else {
                Log.Debug("Ignoring empty message");
            }
        }
    }, {
        key: 'sQ',
        get: function get() {
            return this._sQ;
        }
    }, {
        key: 'rQ',
        get: function get() {
            return this._rQ;
        }
    }, {
        key: 'rQi',
        get: function get() {
            return this._rQi;
        },
        set: function set(val) {
            this._rQi = val;
        }

        // Receive Queue

    }, {
        key: 'rQlen',
        get: function get() {
            return this._rQlen - this._rQi;
        }
    }]);

    return Websock;
}();

exports.default = Websock;