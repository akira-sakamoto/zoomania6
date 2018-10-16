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
 * ビンゴテーブル
 */
var _bingoSheet = [];

/**
 * ソフトリセット
 */
function softReset() {
  // ビンゴシートを用意する
  if (isUndefinedOrNull(loadBingo())) {
    // ビンゴの準備
    makeBingo();
  }
  // QRコードをリセットする
  // ログシステム初期化
  qrLog = new QRlog();
}

/**
 * 初期化
 */
ons.ready(function() {
  // 動物データ読み込み
  if (_zooData.length === 0) {
    $.getJSON("assets/zoodata.json", function(data) {
      _zooData = data;
      console.log("zoodata is loaded");
      softReset();      
    });
  }

  // 実機でないときの処理
  if (isEmulator()) {
    // monacaデバッガを抑制する
    monaca.console.sendLog = myConsoleLog;

    // スタブデータを読み込む
    if (_qrStub.length === 0) {
      $.getJSON("assets/qrstub.json", function(data) {
        _qrStub = data;
        console.log("load qrstub");
      });
    }
  }

  
  /**
   * @private {object} ページリスト
   */
  var _pageList = {
    animalName: "",

    /**
     * メインメニュー
     */
    menu: function() {
      console.log("_pageList.menu <<");
      console.log("_pageList.menu >>");
    },
    
    /**
     * どうぶつずかん
     */
    book: function() {
      console.log("_pageList.book <<");
      var $page = $(nowPage());
      var animalList = $page.find("#animalList")[0];
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
      console.log("_pageList.book >>");
    },
    
    /**
     * 動物詳細情報
     * @param {Object} data 表示する動物情報{method: "bringPageTop", name: animal}
     */
    detail: function(data) {
      console.log("detail <<");
      var p = getNowPage();
      var $page = $(nowPage());
      var animalName;

      // 動物名が指定されているか
      if (!isUndefinedOrNull(data) && !isUndefinedOrNull(data.name)) {
        animalName = data.name;
      } else {
        // 本来はありえないがエラー防止
        data = {};
      }
      
      // QR読み取りボタンおよび戻るボタンを表示する
      var showQRbutton = true;

      // QRから来たかを判断する
      if (!isUndefinedOrNull(data.qr) && data.qr) {
        console.log("QRから来た")
        // QR読み取りボタンと戻るボタンを禁止する
        showQRbutton = false;
        // ログを記録する
        qrLog.addLog(animalName);
        qrLog.listLog();
      }

      setTimeout(function() {
        for (var i = 0; i < _zooData.length; i++) {
          var animal = _zooData[i];
          if (animal.jpName === animalName) {
            $page.find("#zm_header-title")[0].innerText = animal.jpName;
            $page.find("#photo").attr("src", animal.urlPhoto);
            $page.find("#urlWiki").attr("href", animal.urlWiki);
            $page.find("#jpName")[0].innerText = animal.jpName;
            $page.find("#enName")[0].innerText = animal.enName;
            $page.find("#zlName")[0].innerText = animal.zlName;
            var classified = animal.class + " " + animal.order + " " + animal.family;
            $page.find("#classified")[0].innerText = classified;
            if (!isUndefinedOrNull(animal.description)) {
              $page.find("#description")[0].innerText = animal.description;
            }
            // ログをしらべてトロフィーを表示する
            // QRから来たときはすでに登録済みになっている
            if (!isUndefinedOrNull(qrLog.getLog(animalName))) {
              $page.find("#trophy").css("visibility", "visible");
            } else {
              $page.find("#trophy").css("visibility", "hidden");
            }
            if (showQRbutton) {
              $page.find("#buttonQRscan").show();
              $page.find("#zm_backButton").show();
            } else {
              $page.find("#buttonQRscan").hide();
              $page.find("#zm_backButton").hide();
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
      console.log("_pageList.map <<");

      var $page = $(nowPage());
      var $zooMap = $page.find("#zooMap");
      var scale, minScale, prevScale;

      // 描画完了を待っているつもり
      setTimeout(function() {
        // 本来の画像サイズ
        // var mapImg = $("#zooMap")[0];
        var mapImg = $zooMap[0];
        var naturalW = mapImg.naturalWidth;
        var naturalH = mapImg.naturalHeight;

        // 描画領域のサイズ
        var $detector = $($page.find("ons-gesture-detector"));
        var areaW = $detector.width();
        var areaH = $detector.height();

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

      
      console.log("_pageList.map >>");

      function scaleStr(scale) {
        return sprintf("scale(%.3f,%.3f)", scale, scale);
      }
      function translateStr(deltaX, deltaY) {
        return sprintf("translate(%.3fpx,%.3fpx)", deltaX, deltaY);
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
     * サブメニュー
     */
    contents: function() {
      console.log("_pageList.contents <<");
      console.log("_pageList.contents >>");
    },

    /**
     * ヘルプ
     */
    help: function() {
      console.log("_pageList.help <<");
      console.log("_pageList.help >>");
    },

    /**
     * おたのしみ
     */
    pleasure: function() {
      console.log("_pageList.pleasure <<");
      var $page = $(nowPage());
      var checked_animal = checkedAnimals();
      $page.find("#checked_animals").text(checked_animal);
      $page.find("#total_animals").text(_zooData.length);

      // ビンゴを表示する
      var bingo = showBingo();

      // スタンプラリーをリセットする
      // スタンプラリーのラベル部分を長押しすることでリセットする
      $($page.find("#bingo")).on("hold", function(e) {
        if (bingo) {
          ons.notification.confirm({
            title: "係員専用",
            message: "スタンプラリーを初期化してもいいですか？",
            callback: function(answer) {
              if (answer === 1) {
                window.localStorage.clear();
                // ビンゴシートを初期化
                softReset();
                var nav = document.querySelector("#navigator");
                nav.resetToPage("menu.html");
              }
            }
          });
        }
      });
      console.log("_pageList.pleasure >>");
    },

    /**
     * 飼育員ブログ
     */
    blog: function(param) {
      console.log("_pageList.blog <<");
      if (!isUndefinedOrNull(param.url)) {
        var $page = $(nowPage());
        $page.find("#zm_header-title").text(param.title);
        $page.find("#iframe").attr("src", param.url);
      }
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
     * ライセンス
     */
    license: function() {
      console.log("_pageList.license <<");
      console.log("_pageList.license >>");
    },
    
    /**
     * QRコードスキャン
     */
    qrscan: function() {
      console.log("_pageList.qrscan <<");
      console.log("_pageList.qrscan >>");
    }
  }; // _pageList


// addEventListener("init") の前に実行することで android 用のスタイル適用を
// 抑止できるチートらしいが、ons なんか知らないと怒られる
// ons.disableAutoStyling();


  // Page init event
  // ページ遷移ごとに実行される  
  document.addEventListener("init", function(event) {
    console.log("init <<");

    var x = getNowPage();
    var $page = $(nowPage());
    debugPageList();

    // ヘッダを作る
    var target = $page.find("#headerArea");
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

    // コントローラを呼び出す
    var page = event.target;
    _pageList[page.id](page.data);
    console.log("init >>");
  });
//})();
}); // ons.ready


/**
 * スキャンボタン押下時
 */
function scanBarcode() {
  console.log("scanBarcode << " + _stubCount);
  if (isEmulator()) {
    // 実機ではないとき
    var qrValue = {};
    // ダミーデータから取得する
    qrValue.text = _qrStub[_stubCount];
    _stubCount = (_stubCount + 1) % _qrStub.length;
    decodeQrCode(qrValue);
  } else {
    // 実機のとき
    if (window.plugins === undefined) {
      // エラーメッセージ
      $("#qrResultMessage").text("QRコードスキャナは使えません");
    } else {
      // 実機かつカメラが使える
      window.plugins.barcodeScanner.scan(function(result) {
        // successコールバック
        if (result.cancelled) {
          // キャンセルされたらなにもしない
        } else {
          // デコード
          setTimeout(function() {
            decodeQrCode(result);
          }, 1000);
        }
      }, function(error) {
        // エラーコールバック
        $("#qrResultMessage").text(error);
      });
    }        
  }
  console.log("scanBarcode <<");
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


/**
 * pushPage再入防止カウンタ
 *    pushPage完了前に呼び出すとエラーになるため、完了を確認するためのカウンタ
 * @private
 */
var __global_myPushPageCounter = 0;

/**
 * pushPageの代替
 * @param {string} page     遷移先のhtml
 * @param {object} options  オプションを指定するオブジェクト
 */
function myPushPage(page, option) {
  console.log("myPushPage " + page + ", " + option + " << counter = " + __global_myPushPageCounter);

  var options = {};
  var data = {};
  var method = "pushPage";
  var animalName;

  if (!isUndefinedOrNull(option)) {
    if (typeof option === "object") {
      // QRスキャンで来たときはオブジェクトで渡される
      if (!isUndefinedOrNull(option.url)) {
        switch (option.url.toLowerCase()) {
          case "terms":
          case "company":
            data.title = option.title;
            data.url = "http://araten.co.jp";
        }
      } else {
        // homepage以外はQRから来た動物情報とみなす
        animalName = option.name;
        method = option.method;
        data.qr = true;
      }
    } else if (typeof option === "string") {
      // 動物リストをクリックされたときは動物名が直接渡される
      animalName = option.trim();
    }
    data.name = animalName;
    options.data = data;
  }
  // pushPage完了後に呼び出されるcallback
  // 再入防止カウンタをリセットする
  options.callback = function() {
    console.log("pushPage callback " + __global_myPushPageCounter);
    __global_myPushPageCounter = 0;
  }

  // var x = document.querySelectorAll("#navigator");
  var nav = document.querySelector("#navigator");
  //if (method === "bringPageTop") {
    // nav.bringPageTop(page, options);
  // } else {

  // ホームページ遷移は options.url
  // 動物図鑑は options.data
  if (__global_myPushPageCounter === 0) {
    __global_myPushPageCounter++;
    nav.pushPage(page, options)
    .then(function() {
      console.log("pushPage done ---- " + __global_myPushPageCounter);
      __global_myPushPageCounter = 0;
    });
  } else {
    console.log("pushPage counter is not 0");
  }

  // }
  console.log("myPushPage >>");
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
    if (projectType !== "animal")
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
 * ビンゴを用意する
 */
function makeBingo() {
  console.log("makeBingo <<");
  // テーブルリセット
  _bingoSheet = [];
  // 誰もが同じ結果になるように日付をキーにする
  var date = new Date();
  var seed = (date.getFullYear() * 10000) + ((date.getMonth() + 1) * 100) + date.getDate();
  // 最初の動物を決定する
  var start = seed % _zooData.length;
  // 収集する間隔を曜日から決定する
  // mod が 0 になることがあるので +1 しておく
  var skip = (_zooData.length % (date.getDay() + 1)) + 1;
  // 複数回選択しないように
  var usedAnimal = [];
  for (var i = 0; i < _zooData.length; i++) {
    usedAnimal[i] = 0;
  }
  var index = start;
  // ビンゴシートのポジション数は9
  for (var i = 0; i < 9; i++) {
    // 未使用の動物を探す
    if (usedAnimal[index] === 0) {
      usedAnimal[index] = 1;
      // シートのポジションは乱数で決定
      var randomPosition;
      do {
        randomPosition = Math.floor(Math.random() * 9);
      } while(!isUndefinedOrNull(_bingoSheet[randomPosition]));
      _bingoSheet[randomPosition] = index;
    }
    index += skip;
  }
  // ビンゴシートを保存する
  window.localStorage.setItem("zm_bingoSheet", JSON.stringify(_bingoSheet));
  console.log("makeBingo >>");
}

/**
 * ローカルストレージからビンゴシートを取得する
 * @return {Object} 保存していたビンゴシートを返す
 */
function loadBingo() {
  console.log("loadBingo --");
  var sheet = window.localStorage.getItem("zm_bingoSheet");
  if (!isUndefinedOrNull(sheet)) {
    // 保存してあればビンゴシートとして使用する
    _bingoSheet = JSON.parse(sheet);
  }
  return sheet;
}

/**
 * ビンゴシートを表示する
 * @return {Boolean}  ビンゴになったことを返す(true)
 */
function showBingo() {
  console.log("showBingo <<");
  const PANELID = ["00", "01", "02", "10", "11", "12", "20", "21", "22"];
  var $page = $(nowPage());

  for (var i = 0; i < 9; i++) {
    var idx = _bingoSheet[i];
    var animal = _zooData[idx];
    console.log(i + " " + animal.jpName);
    // QRを読んでいれば置換する
    var log = qrLog.getLog(animal.jpName);
    if (!isUndefinedOrNull(log)) {
      var thumbnail = "assets/image/thumbnails/" + animal.thumbnail;
      var panel = $page.find("#bingo_" + PANELID[i]);
      panel.attr("src", thumbnail).addClass("hit");
    }
  }
  // hitチェック
  const checkList = [
    ["00", "01", "02"],
    ["10", "11", "12"],
    ["20", "21", "22"],
    ["00", "10", "20"],
    ["01", "11", "21"],
    ["02", "12", "22"],
    ["00", "11", "22"],
    ["02", "11", "20"]
  ];
  var bingo = false;
  for (var i = 0; i < checkList.length; i++) {
    bingo = checkBingo(checkList[i]);
    if (bingo) {
      // bingoしたら1秒後にアニメーション
      setTimeout(function() {
        $page.find("#label_bingo").show().addClass("bingo_animation");
      }, 1000);
      break;
    }
  }
  console.log("showBingo >>");
  return bingo;

  // ビンゴチェック
  function checkBingo(list) {
    var count = 0;
    for (var i = 0; i < 3; i++) {
      var elem = $page.find("#bingo_" + list[i]);
      count += (elem.is(".hit") ? 1 : 0);
    }
    return (count === 3);
  }
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

