'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _logging = require('./util/logging.js');

var Log = _interopRequireWildcard(_logging);

var _strings = require('./util/strings.js');

var _browser = require('./util/browser.js');

var _eventtarget = require('./util/eventtarget.js');

var _eventtarget2 = _interopRequireDefault(_eventtarget);

var _display = require('./display.js');

var _display2 = _interopRequireDefault(_display);

var _keyboard = require('./input/keyboard.js');

var _keyboard2 = _interopRequireDefault(_keyboard);

var _mouse = require('./input/mouse.js');

var _mouse2 = _interopRequireDefault(_mouse);

var _cursor = require('./util/cursor.js');

var _cursor2 = _interopRequireDefault(_cursor);

var _websock = require('./websock.js');

var _websock2 = _interopRequireDefault(_websock);

var _des = require('./des.js');

var _des2 = _interopRequireDefault(_des);

var _keysym = require('./input/keysym.js');

var _keysym2 = _interopRequireDefault(_keysym);

var _xtscancodes = require('./input/xtscancodes.js');

var _xtscancodes2 = _interopRequireDefault(_xtscancodes);

var _encodings = require('./encodings.js');

require('./util/polyfill.js');

var _raw = require('./decoders/raw.js');

var _raw2 = _interopRequireDefault(_raw);

var _copyrect = require('./decoders/copyrect.js');

var _copyrect2 = _interopRequireDefault(_copyrect);

var _rre = require('./decoders/rre.js');

var _rre2 = _interopRequireDefault(_rre);

var _hextile = require('./decoders/hextile.js');

var _hextile2 = _interopRequireDefault(_hextile);

var _tight = require('./decoders/tight.js');

var _tight2 = _interopRequireDefault(_tight);

var _tightpng = require('./decoders/tightpng.js');

var _tightpng2 = _interopRequireDefault(_tightpng);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * noVNC: HTML5 VNC client
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright (C) 2018 The noVNC Authors
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under MPL 2.0 (see LICENSE.txt)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See README.md for usage and integration instructions.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

// How many seconds to wait for a disconnect to finish
var DISCONNECT_TIMEOUT = 3;
var DEFAULT_BACKGROUND = 'rgb(40, 40, 40)';

