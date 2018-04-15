// This is a JavaScript file

"use strict";

/* ログの構造 */
var logStruct = {
  id: "動物名",
  date: "アクセス日時",
  count: 0
}

/**
 * @class QRlog
 */
function QRlog() {
  console.log("QRlog.constructor <<");
  // 最後のアクセス時間を取得して this.lastLogDate にセットする
  this.getLastLogDate();

  // 日付を確認
  var lastYear, lastMonth, lastDay;
  if (!isUndefinedOrNull(this.lastLogDate)) {
    // 最終アクセス日が今日でなければ初期化
    var lastDate = new Date(this.lastLogDate);
    lastYear = lastDate.getFullYear();
    lastMonth = lastDate.getMonth();    // 0..11
    lastDay = lastDate.getDate();
  }
  var nowDate = new Date();
  var nowYear = nowDate.getFullYear();
  var nowMonth = nowDate.getMonth();
  var nowDay = nowDate.getDate();
  if (lastYear === nowYear && lastMonth === nowMonth && lastDay === nowDay) {
    // 一致したときはログを読み込む
    this.qrLogData = this.loadQRlog()
  } else {
    // 一致しないので初期化する
    window.localStorage.clear();
    this.setLastLogDate(nowDate);
    this.qrLogData = [];
  }
  console.log("QRlog.constructor >>");
}

/**
 * 最終アクセス時間を取得する
 * @return {Object}   最終アクセス時間を返す
 */
QRlog.prototype.getLastLogDate = function() {
  console.log("QRlog.getLastLogDate <<");
  if (isUndefinedOrNull(this.lastLogDate)) {
    this.lastLogDate = JSON.parse(window.localStorage.getItem("zm_lastLogDate"));
  }
  console.log("QRlog.getLastLogDate >> " + this.lastLogDate);
  return this.lastLogDate;
}

/**
 * 最終アクセス時間をセットする
 * @param {Object} date   最終アクセス時間
 */
QRlog.prototype.setLastLogDate = function(date) {
  console.log("QRlog.setLastLogDate <<");
  this.lastLogDate = date;
  window.localStorage.setItem("zm_lastLogDate", JSON.stringify(date));
  console.log("QRlog.setLastLogDate >>");
}

/**
 * ログデータを取得する
 * @param {String} id  動物ID
 * @return {Object} ログデータ全体あるいは指定されたデータを返す
 */
QRlog.prototype.loadQRlog = function(id) {
  console.log("QRlog.loadQRlog <<");
  if (isUndefinedOrNull(this.qrLogData)) {
    this.qrLogData = JSON.parse(window.localStorage.getItem("zm_qrLogData"));
  }
  var result = null;
  if (isUndefinedOrNull(id)) {
    // idが指定されないときはリスト全体を返す
    result = this.qrLogData;
  } else {
    // idが指定されているときは指定されたデータを返す
    for (var i = 0; i < this.qrLogData.length; i++) {
      if (this.qrLogData[i].id === id) {
        result = this.qrLogData[i];
        break;
      }
    }
  }
  console.log("QRlog.loadQRlog >>");
  return result;
}

/**
 * ログデータを保存する
 */
QRlog.prototype.saveQRlog = function() {
  console.log("QRlog.saveQRlog <<");
  if (!isUndefinedOrNull(this.qrLogData)) {
    window.localStorage.setItem("zm_qrLogData", JSON.stringify(this.qrLogData));
  }
  console.log("QRlog.saveQRlog >>");
}

/**
 * ログに記録する
 * @param {String} animalId 動物ID
 */
QRlog.prototype.addLog = function(animalId) {
  console.log("QRlog.addLog << " + animalId);
  // 現在時刻を取得する
  var date = new Date();
  var log = {};
  log.id = animalId;
  log.date = date;
  log.count = 1;      // 1回目

  // すでに登録済みかを探す
  var logItem = this.getLog(animalId);
  if (!isUndefinedOrNull(logItem)) {
    logItem.date = date;
    logItem.count++;
  } else {
    this.qrLogData.push(log);
  }
  // ログを保存する
  this.saveQRlog()

  // 最終アクセス時間をセットする
  this.setLastLogDate(date);

  console.log("QRlog.addLog >>");
}

/**
 * 指定された動物IDのログを探す
 * @param {String} animalId 動物ID
 * @return {Object} 見つけたログデータを返す
 */
QRlog.prototype.getLog = function(animalId) {
  console.log("QRlog.getLog <<");

  // 既に登録済みかを探す
  for (var i = 0; i < this.qrLogData.length; i++) {
    if (this.qrLogData[i].id === animalId) {
      return this.qrLogData[i];
    }
  }
  return null;
  console.log("QRlog.getLog >>");
}

/**
 * console.logとしてログを表示する
 */
QRlog.prototype.listLog = function() {
  console.log("QRlog.listLog <<");
  // 最終アクセス時間
  var date = this.getLastLogDate();
  console.log("lastLogDate: " + date);

  // ログデータ
  for (var i = 0; i < this.qrLogData.length; i++) {
    var item = this.qrLogData[i];
    var dd = item.date.toLocaleString();
    var str = sprintf("%2d %30s %4d %s", i, item.id, item.count, dd);
    console.log(str);
  }
  console.log("QRlog.listLog >>");
}

/**
 * チェックした数を返す
 * @return {Number} ログをチェックした数
 */
QRlog.prototype.countLog = function() {
  console.log("QRlog.countLog <<");
  var sum = 0;
  for (var i = 0; i < this.qrLogData.length; i++) {
    if (this.qrLogData[i].count > 0) {
      sum++;
    }
  }
  return sum;
  console.log("QRlog.countLog >>");
}