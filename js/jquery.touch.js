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
        this.elem = elem;
        //this.$elem = $(elem);

        // Detect support for Webkit CSS 3d transforms
        this.supportsWebkit3dTransform = ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix());
        this.init();
    }

    //static property to store the zIndex for an element
    Touch.zIndexCount = 1;

    Touch.prototype.init = function () {
        this.rotation = 0; //default rotation in degrees
        this.scale = 1.0; //default scale value
        this.gesture = false; //flags a 2 touch gesture
        //this.touch = 0;
        $(this.elem).on('touchstart', this.touchstart.bind(this));
    };

    Touch.prototype.touchstart = function (e) {
        e.preventDefault();

        //bring item to the front
        //this.elem.style.zIndex = Touch.zIndexCount++;
        $(this.elem).css({
            'zIndex': Touch.zIndexCount++
        });
        $(this.elem).on('touchmove.touch', this.touchmove.bind(this));
        $(this.elem).on('touchend.touch touchcancel.touch', this.touchend.bind(this));

        $(this.elem).addClass('touching');

        this.start0X = $(this.elem).getMatrix(4) - e.touches[0].pageX;
        this.start0Y = $(this.elem).getMatrix(5) - e.touches[0].pageY;
        if (e.touches.length < 2) { return; }
        this.start1X = $(this.elem).getMatrix(4) - e.touches[1].pageX;
        this.start1Y = $(this.elem).getMatrix(5) - e.touches[1].pageY;
    };

    Touch.prototype.touchmove = function (e) {
        e.preventDefault();

        $(this.elem).html(e.touches.length);

        var myTransform = '';
        var x1 = 0;
        var y1 = 0;
        var    x2 = 0;
        var    y2 = 0;
        var curX = 0;
        var    curY = 0;

        //drag event
        if (e.touches.length === 1) {

            //get drag point
            curX = this.start0X + e.touches[0].pageX;
            curY = this.start0Y + e.touches[0].pageY;

            //translate drag
            myTransform += this.supportsWebkit3dTransform ?
                            'translate3d(' + curX + 'px,' + curY + 'px, 0)' :
                            'translate(' + curX + 'px,' + curY + 'px)';
            myTransform += 'scale(' + (this.scale) + ')';
            myTransform += 'rotate(' + ((this.rotation) % 360) + 'deg)';

        } else if (e.touches.length === 2) {
            //gesture event
            this.gesture = true;

            //get middle point between two touches for drag
            x1 = this.start0X + e.touches[0].pageX;
            y1 = this.start0Y + e.touches[0].pageY;
            x2 = this.start1X + e.touches[1].pageX;
            y2 = this.start1Y + e.touches[1].pageY;
            curX = (x1 + x2) / 2, curY = (y1 + y2) / 2;

            //translate drag
            myTransform += this.supportsWebkit3dTransform ?
                     'translate3d(' + curX + 'px,' + curY + 'px, 0)' :
                     'translate(' + curX + 'px,' + curY + 'px)';

            //scale and rotate
            myTransform += 'scale(' + (this.scale * e.scale) + ')';
            myTransform += 'rotate(' + ((this.rotation + e.rotation) % 360) + 'deg)';
        }

        $(this.elem).css({
            'webkitTransform': myTransform,
            'MozTransform': myTransform,
            'msTransform': myTransform,
            'OTransform': myTransform,
            'transform': myTransform,
        });
        //this.elem.style.webkitTransform = this.elem.style.MozTransform = this.elem.style.msTransform = this.elem.style.OTransform = this.elem.style.transform = myTransform;
    };

    Touch.prototype.touchend = function (e) {
        e.preventDefault();

        $(this.elem).off('.touch');

        //store scale and rotate values on gesture end
        if (this.gesture) {
            this.scale *= e.scale;
            this.rotation = (this.rotation + e.rotation) % 360;
            this.gesture = false;
        }

        $(this.elem).removeClass('touching');
    };
}(jQuery));