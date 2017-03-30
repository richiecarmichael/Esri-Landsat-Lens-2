/*
 * jquery.touch.js 0.0.5 - https://github.com/yckart/jquery.touch.js
 * Drag, scale and rotate elements during touch.
 *
 * Copyright (c) 2013 Yannick Albert (http://yckart.com)
 * Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php).
 * 2013/02/23
 */

(function ($) {
    'use strict';

    //
    var props = $.event.props || [];
    props.push('touches');
    props.push('scale');
    props.push('rotation');
    $.event.props = props;

    // plugin wrapper
    $.fn.touch = function () {
        return $(this).each(function () {
            if (!$(this).data('plugin_touch')) {
                $(this).data('plugin_touch', new Touch(this));
            }
        });
    };

    $.fn.getMatrix = function (i) {
        if ($(this).css('transform') === 'none') { return 0; }
        var array = $(this).css('transform').split('(')[1].split(')')[0].split(',');
        return array[i] || array;
    };

    function Touch(elem) {
        this.element = elem;

        // Detect support for Webkit CSS 3d transforms
        this.supportsWebkit3dTransform = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix();
        this.init();
    }

    // Static property to store the zIndex for an element
    Touch.zIndexCount = 1;

    Touch.prototype.init = function () {
        this.rotation = 0;    // Default rotation in degrees
        this.scale = 1.0;     // Default scale value
        this.gesture = false; // Flags a 2 touch gesture
        $(this.element).on('touchstart', this.touchstart.bind(this));
    };

    Touch.prototype.touchstart = function (e) {
        e.preventDefault();

        var touches = [];
        for (var i = 0; i < e.touches.length; i++) {
            var touch = e.touches.item(i);
            if (touch.target.id === $(this.element).attr('id')) {
                touches.push(touch);
            }
        }

        $(this.element).css({
            'zIndex': Touch.zIndexCount++
        });
        $(this.element).on('touchmove.touch', this.touchmove.bind(this));
        $(this.element).on('touchend.touch touchcancel.touch', this.touchend.bind(this));
        $(this.element).addClass('touching');

        this.start0X = $(this.element).getMatrix(4) - touches[0].pageX;
        this.start0Y = $(this.element).getMatrix(5) - touches[0].pageY;
        if (touches.length < 2) { return; }
        this.start1X = $(this.element).getMatrix(4) - touches[1].pageX;
        this.start1Y = $(this.element).getMatrix(5) - touches[1].pageY; 
    };

    Touch.prototype.touchmove = function (e) {
        e.preventDefault();

        var touches = [];
        for (var i = 0; i < e.touches.length; i++) {
            var touch = e.touches.item(i);
            if (touch.target.id === $(this.element).attr('id')) {
                touches.push(touch);
            }
        }

        var transform = '';
        var x1 = 0;
        var y1 = 0;
        var x2 = 0;
        var y2 = 0;
        var curX = 0;
        var curY = 0;

        // Drag event
        if (touches.length === 1) {

            // Get drag point
            curX = this.start0X + touches[0].pageX;
            curY = this.start0Y + touches[0].pageY;

            // Translate, scale and rotate
            transform += this.supportsWebkit3dTransform ? 'translate3d(' + curX + 'px,' + curY + 'px, 0)' :
                                                          'translate(' + curX + 'px,' + curY + 'px)';
            transform += 'scale(' + (this.scale) + ')';
            transform += 'rotate(' + ((this.rotation) % 360) + 'deg)';

        } else if (touches.length === 2) {
            // Gesture event
            this.gesture = true;

            // Get middle point between two touches for drag
            x1 = this.start0X + touches[0].pageX;
            y1 = this.start0Y + touches[0].pageY;
            x2 = this.start1X + touches[1].pageX;
            y2 = this.start1Y + touches[1].pageY;
            curX = (x1 + x2) / 2;
            curY = (y1 + y2) / 2;

            // Translate, scale and rotate
            transform += this.supportsWebkit3dTransform ? 'translate3d(' + curX + 'px,' + curY + 'px, 0)' :
                                                          'translate(' + curX + 'px,' + curY + 'px)';
            transform += 'scale(' + (this.scale * e.scale) + ')';
            transform += 'rotate(' + ((this.rotation + e.rotation) % 360) + 'deg)';
        }

        $(this.element).css({
            'webkitTransform': transform,
            'MozTransform': transform,
            'msTransform': transform,
            'OTransform': transform,
            'transform': transform,
        });
    };

    Touch.prototype.touchend = function (e) {
        e.preventDefault();

        $(this.element).off('.touch');
        $(this.element).removeClass('touching');

        // Store scale and rotate values on gesture end
        if (this.gesture) {
            this.scale *= e.scale;
            this.rotation = (this.rotation + e.rotation) % 360;
            this.gesture = false;
        }
    };
}(jQuery));