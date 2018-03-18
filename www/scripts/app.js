// This is a JavaScript file

(function() {
  /**
   * @pravate {object} 読み込んだ動物データを保持する
   */
  var _zooData = [];
  
  var _useDebug = true;
  
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
      });
      
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
        if (_useDebug) {
          var qrValue = {
            text: "projectName=Utsunomiya&projectVersion=1.0&projectType=animal&itemId=lion&hash=aae60e5174462fbef17d4dbe4d0e34dc96b93d38",
            format: "xx",
            cancelled: ""
          };
          decodeQrCode(qrValue);
        } else {
          if (window.plugins === undefined) {
            // エラーメッセージ
            $('#qrResultMessage').text('QRコードスキャナは使えません');
            return;
          } else {
            window.plugins.barcodeScanner.scan(function(result) {
              // successコールバック
              if (result.cancelled) {
                // キャンセルされたらなにもしない
                return;
              }
              // デコード
              decodeQrCode(result);
            }, function(error) {
              // エラーコールバック
              $('#qrResultMessage').text(error);
            });
          }        
        }
        console.log('_pageList.qrscan <<');
      }
    }
  };

  function decodeQrCode(scanedValue) {
    // 結果をデコードする
    var qrArray = scanedValue.text.split(/&/g);
    qrArray.forEach(function(keyValue) {
      var args = keyValue.split(/=/);
      console.log(args[0] + " = " + args[1]);
    });
    // projectName
    // projectVersion
    // projectType
    // itemId
    // hash
    console.dir(qrArray);
            
    // 結果テキストを表示する
    $('#qrResultMessage').text(scanedValue.text);
  
    // URLならばブラウザでひらくボタンを表示する
//    if (result.text.indexOf('http') === 0) {
//      $('#qrBrowserOpenButton').show();
//    } else {
//      $('#qrBrowserOpenButton').hide();
//    }
  }
  
  // addEventListener("init") の前に実行することで android 用のスタイル適用を
  // 抑止できるチートらしいが、ons なんか知らないと怒られる
  // ons.disableAutoStyling();
  
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
