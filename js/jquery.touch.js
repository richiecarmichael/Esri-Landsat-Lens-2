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
    'use strict';
    
    //
    var props = $.event.props || [];
    props.push('touches');
    props.push('scale');
    props.push('rotation');
    $.event.props = props;

    $(document).ready(function () {
        $.each($('.touchWindow'), function () {
            if (!$(this).data('plugin_touch')) {
                $(this).data('plugin_touch', new Touch(this));
            }
        });
    });
    
    function Touch(element) {
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
        this.origin = {};

        //
        $(this.element).on('touchstart', this.touchstart.bind(this));
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
            if (touch.target.id === $(this.element).attr('id')) {
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
        $(this.element).addClass('touchContact');
    };

    Touch.prototype.touchmove = function (e) {
        // Prevent event bubbling.
        e.preventDefault();

        // Filter events not related to current element.
        var touches = [];
        for (var i = 0; i < e.touches.length; i++) {
            var touch = e.touches.item(i);
            if (touch.target.id === $(this.element).attr('id')) {
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
        if (fingers1.length !== fingers2.length) {
            alert("not equal");
            return;
        }

        // Calculate translation deltas.
        this.dx = 0;
        this.dy = 0;
        
        for (var i = 0; i < fingers1.length; i++) {
            var id = fingers1[i];
            this.dx += touches[id].x - this.origin[id].x
            this.dy += touches[id].y - this.origin[id].y 
        }
        this.dx /= fingers1.length;
        this.dy /= fingers1.length;

        //// Calculate rotation deltas.
        //this.dr = 0;
        //if (fingers1.length > 1) {
        //    for (var i = 0; i < fingers1.length - 1; i++) {
        //        var id = fingers1[i];
        //        var r1 = Math.atan2(
        //            this.origin[id].y - this.origin[i + 1].y,
        //            this.origin[id].x - this.origin[i + 1].x
        //        );
        //        var r2 = Math.atan2(
        //            touches[i].y - touches[i + 1].y,
        //            touches[i].x - touches[i + 1].x
        //        );
        //        this.dr += r2 - r1;
        //    }
        //}
        //this.dr *= 180 / Math.PI;
        //this.dr /= touches.length;

        //// Calculate scale deltas.
        //this.ds = 1;
        //if (touches.length > 1) {
        //    this.ds = 0;
        //    for (var i = 0; i < touches.length - 1; i++) {
        //        var d1 = Math.sqrt(
        //            Math.pow(this.origin[i].x - this.origin[i + 1].x, 2) +
        //            Math.pow(this.origin[i].y - this.origin[i + 1].y, 2)
        //        );
        //        var d2 = Math.sqrt(
        //            Math.pow(touches[i].x - touches[i + 1].x, 2) +
        //            Math.pow(touches[i].y - touches[i + 1].y, 2)
        //        );
        //        this.ds += d2 / d1;
        //    }
        //    this.ds /= touches.length;
        //}

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
    };

    Touch.prototype.touchend = function (e) {
        // Prevent event bubbling.
        e.preventDefault();

        // Is this the last finger? If so, do not proceed.
        var fingerCount = 0;
        for (var i = 0; i < e.touches.length; i++) {
            var touch = e.touches.item(i);
            if (touch.target.id === $(this.element).attr('id')) {
                fingerCount++;
            }
        }
        if (fingerCount !== 0) { return; }

        // Clear origin
        this.origin = {};

        // Stop listening to touch events. Remove touching class.
        $(this.element).off('.touch');
        $(this.element).removeClass('touchContact');

        // Store last used transformation parameters.
        this.x += this.dx;
        this.y += this.dy;
        this.r = (this.r + this.dr) % 360;
        this.s *= this.ds;
    };
}(jQuery));