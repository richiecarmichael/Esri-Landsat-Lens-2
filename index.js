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
        number,
        string
    ) {
        $(document).ready(function () {
            // Enforce strict mode
            'use strict';

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
                addLens(2016);
            });

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
                }
            });

            //
            $('#buttonHelp').click(function () {
                $('#modalHelp').modal('show');
            });
            $('#buttonAbout').click(function () {
                $('#modalAbout').modal('show');
            });

            function addLens(year) {
                $('#map-container').append(
                    $(document.createElement('div')).addClass('rc-window').css({
                        position: 'absolute',
                        left: '0',
                        top: '0',
                        width: '400px',
                        height: '400px'
                    }).data('year', year).touch({
                        canTranslate: true,
                        canRotate: true,
                        canScale: false,
                        touchClass: 'rc-touching',
                        touchMove: function (e) {
                            var transform = string.substitute('translate(${x}px,${y}px) scale(${s}) rotate(${r}deg)', {
                                x: -e.x,
                                y: -e.y,
                                s: 1 / e.s,
                                r: -e.r
                            });
                            var origin = string.substitute('${x}px ${y}px', {
                                x: e.x + 200 * e.s,
                                y: e.y + 200 * e.s
                            });
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
                        touchEnd: function (e) {
                            //
                        }
                    }).append(
                        $(document.createElement('div')).addClass('rc-window-image').css({
                            'position': 'absolute',
                            'left': '0',
                            'top': '0',
                            'width': _view.width + 'px',
                            'height': _view.height + 'px',
                            'pointer-events': 'none',
                            'background-size': 'cover',
                            'background-repeat': 'no-repeat',
                            'background-image': function () {
                                return 'url("' + getImageUrl(year) + '")';
                            }
                        }),
                        $(document.createElement('div')).css({
                            'position': 'absolute',
                            'left': '0',
                            'top': '0',
                            'font-size': '18px',
                            'font-weight': 700,
                            'pointer-events': 'none',
                            'color': 'rgba(255, 255, 255, 0.5)'
                        }).html(year)
                    )
                );
                
            }

            function getImageUrl(year) {
                var url = $('.rc-theme li.active a').attr('data-url');
                var fxn = $('.rc-theme li.active a').attr('data-function');
                url += '/exportImage?f=image'
                url += string.substitute('&bbox=${xmin},${ymin},${xmax},${ymax}', {
                    xmin: _view.extent.xmin,
                    ymin: _view.extent.ymin,
                    xmax: _view.extent.xmax,
                    ymax: _view.extent.ymax
                });
                url += '&bboxSR=' + _view.spatialReference.wkid;
                url += '&imageSR=' + _view.spatialReference.wkid;
                url += string.substitute('&size=${width},${height}', {
                    width: _view.width,
                    height: _view.height
                });
                url += string.substitute('&time=${from},${to}', {
                    from: 0,
                    to: 1491867353597
                });
                url += '&format=' + 'jpgpng';
                url += '&interpolation=' + 'RSP_BilinearInterpolation';
                url += '&mosaicRule=' + '{mosaicMethod:\'esriMosaicAttribute\',sortField:\'AcquisitionDate\',sortValue:\'2017/02/06, 12:00 AM\',ascending:true,mosaicOperation:\'MT_FIRST\'}';
                url += '&renderingRule=' + string.substitute('{rasterFunction:\'${rasterFunction}\'}', {
                    rasterFunction: fxn
                });
                return url;
            }

            // Ag
            // https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer/exportImage?f=image&format=jpgpng&renderingRule={"rasterFunction":"Agriculture with DRA"}&bbox=-13070592.427855214,4026711.9772103243,-13035909.126270862,4044368.930744176&imageSR=102100&bboxSR=102100&size=1815,924

            // Color Infrared
            // https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer/exportImage?f=image&format=jpgpng&bandIds=&renderingRule={"rasterFunction":"Color Infrared with DRA"}&bbox=-13070592.427855214,4026711.9772103243,-13035909.126270862,4044368.930744176&imageSR=102100&bboxSR=102100&size=1815,924

            // Natural View
            // http://landsat2.arcgis.com/arcgis/rest/services/Landsat/PS/ImageServer/exportImage
            // ?bbox=-13070592.427855214,4026711.9772103243,-13035909.126270862,4044368.930744176
            // &bboxSR=102100
            // &size=1815,924
            // &imageSR=102100
            // &time=28800000,1491867353597
            // &format=jpgpng
            // &pixelType=U16
            // &noData=
            // &noDataInterpretation=esriNoDataMatchAny
            // &interpolation= RSP_BilinearInterpolation
            // &compression=
            // &compressionQuality=
            // &bandIds=
            // &mosaicRule={
            //    "mosaicMethod":"esriMosaicAttribute",
            //    "sortField":"AcquisitionDate",
            //    "sortValue":"2017/02/06, 12:00 AM",
            //    "ascending":true,
            //    "mosaicOperation":"MT_FIRST"
            // }
            // &renderingRule={"rasterFunction":"Pansharpened Enhanced with DRA"}
            // &f=html

            // https://landsat2.arcgis.com/arcgis/rest/services/Landsat/PS/ImageServer/query?f=json&where=(Category=1)AND(CloudCover<=0.10)&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":-13061921.602459125,"ymin":4031126.215593787,"xmax":-13044579.951666951,"ymax":4039954.692360713,"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=AcquisitionDate,GroupName,Best,CloudCover,WRS_Row,Month,Name&orderByFields=AcquisitionDate&outSR=102100&wab_dv=6.5
            // https://landsat2.arcgis.com/arcgis/rest/services/Landsat/PS/ImageServer/query
            // ?f = json
            // &where=(Category=1)AND(CloudCover<=0.10)
            // &returnGeometry=true
            // &spatialRel=esriSpatialRelIntersects
            // &geometry={"xmin":-13061921.602459125,"ymin":4031126.215593787,"xmax":-13044579.951666951, "ymax":4039954.692360713, "spatialReference":{ "wkid":102100 } }
            // &geometryType=esriGeometryEnvelope
            // &inSR=102100
            // &outFields=AcquisitionDate,GroupName,Best,CloudCover,WRS_Row,Month,Name
            // &orderByFields=AcquisitionDate
            // &outSR=102100
            // &wab_dv=6.5
            // http://landsat2.arcgis.com/arcgis/rest/services/Landsat/PS/ImageServer/exportImage?f=image&format=jpgpng&renderingRule={"rasterFunction":"Pansharpened Enhanced with DRA"}&bbox=-13070592.427855214,4026711.9772103243,-13035909.126270862,4044368.930744176&imageSR=102100&bboxSR=102100&size=1815,924&mosaicRule={"mosaicMethod":"esriMosaicLockRaster","ascending":true,"lockRasterIds":[77113],"mosaicOperation":"MT_FIRST"}
            // http://landsat2.arcgis.com/arcgis/rest/services/Landsat/PS/ImageServer/exportImage
            // ?f=image
            // &format=jpgpng
            // &renderingRule={"rasterFunction":"Pansharpened Enhanced with DRA"}
            // &bbox=-13070592.427855214,4026711.9772103243,-13035909.126270862,4044368.930744176
            // &imageSR=102100
            // &bboxSR=102100
            // &size=1815,924
            // &mosaicRule={"mosaicMethod":"esriMosaicLockRaster","ascending":true,"lockRasterIds":[77113],"mosaicOperation":"MT_FIRST"}

            // https://landsat2.arcgis.com/arcgis/rest/services/Landsat/PS/ImageServer/exportImage?f=image&format=jpgpng&renderingRule={"rasterFunction":"Pansharpened Enhanced with DRA"}&bbox=-13070592.427855214,4026711.9772103243,-13035909.126270862,4044368.930744176&imageSR=102100&bboxSR=102100&size=1815,924

            // Moisure
            // https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer/exportImage?f=image&format=jpgpng&bandIds=&renderingRule={"rasterFunction":"Normalized Difference Moisture Index Colorized"}&bbox=-13070592.427855214,4026711.9772103243,-13035909.126270862,4044368.930744176&imageSR=102100&bboxSR=102100&size=1815,924

            // Vege
            // https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer/exportImage?f=image&format=jpgpng&bandIds=&renderingRule={"rasterFunction":"NDVI Colorized"}&bbox=-13070592.427855214,4026711.9772103243,-13035909.126270862,4044368.930744176&imageSR=102100&bboxSR=102100&size=1815,924
        });
    });
