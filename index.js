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

require([
        'esri/Map',
        'esri/geometry/Extent',
        'esri/geometry/SpatialReference',
        'esri/geometry/Point',
        'esri/geometry/ScreenPoint',
        'esri/views/MapView',
        'esri/widgets/Home',
        'esri/widgets/Search',
        'esri/widgets/ScaleBar',
        //'dojo/on',
        //'dojo/debounce',
        'dojo/number',
        'dojo/string',
        'dojo/domReady!'
    ],
    function (
        Map,
        Extent,
        SpatialReference,
        Point,
        ScreenPoint,
        MapView,
        Home,
        Search,
        ScaleBar,
        //on,
        //debounce,
        number,
        string
    ) {
        $(document).ready(function () {
            // Enforce strict mode
            'use strict';

            var DEFAULT_SIZE = 400;
            var DEFAULT_YEAR = 2017;
            var MAX_IMAGE = 2000;

            //
            var palms1 = $('.rc-bookmark li a').get(7);
            var palms2 = $(palms1).attr('data-extent').split(',');

            // Map view
            var _view = new MapView({
                container: 'map',
                extent: new Extent({
                    xmin: Number(palms2[0]),
                    ymin: Number(palms2[1]),
                    xmax: Number(palms2[2]),
                    ymax: Number(palms2[3]),
                    spatialReference: SpatialReference.WebMercator
                }),
                padding: {
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0
                },
                ui: {
                    components: [
                        'zoom'
                    ]
                },
                map: new Map({
                    basemap: 'osm'
                })
            });
            _view.then(function () {
                addLens(
                    DEFAULT_YEAR,
                    DEFAULT_SIZE
                );
            });

            _view.on('resize', $.debounce(1000, function (e) {
                updateLensImages();
            }));

            //on(_view, 'resize', debounce(function (e) {
            //    updateLensImages();
            //}, 1000));

            _view.watch('extent', $.debounce(250, function (e) {
                updateLensImages();
            }));



            //
            _view.ui.add(new ScaleBar({ view: _view }), "bottom-left");

            // 
            $('.dropdown-menu li a').click(function () {
                if ($(this).parent().parent().hasClass('rc-bookmark')) {
                    var coordinates = $(this).attr('data-extent').split(',');
                    _view.extent = new Extent({
                        xmin: Number(coordinates[0]),
                        ymin: Number(coordinates[1]),
                        xmax: Number(coordinates[2]),
                        ymax: Number(coordinates[3]),
                        spatialReference: SpatialReference.WebMercator
                    });
                }

                if ($(this).parent().parent().hasClass('rc-theme')) {
                    // Exit if item already selected.
                    if ($(this).parent().hasClass('active')) { return; }

                    // Toggle enabled state for clicked item and siblings.
                    $(this).parent().addClass('active').siblings().removeClass('active');

                    //
                }

                if ($(this).parent().parent().hasClass('rc-year')) {
                    // Add Lens
                    var year = $(this).attr('data-year');
                    addLens(
                        year,
                        DEFAULT_SIZE
                    );
                }
            });

            //
            $('#buttonHelp').click(function () {
                $('#modalHelp').modal('show');
            });
            $('#buttonAbout').click(function () {
                $('#modalAbout').modal('show');
            });

            function addLens(year, size) {
                var left = _view.width / 2 - size / 2;
                var top = _view.height / 2 - size / 2;

                var window = $(document.createElement('div')).addClass('rc-window').css({
                    'position': 'absolute',
                    'left': left + 'px',
                    'top': top + 'px',
                    'width': size + 'px',
                    'height': size + 'px'
                }).data({
                    'year': year
                });

                window.touch({
                    'canTranslate': true,
                    'canRotate': true,
                    'canScale': true,
                    'touchStart': function (e) {
                        // Bring lens to the front
                        $(e.object).bringToFont('.rc-window');

                        // 
                        $(e.object).css({
                            'opacity': 0.7,
                            'cursor': 'grabbing'
                        });
                    },
                    'touchMove': function (e) {
                        // Create texture transformation
                        var transform = string.substitute('translate(${x}px,${y}px) scale(${s}) rotate(${r}deg)', {
                            x: -e.x,
                            y: -e.y,
                            s: 1 / e.s,
                            r: -e.r
                        });

                        // Create texture transformation origin
                        var origin = string.substitute('${x}px ${y}px', {
                            x: _view.width / 2 + e.x,
                            y: _view.height / 2 + e.y
                        });

                        // Apply transformation and transformation origin
                        $(e.object).children('.rc-window-image').css({
                            '-webkit-transform': transform,
                            '-moz-transform': transform,
                            '-ms-transform': transform,
                            '-0-transform': transform,
                            'transform': transform,
                            '-webkit-transform-origin': origin,
                            '-moz-transform-origin': origin,
                            '-ms-transform-origin': origin,
                            '-0-transform-origin': origin,
                            'transform-origin': origin
                        });
                    },
                    'touchEnd': function (e) {
                        //
                        $(e.object).css({
                            'opacity': 1,
                            'cursor': 'grab'
                        });
                    }
                });

                // Add progress gif
                window.append(
                    $(document.createElement('img'))
                        .attr('src', 'img/loading-throb.gif')
                        .css({
                            'position': 'absolute',
                            'left':  '50%',
                            'top': '50%',
                            'width': '33px',
                            'margin-top': '-20px',
                            'margin-left': '-17px',
                            'pointer-events': 'none'
                        })
                );


                window.append(
                    $(document.createElement('div')).addClass('rc-window-image').css({
                        'position': 'absolute',
                        'left': -left + 'px',
                        'top': -top + 'px',
                        'width': _view.width + 'px',
                        'height': _view.height + 'px',
                        'pointer-events': 'none',
                        'background-size': 'cover',
                        'background-repeat': 'no-repeat',
                        'background-image': 'none'
                    })
                );

                window.append(
                    $(document.createElement('div')).css({
                        'position': 'absolute',
                        'left': '0',
                        'top': '0',
                        'font-size': '24px',
                        'font-weight': 700,
                        'pointer-events': 'none',
                        'color': 'rgba(255, 255, 255, 0.5)',
                        'margin-top': '1px',
                        'margin-left': '5px'
                    }).html(year)
                );

                $('#map-container').append(
                    window
                );

                updateLensImages();
            }

            function getImageUrl(year) {
                // Calcuate scale if image exceeds maximum size.
                var max = Math.max(_view.width, _view.height);
                var scale = max <= MAX_IMAGE ? 1 : MAX_IMAGE / max;

                var url = $('.rc-theme li.active a').attr('data-url');
                var fxn = $('.rc-theme li.active a').attr('data-function');
                var date =
                    url += '/exportImage?f=image'
                url += string.substitute('&bbox=${xmin},${ymin},${xmax},${ymax}', {
                    xmin: _view.extent.xmin,
                    ymin: _view.extent.ymin,
                    xmax: _view.extent.xmax,
                    ymax: _view.extent.ymax
                });
                url += '&bboxSR=' + _view.spatialReference.wkid;
                url += '&imageSR=' + _view.spatialReference.wkid;
                url += string.substitute('&size=${w},${h}', {
                    w: Math.min(Math.round(scale * _view.width), MAX_IMAGE),
                    h: Math.min(Math.round(scale * _view.height), MAX_IMAGE)
                });
                url += string.substitute('&time=${f},${t}', {
                    f: 0,
                    t: Date.UTC(year, 0, 1)
                });
                url += '&format=' + 'jpgpng';
                url += '&interpolation=' + 'RSP_BilinearInterpolation';
                url += '&mosaicRule=' + '{mosaicMethod:\'esriMosaicAttribute\',sortField:\'AcquisitionDate\',sortValue:\'2017/02/06, 12:00 AM\',ascending:true,mosaicOperation:\'MT_FIRST\',where:\'CloudCover<=0.1\'}';
                url += '&renderingRule=' + string.substitute('{rasterFunction:\'${rasterFunction}\'}', {
                    rasterFunction: fxn
                });
                return url;
            }

            function updateLensImages() {
                $('.rc-window').each(function () {
                    var year = $(this).data().year;
                    $(this).children('.rc-window-image').css({
                        'background-image':'none'
                    });
                    $(this).children('.rc-window-image').css({
                        'width': _view.width + 'px',
                        'height': _view.height + 'px',
                        'background-image': function () {
                            return 'url("' + getImageUrl(year) + '")';
                        }
                    });
                });
            }
        });

        $.fn.bringToFont = function (selector) {
            var max = Math.max.apply(null, $(this).siblings(selector).map(function () {
                return Number($(this).css('z-index'));
            }));
            if (max >= Number($(this).css('z-index'))) {
                $(this).css({
                    'z-index': ++max
                });
            }
            return this;
        };
    }
);
