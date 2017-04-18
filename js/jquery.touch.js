/* ------------------------------------------------------------

   Copyright 2017 Esri

   Licensed under the Apache License, Version 2.0 (the 'License');
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at:
   http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an 'AS IS' BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

--------------------------------------------------------------- */

(function ($) {
    // Enforce strict mode
    'use strict';

    var defaults = {
        canTranslate: true,
        canScale: true,
        canRotate: true,
        touchStart: null,
        touchMove: null,
        touchEnd: null
    };

    //
    var props = $.event.props || [];
    props.push('touches');
    props.push('scale');
    props.push('rotation');
    $.event.props = props;

    function Touch(element, options) {
        // Store element
        this.element = element;

        // Initialize transformation parameters.
        this.x = 0;
        this.y = 0;
        this.r = 0;
        this.s = 1;

        // Initialize transformation deltas.
        this.dx = 0;
        this.dy = 0;
        this.dr = 0;
        this.ds = 1;

        //
        this.options = $.extend({}, defaults, options);

        //
        this.origin = {};

        //
        $(this.element).on('touchstart.touch', this.touchstart.bind(this));
        $(this.element).on('touchmove.touch', this.touchmove.bind(this));
        $(this.element).on('touchend.touch touchcancel.touch', this.touchend.bind(this));
        $(this.element).on('mousedown.touch', this.mousestart.bind(this));
        $(this.element).on('mousemove.touch', this.mousemove.bind(this));
        $(this.element).on('mouseup.touch', this.mouseend.bind(this));
        $(this.element).on('mousewheel.touch', this.mousewheel.bind(this));
    }

    Touch.prototype.mousewheel = function (e) {
        //
        if (this.options.canScale) {
            // Prepare transformation description.
            this.s *= (1 + e.deltaY * 0.01);

            //
            this.applyTransform(
                this.x,
                this.y,
                this.r,
                this.s
            );
        }
    }

    Touch.prototype.mousestart = function (e) {
        this.origin['mouse'] = {
            x: e.pageX,
            y: e.pageY
        }

        if (this.options.touchStart) {
            this.options.touchStart({
                object: this.element
            });
        }
    }

    Touch.prototype.mousemove = function (e) {
        // Exit if no mouse origin.
        if (!this.origin['mouse']) { return; }

        // Exit if translation not supported.
        this.dx = 0;
        this.dy = 0;
        if (this.options.canTranslate) {
            //
            this.dx = e.pageX - this.origin['mouse'].x;
            this.dy = e.pageY - this.origin['mouse'].y;
        }

        //
        this.applyTransform(
            this.x + this.dx,
            this.y + this.dy,
            this.r,
            this.s
        );
    }

    Touch.prototype.mouseend = function (e) {
        // Clear origin
        this.origin = {};

        // Exit if translation not supported.
        if (this.options.canTranslate) {
            //
            this.x += this.dx;
            this.y += this.dy;
        }

        if (this.options.touchEnd) {
            this.options.touchEnd({
                object: this.element,
                x: this.x,
                y: this.y,
                r: this.r,
                s: this.s
            });
        }
    }

    Touch.prototype.touchstart = function (e) {
        // Prevent event bubbling.
        e.preventDefault();

        // Store originating touch positions.
        for (var i = 0; i < e.touches.length; i++) {
            var touch = e.touches.item(i);
            if (touch.target === this.element) {
                if (touch.identifier in this.origin) {
                    // Finger already tracked
                }
                else {
                    this.origin[touch.identifier] = {
                        x: touch.pageX,
                        y: touch.pageY
                    }
                }
            }
        }
    };

    Touch.prototype.touchmove = function (e) {
        // Prevent event bubbling.
        e.preventDefault();

        // Filter events not related to current element.
        var touches = [];
        for (var i = 0; i < e.touches.length; i++) {
            var touch = e.touches.item(i);
            if (touch.target === this.element) {
                touches[touch.identifier] = {
                    x: touch.pageX,
                    y: touch.pageY
                }
            }
        }

        // Get Fingers
        var fingers1 = Object.keys(this.origin);
        var fingers2 = Object.keys(touches);

        // Exit if no fingers touching.
        if (fingers1.length === 0 || fingers2.length === 0) { return; }
        if (fingers1.length !== fingers2.length) { return; }
        var count = fingers1.length;

        // Calculate translation deltas.
        this.dx = 0;
        this.dy = 0;
        if (this.options.canTranslate) {
            for (var i = 0; i < count; i++) {
                var id = fingers1[i];
                this.dx += touches[id].x - this.origin[id].x
                this.dy += touches[id].y - this.origin[id].y
            }
            this.dx /= fingers1.length;
            this.dy /= fingers1.length;
        }

        // Calculate rotation deltas.
        this.dr = 0;
        if (this.options.canRotate) {
            if (count > 1) {
                // Find center of original hand 
                var hand1x = 0;
                var hand1y = 0;
                for (var i = 0; i < count; i++) {
                    var id = fingers1[i];
                    hand1x += this.origin[id].x;
                    hand1y += this.origin[id].y;
                }
                hand1x /= count;
                hand1y /= count;

                // Find center of current hand 
                var hand2x = 0;
                var hand2y = 0;
                for (var i = 0; i < count; i++) {
                    var id = fingers2[i];
                    hand2x += touches[id].x;
                    hand2y += touches[id].y;
                }
                hand2x /= count;
                hand2y /= count;

                // Set angle to center
                for (var i = 0; i < count; i++) {
                    var id = fingers1[i];
                    var r1 = Math.atan2(
                        this.origin[id].y - hand1y,
                        this.origin[id].x - hand1x
                    );
                    var r2 = Math.atan2(
                        touches[id].y - hand2y,
                        touches[id].x - hand2x
                    );
                    this.dr += r2 - r1;
                }
            }
            //
            this.dr *= 180 / Math.PI;
            this.dr /= count;
        }

        // Calculate scale deltas.
        this.ds = 1;
        if (this.options.canScale) {
            if (touches.length > 1) {
                this.ds = 0;

                // Find size of original hand
                var minx1 = null;
                var miny1 = null;
                var maxx1 = null;
                var maxy1 = null;
                for (var i = 0; i < count; i++) {
                    var id = fingers1[i];
                    var x = this.origin[id].x;
                    var y = this.origin[id].y;
                    minx1 = minx1 === null ? x : Math.min(minx1, x);
                    miny1 = miny1 === null ? y : Math.min(miny1, y);
                    maxx1 = maxx1 === null ? x : Math.max(maxx1, x);
                    maxy1 = maxy1 === null ? y : Math.max(maxy1, y);
                }

                // Find size of original hand
                var minx2 = null;
                var miny2 = null;
                var maxx2 = null;
                var maxy2 = null;
                for (var i = 0; i < count; i++) {
                    var id = fingers2[i];
                    var x = touches[id].x;
                    var y = touches[id].y;
                    minx2 = minx2 === null ? x : Math.min(minx2, x);
                    miny2 = miny2 === null ? y : Math.min(miny2, y);
                    maxx2 = maxx2 === null ? x : Math.max(maxx2, x);
                    maxy2 = maxy2 === null ? y : Math.max(maxy2, y);
                }

                // 
                var scalex = (maxx2 - minx2) / (maxx1 - minx1);
                var scaley = (maxy2 - miny2) / (maxy1 - miny1);
                this.ds = Math.max(scalex, scaley) / 2;
            }
        }

        //
        this.applyTransform(
            this.x + this.dx,
            this.y + this.dy,
            (this.r + this.dr) % 360,
            this.s * this.ds
        );
    };

    Touch.prototype.touchend = function (e) {
        // Prevent event bubbling.
        e.preventDefault();

        // Is this the last finger? If so, do not proceed.
        var fingerCount = 0;
        for (var i = 0; i < e.touches.length; i++) {
            var touch = e.touches.item(i);
            if (touch.target === this.element) {
                fingerCount++;
            }
        }
        if (fingerCount !== 0) { return; }

        // Clear origin
        this.origin = {};

        // Store last used transformation parameters.
        this.x += this.dx;
        this.y += this.dy;
        this.r = (this.r + this.dr) % 360;
        this.s *= this.ds;

        //
        if (this.options.touchEnd) {
            this.options.touchEnd({
                object: this.element
            });
        }
    };

    Touch.prototype.applyTransform = function (x, y, r, s) {
        var transform =
            'translate(' + x + 'px,' + y + 'px) ' +
            'scale(' + s + ') ' +
            'rotate(' + r + 'deg)';

        // Apply transformation.
        $(this.element).css({
            '-webkit-transform': transform,
            '-moz-transform': transform,
            '-ms-transform': transform,
            '-0-transform': transform,
            'transform': transform
        });

        if (this.options.touchMove) {
            this.options.touchMove({
                object: this.element,
                x: x,
                y: y,
                r: r,
                s: s
            });
        }
    }

    $.fn.touch = function (options) {
        return this.each(function () {
            if (!$.data(this, "plugin_touch")) {
                $.data(this, 'plugin_touch', new Touch(this, options));
            }
        });
    };

    $.fn.untouch = function () {
        return this.each(function () {
            if ($.data(this, "plugin_touch")) {
                $.removeData(this, 'plugin_touch');
            }
            $(this).off('.touch');
        });
    };
}(jQuery));