var RFB = function (_EventTargetMixin) {
    _inherits(RFB, _EventTargetMixin);

    function RFB(target, url, options) {
        _classCallCheck(this, RFB);

        if (!target) {
            throw new Error("Must specify target");
        }
        if (!url) {
            throw new Error("Must specify URL");
        }

        var _this = _possibleConstructorReturn(this, (RFB.__proto__ || Object.getPrototypeOf(RFB)).call(this));

        _this._target = target;
        _this._url = url;

        // Connection details
        options = options || {};
        _this._rfb_credentials = options.credentials || {};
        _this._shared = 'shared' in options ? !!options.shared : true;
        _this._repeaterID = options.repeaterID || '';
        _this._showDotCursor = options.showDotCursor || false;

        // Internal state
        _this._rfb_connection_state = '';
        _this._rfb_init_state = '';
        _this._rfb_auth_scheme = -1;
        _this._rfb_clean_disconnect = true;

        // Server capabilities
        _this._rfb_version = 0;
        _this._rfb_max_version = 3.8;
        _this._rfb_tightvnc = false;
        _this._rfb_xvp_ver = 0;

        _this._fb_width = 0;
        _this._fb_height = 0;

        _this._fb_name = "";

        _this._capabilities = { power: false };

        _this._supportsFence = false;

        _this._supportsContinuousUpdates = false;
        _this._enabledContinuousUpdates = false;

        _this._supportsSetDesktopSize = false;
        _this._screen_id = 0;
        _this._screen_flags = 0;

        _this._qemuExtKeyEventSupported = false;

        // Internal objects
        _this._sock = null; // Websock object
        _this._display = null; // Display object
        _this._flushing = false; // Display flushing state
        _this._keyboard = null; // Keyboard input handler object
        _this._mouse = null; // Mouse input handler object

        // Timers
        _this._disconnTimer = null; // disconnection timer
        _this._resizeTimeout = null; // resize rate limiting

        // Decoder states
        _this._decoders = {};

        _this._FBU = {
            rects: 0,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            encoding: null
        };

        // Mouse state
        _this._mouse_buttonMask = 0;
        _this._mouse_arr = [];
        _this._viewportDragging = false;
        _this._viewportDragPos = {};
        _this._viewportHasMoved = false;

        // Bound event handlers
        _this._eventHandlers = {
            focusCanvas: _this._focusCanvas.bind(_this),
            windowResize: _this._windowResize.bind(_this)
        };

        // main setup
        Log.Debug(">> RFB.constructor");

        // Create DOM elements
        _this._screen = document.createElement('div');
        _this._screen.style.display = 'flex';
        _this._screen.style.width = '100%';
        _this._screen.style.height = '100%';
        _this._screen.style.overflow = 'auto';
        _this._screen.style.background = DEFAULT_BACKGROUND;
        _this._canvas = document.createElement('canvas');
        _this._canvas.style.margin = 'auto';
        // Some browsers add an outline on focus
        _this._canvas.style.outline = 'none';
        // IE miscalculates width without this :(
        _this._canvas.style.flexShrink = '0';
        _this._canvas.width = 0;
        _this._canvas.height = 0;
        _this._canvas.tabIndex = -1;
        _this._screen.appendChild(_this._canvas);

        // Cursor
        _this._cursor = new _cursor2.default();

        // XXX: TightVNC 2.8.11 sends no cursor at all until Windows changes
        // it. Result: no cursor at all until a window border or an edit field
        // is hit blindly. But there are also VNC servers that draw the cursor
        // in the framebuffer and don't send the empty local cursor. There is
        // no way to satisfy both sides.
        //
        // The spec is unclear on this "initial cursor" issue. Many other
        // viewers (TigerVNC, RealVNC, Remmina) display an arrow as the
        // initial cursor instead.
        _this._cursorImage = RFB.cursors.none;

        // populate decoder array with objects
        _this._decoders[_encodings.encodings.encodingRaw] = new _raw2.default();
        _this._decoders[_encodings.encodings.encodingCopyRect] = new _copyrect2.default();
        _this._decoders[_encodings.encodings.encodingRRE] = new _rre2.default();
        _this._decoders[_encodings.encodings.encodingHextile] = new _hextile2.default();
        _this._decoders[_encodings.encodings.encodingTight] = new _tight2.default();
        _this._decoders[_encodings.encodings.encodingTightPNG] = new _tightpng2.default();

        // NB: nothing that needs explicit teardown should be done
        // before this point, since this can throw an exception
        try {
            _this._display = new _display2.default(_this._canvas);
        } catch (exc) {
            Log.Error("Display exception: " + exc);
            throw exc;
        }
        _this._display.onflush = _this._onFlush.bind(_this);
        _this._display.clear();

        _this._keyboard = new _keyboard2.default(_this._canvas);
        _this._keyboard.onkeyevent = _this._handleKeyEvent.bind(_this);

        _this._mouse = new _mouse2.default(_this._canvas);
        _this._mouse.onmousebutton = _this._handleMouseButton.bind(_this);
        _this._mouse.onmousemove = _this._handleMouseMove.bind(_this);

        _this._sock = new _websock2.default();
        _this._sock.on('message', function () {
            _this._handle_message();
        });
        _this._sock.on('open', function () {
            if (_this._rfb_connection_state === 'connecting' && _this._rfb_init_state === '') {
                _this._rfb_init_state = 'ProtocolVersion';
                Log.Debug("Starting VNC handshake");
            } else {
                _this._fail("Unexpected server connection while " + _this._rfb_connection_state);
            }
        });
        _this._sock.on('close', function (e) {
            Log.Debug("WebSocket on-close event");
            var msg = "";
            if (e.code) {
                msg = "(code: " + e.code;
                if (e.reason) {
                    msg += ", reason: " + e.reason;
                }
                msg += ")";
            }
            switch (_this._rfb_connection_state) {
                case 'connecting':
                    _this._fail("Connection closed " + msg);
                    break;
                case 'connected':
                    // Handle disconnects that were initiated server-side
                    _this._updateConnectionState('disconnecting');
                    _this._updateConnectionState('disconnected');
                    break;
                case 'disconnecting':
                    // Normal disconnection path
                    _this._updateConnectionState('disconnected');
                    break;
                case 'disconnected':
                    _this._fail("Unexpected server disconnect " + "when already disconnected " + msg);
                    break;
                default:
                    _this._fail("Unexpected server disconnect before connecting " + msg);
                    break;
            }
            _this._sock.off('close');
        });
        _this._sock.on('error', function (e) {
            return Log.Warn("WebSocket on-error event");
        });

        // Slight delay of the actual connection so that the caller has
        // time to set up callbacks
        setTimeout(_this._updateConnectionState.bind(_this, 'connecting'));

        Log.Debug("<< RFB.constructor");

        // ===== PROPERTIES =====

        _this.dragViewport = false;
        _this.focusOnClick = true;

        _this._viewOnly = false;
        _this._clipViewport = false;
        _this._scaleViewport = false;
        _this._resizeSession = false;
        return _this;
    }

    // ===== PROPERTIES =====

    _createClass(RFB, [{
        key: 'disconnect',


        // ===== PUBLIC METHODS =====

        value: function disconnect() {
            this._updateConnectionState('disconnecting');
            this._sock.off('error');
            this._sock.off('message');
            this._sock.off('open');
        }
    }, {
        key: 'sendCredentials',
        value: function sendCredentials(creds) {
            this._rfb_credentials = creds;
            setTimeout(this._init_msg.bind(this), 0);
        }
    }, {
        key: 'sendCtrlAltDel',
        value: function sendCtrlAltDel() {
            if (this._rfb_connection_state !== 'connected' || this._viewOnly) {
                return;
            }
            Log.Info("Sending Ctrl-Alt-Del");

            this.sendKey(_keysym2.default.XK_Control_L, "ControlLeft", true);
            this.sendKey(_keysym2.default.XK_Alt_L, "AltLeft", true);
            this.sendKey(_keysym2.default.XK_Delete, "Delete", true);
            this.sendKey(_keysym2.default.XK_Delete, "Delete", false);
            this.sendKey(_keysym2.default.XK_Alt_L, "AltLeft", false);
            this.sendKey(_keysym2.default.XK_Control_L, "ControlLeft", false);
        }
    }, {
        key: 'machineShutdown',
        value: function machineShutdown() {
            this._xvpOp(1, 2);
        }
    }, {
        key: 'machineReboot',
        value: function machineReboot() {
            this._xvpOp(1, 3);
        }
    }, {
        key: 'machineReset',
        value: function machineReset() {
            this._xvpOp(1, 4);
        }

        // Send a key press. If 'down' is not specified then send a down key
        // followed by an up key.

    }, {
        key: 'sendKey',
        value: function sendKey(keysym, code, down) {
            if (this._rfb_connection_state !== 'connected' || this._viewOnly) {
                return;
            }

            if (down === undefined) {
                this.sendKey(keysym, code, true);
                this.sendKey(keysym, code, false);
                return;
            }

            var scancode = _xtscancodes2.default[code];

            if (this._qemuExtKeyEventSupported && scancode) {
                // 0 is NoSymbol
                keysym = keysym || 0;

                Log.Info("Sending key (" + (down ? "down" : "up") + "): keysym " + keysym + ", scancode " + scancode);

                RFB.messages.QEMUExtendedKeyEvent(this._sock, keysym, down, scancode);
            } else {
                if (!keysym) {
                    return;
                }
                Log.Info("Sending keysym (" + (down ? "down" : "up") + "): " + keysym);
                RFB.messages.keyEvent(this._sock, keysym, down ? 1 : 0);
            }
        }
    }, {
        key: 'focus',
        value: function focus() {
            this._canvas.focus();
        }
    }, {
        key: 'blur',
        value: function blur() {
            this._canvas.blur();
        }
    }, {
        key: 'clipboardPasteFrom',
        value: function clipboardPasteFrom(text) {
            if (this._rfb_connection_state !== 'connected' || this._viewOnly) {
                return;
            }
            RFB.messages.clientCutText(this._sock, text);
        }

        // ===== PRIVATE METHODS =====

    }, {
        key: '_connect',
        value: function _connect() {
            Log.Debug(">> RFB.connect");

            Log.Info("connecting to " + this._url);

            try {
                // WebSocket.onopen transitions to the RFB init states
                this._sock.open(this._url, ['binary']);
            } catch (e) {
                if (e.name === 'SyntaxError') {
                    this._fail("Invalid host or port (" + e + ")");
                } else {
                    this._fail("Error when opening socket (" + e + ")");
                }
            }

            // Make our elements part of the page
            this._target.appendChild(this._screen);

            this._cursor.attach(this._canvas);
            this._refreshCursor();

            // Monitor size changes of the screen
            // FIXME: Use ResizeObserver, or hidden overflow
            window.addEventListener('resize', this._eventHandlers.windowResize);

            // Always grab focus on some kind of click event
            this._canvas.addEventListener("mousedown", this._eventHandlers.focusCanvas);
            this._canvas.addEventListener("touchstart", this._eventHandlers.focusCanvas);

            Log.Debug("<< RFB.connect");
        }
    }, {
        key: '_disconnect',
        value: function _disconnect() {
            Log.Debug(">> RFB.disconnect");
            this._cursor.detach();
            this._canvas.removeEventListener("mousedown", this._eventHandlers.focusCanvas);
            this._canvas.removeEventListener("touchstart", this._eventHandlers.focusCanvas);
            window.removeEventListener('resize', this._eventHandlers.windowResize);
            this._keyboard.ungrab();
            this._mouse.ungrab();
            this._sock.close();
            try {
                this._target.removeChild(this._screen);
            } catch (e) {
                if (e.name === 'NotFoundError') {
                    // Some cases where the initial connection fails
                    // can disconnect before the _screen is created
                } else {
                    throw e;
                }
            }
            clearTimeout(this._resizeTimeout);
            Log.Debug("<< RFB.disconnect");
        }
    }, {
        key: '_focusCanvas',
        value: function _focusCanvas(event) {
            // Respect earlier handlers' request to not do side-effects
            if (event.defaultPrevented) {
                return;
            }

            if (!this.focusOnClick) {
                return;
            }

            this.focus();
        }
    }, {
        key: '_windowResize',
        value: function _windowResize(event) {
            var _this2 = this;

            // If the window resized then our screen element might have
            // as well. Update the viewport dimensions.
            window.requestAnimationFrame(function () {
                _this2._updateClip();
                _this2._updateScale();
            });

            if (this._resizeSession) {
                // Request changing the resolution of the remote display to
                // the size of the local browser viewport.

                // In order to not send multiple requests before the browser-resize
                // is finished we wait 0.5 seconds before sending the request.
                clearTimeout(this._resizeTimeout);
                this._resizeTimeout = setTimeout(this._requestRemoteResize.bind(this), 500);
            }
        }

        // Update state of clipping in Display object, and make sure the
        // configured viewport matches the current screen size

    }, {
        key: '_updateClip',
        value: function _updateClip() {
            var cur_clip = this._display.clipViewport;
            var new_clip = this._clipViewport;

            if (this._scaleViewport) {
                // Disable viewport clipping if we are scaling
                new_clip = false;
            }

            if (cur_clip !== new_clip) {
                this._display.clipViewport = new_clip;
            }

            if (new_clip) {
                // When clipping is enabled, the screen is limited to
                // the size of the container.
                var size = this._screenSize();
                this._display.viewportChangeSize(size.w, size.h);
                this._fixScrollbars();
            }
        }
    }, {
        key: '_updateScale',
        value: function _updateScale() {
            if (!this._scaleViewport) {
                this._display.scale = 1.0;
            } else {
                var size = this._screenSize();
                this._display.autoscale(size.w, size.h);
            }
            this._fixScrollbars();
        }

        // Requests a change of remote desktop size. This message is an extension
        // and may only be sent if we have received an ExtendedDesktopSize message

    }, {
        key: '_requestRemoteResize',
        value: function _requestRemoteResize() {
            clearTimeout(this._resizeTimeout);
            this._resizeTimeout = null;

            if (!this._resizeSession || this._viewOnly || !this._supportsSetDesktopSize) {
                return;
            }

            var size = this._screenSize();
            RFB.messages.setDesktopSize(this._sock, Math.floor(size.w), Math.floor(size.h), this._screen_id, this._screen_flags);

            Log.Debug('Requested new desktop size: ' + size.w + 'x' + size.h);
        }

        // Gets the the size of the available screen

    }, {
        key: '_screenSize',
        value: function _screenSize() {
            var r = this._screen.getBoundingClientRect();
            return { w: r.width, h: r.height };
        }
    }, {
        key: '_fixScrollbars',
        value: function _fixScrollbars() {
            // This is a hack because Chrome screws up the calculation
            // for when scrollbars are needed. So to fix it we temporarily
            // toggle them off and on.
            var orig = this._screen.style.overflow;
            this._screen.style.overflow = 'hidden';
            // Force Chrome to recalculate the layout by asking for
            // an element's dimensions
            this._screen.getBoundingClientRect();
            this._screen.style.overflow = orig;
        }

        /*
         * Connection states:
         *   connecting
         *   connected
         *   disconnecting
         *   disconnected - permanent state
         */

    }, {
        key: '_updateConnectionState',
        value: function _updateConnectionState(state) {
            var _this3 = this;

            var oldstate = this._rfb_connection_state;

            if (state === oldstate) {
                Log.Debug("Already in state '" + state + "', ignoring");
                return;
            }

            // The 'disconnected' state is permanent for each RFB object
            if (oldstate === 'disconnected') {
                Log.Error("Tried changing state of a disconnected RFB object");
                return;
            }

            // Ensure proper transitions before doing anything
            switch (state) {
                case 'connected':
                    if (oldstate !== 'connecting') {
                        Log.Error("Bad transition to connected state, " + "previous connection state: " + oldstate);
                        return;
                    }
                    break;

                case 'disconnected':
                    if (oldstate !== 'disconnecting') {
                        Log.Error("Bad transition to disconnected state, " + "previous connection state: " + oldstate);
                        return;
                    }
                    break;

                case 'connecting':
                    if (oldstate !== '') {
                        Log.Error("Bad transition to connecting state, " + "previous connection state: " + oldstate);
                        return;
                    }
                    break;

                case 'disconnecting':
                    if (oldstate !== 'connected' && oldstate !== 'connecting') {
                        Log.Error("Bad transition to disconnecting state, " + "previous connection state: " + oldstate);
                        return;
                    }
                    break;

                default:
                    Log.Error("Unknown connection state: " + state);
                    return;
            }

            // State change actions

            this._rfb_connection_state = state;

            Log.Debug("New state '" + state + "', was '" + oldstate + "'.");

            if (this._disconnTimer && state !== 'disconnecting') {
                Log.Debug("Clearing disconnect timer");
                clearTimeout(this._disconnTimer);
                this._disconnTimer = null;

                // make sure we don't get a double event
                this._sock.off('close');
            }

            switch (state) {
                case 'connecting':
                    this._connect();
                    break;

                case 'connected':
                    this.dispatchEvent(new CustomEvent("connect", { detail: {} }));
                    break;

                case 'disconnecting':
                    this._disconnect();

                    this._disconnTimer = setTimeout(function () {
                        Log.Error("Disconnection timed out.");
                        _this3._updateConnectionState('disconnected');
                    }, DISCONNECT_TIMEOUT * 1000);
                    break;

                case 'disconnected':
                    this.dispatchEvent(new CustomEvent("disconnect", { detail: { clean: this._rfb_clean_disconnect } }));
                    break;
            }
        }

        /* Print errors and disconnect
         *
         * The parameter 'details' is used for information that
         * should be logged but not sent to the user interface.
         */

    }, {
        key: '_fail',
        value: function _fail(details) {
            switch (this._rfb_connection_state) {
                case 'disconnecting':
                    Log.Error("Failed when disconnecting: " + details);
                    break;
                case 'connected':
                    Log.Error("Failed while connected: " + details);
                    break;
                case 'connecting':
                    Log.Error("Failed when connecting: " + details);
                    break;
                default:
                    Log.Error("RFB failure: " + details);
                    break;
            }
            this._rfb_clean_disconnect = false; //This is sent to the UI

            // Transition to disconnected without waiting for socket to close
            this._updateConnectionState('disconnecting');
            this._updateConnectionState('disconnected');

            return false;
        }
    }, {
        key: '_setCapability',
        value: function _setCapability(cap, val) {
            this._capabilities[cap] = val;
            this.dispatchEvent(new CustomEvent("capabilities", { detail: { capabilities: this._capabilities } }));
        }
    }, {
        key: '_handle_message',
        value: function _handle_message() {
            if (this._sock.rQlen === 0) {
                Log.Warn("handle_message called on an empty receive queue");
                return;
            }

            switch (this._rfb_connection_state) {
                case 'disconnected':
                    Log.Error("Got data while disconnected");
                    break;
                case 'connected':
                    while (true) {
                        if (this._flushing) {
                            break;
                        }
                        if (!this._normal_msg()) {
                            break;
                        }
                        if (this._sock.rQlen === 0) {
                            break;
                        }
                    }
                    break;
                default:
                    this._init_msg();
                    break;
            }
        }
    }, {
        key: '_handleKeyEvent',
        value: function _handleKeyEvent(keysym, code, down) {
            this.sendKey(keysym, code, down);
        }
    }, {
        key: '_handleMouseButton',
        value: function _handleMouseButton(x, y, down, bmask) {
            if (down) {
                this._mouse_buttonMask |= bmask;
            } else {
                this._mouse_buttonMask &= ~bmask;
            }

            if (this.dragViewport) {
                if (down && !this._viewportDragging) {
                    this._viewportDragging = true;
                    this._viewportDragPos = { 'x': x, 'y': y };
                    this._viewportHasMoved = false;

                    // Skip sending mouse events
                    return;
                } else {
                    this._viewportDragging = false;

                    // If we actually performed a drag then we are done
                    // here and should not send any mouse events
                    if (this._viewportHasMoved) {
                        return;
                    }

                    // Otherwise we treat this as a mouse click event.
                    // Send the button down event here, as the button up
                    // event is sent at the end of this function.
                    RFB.messages.pointerEvent(this._sock, this._display.absX(x), this._display.absY(y), bmask);
                }
            }

            if (this._viewOnly) {
                return;
            } // View only, skip mouse events

            if (this._rfb_connection_state !== 'connected') {
                return;
            }
            RFB.messages.pointerEvent(this._sock, this._display.absX(x), this._display.absY(y), this._mouse_buttonMask);
        }
    }, {
        key: '_handleMouseMove',
        value: function _handleMouseMove(x, y) {
            if (this._viewportDragging) {
                var deltaX = this._viewportDragPos.x - x;
                var deltaY = this._viewportDragPos.y - y;

                if (this._viewportHasMoved || Math.abs(deltaX) > _browser.dragThreshold || Math.abs(deltaY) > _browser.dragThreshold) {
                    this._viewportHasMoved = true;

                    this._viewportDragPos = { 'x': x, 'y': y };
                    this._display.viewportChangePos(deltaX, deltaY);
                }

                // Skip sending mouse events
                return;
            }

            if (this._viewOnly) {
                return;
            } // View only, skip mouse events

            if (this._rfb_connection_state !== 'connected') {
                return;
            }
            RFB.messages.pointerEvent(this._sock, this._display.absX(x), this._display.absY(y), this._mouse_buttonMask);
        }

        // Message Handlers

    }, {
        key: '_negotiate_protocol_version',
        value: function _negotiate_protocol_version() {
            if (this._sock.rQwait("version", 12)) {
                return false;
            }

            var sversion = this._sock.rQshiftStr(12).substr(4, 7);
            Log.Info("Server ProtocolVersion: " + sversion);
            var is_repeater = 0;
            switch (sversion) {
                case "000.000":
                    // UltraVNC repeater
                    is_repeater = 1;
                    break;
                case "003.003":
                case "003.006": // UltraVNC
                case "003.889":
                    // Apple Remote Desktop
                    this._rfb_version = 3.3;
                    break;
                case "003.007":
                    this._rfb_version = 3.7;
                    break;
                case "003.008":
                case "004.000": // Intel AMT KVM
                case "004.001": // RealVNC 4.6
                case "005.000":
                    // RealVNC 5.3
                    this._rfb_version = 3.8;
                    break;
                default:
                    return this._fail("Invalid server version " + sversion);
            }

            if (is_repeater) {
                var repeaterID = "ID:" + this._repeaterID;
                while (repeaterID.length < 250) {
                    repeaterID += "\0";
                }
                this._sock.send_string(repeaterID);
                return true;
            }

            if (this._rfb_version > this._rfb_max_version) {
                this._rfb_version = this._rfb_max_version;
            }

            var cversion = "00" + parseInt(this._rfb_version, 10) + ".00" + this._rfb_version * 10 % 10;
            this._sock.send_string("RFB " + cversion + "\n");
            Log.Debug('Sent ProtocolVersion: ' + cversion);

            this._rfb_init_state = 'Security';
        }
    }, {
        key: '_negotiate_security',
        value: function _negotiate_security() {
            // Polyfill since IE and PhantomJS doesn't have
            // TypedArray.includes()
            function includes(item, array) {
                for (var i = 0; i < array.length; i++) {
                    if (array[i] === item) {
                        return true;
                    }
                }
                return false;
            }

            if (this._rfb_version >= 3.7) {
                // Server sends supported list, client decides
                var num_types = this._sock.rQshift8();
                if (this._sock.rQwait("security type", num_types, 1)) {
                    return false;
                }

                if (num_types === 0) {
                    this._rfb_init_state = "SecurityReason";
                    this._security_context = "no security types";
                    this._security_status = 1;
                    return this._init_msg();
                }

                var types = this._sock.rQshiftBytes(num_types);
                Log.Debug("Server security types: " + types);

                // Look for each auth in preferred order
                if (includes(1, types)) {
                    this._rfb_auth_scheme = 1; // None
                } else if (includes(22, types)) {
                    this._rfb_auth_scheme = 22; // XVP
                } else if (includes(16, types)) {
                    this._rfb_auth_scheme = 16; // Tight
                } else if (includes(2, types)) {
                    this._rfb_auth_scheme = 2; // VNC Auth
                } else {
                    return this._fail("Unsupported security types (types: " + types + ")");
                }

                this._sock.send([this._rfb_auth_scheme]);
            } else {
                // Server decides
                if (this._sock.rQwait("security scheme", 4)) {
                    return false;
                }
                this._rfb_auth_scheme = this._sock.rQshift32();

                if (this._rfb_auth_scheme == 0) {
                    this._rfb_init_state = "SecurityReason";
                    this._security_context = "authentication scheme";
                    this._security_status = 1;
                    return this._init_msg();
                }
            }

            this._rfb_init_state = 'Authentication';
            Log.Debug('Authenticating using scheme: ' + this._rfb_auth_scheme);

            return this._init_msg(); // jump to authentication
        }
    }, {
        key: '_handle_security_reason',
        value: function _handle_security_reason() {
            if (this._sock.rQwait("reason length", 4)) {
                return false;
            }
            var strlen = this._sock.rQshift32();
            var reason = "";

            if (strlen > 0) {
                if (this._sock.rQwait("reason", strlen, 4)) {
                    return false;
                }
                reason = this._sock.rQshiftStr(strlen);
            }

            if (reason !== "") {
                this.dispatchEvent(new CustomEvent("securityfailure", { detail: { status: this._security_status,
                        reason: reason } }));

                return this._fail("Security negotiation failed on " + this._security_context + " (reason: " + reason + ")");
            } else {
                this.dispatchEvent(new CustomEvent("securityfailure", { detail: { status: this._security_status } }));

                return this._fail("Security negotiation failed on " + this._security_context);
            }
        }

        // authentication

    }, {
        key: '_negotiate_xvp_auth',
        value: function _negotiate_xvp_auth() {
            if (!this._rfb_credentials.username || !this._rfb_credentials.password || !this._rfb_credentials.target) {
                this.dispatchEvent(new CustomEvent("credentialsrequired", { detail: { types: ["username", "password", "target"] } }));
                return false;
            }

            var xvp_auth_str = String.fromCharCode(this._rfb_credentials.username.length) + String.fromCharCode(this._rfb_credentials.target.length) + this._rfb_credentials.username + this._rfb_credentials.target;
            this._sock.send_string(xvp_auth_str);
            this._rfb_auth_scheme = 2;
            return this._negotiate_authentication();
        }
    }, {
        key: '_negotiate_std_vnc_auth',
        value: function _negotiate_std_vnc_auth() {
            if (this._sock.rQwait("auth challenge", 16)) {
                return false;
            }

            if (!this._rfb_credentials.password) {
                this.dispatchEvent(new CustomEvent("credentialsrequired", { detail: { types: ["password"] } }));
                return false;
            }

            // TODO(directxman12): make genDES not require an Array
            var challenge = Array.prototype.slice.call(this._sock.rQshiftBytes(16));
            var response = RFB.genDES(this._rfb_credentials.password, challenge);
            this._sock.send(response);
            this._rfb_init_state = "SecurityResult";
            return true;
        }
    }, {
        key: '_negotiate_tight_tunnels',
        value: function _negotiate_tight_tunnels(numTunnels) {
            var clientSupportedTunnelTypes = {
                0: { vendor: 'TGHT', signature: 'NOTUNNEL' }
            };
            var serverSupportedTunnelTypes = {};
            // receive tunnel capabilities
            for (var i = 0; i < numTunnels; i++) {
                var cap_code = this._sock.rQshift32();
                var cap_vendor = this._sock.rQshiftStr(4);
                var cap_signature = this._sock.rQshiftStr(8);
                serverSupportedTunnelTypes[cap_code] = { vendor: cap_vendor, signature: cap_signature };
            }

            Log.Debug("Server Tight tunnel types: " + serverSupportedTunnelTypes);

            // Siemens touch panels have a VNC server that supports NOTUNNEL,
            // but forgets to advertise it. Try to detect such servers by
            // looking for their custom tunnel type.
            if (serverSupportedTunnelTypes[1] && serverSupportedTunnelTypes[1].vendor === "SICR" && serverSupportedTunnelTypes[1].signature === "SCHANNEL") {
                Log.Debug("Detected Siemens server. Assuming NOTUNNEL support.");
                serverSupportedTunnelTypes[0] = { vendor: 'TGHT', signature: 'NOTUNNEL' };
            }

            // choose the notunnel type
            if (serverSupportedTunnelTypes[0]) {
                if (serverSupportedTunnelTypes[0].vendor != clientSupportedTunnelTypes[0].vendor || serverSupportedTunnelTypes[0].signature != clientSupportedTunnelTypes[0].signature) {
                    return this._fail("Client's tunnel type had the incorrect " + "vendor or signature");
                }
                Log.Debug("Selected tunnel type: " + clientSupportedTunnelTypes[0]);
                this._sock.send([0, 0, 0, 0]); // use NOTUNNEL
                return false; // wait until we receive the sub auth count to continue
            } else {
                return this._fail("Server wanted tunnels, but doesn't support " + "the notunnel type");
            }
        }
    }, {
        key: '_negotiate_tight_auth',
        value: function _negotiate_tight_auth() {
            if (!this._rfb_tightvnc) {
                // first pass, do the tunnel negotiation
                if (this._sock.rQwait("num tunnels", 4)) {
                    return false;
                }
                var numTunnels = this._sock.rQshift32();
                if (numTunnels > 0 && this._sock.rQwait("tunnel capabilities", 16 * numTunnels, 4)) {
                    return false;
                }

                this._rfb_tightvnc = true;

                if (numTunnels > 0) {
                    this._negotiate_tight_tunnels(numTunnels);
                    return false; // wait until we receive the sub auth to continue
                }
            }

            // second pass, do the sub-auth negotiation
            if (this._sock.rQwait("sub auth count", 4)) {
                return false;
            }
            var subAuthCount = this._sock.rQshift32();
            if (subAuthCount === 0) {
                // empty sub-auth list received means 'no auth' subtype selected
                this._rfb_init_state = 'SecurityResult';
                return true;
            }

            if (this._sock.rQwait("sub auth capabilities", 16 * subAuthCount, 4)) {
                return false;
            }

            var clientSupportedTypes = {
                'STDVNOAUTH__': 1,
                'STDVVNCAUTH_': 2
            };

            var serverSupportedTypes = [];

            for (var i = 0; i < subAuthCount; i++) {
                this._sock.rQshift32(); // capNum
                var capabilities = this._sock.rQshiftStr(12);
                serverSupportedTypes.push(capabilities);
            }

            Log.Debug("Server Tight authentication types: " + serverSupportedTypes);

            for (var authType in clientSupportedTypes) {
                if (serverSupportedTypes.indexOf(authType) != -1) {
                    this._sock.send([0, 0, 0, clientSupportedTypes[authType]]);
                    Log.Debug("Selected authentication type: " + authType);

                    switch (authType) {
                        case 'STDVNOAUTH__':
                            // no auth
                            this._rfb_init_state = 'SecurityResult';
                            return true;
                        case 'STDVVNCAUTH_':
                            // VNC auth
                            this._rfb_auth_scheme = 2;
                            return this._init_msg();
                        default:
                            return this._fail("Unsupported tiny auth scheme " + "(scheme: " + authType + ")");
                    }
                }
            }

            return this._fail("No supported sub-auth types!");
        }
    }, {
        key: '_negotiate_authentication',
        value: function _negotiate_authentication() {
            switch (this._rfb_auth_scheme) {
                case 1:
                    // no auth
                    if (this._rfb_version >= 3.8) {
                        this._rfb_init_state = 'SecurityResult';
                        return true;
                    }
                    this._rfb_init_state = 'ClientInitialisation';
                    return this._init_msg();

                case 22:
                    // XVP auth
                    return this._negotiate_xvp_auth();

                case 2:
                    // VNC authentication
                    return this._negotiate_std_vnc_auth();

                case 16:
                    // TightVNC Security Type
                    return this._negotiate_tight_auth();

                default:
                    return this._fail("Unsupported auth scheme (scheme: " + this._rfb_auth_scheme + ")");
            }
        }
    }, {
        key: '_handle_security_result',
        value: function _handle_security_result() {
            if (this._sock.rQwait('VNC auth response ', 4)) {
                return false;
            }

            var status = this._sock.rQshift32();

            if (status === 0) {
                // OK
                this._rfb_init_state = 'ClientInitialisation';
                Log.Debug('Authentication OK');
                return this._init_msg();
            } else {
                if (this._rfb_version >= 3.8) {
                    this._rfb_init_state = "SecurityReason";
                    this._security_context = "security result";
                    this._security_status = status;
                    return this._init_msg();
                } else {
                    this.dispatchEvent(new CustomEvent("securityfailure", { detail: { status: status } }));

                    return this._fail("Security handshake failed");
                }
            }
        }
    }, {
        key: '_negotiate_server_init',
        value: function _negotiate_server_init() {
            if (this._sock.rQwait("server initialization", 24)) {
                return false;
            }

            /* Screen size */
            var width = this._sock.rQshift16();
            var height = this._sock.rQshift16();

            /* PIXEL_FORMAT */
            var bpp = this._sock.rQshift8();
            var depth = this._sock.rQshift8();
            var big_endian = this._sock.rQshift8();
            var true_color = this._sock.rQshift8();

            var red_max = this._sock.rQshift16();
            var green_max = this._sock.rQshift16();
            var blue_max = this._sock.rQshift16();
            var red_shift = this._sock.rQshift8();
            var green_shift = this._sock.rQshift8();
            var blue_shift = this._sock.rQshift8();
            this._sock.rQskipBytes(3); // padding

            // NB(directxman12): we don't want to call any callbacks or print messages until
            //                   *after* we're past the point where we could backtrack

            /* Connection name/title */
            var name_length = this._sock.rQshift32();
            if (this._sock.rQwait('server init name', name_length, 24)) {
                return false;
            }
            this._fb_name = (0, _strings.decodeUTF8)(this._sock.rQshiftStr(name_length));

            if (this._rfb_tightvnc) {
                if (this._sock.rQwait('TightVNC extended server init header', 8, 24 + name_length)) {
                    return false;
                }
                // In TightVNC mode, ServerInit message is extended
                var numServerMessages = this._sock.rQshift16();
                var numClientMessages = this._sock.rQshift16();
                var numEncodings = this._sock.rQshift16();
                this._sock.rQskipBytes(2); // padding

                var totalMessagesLength = (numServerMessages + numClientMessages + numEncodings) * 16;
                if (this._sock.rQwait('TightVNC extended server init header', totalMessagesLength, 32 + name_length)) {
                    return false;
                }

                // we don't actually do anything with the capability information that TIGHT sends,
                // so we just skip the all of this.

                // TIGHT server message capabilities
                this._sock.rQskipBytes(16 * numServerMessages);

                // TIGHT client message capabilities
                this._sock.rQskipBytes(16 * numClientMessages);

                // TIGHT encoding capabilities
                this._sock.rQskipBytes(16 * numEncodings);
            }

            // NB(directxman12): these are down here so that we don't run them multiple times
            //                   if we backtrack
            Log.Info("Screen: " + width + "x" + height + ", bpp: " + bpp + ", depth: " + depth + ", big_endian: " + big_endian + ", true_color: " + true_color + ", red_max: " + red_max + ", green_max: " + green_max + ", blue_max: " + blue_max + ", red_shift: " + red_shift + ", green_shift: " + green_shift + ", blue_shift: " + blue_shift);

            if (big_endian !== 0) {
                Log.Warn("Server native endian is not little endian");
            }

            if (red_shift !== 16) {
                Log.Warn("Server native red-shift is not 16");
            }

            if (blue_shift !== 0) {
                Log.Warn("Server native blue-shift is not 0");
            }

            // we're past the point where we could backtrack, so it's safe to call this
            this.dispatchEvent(new CustomEvent("desktopname", { detail: { name: this._fb_name } }));

            this._resize(width, height);

            if (!this._viewOnly) {
                this._keyboard.grab();
            }
            if (!this._viewOnly) {
                this._mouse.grab();
            }

            this._fb_depth = 24;

            if (this._fb_name === "Intel(r) AMT KVM") {
                Log.Warn("Intel AMT KVM only supports 8/16 bit depths. Using low color mode.");
                this._fb_depth = 8;
            }

            RFB.messages.pixelFormat(this._sock, this._fb_depth, true);
            this._sendEncodings();
            RFB.messages.fbUpdateRequest(this._sock, false, 0, 0, this._fb_width, this._fb_height);

            this._updateConnectionState('connected');
            return true;
        }
    }, {
        key: '_sendEncodings',
        value: function _sendEncodings() {
            var encs = [];

            // In preference order
            encs.push(_encodings.encodings.encodingCopyRect);
            // Only supported with full depth support
            if (this._fb_depth == 24) {
                encs.push(_encodings.encodings.encodingTight);
                encs.push(_encodings.encodings.encodingTightPNG);
                encs.push(_encodings.encodings.encodingHextile);
                encs.push(_encodings.encodings.encodingRRE);
            }
            encs.push(_encodings.encodings.encodingRaw);

            // Psuedo-encoding settings
            encs.push(_encodings.encodings.pseudoEncodingQualityLevel0 + 6);
            encs.push(_encodings.encodings.pseudoEncodingCompressLevel0 + 2);

            encs.push(_encodings.encodings.pseudoEncodingDesktopSize);
            encs.push(_encodings.encodings.pseudoEncodingLastRect);
            encs.push(_encodings.encodings.pseudoEncodingQEMUExtendedKeyEvent);
            encs.push(_encodings.encodings.pseudoEncodingExtendedDesktopSize);
            encs.push(_encodings.encodings.pseudoEncodingXvp);
            encs.push(_encodings.encodings.pseudoEncodingFence);
            encs.push(_encodings.encodings.pseudoEncodingContinuousUpdates);

            if (this._fb_depth == 24) {
                encs.push(_encodings.encodings.pseudoEncodingCursor);
            }

            RFB.messages.clientEncodings(this._sock, encs);
        }

        /* RFB protocol initialization states:
         *   ProtocolVersion
         *   Security
         *   Authentication
         *   SecurityResult
         *   ClientInitialization - not triggered by server message
         *   ServerInitialization
         */

    }, {
        key: '_init_msg',
        value: function _init_msg() {
            switch (this._rfb_init_state) {
                case 'ProtocolVersion':
                    return this._negotiate_protocol_version();

                case 'Security':
                    return this._negotiate_security();

                case 'Authentication':
                    return this._negotiate_authentication();

                case 'SecurityResult':
                    return this._handle_security_result();

                case 'SecurityReason':
                    return this._handle_security_reason();

                case 'ClientInitialisation':
                    this._sock.send([this._shared ? 1 : 0]); // ClientInitialisation
                    this._rfb_init_state = 'ServerInitialisation';
                    return true;

                case 'ServerInitialisation':
                    return this._negotiate_server_init();

                default:
                    return this._fail("Unknown init state (state: " + this._rfb_init_state + ")");
            }
        }
    }, {
        key: '_handle_set_colour_map_msg',
        value: function _handle_set_colour_map_msg() {
            Log.Debug("SetColorMapEntries");

            return this._fail("Unexpected SetColorMapEntries message");
        }
    }, {
        key: '_handle_server_cut_text',
        value: function _handle_server_cut_text() {
            Log.Debug("ServerCutText");

            if (this._sock.rQwait("ServerCutText header", 7, 1)) {
                return false;
            }
            this._sock.rQskipBytes(3); // Padding
            var length = this._sock.rQshift32();
            if (this._sock.rQwait("ServerCutText", length, 8)) {
                return false;
            }

            var text = this._sock.rQshiftStr(length);

            if (this._viewOnly) {
                return true;
            }

            this.dispatchEvent(new CustomEvent("clipboard", { detail: { text: text } }));

            return true;
        }
    }, {
        key: '_handle_server_fence_msg',
        value: function _handle_server_fence_msg() {
            if (this._sock.rQwait("ServerFence header", 8, 1)) {
                return false;
            }
            this._sock.rQskipBytes(3); // Padding
            var flags = this._sock.rQshift32();
            var length = this._sock.rQshift8();

            if (this._sock.rQwait("ServerFence payload", length, 9)) {
                return false;
            }

            if (length > 64) {
                Log.Warn("Bad payload length (" + length + ") in fence response");
                length = 64;
            }

            var payload = this._sock.rQshiftStr(length);

            this._supportsFence = true;

            /*
             * Fence flags
             *
             *  (1<<0)  - BlockBefore
             *  (1<<1)  - BlockAfter
             *  (1<<2)  - SyncNext
             *  (1<<31) - Request
             */

            if (!(flags & 1 << 31)) {
                return this._fail("Unexpected fence response");
            }

            // Filter out unsupported flags
            // FIXME: support syncNext
            flags &= 1 << 0 | 1 << 1;

            // BlockBefore and BlockAfter are automatically handled by
            // the fact that we process each incoming message
            // synchronuosly.
            RFB.messages.clientFence(this._sock, flags, payload);

            return true;
        }
    }, {
        key: '_handle_xvp_msg',
        value: function _handle_xvp_msg() {
            if (this._sock.rQwait("XVP version and message", 3, 1)) {
                return false;
            }
            this._sock.rQskipBytes(1); // Padding
            var xvp_ver = this._sock.rQshift8();
            var xvp_msg = this._sock.rQshift8();

            switch (xvp_msg) {
                case 0:
                    // XVP_FAIL
                    Log.Error("XVP Operation Failed");
                    break;
                case 1:
                    // XVP_INIT
                    this._rfb_xvp_ver = xvp_ver;
                    Log.Info("XVP extensions enabled (version " + this._rfb_xvp_ver + ")");
                    this._setCapability("power", true);
                    break;
                default:
                    this._fail("Illegal server XVP message (msg: " + xvp_msg + ")");
                    break;
            }

            return true;
        }
    }, {
        key: '_normal_msg',
        value: function _normal_msg() {
            var msg_type = void 0;
            if (this._FBU.rects > 0) {
                msg_type = 0;
            } else {
                msg_type = this._sock.rQshift8();
            }

            var first = void 0,
                ret = void 0;
            switch (msg_type) {
                case 0:
                    // FramebufferUpdate
                    ret = this._framebufferUpdate();
                    if (ret && !this._enabledContinuousUpdates) {
                        RFB.messages.fbUpdateRequest(this._sock, true, 0, 0, this._fb_width, this._fb_height);
                    }
                    return ret;

                case 1:
                    // SetColorMapEntries
                    return this._handle_set_colour_map_msg();

                case 2:
                    // Bell
                    Log.Debug("Bell");
                    this.dispatchEvent(new CustomEvent("bell", { detail: {} }));
                    return true;

                case 3:
                    // ServerCutText
                    return this._handle_server_cut_text();

                case 150:
                    // EndOfContinuousUpdates
                    first = !this._supportsContinuousUpdates;
                    this._supportsContinuousUpdates = true;
                    this._enabledContinuousUpdates = false;
                    if (first) {
                        this._enabledContinuousUpdates = true;
                        this._updateContinuousUpdates();
                        Log.Info("Enabling continuous updates.");
                    } else {
                        // FIXME: We need to send a framebufferupdaterequest here
                        // if we add support for turning off continuous updates
                    }
                    return true;

                case 248:
                    // ServerFence
                    return this._handle_server_fence_msg();

                case 250:
                    // XVP
                    return this._handle_xvp_msg();

                default:
                    this._fail("Unexpected server message (type " + msg_type + ")");
                    Log.Debug("sock.rQslice(0, 30): " + this._sock.rQslice(0, 30));
                    return true;
            }
        }
    }, {
        key: '_onFlush',
        value: function _onFlush() {
            this._flushing = false;
            // Resume processing
            if (this._sock.rQlen > 0) {
                this._handle_message();
            }
        }
    }, {
        key: '_framebufferUpdate',
        value: function _framebufferUpdate() {
            if (this._FBU.rects === 0) {
                if (this._sock.rQwait("FBU header", 3, 1)) {
                    return false;
                }
                this._sock.rQskipBytes(1); // Padding
                this._FBU.rects = this._sock.rQshift16();

                // Make sure the previous frame is fully rendered first
                // to avoid building up an excessive queue
                if (this._display.pending()) {
                    this._flushing = true;
                    this._display.flush();
                    return false;
                }
            }

            while (this._FBU.rects > 0) {
                if (this._FBU.encoding === null) {
                    if (this._sock.rQwait("rect header", 12)) {
                        return false;
                    }
                    /* New FramebufferUpdate */

                    var hdr = this._sock.rQshiftBytes(12);
                    this._FBU.x = (hdr[0] << 8) + hdr[1];
                    this._FBU.y = (hdr[2] << 8) + hdr[3];
                    this._FBU.width = (hdr[4] << 8) + hdr[5];
                    this._FBU.height = (hdr[6] << 8) + hdr[7];
                    this._FBU.encoding = parseInt((hdr[8] << 24) + (hdr[9] << 16) + (hdr[10] << 8) + hdr[11], 10);
                }

                if (!this._handleRect()) {
                    return false;
                }

                this._FBU.rects--;
                this._FBU.encoding = null;
            }

            this._display.flip();

            return true; // We finished this FBU
        }
    }, {
        key: '_handleRect',
        value: function _handleRect() {
            switch (this._FBU.encoding) {
                case _encodings.encodings.pseudoEncodingLastRect:
                    this._FBU.rects = 1; // Will be decreased when we return
                    return true;

                case _encodings.encodings.pseudoEncodingCursor:
                    return this._handleCursor();

                case _encodings.encodings.pseudoEncodingQEMUExtendedKeyEvent:
                    // Old Safari doesn't support creating keyboard events
                    try {
                        var keyboardEvent = document.createEvent("keyboardEvent");
                        if (keyboardEvent.code !== undefined) {
                            this._qemuExtKeyEventSupported = true;
                        }
                    } catch (err) {
                        // Do nothing
                    }
                    return true;

                case _encodings.encodings.pseudoEncodingDesktopSize:
                    this._resize(this._FBU.width, this._FBU.height);
                    return true;

                case _encodings.encodings.pseudoEncodingExtendedDesktopSize:
                    return this._handleExtendedDesktopSize();

                default:
                    return this._handleDataRect();
            }
        }
    }, {
        key: '_handleCursor',
        value: function _handleCursor() {
            var hotx = this._FBU.x; // hotspot-x
            var hoty = this._FBU.y; // hotspot-y
            var w = this._FBU.width;
            var h = this._FBU.height;

            var pixelslength = w * h * 4;
            var masklength = Math.ceil(w / 8) * h;

            var bytes = pixelslength + masklength;
            if (this._sock.rQwait("cursor encoding", bytes)) {
                return false;
            }

            // Decode from BGRX pixels + bit mask to RGBA
            var pixels = this._sock.rQshiftBytes(pixelslength);
            var mask = this._sock.rQshiftBytes(masklength);
            var rgba = new Uint8Array(w * h * 4);

            var pix_idx = 0;
            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    var mask_idx = y * Math.ceil(w / 8) + Math.floor(x / 8);
                    var alpha = mask[mask_idx] << x % 8 & 0x80 ? 255 : 0;
                    rgba[pix_idx] = pixels[pix_idx + 2];
                    rgba[pix_idx + 1] = pixels[pix_idx + 1];
                    rgba[pix_idx + 2] = pixels[pix_idx];
                    rgba[pix_idx + 3] = alpha;
                    pix_idx += 4;
                }
            }

            this._updateCursor(rgba, hotx, hoty, w, h);

            return true;
        }
    }, {
        key: '_handleExtendedDesktopSize',
        value: function _handleExtendedDesktopSize() {
            if (this._sock.rQwait("ExtendedDesktopSize", 4)) {
                return false;
            }

            var number_of_screens = this._sock.rQpeek8();

            var bytes = 4 + number_of_screens * 16;
            if (this._sock.rQwait("ExtendedDesktopSize", bytes)) {
                return false;
            }

            var firstUpdate = !this._supportsSetDesktopSize;
            this._supportsSetDesktopSize = true;

            // Normally we only apply the current resize mode after a
            // window resize event. However there is no such trigger on the
            // initial connect. And we don't know if the server supports
            // resizing until we've gotten here.
            if (firstUpdate) {
                this._requestRemoteResize();
            }

            this._sock.rQskipBytes(1); // number-of-screens
            this._sock.rQskipBytes(3); // padding

            for (var i = 0; i < number_of_screens; i += 1) {
                // Save the id and flags of the first screen
                if (i === 0) {
                    this._screen_id = this._sock.rQshiftBytes(4); // id
                    this._sock.rQskipBytes(2); // x-position
                    this._sock.rQskipBytes(2); // y-position
                    this._sock.rQskipBytes(2); // width
                    this._sock.rQskipBytes(2); // height
                    this._screen_flags = this._sock.rQshiftBytes(4); // flags
                } else {
                    this._sock.rQskipBytes(16);
                }
            }

            /*
             * The x-position indicates the reason for the change:
             *
             *  0 - server resized on its own
             *  1 - this client requested the resize
             *  2 - another client requested the resize
             */

            // We need to handle errors when we requested the resize.
            if (this._FBU.x === 1 && this._FBU.y !== 0) {
                var msg = "";
                // The y-position indicates the status code from the server
                switch (this._FBU.y) {
                    case 1:
                        msg = "Resize is administratively prohibited";
                        break;
                    case 2:
                        msg = "Out of resources";
                        break;
                    case 3:
                        msg = "Invalid screen layout";
                        break;
                    default:
                        msg = "Unknown reason";
                        break;
                }
                Log.Warn("Server did not accept the resize request: " + msg);
            } else {
                this._resize(this._FBU.width, this._FBU.height);
            }

            return true;
        }
    }, {
        key: '_handleDataRect',
        value: function _handleDataRect() {
            var decoder = this._decoders[this._FBU.encoding];
            if (!decoder) {
                this._fail("Unsupported encoding (encoding: " + this._FBU.encoding + ")");
                return false;
            }

            try {
                return decoder.decodeRect(this._FBU.x, this._FBU.y, this._FBU.width, this._FBU.height, this._sock, this._display, this._fb_depth);
            } catch (err) {
                this._fail("Error decoding rect: " + err);
                return false;
            }
        }
    }, {
        key: '_updateContinuousUpdates',
        value: function _updateContinuousUpdates() {
            if (!this._enabledContinuousUpdates) {
                return;
            }

            RFB.messages.enableContinuousUpdates(this._sock, true, 0, 0, this._fb_width, this._fb_height);
        }
    }, {
        key: '_resize',
        value: function _resize(width, height) {
            this._fb_width = width;
            this._fb_height = height;

            this._display.resize(this._fb_width, this._fb_height);

            // Adjust the visible viewport based on the new dimensions
            this._updateClip();
            this._updateScale();

            this._updateContinuousUpdates();
        }
    }, {
        key: '_xvpOp',
        value: function _xvpOp(ver, op) {
            if (this._rfb_xvp_ver < ver) {
                return;
            }
            Log.Info("Sending XVP operation " + op + " (version " + ver + ")");
            RFB.messages.xvpOp(this._sock, ver, op);
        }
    }, {
        key: '_updateCursor',
        value: function _updateCursor(rgba, hotx, hoty, w, h) {
            this._cursorImage = {
                rgbaPixels: rgba,
                hotx: hotx, hoty: hoty, w: w, h: h
            };
            this._refreshCursor();
        }
    }, {
        key: '_shouldShowDotCursor',
        value: function _shouldShowDotCursor() {
            // Called when this._cursorImage is updated
            if (!this._showDotCursor) {
                // User does not want to see the dot, so...
                return false;
            }

            // The dot should not be shown if the cursor is already visible,
            // i.e. contains at least one not-fully-transparent pixel.
            // So iterate through all alpha bytes in rgba and stop at the
            // first non-zero.
            for (var i = 3; i < this._cursorImage.rgbaPixels.length; i += 4) {
                if (this._cursorImage.rgbaPixels[i]) {
                    return false;
                }
            }

            // At this point, we know that the cursor is fully transparent, and
            // the user wants to see the dot instead of this.
            return true;
        }
    }, {
        key: '_refreshCursor',
        value: function _refreshCursor() {
            var image = this._shouldShowDotCursor() ? RFB.cursors.dot : this._cursorImage;
            this._cursor.change(image.rgbaPixels, image.hotx, image.hoty, image.w, image.h);
        }
    }, {
        key: 'viewOnly',
        get: function get() {
            return this._viewOnly;
        },
        set: function set(viewOnly) {
            this._viewOnly = viewOnly;

            if (this._rfb_connection_state === "connecting" || this._rfb_connection_state === "connected") {
                if (viewOnly) {
                    this._keyboard.ungrab();
                    this._mouse.ungrab();
                } else {
                    this._keyboard.grab();
                    this._mouse.grab();
                }
            }
        }
    }, {
        key: 'capabilities',
        get: function get() {
            return this._capabilities;
        }
    }, {
        key: 'touchButton',
        get: function get() {
            return this._mouse.touchButton;
        },
        set: function set(button) {
            this._mouse.touchButton = button;
        }
    }, {
        key: 'clipViewport',
        get: function get() {
            return this._clipViewport;
        },
        set: function set(viewport) {
            this._clipViewport = viewport;
            this._updateClip();
        }
    }, {
        key: 'scaleViewport',
        get: function get() {
            return this._scaleViewport;
        },
        set: function set(scale) {
            this._scaleViewport = scale;
            // Scaling trumps clipping, so we may need to adjust
            // clipping when enabling or disabling scaling
            if (scale && this._clipViewport) {
                this._updateClip();
            }
            this._updateScale();
            if (!scale && this._clipViewport) {
                this._updateClip();
            }
        }
    }, {
        key: 'resizeSession',
        get: function get() {
            return this._resizeSession;
        },
        set: function set(resize) {
            this._resizeSession = resize;
            if (resize) {
                this._requestRemoteResize();
            }
        }
    }, {
        key: 'showDotCursor',
        get: function get() {
            return this._showDotCursor;
        },
        set: function set(show) {
            this._showDotCursor = show;
            this._refreshCursor();
        }
    }, {
        key: 'background',
        get: function get() {
            return this._screen.style.background;
        },
        set: function set(cssValue) {
            this._screen.style.background = cssValue;
        }
    }], [{
        key: 'genDES',
        value: function genDES(password, challenge) {
            var passwordChars = password.split('').map(function (c) {
                return c.charCodeAt(0);
            });
            return new _des2.default(passwordChars).encrypt(challenge);
        }
    }]);

    return RFB;
}(_eventtarget2.default);

