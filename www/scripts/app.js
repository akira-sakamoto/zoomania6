// This is a JavaScript file

(function() {
  /**
   * @pravate {object} 読み込んだ動物データを保持する
   */
  var _zooData = [];
  
  /**
   * @private {object} ページリスト
   */
  var _pageList = {
    animalName: '',

    menu: function() {
      console.log('_pageList.menu');
    },
    
    book: function() {
      var animalList = $('#animalList')[0];
      // console.dir(animalList);
      animalList.delegate = {
        createItemContent: function(i) {
          var animal = _zooData[i];
          var thumbnail = "assets/image/thumbnails/" + animal.thumbnail;
          var element = 
            "<ons-list-item>" +
              "<div class='animalListDiv' onclick='myPushPage(\"detail.html\", this.innerText)'>" +
                "<img src='" + thumbnail + "' class='thumbnail'>" +
                "<div class='animalListName'>" +
                  animal.jpName +
                "</div>" +
              "</div>" +
            "</ons-list-item>";
          return ons.createElement(element);
        },
        countItems: function() {
          return _zooData.length;
        }
      };
      animalList.refresh();
    },
    
    /**
     * 動物詳細情報
     */
    detail: function() {
      setTimeout(function() {
        _zooData.forEach(function(animal) {
          if (animal.jpName === selectedAnimal) {
            $('#title')[0].innerText = animal.jpName;
            $('#photo').attr('src', animal.urlPhoto);
            $('#urlWiki').attr('href', animal.urlWiki);
            $('#jpName')[0].innerText = animal.jpName;
            $('#enName')[0].innerText = animal.enName;
            $('#zlName')[0].innerText = animal.zlName;
            var classified = animal.class + ' ' + animal.order + ' ' + animal.family;
            $('#classified')[0].innerText = classified;
            $('#description')[0].innerText = animal.description;
            return;
          }
        })
      }, 100);
    },

    /**
     * 園内マップ
     */
    map: function() {
      console.log('_pageList.map <<');
      createImageView({id:'mapImage', x:0, y:0});
      
      document.addEventListener('touchmove', function(event) {
        event.preventDefault();
      });
      
      function createImageView(params) {
        var view = {
          element: $('#mapImage'),
          x: params.x,
          y: params.y,
          scale: 1,
          prevScale: 1,
          
          init: function() {
            console.log('createImageView.init');
            this.element.on('drag', this.onDrag.bind(this));
            this.element.on('pinch', this.onPinch.bind(this));
            this.element.on('release', this.onRelease.bind(this));
            this.update();
          },
          
          onDrag: function(event) {
            console.log('createImageView.onDrag');
            this.element.addClass('dragging');
            var gesture = event.originalEvent.gesture;
            this.x = gesture.center.pageX;
            this.y = gesture.center.pageY;
            this.update();
          },

          onPinch: function(event) {
            console.log('createImageView.onPinch');
            var gesture = event.originalEvent.gesture;
            this.scale = Math.max(0.5, Math.min(this.prevScale * gesture.scale, 3));
            this.update();
          },
          
          onRelease: function(event) {
            console.log('createImageView.onRelease');
            this.prevScale = this.scale;
            this.element.removeClass('dragging');
          },
          
          update: function() {
            var transform = 'translate(' + this.x + 'px,' + this.y + 'px)'
                + ' scale(' + this.scale + ')';
            this.element.css('transform', transform);
            console.log('update: ' + transform);
          }
        };
        view.init();
      }
      console.log('_pageList.map >>');
    },

    /**
     * ヘルプ
     */
    help: function() {
      console.log('_pageList.help <<');
      console.log('_pageList.help >>');
    },

    /**
     * QRコードスキャン
     */
    qrscan: function() {
      console.log('_pageList.qrscan <<');
      $('#qrScanButton').click(function() {
        scanBarcode();
        return false;
      });

      /**
       * スキャンボタン押下時
       */
      function scanBarcode() {
        if (window.plugins === undefined) {
          // エラーメッセージ
          $('#qrResultMessage').text('QRコードスキャナは使えません');
        } else {
          window.plugins.barcodeScanner.scan(function(result) {
            // successコールバック
            if (result.cancelled) {
              // キャンセルされたらなにもしない
              return;
            }
            
            // 結果テキストを表示する
            $('#qrResultMessage').text(result.text);
  
            // URLならばブラウザでひらくボタンを表示する
            if (result.text.indexOf('http') === 0) {
              $('#qrBrowserOpenButton').show();
            } else {
              $('#qrBrowserOpenButton').hide();
            }
          }, function(error) {
            // エラーコールバック
            $('#qrResultMessage').text(error);
          });
        }
      };
      console.log('_pageList.qrscan <<');
    }

  };
  
  // Page init event
  // ページ遷移ごとに実行される
  document.addEventListener('init', function(event) {
    console.log('init <<');
    
    // 動物データ読み込み
    if (_zooData.length === 0) {
      $.getJSON('assets/zoodata.json', function(data) {
        _zooData = data;
        console.log('zoodata is loaded');
      });
    }

    // 各ページごとにコントローラを設定する
    var page = event.target;
    _pageList[page.id]();
      
    console.log('init >>');
  });
})();

/**
 * 選択された動物名を記録する
 * @type {string}
 */
var selectedAnimal = null;

/**
 * pushPageの代替
 * @param {string} page     遷移先のhtml
 * @param {object} options  オプションを指定するオブジェクト
 */
function myPushPage(page, option) {
  console.log('myPushPage ' + page + ', ' + option + ' <<');
  var options;
  if ((option !== undefined) && (typeof option === 'string')) {
    // すごくダサいけれど選択された動物をグローバル変数に記憶する
    selectedAnimal = option.trim();
  }
  var nav = document.querySelector('#navigator');
  nav.pushPage(page, options);
  console.log('myPushPage >>');
}


