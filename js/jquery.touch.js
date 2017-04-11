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
        touchClass: 'touching',
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
    }

    // Static property to store the zIndex for an element
    Touch.zIndexCount = 1;

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

        // Force element to top.
        $(this.element).css({
            'zIndex': Touch.zIndexCount++
        });

        // Add touching class.
        $(this.element).addClass(this.options.touchClass);
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
        for (var i = 0; i < count; i++) {
            var id = fingers1[i];
            this.dx += touches[id].x - this.origin[id].x
            this.dy += touches[id].y - this.origin[id].y 
        }
        this.dx /= fingers1.length;
        this.dy /= fingers1.length;

        // Calculate rotation deltas.
        this.dr = 0;
        if (count > 1) {
            // Find center of original hand 
            var hand1x =0;
            var hand1y =0;
            for (var i = 0; i < count; i++) {
                var id = fingers1[i];
                hand1x += this.origin[id].x;
                hand1y += this.origin[id].y;
            }
            hand1x /= count;
            hand1y /= count;
            
            // Find center of current hand 
            var hand2x =0;
            var hand2y =0;
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
        
        // Calculate scale deltas.
        this.ds = 1;
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

        // Prepare transformation description.
        var x = this.x + this.dx;
        var y = this.y + this.dy;
        var r = (this.r + this.dr) % 360;
        var s = this.s * this.ds;
        var transform =
            'translate(' + x + 'px,' + y + 'px) ' +
            'scale(' + s + ') ' +
            'rotate(' + r + 'deg)';

        // Apply transformation.
        $(this.element).css({
            'webkitTransform': transform,
            'MozTransform': transform,
            'msTransform': transform,
            'OTransform': transform,
            'transform': transform,
        });
        
        //
        if (this.options.touchMove) {
            this.options.touchMove({
                x: this.x,
                y: this.y,
                r: this.r,
                s: this.s
            });
        }
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

        // Stop listening to touch events. Remove touching class.
        $(this.element).removeClass(this.options.touchClass);

        // Store last used transformation parameters.
        this.x += this.dx;
        this.y += this.dy;
        this.r = (this.r + this.dr) % 360;
        this.s *= this.ds;
        
        //
        if (this.options.touchEnd){
            this.options.touchEnd({
                x: this.x,
                y: this.y,
                r: this.r,
                s: this.s
            });
        }
    };
    
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
    
//    $.fn.touch2 = function (options) {
//        return this.each(function () {
//            if (!$.data(this, "plugin_touch")) { return; }
//            
//        });
//    };
}(jQuery));