// This is a JavaScript file

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
    console.log("debugPageList: " + i + " - " + child.id);
  }
}

/**
 * 現在のページを探す
 * @param {String} pageId 
 * @return {Object}   現在のページを返す
 */
function getNowPage(pageId) {
  var onsPageArray = document.querySelectorAll("ons-page");
  // ページスタックの末尾から探す
  for (var i = onsPageArray.length - 1; i >= 0; i--) {
    var page = onsPageArray[i];
    // 表示されているページが対象
    if (page.style.display !== "none") {
      if (!isUndefinedOrNull(pageId)) {
        // ページ指定あり
        if (!isUndefinedOrNull(page.id)) {
          if (page.id === pageId) {
            // 指定のページが見つかった
            return page;
          }
        }
      } else {
        // ページ指定なし
        // 親を探していく
        var parentNode = page.parentNode;
        if (parentNode.tagName.toLowerCase() === "ons-navigator") {
          // 親まで探した
          return page;
        } else {
          // tagBarなど、ons-page内に書かれたons-page
          while (true) {
            try {
              parentNode = parentNode.parentNode;
              if (parentNode.tagName.toLowerCase === "ons-page") {
                break;
              }
            } catch (error) {
              parentNode = undefined;
              break;
            }
          }
          if (isUndefinedOrNull(parentNode)) {
            // 親ons-pageが無いときは最初に見つけたons-navigator直下でないons-pageを
            // 現在表示中のページとして扱う
            return page;
          }
          // 親ons-page無いの子ons-pageを探す
          var onsPageChildArray = parentNode.querySelectorAll("ons-page");
          if (onsPageChildArray.length === 1) {
            return onsPageChildArray[0];    // 実質的にonsPageArray[i]と同じものになる
          }
          // ons-tab内を探す
          var onsTabArray = parentNode.querySelectorAll("ons-tab");
          var activeIndex = -1;
          for (var j = 0; j < onsTabArray.length; j++) {
            if (onsTabArray[j].hasAttribute("active")) {
              activeIndex = j;
              break;
            }
            if (activeIndex !== -1 && activeIndex < onsPageChildArray.length) {
              // activeとなっているons-tabが見つからないときは例の謎ページ
              return onsPageChildArray[activeIndex];
            }
            return page;
          }
        }
        return page;
      }
    }
  } // for
  // ons-pageがまったく見つからなかった
  return undefined;
}

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
  for (var i = 0; i < arguments.length; i++){
      if (typeof arguments[i] == "string") {
          message = arguments[i];
      } else {
          message = JSON.stringify(arguments[i]);
      }
      window.orig_console[level](message);
  }
}
