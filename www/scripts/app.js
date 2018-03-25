// This is a JavaScript file

  /**
   * デバッグモード
   * @private
   */
  var _useDebug = true;
  
  /**
   * HASHのsalt
   * @property {String}
   */
  var shaSalt = "QRcodeGenerator";
  
  /**
   * QRログ
   *    24時にリセットされる
   */
  var qrLog = null;

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
      console.log('_pageList.menu <<');
      // 動物データ読み込み
      if (_zooData.length === 0) {
        $.getJSON('assets/zoodata.json', function(data) {
          _zooData = data;
          console.log('zoodata is loaded');
        });
      }
      // QRログデータ読み込み
      // if (isUndefinedOrNull(qrLog)) {
      //   // ローカルストレージから読み込む
      //   var storage = windows.localStorage;
      //   var log = storage.getItem("qrLog");
      //   if (!isUndefined(log)) {
      //     qrLog = log;
      //   } else {
      //     qrLog = {};
      //   }
      // }

      console.log('_pageList.menu >>');
    },
    
    book: function() {
      var animalList = $('#animalList')[0];
      // console.dir(animalList);
      animalList.delegate = {
        createItemContent: function(index) {
          var animal = _zooData[index];
          var thumbnail = "assets/image/thumbnails/" + animal.thumbnail;
          var element = 
            "<ons-list-item>" +
              "<div class='animalListDiv' onclick='myPushPage(\"detail.html\", this.innerText)'>" +
                "<img src='" + thumbnail + "' class='thumbnail'>" +
                "<div class='animalListName'>" +
                  animal.jpName +
                  "<div class='fa bookTrophy'></div>" +
                "</div>" +
              "</div>" +
            "</ons-list-item>";
          return ons.createElement(element);
        },
        countItems: function() {
          return _zooData.length;
        },
        hasTrophy: function(index) {
          return isUndefinedOrNull(_zooData[index].qrChecked);
        }
      };
      animalList.refresh();
    },
    
    /**
     * 動物詳細情報
     */
    detail: function(data) {
      console.log("detail <<");
      console.log(data);
      var animalName;
      if (!isUndefinedOrNull(data) && !isUndefinedOrNull(data.name)) {
        animalName = data.name;
      }
      
      setTimeout(function() {
        for (var i = 0; i < _zooData.length; i++) {
          var animal = _zooData[i];
          if (animal.jpName === animalName) {
            if (isUndefinedOrNull(data.qrChecked)) {
              animal.qrChecked = new Date();
            }
            $('#title')[0].innerText = animal.jpName;
            $('#photo').attr('src', animal.urlPhoto);
            $('#urlWiki').attr('href', animal.urlWiki);
            $('#jpName')[0].innerText = animal.jpName;
            $('#enName')[0].innerText = animal.enName;
            $('#zlName')[0].innerText = animal.zlName;
            var classified = animal.class + ' ' + animal.order + ' ' + animal.family;
            $('#classified')[0].innerText = classified;
            $('#description')[0].innerText = animal.description;
            if (!isUndefinedOrNull(animal.qrChecked)) {
              $("#trophy").css("visibility", "visible");
            } else {
              $("#trophy").css("visibility", "hidden");
            }
            return;
          }
        }
      },1000);
      console.log("detail >>");
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
     * おたのしみ
     */
    pleasure: function() {
      console.log("_pageList.pleasure <<");
      var checked_animal = checkedAnimals();
      $("#checked_animals").text(checked_animal);
      $("#total_animals").text(_zooData.length);
      console.log("_pageList.pleasure >>");
    },

    /**
     * 飼育員ブログ
     */
    blog: function() {
      console.log("_pageList.blog <<");
      console.log("_pageList.blog >>");
    },

    /**
     * ホームページ
     */
    homepage: function() {
      console.log("_pageList.homepage <<");
      console.log("_pageList.homepage >>");
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
      
      var stubCount = 0;
      /**
       * スキャンボタン押下時
       */
      function scanBarcode() {
        if (_useDebug) {
          var stub = [
            "projectName=Utsunomiya&projectVersion=1.0&projectType=animal&itemId=ライオン&hash=6f328928900b3000925be62fde1f72ebc83ce3a1",
            "projectName=Utsunomiya&projectVersion=1.0&projectType=animal&itemId=シロテテナガザル&hash=1367b2342b348b4b4f7ff43c8e7d969edb877dc0",
            "projectName=Utsunomiya&projectVersion=1.0&projectType=animal&itemId=ニホンザル&hash=9dcb507dde1b03cd87fa852a19dd9605d1dc0582"
          ];
          var qrValue = {
            format: "xx",
            cancelled: ""
          };
          qrValue.text = stub[stubCount];
          stubCount = (stubCount + 1) % stub.length;
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

  /**
   * 結果をデコードする
   */
  function decodeQrCode(scanedValue) {
    // 結果をデコードする
    var qrArray = scanedValue.text.split(/&/g);
    var kvPair = [];
    qrArray.forEach(function(keyValue) {
      var kv = keyValue.split(/=/);
      var key = kv[0];
      var value = kv[1];
      kvPair[key] = value;
    });
    console.log(kvPair);
    
    // パラメータチェック
    if (!checkParameters(kvPair)) {
      // QRコード不正
      ons.notification.alert("QRコードが読み取れませんでした");
    }
      
    // 動物詳細へジャンプ
    var animal = kvPair.itemId;
    myPushPage("detail.html", {method: "bringPageTop", name: animal});
    
  }

  /**
   * QRコードでチェックした動物数をカウントする
   * @return {Number} QRコードでチェックした動物数を返す
   */
  function checkedAnimals() {
    var sum = 0;
    for (var i = 0; i < _zooData.length; i++) {
      sum++;
    }
    return sum;
  }
  
  // addEventListener("init") の前に実行することで android 用のスタイル適用を
  // 抑止できるチートらしいが、ons なんか知らないと怒られる
  // ons.disableAutoStyling();

  
  // Page init event
  // ページ遷移ごとに実行される  
  document.addEventListener('init', function(event) {
    console.log('init <<');
    
    // 各ページごとにコントローラを設定する
    var page = event.target;
    _pageList[page.id](page.data);
    console.log("page.id = " + page.id + ", page.data = " + page.data);
    console.log('init >>');
  });
})();

/**
 * pushPageの代替
 * @param {string} page     遷移先のhtml
 * @param {object} options  オプションを指定するオブジェクト
 */
function myPushPage(page, option) {
  console.log('myPushPage ' + page + ', ' + option + ' <<');
  
  var options = {};
  var data = {};
  var method = "pushPage";
  var animalName;
  
  if (!isUndefinedOrNull(option)) {
    if (typeof option === "object") {
      // QRスキャンで来たときはオブジェクトで渡される
      animalName = option.name;
      method = option.method;
      data.qr = true;
    } else if (typeof option === 'string') {
      // 動物リストをクリックされたときは動物名が直接渡される
      animalName = option.trim();
    }
    data.name = animalName;
    options.data = data;
  }
  var nav = document.querySelector('#navigator');
  //if (method === "bringPageTop") {
    nav.bringPageTop(page, options);
  //} else {
  //  nav.pushPage(page, options);
  //}
  console.log('myPushPage >>');
}

/**
 * パラメータチェック
 * @param {Array} params  チェックするパラメータ
 * @return {Boolean}      パラメータが正しいときに true
 */
function checkParameters(params) {
  var result = true;
  
  // projectName
  var projectName = params.projectName;
  if (isUndefinedOrNull(projectName))
    return false;
  if (projectName !== "Utsunomiya")
    return false;

  // projectType
  var projectType = params.projectType;
  if (isUndefinedOrNull(projectType))
    return false;
  
  // projectVersion
  var projectVersion = params.projectVersion;
  if (isUndefinedOrNull(projectVersion))
    return false;
  var version = Number(projectVersion);
  if (version < 2.0) {
    // animalのみ  
    if (projectType !== 'animal')
      return false;
  }
  
  // itemId
  var itemId = params.itemId;
  if (isUndefinedOrNull(itemId))
    return false;
  
  // hash
  var paramHash = params.hash;
  if (isUndefinedOrNull(paramHash))
    return false;
  var hashStr = "projectName=" + projectName +
                "&projectVersion=" + projectVersion +
                "&projectType=" + projectType +
                "&itemId=" + itemId;
  var hashObj = new jsSHA("SHA-1", "TEXT");
  hashObj.update(shaSalt);
  hashObj.update(encodeURI(hashStr));
  var getHash = hashObj.getHash("HEX");
  console.log("paramHash = " + paramHash);
  console.log("getHash = " + getHash);
  if (paramHash !== getHash)
    return false;
  
  return true;
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
