// Header interactivity — hamburger + language dropdowns, mirroring the
// click-outside-closes behavior of the main site's Header.tsx.
//
// Language switching uses Google's "Website Translator" widget
// (loaded in index.html, bootstrapped into the hidden
// #google_translate_element box) instead of redirecting to
// translate.google.com — it translates the page's real, dynamically
// rendered content (any case, any language) in place, no new tab,
// and needs zero hand-maintained translation data. Picking a language
// programmatically drives the widget's hidden <select>, since we hide
// its own UI and drive it from our own dropdown instead.
(function () {
  function setup(toggleId, dropdownId, boxSelector) {
    var toggle = document.getElementById(toggleId);
    var dropdown = document.getElementById(dropdownId);
    if (!toggle || !dropdown) return;
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdown.hidden = !dropdown.hidden;
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(boxSelector)) dropdown.hidden = true;
    });
  }

  setup("menu-toggle", "menu-dropdown", "[data-menu-box]");
  setup("lang-toggle", "lang-dropdown", "[data-lang-box]");

  var langDropdown = document.getElementById("lang-dropdown");
  if (!langDropdown) return;

  // Google Translate Element 的語言代碼：zh-Hans 對應 zh-CN，其餘直接相同
  var GOOGLE_LANG = { "zh-Hans": "zh-CN", en: "en", ja: "ja", ko: "ko" };

  function triggerGoogleTranslate(code, retriesLeft) {
    var combo = document.querySelector(".goog-te-combo");
    if (!combo) {
      // 小工具還在載入中（第一次點擊時常見），稍後重試幾次
      if (retriesLeft > 0) setTimeout(function () { triggerGoogleTranslate(code, retriesLeft - 1); }, 300);
      return;
    }
    combo.value = code;
    combo.dispatchEvent(new Event("change"));
  }

  function resetToOriginal() {
    // Google Translate 用 cookie 記錄目前語言，清掉並重新整理即可還原成原文
    ["googtrans", "googtrans=/zh-TW/zh-TW"].forEach(function (name) {
      document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + location.hostname;
    });
    location.reload();
  }

  var buttons = langDropdown.querySelectorAll("button[data-lang]");
  var current = (document.cookie.match(/googtrans=\/zh-TW\/(\w+(-\w+)?)/) || [])[1] || "zh-Hant";
  buttons.forEach(function (b) {
    var code = b.getAttribute("data-lang");
    var matches = code === "zh-Hant" ? current === "zh-Hant" : GOOGLE_LANG[code] === current;
    b.classList.toggle("active", matches);
  });

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var code = btn.getAttribute("data-lang");
      langDropdown.hidden = true;
      if (code === "zh-Hant") {
        resetToOriginal();
        return;
      }
      buttons.forEach(function (b) { b.classList.toggle("active", b === btn); });
      triggerGoogleTranslate(GOOGLE_LANG[code], 10);
    });
  });
})();
