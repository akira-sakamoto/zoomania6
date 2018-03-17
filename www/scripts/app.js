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
        });
      }, 100);
    },

    /**
     * 園内マップ
     */
    map: function() {
      console.log('_pageList.map <<');

      var zooMap = $("#zooMap");
      var prevScale = 1;
      var scale = 1;

      $(zooMap).on("transform", function(event) {
        console.log("transform");
        var gesture = getGesture(event);
        scale = Math.max(0.5, Math.min(prevScale * gesture.scale, 3));
        console.log("scale = " + scale);
        zooMap.css({transform: "scale(" + scale + "," + scale + ")"});
      });
      
      $(zooMap).on("release", function(event) {
        console.log("release");
        prevScale = scale;
      })
      
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
  if (!isUndefinedOrNull(option) && (typeof option === 'string')) {
    // すごくダサいけれど選択された動物をグローバル変数に記憶する
    selectedAnimal = option.trim();
  }
  var nav = document.querySelector('#navigator');
  nav.pushPage(page, options);
  console.log('myPushPage >>');
}


/**
 * null チェック
 * @param {any} value
 * @return {boolean} 判定結果を返す
 */
function isUndefinedOrNull(value) {
  return isUndefined(value) || value === null;
}
function isUndefined(value) {
  return typeof value === 'undefined';
}

/**
 * event.gesture を取り出す
 * @param {Event} event
 * @return {object} event.gesture を返す
 */
function getGesture(event) {
  // ドキュメントでは event.originalEvent.gesture から取り出すことになっているが
  // 実行すると originalEvent が存在しないので event.gesture を使う
  if (isUndefinedOrNull(event.originalEvent)) {
    return event.gesture;
  }
  return event.originalEvent.gesture;
}
