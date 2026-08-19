// Header interactivity — hamburger + language dropdowns, mirroring the
// click-outside-closes behavior of the main site's Header.tsx. This page
// has no i18n content system, so picking a language just marks it active
// visually (parity with the main site's look, not a functional translation
// — swap in real logic here if/when this page needs to support languages).
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
  if (langDropdown) {
    langDropdown.querySelectorAll("button[data-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        langDropdown.querySelectorAll("button[data-lang]").forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        langDropdown.hidden = true;
      });
    });
  }
})();
