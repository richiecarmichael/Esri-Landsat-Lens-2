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
    'esri/Graphic',
    'esri/geometry/Extent',
    'esri/geometry/SpatialReference',
    'esri/geometry/Point',
    'esri/geometry/ScreenPoint',
    'esri/views/MapView',
    'esri/layers/GraphicsLayer',
    'esri/symbols/SimpleFillSymbol',
    'esri/renderers/SimpleRenderer',
    'esri/widgets/Home',
    'esri/widgets/Search',
    'esri/widgets/ScaleBar',
    'esri/portal/Portal',
    'esri/identity/OAuthInfo',
    'esri/identity/IdentityManager',
    'dojo/number',
    'dojo/domReady!'
],
    function (
        Map,
        Graphic,
        Extent,
        SpatialReference,
        Point,
        ScreenPoint,
        MapView,
        GraphicsLayer,
        SimpleFillSymbol,
        SimpleRenderer,
        Home,
        Search,
        ScaleBar,
        Portal,
        OAuthInfo,
        IdentityManager,
        number
    ) {
        $(document).ready(function () {
            // Enforce strict mode
            'use strict';

            //
            var palms1 = $('#bookmarks li a').get(7);
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
                    top: 50,
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
                addLens();
            });

            //
            _view.ui.add(new ScaleBar({ view: _view }), "bottom-left");

            // 
            $('#bookmarks li a').click(function () {
                var coordinates = $(this).attr('data-extent').split(',');
                _view.extent = new Extent({
                    xmin: Number(coordinates[0]),
                    ymin: Number(coordinates[1]),
                    xmax: Number(coordinates[2]),
                    ymax: Number(coordinates[3]),
                    spatialReference: SpatialReference.WebMercator
                });
            });

            //
            $('#buttonHelp').click(function () {
                $('#modalHelp').modal('show');
            });
            $('#buttonAbout').click(function () {
                $('#modalAbout').modal('show');
            });

            function touchMove(e){
                var x = '';
            }
            
            function touchEnd(e){
                var x = '';
            }
            
            function addLens() {
                $('#map-container').append(
                    $(document.createElement('div')).addClass('rc-window').css({
                        left: '0',
                        top: '0'
                    }).touch({
                        touchClass: 'rc-touching',
                        touchMove: touchMove,
                        touchEnd: touchEnd
                    })
                );
            }
        });
    });
