/* ============================================================
   語言選擇：讀網址 ?lang= 參數，把 PROJECT_TRANSLATIONS 對應語言的
   文字覆蓋回 PROJECT 上，接著 render.js 才會執行、讀取 PROJECT 建出
   畫面 —— 所以這支檔案一定要放在 data-sample.js 之後、render.js 之前。
   照片路徑/比例/地圖經緯度不變，只換文字欄位；陣列用「索引」對應
   （data-translations.js 的段落/照片數量要跟 data-sample.js 一致，
   對不上的索引會被安靜跳過，不會報錯，但也不會生效）。
   ============================================================ */
(function () {
  var params = new URLSearchParams(window.location.search);
  var lang = params.get("lang");
  if (!lang || lang === "zh-Hant") return;
  if (typeof PROJECT === "undefined" || typeof PROJECT_TRANSLATIONS === "undefined") return;
  var t = PROJECT_TRANSLATIONS[lang];
  if (!t) return;

  if (t.title) PROJECT.title = t.title;
  if (t.ledeMeta) PROJECT.ledeMeta = t.ledeMeta;
  if (t.intro) PROJECT.intro = t.intro;
  if (t.paragraphs) PROJECT.paragraphs = t.paragraphs;

  if (t.photos && PROJECT.photos) {
    t.photos.forEach(function (caption, i) {
      if (PROJECT.photos[i] && caption != null) PROJECT.photos[i].caption = caption;
    });
  }

  if (t.designResearch && PROJECT.designResearch) {
    t.designResearch.forEach(function (step, i) {
      var target = PROJECT.designResearch[i];
      if (!target) return;
      if (step.body) target.body = step.body;
      if (step.photos && target.photos) {
        step.photos.forEach(function (caption, j) {
          if (target.photos[j] && caption != null) target.photos[j].caption = caption;
        });
      }
    });
  }

  if (t.process && PROJECT.process) {
    t.process.forEach(function (body, i) {
      if (PROJECT.process[i] && body != null) PROJECT.process[i].body = body;
    });
  }

  if (t.drawings && PROJECT.drawings) {
    t.drawings.forEach(function (caption, i) {
      if (PROJECT.drawings[i] && caption != null) PROJECT.drawings[i].caption = caption;
    });
  }

  if (t.mapAddress && PROJECT.map) PROJECT.map.address = t.mapAddress;

  document.documentElement.lang = t.htmlLang || lang;
})();
