// Header interactivity — hamburger + language dropdowns, mirroring the
// click-outside-closes behavior of the main site's Header.tsx.
//
// This page has no real i18n content system (no per-string translation
// data like the main site's translations.ts), so instead of a fake
// language switch, picking a language hands the current page off to
// Google's translate proxy (https://translate.google.com/translate?...),
// which works in any browser (not just Chromium's built-in translate,
// which has no public JS API to trigger on demand) and actually
// translates the real rendered content. 中文（繁體）is this page's
// original language, so it just closes the dropdown instead of
// round-tripping through Google for no reason.
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

  // Google Translate's "tl" (target language) codes — zh-Hans maps to
  // zh-CN, the rest match our own data-lang values directly.
  var GOOGLE_TRANSLATE_TARGET = {
    "zh-Hans": "zh-CN",
    en: "en",
    ja: "ja",
    ko: "ko",
  };

  var langDropdown = document.getElementById("lang-dropdown");
  if (langDropdown) {
    langDropdown.querySelectorAll("button[data-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        langDropdown.querySelectorAll("button[data-lang]").forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        langDropdown.hidden = true;

        var code = btn.getAttribute("data-lang");
        var target = GOOGLE_TRANSLATE_TARGET[code];
        if (!target) return; // zh-Hant (original) — nothing to do
        var url =
          "https://translate.google.com/translate?sl=zh-TW&tl=" +
          target +
          "&u=" +
          encodeURIComponent(window.location.href);
        window.open(url, "_blank", "noopener,noreferrer");
      });
    });
  }
})();
