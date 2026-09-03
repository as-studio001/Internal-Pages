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

  // 案件選單由後台依章節類型（CH 1～CH 4）自動產生。原型數位的 href
  // 已經是外部網站，這裡只照資料原樣輸出，不自行改寫成案例內頁。
  var caseMenuLinks = document.getElementById("case-menu-links");
  if (caseMenuLinks) {
    fetch("content/site/case-links.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Could not load case menu links");
        return res.json();
      })
      .then(function (data) {
        caseMenuLinks.replaceChildren();
        var lastChapter = null;
        (data.links || []).forEach(function (link) {
          if (!link || !link.label || !link.href) return;
          var a = document.createElement("a");
          a.href = link.href;
          a.target = "_blank";
          a.rel = "noreferrer";
          
          var match = link.label.match(/^(CH\s*(\d+)\.\d+\s*)(.*)$/i);
          if (match) {
            var currentChapter = match[2];
            if (lastChapter !== null && currentChapter !== lastChapter) {
              var hr = document.createElement("hr");
              hr.className = "menu-divider";
              caseMenuLinks.appendChild(hr);
            }
            lastChapter = currentChapter;
            
            var span = document.createElement("span");
            span.className = "ch-prefix";
            span.textContent = match[1];
            a.appendChild(span);
            a.appendChild(document.createTextNode(match[3]));
          } else {
            a.textContent = link.label;
          }
          
          caseMenuLinks.appendChild(a);
        });
      })
      .catch(function () {
        // 清單讀取失敗時仍保留固定的「原型首頁」連結，不讓選單完全空白。
      });
  }

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

// 設計研究／施工過程／圖面收合區塊：預設收起，點「+」展開／收合，
// 沒有捲動觸發、沒有動畫時機的問題——單純點擊就切換，一定看得到。
(function () {
  var toggle = document.getElementById("detail-toggle");
  var panel = document.getElementById("detail-panel");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", function () {
    var expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
  });
})();
