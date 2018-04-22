// This is a JavaScript file
  
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

  /**
   * QRコードスタブ
   */
  var _qrStub = [];
  
  /**
   * スタブ使用時のカウンタ
   */
  var _stubCount = 0;
  
  /**
   * @pravate {object} 読み込んだ動物データを保持する
   */
  var _zooData = [];

  /**
   * monacaデバッガと連動するconsoleを無効化する
   * @param {*} level 
   * @param {*} url 
   * @param {*} line 
   * @param {*} char 
   * @param {*} arguments 
   */
  var myConsoleLog = function(level, url, line, char, arguments) {
    // 普通にconsole.xxxを使用するとmonacaデバッガへ通信を行おうとして大量にエラーが発生するからそれを抑制する
    var message;
    for (var i=0; i<arguments.length; i++){
        if (typeof arguments[i] == "string") {
            message = arguments[i];
        } else {
            message = JSON.stringify(arguments[i]);
        }
        window.orig_console[level](message);
    }
  }

  /**
   * 初期化
   */
  ons.ready(function() {
    // 動物データ読み込み
    if (_zooData.length === 0) {
      $.getJSON('assets/zoodata.json', function(data) {
        _zooData = data;
        console.log('zoodata is loaded');
      });
    }
    if (isEmulator()) {
      // monacaデバッガを抑制する
      monaca.console.sendLog = myConsoleLog;

      // emulatorのときはスタブデータを読み込む
      if (_qrStub.length === 0) {
        $.getJSON("assets/qrstub.json", function(data) {
          _qrStub = data;
          console.log("qrstub is loaded");
        });
      }
    }
    // ログシステム初期化
    qrLog = new QRlog();
    
  /**
   * @private {object} ページリスト
   */
  var _pageList = {
    animalName: '',

    /**
     * メインメニュー
     */
    menu: function() {
      console.log('_pageList.menu <<');
      console.log('_pageList.menu >>');
    },
    
    /**
     * どうぶつずかん
     */
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
     * @param {Object} data 表示する動物情報{method: "bringPageTop", name: animal}
     */
    detail: function(data) {
      console.log("detail <<");
      console.log(data);
      var animalName;

      // 動物名が指定されているか
      if (!isUndefinedOrNull(data) && !isUndefinedOrNull(data.name)) {
        animalName = data.name;
      } else {
        // 本来はありえないがエラー防止
        data = {};
      }
      // QRから来たかを判断する
      if (!isUndefinedOrNull(data.qr) && data.qr) {
        // QR読み取りボタンを禁止する
        $("#buttonQRscan").hide();
        // ログを記録する
        qrLog.addLog(animalName);
        qrLog.listLog();
      } else {
        // QRから来なかった場合はQR読み取りボタンを有効にする
        $("#buttonQRscan").show();
      }

      setTimeout(function() {
        for (var i = 0; i < _zooData.length; i++) {
          var animal = _zooData[i];
          if (animal.jpName === animalName) {
            $('#zm_header-title')[0].innerText = animal.jpName;
            $('#photo').attr('src', animal.urlPhoto);
            $('#urlWiki').attr('href', animal.urlWiki);
            $('#jpName')[0].innerText = animal.jpName;
            $('#enName')[0].innerText = animal.enName;
            $('#zlName')[0].innerText = animal.zlName;
            var classified = animal.class + ' ' + animal.order + ' ' + animal.family;
            $('#classified')[0].innerText = classified;
            $('#description')[0].innerText = animal.description;
            // ログをしらべてトロフィーを表示する
            // QRから来たときはすでに登録済みになっている
            if (!isUndefinedOrNull(qrLog.getLog(animalName))) {
              $("#trophy").css("visibility", "visible");
            } else {
              $("#trophy").css("visibility", "hidden");
            }
            return;
          }
        }
      },100);

      console.log("detail >>");
    },

    /**
     * 園内マップ
     */
    map: function() {
      console.log('_pageList.map <<');

      var $zooMap = $("#zooMap");
      var scale, minScale, prevScale;

      // 描画完了を待っているつもり
      setTimeout(function() {
        // 本来の画像サイズ
        var mapImg = $("#zooMap")[0];
        var naturalW = mapImg.naturalWidth;
        var naturalH = mapImg.naturalHeight;

        // 描画領域のサイズ
        var areaW = $("ons-gesture-detector").width();
        var areaH = $("ons-gesture-detector").height();

        // スケール
        var scaleW = areaW / naturalW;
        var scaleH = areaH / naturalH;
        scale = (scaleW > scaleH) ? scaleW : scaleH;
        // これ以上小さくしない
        minScale = scale;
        prevScale = scale;
        
        // スケール後のサイズ
        var imgScaleW = naturalW * scale;
        var imgScaleH = naturalH * scale;

        // 位置補正
        var ofsW = (areaW - imgScaleW) / 2;
        var ofsH = (areaH - imgScaleH) / 2;

        var trans = scaleStr(scale) + translateStr(ofsW, ofsH);
        console.log("trans = " + trans);
        $zooMap.css({"transform-origin": "top left"})
               .css({"transform": trans});
      }, 100);


      // イベントハンドラ
      $zooMap.on("transform", function(event) {
        var gesture = getGesture(event);
        scale = Math.max(minScale, Math.min(prevScale * gesture.scale, 2));
        prevScale = scale;
        console.log("transform:" + scale);
        $zooMap.css({"transform": scaleStr(scale)});
      });

        $zooMap.on("drag", function(event) {
          var gesture = getGesture(event);
          var deltaX = gesture.deltaX;
          var deltaY = gesture.deltaY;
          var trans = scaleStr(scale) + translateStr(deltaX, deltaY);
          console.log("drag: " + trans);
          $zooMap.css({"transform": trans});
        });
        
        $zooMap.on("release", function(event) {
          // var trans = mapImg.style.transform;
          // console.log("release = " + trans);
          // prevScale = scale;
        });

      
      console.log('_pageList.map >>');

      function scaleStr(scale) {
        return sprintf("scale(%g,%g)", scale, scale);
      }
      function translateStr(deltaX, deltaY) {
        return sprintf("translate(%gpx,%gpx)", deltaX, deltaY);
        // "translate(" + deltaX + "px," + deltaY + "px)";
      }
      function translateXstr(delta) {
        return "translateX(" + delta + "px)";
      }
      function translateYstr(delta) {
        return "translateY(" + delta + "px)";
      }
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
      console.log("_pageList.qrscan <<");
      // $('#qrScanButton').click(function() {
      //   scanBarcode();
      //   return false;
      // });
      scanBarcode();
      console.log("_pageList.qrscan >>");
    }
  };

  /**
   * スキャンボタン押下時
   */
  function scanBarcode() {
    console.log("scanBarcode <<");
    if (isEmulator()) {
      // 実機ではないとき

      var qrValue = {
        format: "xx",
        cancelled: ""
      };
      qrValue.text = _qrStub[_stubCount];
      _stubCount = (_stubCount + 1) % _qrStub.length;
      decodeQrCode(qrValue);
    } else {
      // 実機のとき
      if (window.plugins === undefined) {
        // エラーメッセージ
        $('#qrResultMessage').text('QRコードスキャナは使えません');
      } else {
        // 実機かつカメラが使える
        window.plugins.barcodeScanner.scan(function(result) {
          // successコールバック
          if (result.cancelled) {
            // キャンセルされたらなにもしない
          } else {
            // デコード
            decodeQrCode(result);
          }
        }, function(error) {
          // エラーコールバック
          $('#qrResultMessage').text(error);
        });
      }        
    }
    console.log('scanBarcode <<');
  }

  /**
   * 結果をデコードする
   * @param {Object} scanedValue QRコードスキャン結果
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
    return qrLog.countLog();
  }
  
  // addEventListener("init") の前に実行することで android 用のスタイル適用を
  // 抑止できるチートらしいが、ons なんか知らないと怒られる
  // ons.disableAutoStyling();

  
  // Page init event
  // ページ遷移ごとに実行される  
  document.addEventListener('init', function(event) {
    console.log('init <<');

    var nav = nowPage();
    debugPageList();

    // ヘッダを作る
    var target = $(nav).find("#headerArea");
    // var target = $("#headerArea");
    if (!isUndefinedOrNull(target)) {
      var header = $("#zm_header-html").clone();
      var title = $(target).attr("title");
      if (!isUndefinedOrNull(title)) {
        $(header).find("#zm_header-title").text(title);
      }
      var home = $(target).attr("home");
      if (!isUndefinedOrNull(home)) {
        $(header).find("#home-button").show();
      }
      $(header).appendTo(target).show();

      // ホームボタン
      $(".home-button").click(function(event) {
        var nav = document.querySelector("#navigator");
        nav.resetToPage("menu.html");
      });
    }

    // 各ページごとにコントローラを設定する
    var page = event.target;
    console.log("page.id = " + page.id + ", page.data = " + page.data);
    var onsNav = $("ons-navigator");
    var nav = navigator;
    var navKeys = Object.keys(onsNav);
    for (var name in navKeys) {
      console.log("name = " + onsNav[navKeys[name]]);
    }
    _pageList[page.id](page.data);

    console.log('init >>');
  });
//})();
});

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
    // nav.bringPageTop(page, options);
  // } else {
     nav.pushPage(page, options);
  // }
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

/**
 * emulatorで実行しているか
 * @return {boolean} emulatorで実行しているときにtrue
 */
function isEmulator() {
  return typeof cordova === "undefined";
}

/**
 * 現在のページを取得する
 * @param {String} pageId 探したいページID
 * @return {DOM} 現在ページのDOM要素を返す
 */
function nowPage(pageId) {
  console.log("nowPage << " + pageId);
  var nav = document.querySelector("ons-navigator");
  var childNodes = $(nav).find("ons-page");
  console.log("nowPage: length = " + childNodes.length);
  var ret = nav;
  for (var i = (childNodes.length - 1); i >= 0; i--) {
    var child = childNodes[i];
    console.log("nowPage = " + child.id);
    if ($(child).css("display") != "none") {
      if (!isUndefinedOrNull(pageId)) {
        if (child.id === pageId) {
          ret = child;
          break;
        }
      } else {
        ret = child;
        break;
      }
    }
  }
  console.log("nowPage >> " + ret);
  return ret;
}

function debugPageList() {
  var nav = document.querySelector("ons-navigator");
  var childNodes = $(nav).find("ons-page");
  for (var i = (childNodes.length - 1); i >= 0; i--) {
    var child = childNodes[i];
    console.log("debugPageList " + i + " " + child.id);
  }
}