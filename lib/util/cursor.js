"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _browser = require("./browser.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var useFallback = !_browser.supportsCursorURIs || _browser.isTouchDevice;

var Cursor = /*#__PURE__*/function () {
  function Cursor() {
    _classCallCheck(this, Cursor);

    this._target = null;
    this._canvas = document.createElement('canvas');

    if (useFallback) {
      this._canvas.style.position = 'fixed';
      this._canvas.style.zIndex = '65535';
      this._canvas.style.pointerEvents = 'none'; // Can't use "display" because of Firefox bug #1445997

      this._canvas.style.visibility = 'hidden';
    }

    this._position = {
      x: 0,
      y: 0
    };
    this._hotSpot = {
      x: 0,
      y: 0
    };
    this._eventHandlers = {
      'mouseover': this._handleMouseOver.bind(this),
      'mouseleave': this._handleMouseLeave.bind(this),
      'mousemove': this._handleMouseMove.bind(this),
      'mouseup': this._handleMouseUp.bind(this),
      'touchstart': this._handleTouchStart.bind(this),
      'touchmove': this._handleTouchMove.bind(this),
      'touchend': this._handleTouchEnd.bind(this)
    };
  }

  _createClass(Cursor, [{
    key: "attach",
    value: function attach(target) {
      if (this._target) {
        this.detach();
      }

      this._target = target;

      if (useFallback) {
        document.body.appendChild(this._canvas); // FIXME: These don't fire properly except for mouse
        ///       movement in IE. We want to also capture element
        //        movement, size changes, visibility, etc.

        var options = {
          capture: true,
          passive: true
        };

        this._target.addEventListener('mouseover', this._eventHandlers.mouseover, options);

        this._target.addEventListener('mouseleave', this._eventHandlers.mouseleave, options);

        this._target.addEventListener('mousemove', this._eventHandlers.mousemove, options);

        this._target.addEventListener('mouseup', this._eventHandlers.mouseup, options); // There is no "touchleave" so we monitor touchstart globally


        window.addEventListener('touchstart', this._eventHandlers.touchstart, options);

        this._target.addEventListener('touchmove', this._eventHandlers.touchmove, options);

        this._target.addEventListener('touchend', this._eventHandlers.touchend, options);
      }

      this.clear();
    }
  }, {
    key: "detach",
    value: function detach() {
      if (!this._target) {
        return;
      }

      if (useFallback) {
        var options = {
          capture: true,
          passive: true
        };

        this._target.removeEventListener('mouseover', this._eventHandlers.mouseover, options);

        this._target.removeEventListener('mouseleave', this._eventHandlers.mouseleave, options);

        this._target.removeEventListener('mousemove', this._eventHandlers.mousemove, options);

        this._target.removeEventListener('mouseup', this._eventHandlers.mouseup, options);

        window.removeEventListener('touchstart', this._eventHandlers.touchstart, options);

        this._target.removeEventListener('touchmove', this._eventHandlers.touchmove, options);

        this._target.removeEventListener('touchend', this._eventHandlers.touchend, options);

        document.body.removeChild(this._canvas);
      }

      this._target = null;
    }
  }, {
    key: "change",
    value: function change(rgba, hotx, hoty, w, h) {
      if (w === 0 || h === 0) {
        this.clear();
        return;
      }

      this._position.x = this._position.x + this._hotSpot.x - hotx;
      this._position.y = this._position.y + this._hotSpot.y - hoty;
      this._hotSpot.x = hotx;
      this._hotSpot.y = hoty;

      var ctx = this._canvas.getContext('2d');

      this._canvas.width = w;
      this._canvas.height = h;
      var img;

      try {
        // IE doesn't support this
        img = new ImageData(new Uint8ClampedArray(rgba), w, h);
      } catch (ex) {
        img = ctx.createImageData(w, h);
        img.data.set(new Uint8ClampedArray(rgba));
      }

      ctx.clearRect(0, 0, w, h);
      ctx.putImageData(img, 0, 0);

      if (useFallback) {
        this._updatePosition();
      } else {
        var url = this._canvas.toDataURL();

        this._target.style.cursor = 'url(' + url + ')' + hotx + ' ' + hoty + ', default';
      }
    }
  }, {
    key: "clear",
    value: function clear() {
      this._target.style.cursor = 'none';
      this._canvas.width = 0;
      this._canvas.height = 0;
      this._position.x = this._position.x + this._hotSpot.x;
      this._position.y = this._position.y + this._hotSpot.y;
      this._hotSpot.x = 0;
      this._hotSpot.y = 0;
    }
  }, {
    key: "_handleMouseOver",
    value: function _handleMouseOver(event) {
      // This event could be because we're entering the target, or
      // moving around amongst its sub elements. Let the move handler
      // sort things out.
      this._handleMouseMove(event);
    }
  }, {
    key: "_handleMouseLeave",
    value: function _handleMouseLeave(event) {
      // Check if we should show the cursor on the element we are leaving to
      this._updateVisibility(event.relatedTarget);
    }
  }, {
    key: "_handleMouseMove",
    value: function _handleMouseMove(event) {
      this._updateVisibility(event.target);

      this._position.x = event.clientX - this._hotSpot.x;
      this._position.y = event.clientY - this._hotSpot.y;

      this._updatePosition();
    }
  }, {
    key: "_handleMouseUp",
    value: function _handleMouseUp(event) {
      var _this = this;

      // We might get this event because of a drag operation that
      // moved outside of the target. Check what's under the cursor
      // now and adjust visibility based on that.
      var target = document.elementFromPoint(event.clientX, event.clientY);

      this._updateVisibility(target); // Captures end with a mouseup but we can't know the event order of
      // mouseup vs releaseCapture.
      //
      // In the cases when releaseCapture comes first, the code above is
      // enough.
      //
      // In the cases when the mouseup comes first, we need wait for the
      // browser to flush all events and then check again if the cursor
      // should be visible.


      if (this._captureIsActive()) {
        window.setTimeout(function () {
          // Refresh the target from elementFromPoint since queued events
          // might have altered the DOM
          target = document.elementFromPoint(event.clientX, event.clientY);

          _this._updateVisibility(target);
        }, 0);
      }
    }
  }, {
    key: "_handleTouchStart",
    value: function _handleTouchStart(event) {
      // Just as for mouseover, we let the move handler deal with it
      this._handleTouchMove(event);
    }
  }, {
    key: "_handleTouchMove",
    value: function _handleTouchMove(event) {
      this._updateVisibility(event.target);

      this._position.x = event.changedTouches[0].clientX - this._hotSpot.x;
      this._position.y = event.changedTouches[0].clientY - this._hotSpot.y;

      this._updatePosition();
    }
  }, {
    key: "_handleTouchEnd",
    value: function _handleTouchEnd(event) {
      // Same principle as for mouseup
      var target = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);

      this._updateVisibility(target);
    }
  }, {
    key: "_showCursor",
    value: function _showCursor() {
      if (this._canvas.style.visibility === 'hidden') {
        this._canvas.style.visibility = '';
      }
    }
  }, {
    key: "_hideCursor",
    value: function _hideCursor() {
      if (this._canvas.style.visibility !== 'hidden') {
        this._canvas.style.visibility = 'hidden';
      }
    } // Should we currently display the cursor?
    // (i.e. are we over the target, or a child of the target without a
    // different cursor set)

  }, {
    key: "_shouldShowCursor",
    value: function _shouldShowCursor(target) {
      if (!target) {
        return false;
      } // Easy case


      if (target === this._target) {
        return true;
      } // Other part of the DOM?


      if (!this._target.contains(target)) {
        return false;
      } // Has the child its own cursor?
      // FIXME: How can we tell that a sub element has an
      //        explicit "cursor: none;"?


      if (window.getComputedStyle(target).cursor !== 'none') {
        return false;
      }

      return true;
    }
  }, {
    key: "_updateVisibility",
    value: function _updateVisibility(target) {
      // When the cursor target has capture we want to show the cursor.
      // So, if a capture is active - look at the captured element instead.
      if (this._captureIsActive()) {
        target = document.captureElement;
      }

      if (this._shouldShowCursor(target)) {
        this._showCursor();
      } else {
        this._hideCursor();
      }
    }
  }, {
    key: "_updatePosition",
    value: function _updatePosition() {
      this._canvas.style.left = this._position.x + "px";
      this._canvas.style.top = this._position.y + "px";
    }
  }, {
    key: "_captureIsActive",
    value: function _captureIsActive() {
      return document.captureElement && document.documentElement.contains(document.captureElement);
    }
  }]);

  return Cursor;
}();

exports.default = Cursor;