// Class Methods


exports.default = RFB;
RFB.messages = {
    keyEvent: function keyEvent(sock, keysym, down) {
        var buff = sock._sQ;
        var offset = sock._sQlen;

        buff[offset] = 4; // msg-type
        buff[offset + 1] = down;

        buff[offset + 2] = 0;
        buff[offset + 3] = 0;

        buff[offset + 4] = keysym >> 24;
        buff[offset + 5] = keysym >> 16;
        buff[offset + 6] = keysym >> 8;
        buff[offset + 7] = keysym;

        sock._sQlen += 8;
        sock.flush();
    },
    QEMUExtendedKeyEvent: function QEMUExtendedKeyEvent(sock, keysym, down, keycode) {
        function getRFBkeycode(xt_scancode) {
            var upperByte = keycode >> 8;
            var lowerByte = keycode & 0x00ff;
            if (upperByte === 0xe0 && lowerByte < 0x7f) {
                return lowerByte | 0x80;
            }
            return xt_scancode;
        }

        var buff = sock._sQ;
        var offset = sock._sQlen;

        buff[offset] = 255; // msg-type
        buff[offset + 1] = 0; // sub msg-type

        buff[offset + 2] = down >> 8;
        buff[offset + 3] = down;

        buff[offset + 4] = keysym >> 24;
        buff[offset + 5] = keysym >> 16;
        buff[offset + 6] = keysym >> 8;
        buff[offset + 7] = keysym;

        var RFBkeycode = getRFBkeycode(keycode);

        buff[offset + 8] = RFBkeycode >> 24;
        buff[offset + 9] = RFBkeycode >> 16;
        buff[offset + 10] = RFBkeycode >> 8;
        buff[offset + 11] = RFBkeycode;

        sock._sQlen += 12;
        sock.flush();
    },
    pointerEvent: function pointerEvent(sock, x, y, mask) {
        var buff = sock._sQ;
        var offset = sock._sQlen;

        buff[offset] = 5; // msg-type

        buff[offset + 1] = mask;

        buff[offset + 2] = x >> 8;
        buff[offset + 3] = x;

        buff[offset + 4] = y >> 8;
        buff[offset + 5] = y;

        sock._sQlen += 6;
        sock.flush();
    },


    // TODO(directxman12): make this unicode compatible?
    clientCutText: function clientCutText(sock, text) {
        var buff = sock._sQ;
        var offset = sock._sQlen;

        buff[offset] = 6; // msg-type

        buff[offset + 1] = 0; // padding
        buff[offset + 2] = 0; // padding
        buff[offset + 3] = 0; // padding

        var length = text.length;

        buff[offset + 4] = length >> 24;
        buff[offset + 5] = length >> 16;
        buff[offset + 6] = length >> 8;
        buff[offset + 7] = length;

        sock._sQlen += 8;

        // We have to keep track of from where in the text we begin creating the
        // buffer for the flush in the next iteration.
        var textOffset = 0;

        var remaining = length;
        while (remaining > 0) {

            var flushSize = Math.min(remaining, sock._sQbufferSize - sock._sQlen);
            for (var i = 0; i < flushSize; i++) {
                buff[sock._sQlen + i] = text.charCodeAt(textOffset + i);
            }

            sock._sQlen += flushSize;
            sock.flush();

            remaining -= flushSize;
            textOffset += flushSize;
        }
    },
    setDesktopSize: function setDesktopSize(sock, width, height, id, flags) {
        var buff = sock._sQ;
        var offset = sock._sQlen;

        buff[offset] = 251; // msg-type
        buff[offset + 1] = 0; // padding
        buff[offset + 2] = width >> 8; // width
        buff[offset + 3] = width;
        buff[offset + 4] = height >> 8; // height
        buff[offset + 5] = height;

        buff[offset + 6] = 1; // number-of-screens
        buff[offset + 7] = 0; // padding

        // screen array
        buff[offset + 8] = id >> 24; // id
        buff[offset + 9] = id >> 16;
        buff[offset + 10] = id >> 8;
        buff[offset + 11] = id;
        buff[offset + 12] = 0; // x-position
        buff[offset + 13] = 0;
        buff[offset + 14] = 0; // y-position
        buff[offset + 15] = 0;
        buff[offset + 16] = width >> 8; // width
        buff[offset + 17] = width;
        buff[offset + 18] = height >> 8; // height
        buff[offset + 19] = height;
        buff[offset + 20] = flags >> 24; // flags
        buff[offset + 21] = flags >> 16;
        buff[offset + 22] = flags >> 8;
        buff[offset + 23] = flags;

        sock._sQlen += 24;
        sock.flush();
    },
    clientFence: function clientFence(sock, flags, payload) {
        var buff = sock._sQ;
        var offset = sock._sQlen;

        buff[offset] = 248; // msg-type

        buff[offset + 1] = 0; // padding
        buff[offset + 2] = 0; // padding
        buff[offset + 3] = 0; // padding

        buff[offset + 4] = flags >> 24; // flags
        buff[offset + 5] = flags >> 16;
        buff[offset + 6] = flags >> 8;
        buff[offset + 7] = flags;

        var n = payload.length;

        buff[offset + 8] = n; // length

        for (var i = 0; i < n; i++) {
            buff[offset + 9 + i] = payload.charCodeAt(i);
        }

        sock._sQlen += 9 + n;
        sock.flush();
    },
    enableContinuousUpdates: function enableContinuousUpdates(sock, enable, x, y, width, height) {
        var buff = sock._sQ;
        var offset = sock._sQlen;

        buff[offset] = 150; // msg-type
        buff[offset + 1] = enable; // enable-flag

        buff[offset + 2] = x >> 8; // x
        buff[offset + 3] = x;
        buff[offset + 4] = y >> 8; // y
        buff[offset + 5] = y;
        buff[offset + 6] = width >> 8; // width
        buff[offset + 7] = width;
        buff[offset + 8] = height >> 8; // height
        buff[offset + 9] = height;

        sock._sQlen += 10;
        sock.flush();
    },
    pixelFormat: function pixelFormat(sock, depth, true_color) {
        var buff = sock._sQ;
        var offset = sock._sQlen;

        var bpp = void 0;

        if (depth > 16) {
            bpp = 32;
        } else if (depth > 8) {
            bpp = 16;
        } else {
            bpp = 8;
        }

        var bits = Math.floor(depth / 3);

        buff[offset] = 0; // msg-type

        buff[offset + 1] = 0; // padding
        buff[offset + 2] = 0; // padding
        buff[offset + 3] = 0; // padding

        buff[offset + 4] = bpp; // bits-per-pixel
        buff[offset + 5] = depth; // depth
        buff[offset + 6] = 0; // little-endian
        buff[offset + 7] = true_color ? 1 : 0; // true-color

        buff[offset + 8] = 0; // red-max
        buff[offset + 9] = (1 << bits) - 1; // red-max

        buff[offset + 10] = 0; // green-max
        buff[offset + 11] = (1 << bits) - 1; // green-max

        buff[offset + 12] = 0; // blue-max
        buff[offset + 13] = (1 << bits) - 1; // blue-max

        buff[offset + 14] = bits * 2; // red-shift
        buff[offset + 15] = bits * 1; // green-shift
        buff[offset + 16] = bits * 0; // blue-shift

        buff[offset + 17] = 0; // padding
        buff[offset + 18] = 0; // padding
        buff[offset + 19] = 0; // padding

        sock._sQlen += 20;
        sock.flush();
    },
    clientEncodings: function clientEncodings(sock, encodings) {
        var buff = sock._sQ;
        var offset = sock._sQlen;

        buff[offset] = 2; // msg-type
        buff[offset + 1] = 0; // padding

        buff[offset + 2] = encodings.length >> 8;
        buff[offset + 3] = encodings.length;

        var j = offset + 4;
        for (var i = 0; i < encodings.length; i++) {
            var enc = encodings[i];
            buff[j] = enc >> 24;
            buff[j + 1] = enc >> 16;
            buff[j + 2] = enc >> 8;
            buff[j + 3] = enc;

            j += 4;
        }

        sock._sQlen += j - offset;
        sock.flush();
    },
    fbUpdateRequest: function fbUpdateRequest(sock, incremental, x, y, w, h) {
        var buff = sock._sQ;
        var offset = sock._sQlen;

        if (typeof x === "undefined") {
            x = 0;
        }
        if (typeof y === "undefined") {
            y = 0;
        }

        buff[offset] = 3; // msg-type
        buff[offset + 1] = incremental ? 1 : 0;

        buff[offset + 2] = x >> 8 & 0xFF;
        buff[offset + 3] = x & 0xFF;

        buff[offset + 4] = y >> 8 & 0xFF;
        buff[offset + 5] = y & 0xFF;

        buff[offset + 6] = w >> 8 & 0xFF;
        buff[offset + 7] = w & 0xFF;

        buff[offset + 8] = h >> 8 & 0xFF;
        buff[offset + 9] = h & 0xFF;

        sock._sQlen += 10;
        sock.flush();
    },
    xvpOp: function xvpOp(sock, ver, op) {
        var buff = sock._sQ;
        var offset = sock._sQlen;

        buff[offset] = 250; // msg-type
        buff[offset + 1] = 0; // padding

        buff[offset + 2] = ver;
        buff[offset + 3] = op;

        sock._sQlen += 4;
        sock.flush();
    }
};

RFB.cursors = {
    none: {
        rgbaPixels: new Uint8Array(),
        w: 0, h: 0,
        hotx: 0, hoty: 0
    },

    dot: {
        /* eslint-disable indent */
        rgbaPixels: new Uint8Array([255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255]),
        /* eslint-enable indent */
        w: 3, h: 3,
        hotx: 1, hoty: 1
    }
};