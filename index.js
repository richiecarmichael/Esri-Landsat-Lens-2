require([
  "esri/Map",
  "esri/TimeExtent",
  "esri/layers/ImageryLayer",
  "esri/views/MapView",
  "esri/widgets/ScaleBar",
  "esri/widgets/Search"
],
  function (
    Map,
    TimeExtent,
    ImageryLayer,
    MapView,
    ScaleBar,
    Search
  ) {
    $(document).ready(function () {
      const DEFAULT_SIZE = 300;
      const DEFAULT_YEAR = 2017;
      const MAX_IMAGE = 2000;

      // Get extent of the Palms in Dubai
      const palms1 = $('.rc-bookmark li a').get(7);
      const palms2 = $(palms1).attr('data-extent').split(',');

      let layer;

      const view = new MapView({
        container: 'map',
        extent: {
          xmin: Number(palms2[0]),
          ymin: Number(palms2[1]),
          xmax: Number(palms2[2]),
          ymax: Number(palms2[3]),
          spatialReference: {
            wkid: 102100
          }
        },
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
        constraints: {
          rotationEnabled: false
        },
        map: new Map({
          basemap: 'osm'
        })
      });
      view.when(async () => {
        await getLayer();
        addLens(
          DEFAULT_YEAR,
          DEFAULT_SIZE
        );
      });

      async function getLayer() {
        const url = $('.rc-theme li.active a').attr('data-url');
        const functionName = $('.rc-theme li.active a').attr('data-function');

        layer = new ImageryLayer({
          url,
          format: "jpg",
          renderingRule: {
            functionName
          },
          mosaicRule: {
            method: "attribute",
            sortField: "AcquisitionDate",
            sortValue: "2017/02/06, 12:00 AM",
            ascending: true,
            operation: "first",
            where: "CloudCover<=0.1"
          }
        });
        await layer.load();
      }

      view.watch('extent', $.debounce(250, true, function (e) {
        clearLensImages();
      }));
      view.watch('extent', $.debounce(250, function (e) {
        updateLensImages();
      }));

      view.ui.add(
        new ScaleBar({
          view
        }),
        {
          position: 'bottom-left'
        }
      );

      view.ui.add(
        new Search({
          view,
          popupEnabled: false
        }),
        {
          position: 'top-left',
          index: 0
        }
      );

      $('.dropdown-menu li a').click(async function () {
        if ($(this).parent().parent().hasClass('rc-bookmark')) {
          const coordinates = $(this).attr('data-extent').split(',');
          view.extent = {
            xmin: Number(coordinates[0]),
            ymin: Number(coordinates[1]),
            xmax: Number(coordinates[2]),
            ymax: Number(coordinates[3]),
            spatialReference: {
              wkid: 102100
            }
          };

          clearLensImages();
          updateLensImages();
        }

        if ($(this).parent().parent().hasClass('rc-theme')) {
          if ($(this).parent().hasClass('active')) { return; }

          $(this).parent().addClass('active').siblings().removeClass('active');

          const theme = $('.rc-theme li.active a').html();
          $('.rc-theme').siblings('a').find('.rc-item-value').html(theme);

          await getLayer();

          clearLensImages();
          updateLensImages();
        }

        if ($(this).parent().parent().hasClass('rc-year')) {
          const year = $(this).attr('data-year');

          if (year === 'close-all') {
            $('.rc-window').remove();
            return;
          }

          addLens(
            year,
            DEFAULT_SIZE
          );
        }
      });

      $('#buttonHelp').click(function () {
        $('#modalHelp').modal('show');
      });
      $('#buttonAbout').click(function () {
        $('#modalAbout').modal('show');
      });

      function addLens(year, size) {
        const left = view.width / 2 - size / 2;
        const top = view.height / 2 - size / 2;

        const window = $(document.createElement('div')).addClass('rc-window').css({
          position: 'absolute',
          left: left + 'px',
          top: top + 'px',
          width: size + 'px',
          height: size + 'px'
        }).data({
          year
        });

        window.touch({
          canTranslate: true,
          canRotate: true,
          canScale: true,
          touchStart: (e) => {
            $(e.object).bringToFont('.rc-window');
            $(e.object).css({
              cursor: 'grabbing'
            });
          },
          touchMove: (e) => {
            const transform = `translate(${-e.x}px,${-e.y}px) scale(${1 / e.s}) rotate(${-e.r}deg)`;

            $(e.object).children('.rc-window-image').css({
              transform
            });
          },
          touchEnd: (e) => {
            $(e.object).css({
              cursor: 'grab'
            });
          }
        });

        window.append(
          $(document.createElement('img'))
            .attr('src', 'img/loading-throb.gif')
            .css({
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '33px',
              'margin-top': '-20px',
              'margin-left': '-17px',
              'pointer-events': 'none'
            })
        );

        window.append(
          $(document.createElement('div')).addClass('rc-window-image').css({
            position: 'absolute',
            left: -left + 'px',
            top: -top + 'px',
            width: view.width + 'px',
            height: view.height + 'px',
            'pointer-events': 'none',
            'background-size': 'cover',
            'background-repeat': 'no-repeat',
            'background-image': 'none'
          })
        );

        window.append(
          $(document.createElement('div')).css({
            position: 'absolute',
            left: '0',
            top: '0',
            color: 'rgba(255, 255, 255, 0.5)',
            'font-size': '24px',
            'font-weight': 700,
            'pointer-events': 'none',
            'margin-top': '1px',
            'margin-left': '5px'
          }).html(year)
        );

        $('#map-container').append(
          window
        );

        clearLensImages();
        updateLensImages();
      }

      async function getImageUrl(year) {
        const max = Math.max(view.width, view.height);
        const scale = max <= MAX_IMAGE ? 1 : MAX_IMAGE / max;

        const width = Math.min(Math.round(scale * view.width), MAX_IMAGE);
        const height = Math.min(Math.round(scale * view.height), MAX_IMAGE);

        const fetchResult = await layer.fetchImage(
          view.extent,
          width,
          height,
          {
            timeExtent: new TimeExtent({
              start: new Date(0),
              end: Date.UTC(year, 0, 1) 
            })
          }
        );
        const pixelBlock = fetchResult.pixelData.pixelBlock;
        const rgba = pixelBlock.getAsRGBA();

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        const imageData = context.createImageData(width, height);
        imageData.data.set(rgba);
        context.putImageData(imageData, 0, 0);

        return canvas.toDataURL('image/jpeg', 1.0);
      }

      function clearLensImages() {
        $('.rc-window').each(function () {
          $(this).children('.rc-window-image').css({
            'background-image': 'none'
          });
        });
      }

      function updateLensImages() {
        $('.rc-window').each(async function () {
          const year = $(this).data().year;
          const url = await getImageUrl(year);
          $(this).children('.rc-window-image').css({
            width: view.width + 'px',
            height: view.height + 'px',
            'background-image': function () {
              return `url(${url})`;
            }
          });
        });
      }
    });

    $.fn.bringToFont = function (selector) {
      let max = Math.max.apply(null, $(this).siblings(selector).map(function () {
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
