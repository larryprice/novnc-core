"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var Log = _interopRequireWildcard(require("../util/logging.js"));

var _browser = require("../util/browser.js");

var _events = require("../util/events.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var WHEEL_STEP = 10; // Delta threshold for a mouse wheel step

var WHEEL_STEP_TIMEOUT = 50; // ms

var WHEEL_LINE_HEIGHT = 19;

var Mouse = /*#__PURE__*/function () {
  function Mouse(target) {
    _classCallCheck(this, Mouse);

    this._target = target || document;
    this._doubleClickTimer = null;
    this._lastTouchPos = null;
    this._pos = null;
    this._wheelStepXTimer = null;
    this._wheelStepYTimer = null;
    this._accumulatedWheelDeltaX = 0;
    this._accumulatedWheelDeltaY = 0;
    this._eventHandlers = {
      'mousedown': this._handleMouseDown.bind(this),
      'mouseup': this._handleMouseUp.bind(this),
      'mousemove': this._handleMouseMove.bind(this),
      'mousewheel': this._handleMouseWheel.bind(this),
      'mousedisable': this._handleMouseDisable.bind(this)
    }; // ===== PROPERTIES =====

    this.touchButton = 1; // Button mask (1, 2, 4) for touch devices
    // (0 means ignore clicks)
    // ===== EVENT HANDLERS =====

    this.onmousebutton = function () {}; // Handler for mouse button press/release


    this.onmousemove = function () {}; // Handler for mouse movement

  } // ===== PRIVATE METHODS =====


  _createClass(Mouse, [{
    key: "_resetDoubleClickTimer",
    value: function _resetDoubleClickTimer() {
      this._doubleClickTimer = null;
    }
  }, {
    key: "_handleMouseButton",
    value: function _handleMouseButton(e, down) {
      this._updateMousePosition(e);

      var pos = this._pos;
      var bmask;

      if (e.touches || e.changedTouches) {
        // Touch device
        // When two touches occur within 500 ms of each other and are
        // close enough together a double click is triggered.
        if (down == 1) {
          if (this._doubleClickTimer === null) {
            this._lastTouchPos = pos;
          } else {
            clearTimeout(this._doubleClickTimer); // When the distance between the two touches is small enough
            // force the position of the latter touch to the position of
            // the first.

            var xs = this._lastTouchPos.x - pos.x;
            var ys = this._lastTouchPos.y - pos.y;
            var d = Math.sqrt(xs * xs + ys * ys); // The goal is to trigger on a certain physical width,
            // the devicePixelRatio brings us a bit closer but is
            // not optimal.

            var threshold = 20 * (window.devicePixelRatio || 1);

            if (d < threshold) {
              pos = this._lastTouchPos;
            }
          }

          this._doubleClickTimer = setTimeout(this._resetDoubleClickTimer.bind(this), 500);
        }

        bmask = this.touchButton; // If bmask is set
      } else if (e.which) {
        /* everything except IE */
        bmask = 1 << e.button;
      } else {
        /* IE including 9 */
        bmask = (e.button & 0x1) + // Left
        (e.button & 0x2) * 2 + // Right
        (e.button & 0x4) / 2; // Middle
      }

      Log.Debug("onmousebutton " + (down ? "down" : "up") + ", x: " + pos.x + ", y: " + pos.y + ", bmask: " + bmask);
      this.onmousebutton(pos.x, pos.y, down, bmask);
      (0, _events.stopEvent)(e);
    }
  }, {
    key: "_handleMouseDown",
    value: function _handleMouseDown(e) {
      // Touch events have implicit capture
      if (e.type === "mousedown") {
        (0, _events.setCapture)(this._target);
      }

      this._handleMouseButton(e, 1);
    }
  }, {
    key: "_handleMouseUp",
    value: function _handleMouseUp(e) {
      this._handleMouseButton(e, 0);
    } // Mouse wheel events are sent in steps over VNC. This means that the VNC
    // protocol can't handle a wheel event with specific distance or speed.
    // Therefor, if we get a lot of small mouse wheel events we combine them.

  }, {
    key: "_generateWheelStepX",
    value: function _generateWheelStepX() {
      if (this._accumulatedWheelDeltaX < 0) {
        this.onmousebutton(this._pos.x, this._pos.y, 1, 1 << 5);
        this.onmousebutton(this._pos.x, this._pos.y, 0, 1 << 5);
      } else if (this._accumulatedWheelDeltaX > 0) {
        this.onmousebutton(this._pos.x, this._pos.y, 1, 1 << 6);
        this.onmousebutton(this._pos.x, this._pos.y, 0, 1 << 6);
      }

      this._accumulatedWheelDeltaX = 0;
    }
  }, {
    key: "_generateWheelStepY",
    value: function _generateWheelStepY() {
      if (this._accumulatedWheelDeltaY < 0) {
        this.onmousebutton(this._pos.x, this._pos.y, 1, 1 << 3);
        this.onmousebutton(this._pos.x, this._pos.y, 0, 1 << 3);
      } else if (this._accumulatedWheelDeltaY > 0) {
        this.onmousebutton(this._pos.x, this._pos.y, 1, 1 << 4);
        this.onmousebutton(this._pos.x, this._pos.y, 0, 1 << 4);
      }

      this._accumulatedWheelDeltaY = 0;
    }
  }, {
    key: "_resetWheelStepTimers",
    value: function _resetWheelStepTimers() {
      window.clearTimeout(this._wheelStepXTimer);
      window.clearTimeout(this._wheelStepYTimer);
      this._wheelStepXTimer = null;
      this._wheelStepYTimer = null;
    }
  }, {
    key: "_handleMouseWheel",
    value: function _handleMouseWheel(e) {
      this._resetWheelStepTimers();

      this._updateMousePosition(e);

      var dX = e.deltaX;
      var dY = e.deltaY; // Pixel units unless it's non-zero.
      // Note that if deltamode is line or page won't matter since we aren't
      // sending the mouse wheel delta to the server anyway.
      // The difference between pixel and line can be important however since
      // we have a threshold that can be smaller than the line height.

      if (e.deltaMode !== 0) {
        dX *= WHEEL_LINE_HEIGHT;
        dY *= WHEEL_LINE_HEIGHT;
      }

      this._accumulatedWheelDeltaX += dX;
      this._accumulatedWheelDeltaY += dY; // Generate a mouse wheel step event when the accumulated delta
      // for one of the axes is large enough.
      // Small delta events that do not pass the threshold get sent
      // after a timeout.

      if (Math.abs(this._accumulatedWheelDeltaX) > WHEEL_STEP) {
        this._generateWheelStepX();
      } else {
        this._wheelStepXTimer = window.setTimeout(this._generateWheelStepX.bind(this), WHEEL_STEP_TIMEOUT);
      }

      if (Math.abs(this._accumulatedWheelDeltaY) > WHEEL_STEP) {
        this._generateWheelStepY();
      } else {
        this._wheelStepYTimer = window.setTimeout(this._generateWheelStepY.bind(this), WHEEL_STEP_TIMEOUT);
      }

      (0, _events.stopEvent)(e);
    }
  }, {
    key: "_handleMouseMove",
    value: function _handleMouseMove(e) {
      this._updateMousePosition(e);

      this.onmousemove(this._pos.x, this._pos.y);
      (0, _events.stopEvent)(e);
    }
  }, {
    key: "_handleMouseDisable",
    value: function _handleMouseDisable(e) {
      /*
       * Stop propagation if inside canvas area
       * Note: This is only needed for the 'click' event as it fails
       *       to fire properly for the target element so we have
       *       to listen on the document element instead.
       */
      if (e.target == this._target) {
        (0, _events.stopEvent)(e);
      }
    } // Update coordinates relative to target

  }, {
    key: "_updateMousePosition",
    value: function _updateMousePosition(e) {
      e = (0, _events.getPointerEvent)(e);

      var bounds = this._target.getBoundingClientRect();

      var x;
      var y; // Clip to target bounds

      if (e.clientX < bounds.left) {
        x = 0;
      } else if (e.clientX >= bounds.right) {
        x = bounds.width - 1;
      } else {
        x = e.clientX - bounds.left;
      }

      if (e.clientY < bounds.top) {
        y = 0;
      } else if (e.clientY >= bounds.bottom) {
        y = bounds.height - 1;
      } else {
        y = e.clientY - bounds.top;
      }

      this._pos = {
        x: x,
        y: y
      };
    } // ===== PUBLIC METHODS =====

  }, {
    key: "grab",
    value: function grab() {
      var t = this._target;

      if (_browser.isTouchDevice) {
        t.addEventListener('touchstart', this._eventHandlers.mousedown);
        t.addEventListener('touchend', this._eventHandlers.mouseup);
        t.addEventListener('touchmove', this._eventHandlers.mousemove);
      }

      t.addEventListener('mousedown', this._eventHandlers.mousedown);
      t.addEventListener('mouseup', this._eventHandlers.mouseup);
      t.addEventListener('mousemove', this._eventHandlers.mousemove);
      t.addEventListener('wheel', this._eventHandlers.mousewheel); // Prevent middle-click pasting (see above for why we bind to document)

      document.addEventListener('click', this._eventHandlers.mousedisable); // preventDefault() on mousedown doesn't stop this event for some
      // reason so we have to explicitly block it

      t.addEventListener('contextmenu', this._eventHandlers.mousedisable);
    }
  }, {
    key: "ungrab",
    value: function ungrab() {
      var t = this._target;

      this._resetWheelStepTimers();

      if (_browser.isTouchDevice) {
        t.removeEventListener('touchstart', this._eventHandlers.mousedown);
        t.removeEventListener('touchend', this._eventHandlers.mouseup);
        t.removeEventListener('touchmove', this._eventHandlers.mousemove);
      }

      t.removeEventListener('mousedown', this._eventHandlers.mousedown);
      t.removeEventListener('mouseup', this._eventHandlers.mouseup);
      t.removeEventListener('mousemove', this._eventHandlers.mousemove);
      t.removeEventListener('wheel', this._eventHandlers.mousewheel);
      document.removeEventListener('click', this._eventHandlers.mousedisable);
      t.removeEventListener('contextmenu', this._eventHandlers.mousedisable);
    }
  }]);

  return Mouse;
}();

exports.default = Mouse;