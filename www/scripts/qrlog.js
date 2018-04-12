// This is a JavaScript file

"use strict";

/**
 * @class QRlog
 */
function QRlog() {
  // constructor() {
    // 最後のアクセス時間を取得する
    if (isUndefinedOrNull(this.lastLogDate)) {
      this.lastLogDate = window.localStorage.getItem("zm_lastLogDate");
    }
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
      // 一致した
    } else {
      // 一致しないので初期化する
      window.localStorage.clear();
      this.lastLogDate = nowDate;
      window.localStorage.setItem("zm_lastLogDate", this.lastLogDate);
    }

  //}

  
}

QRlog.prototype = {
  /**
   * 最終アクセス時間を取得する
   * @return {Object}   最終アクセス時間を返す
   */
  getLastLogDate: function() {
    return this.lastLogDate;
  },

  /**
   * 最終アクセス時間をセットする
   * @param {Object} date   最終アクセス時間
   */
  setLastLogDate: function(date) {
    this.lastLogDate = date;
    window.localStorage.setItem("zm_lastLogDate", date);
  }
}
