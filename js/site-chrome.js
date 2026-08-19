// Header interactivity — hamburger + language dropdowns, mirroring the
// click-outside-closes behavior of the main site's Header.tsx.
//
// Real (AI-translated) content lives in js/data-translations.js, applied
// by js/i18n-select.js before render.js runs — this file just navigates
// to ?lang=<code> on the same page (a real reload, not a live in-place
// swap) and keeps the dropdown's "active" state in sync with whatever
// language is actually showing. 中文（繁體）is the original — picking it
// just strips the ?lang= param and reloads.
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

  var currentLang = new URLSearchParams(window.location.search).get("lang") || "zh-Hant";
  var buttons = langDropdown.querySelectorAll("button[data-lang]");
  buttons.forEach(function (b) {
    b.classList.toggle("active", b.getAttribute("data-lang") === currentLang);
  });

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var code = btn.getAttribute("data-lang");
      if (code === currentLang) {
        langDropdown.hidden = true;
        return;
      }
      var url = new URL(window.location.href);
      if (code === "zh-Hant") {
        url.searchParams.delete("lang");
      } else {
        url.searchParams.set("lang", code);
      }
      window.location.href = url.toString();
    });
  });
})();
