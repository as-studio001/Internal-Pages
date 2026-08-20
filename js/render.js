/* ============================================================
   版型渲染邏輯 —— 這個檔案通常不需要修改。
   讀取 content/projects/<slug>.json 的內容，自動組出頁面內容。
   網址用 ?case=<slug> 指定要顯示哪個案例（預設 laogu-fang）。
   ============================================================ */

(function () {
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  let PROJECT = null;
  let leafletMap = null;

  /**
   * 建立一張圖片。
   * - 若資料含有 src（真實照片路徑），就輸出 <img>
   * - 若只有 ph（示意色塊代號，僅供本機測試用），輸出示意色塊 div
   */
  function buildImage(data) {
    if (data.src) {
      const img = document.createElement("img");
      img.src = data.src;
      img.alt = data.caption || "";
      img.loading = "lazy";
      return img;
    }
    const div = document.createElement("div");
    div.className = "ph";
    div.setAttribute("data-ph", data.ph || "1");
    return div;
  }

  /**
   * 讀取一張真實照片的實際寬高比例（naturalWidth / naturalHeight）。
   * 後台上傳的都是真實照片，不需要使用者自己填寫「比例」這種技術欄位，
   * 交錯排版演算法要用的 ratio 一律由瀏覽器自動量測。
   */
  function measureRatio(photo) {
    if (photo.ratio) return Promise.resolve(photo.ratio);
    if (!photo.src) return Promise.resolve(4 / 3);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth / img.naturalHeight || 4 / 3);
      img.onerror = () => resolve(4 / 3);
      img.src = photo.src;
    });
  }

  async function withMeasuredRatios(photos) {
    const list = photos || [];
    const ratios = await Promise.all(list.map(measureRatio));
    return list.map((p, i) => Object.assign({}, p, { ratio: p.ratio || ratios[i] }));
  }

  function renderHead() {
    const tagEl = $("#hero-tag");
    if (PROJECT.tag) {
      tagEl.hidden = false;
      tagEl.textContent = PROJECT.tag;
    } else {
      tagEl.hidden = true;
      tagEl.textContent = "";
    }
    $("#hero-title").textContent = PROJECT.title || "";
    $("#lede-meta").textContent = PROJECT.ledeMeta || "";
  }

  function renderHeroPhoto() {
    const wrap = $("#hero-photo");
    wrap.innerHTML = "";
    const heroData = typeof PROJECT.hero === "string" ? { src: PROJECT.hero } : (PROJECT.hero || {});
    const img = buildImage(heroData);
    img.classList.add("ph");
    wrap.appendChild(img);
  }

  /**
   * 自動把「段落陣列」跟「照片陣列」交錯排版，不需要手動指定版型，
   * 完全由照片本身的比例與陣列長度決定結果——不是死板的張數循環。
   *
   * 分組規則：
   *   - 連續的直幅照片收成一組（最多 3 張）等寬等高並排；
   *     橫幅／方形照片兩張一組、寬度不對稱地並排。
   *   - 絕不落單：分組後如果還有單張（例如直幅照片前後剛好都是橫幅），
   *     一律併入相鄰的一組，改成依各自方向給不同欄寬的混合並排，
   *     不會出現「一張圖旁邊留白」的狀況。
   *   - 特別寬幅的全景照（ratio > 1.9）直接獨立成一整排全幅。
   *   - 橫幅配對的寬窄比例會避開「跟上一組一樣」，不會每次都同一個節奏。
   */
  const PAIR_RATIOS = [[7, 4], [4, 7], [6, 5]];
  const ORIENTATION_WEIGHT = { portrait: 4, square: 5, landscape: 7 };

  function orientationOf(photo) {
    const r = photo.ratio || 4 / 3;
    if (r < 0.85) return "portrait";
    if (r > 1.9) return "panorama";
    if (r > 1.15) return "landscape";
    return "square";
  }

  function makePhotoChunks(photos) {
    const chunks = [];
    let i = 0;
    while (i < photos.length) {
      const o = orientationOf(photos[i]);
      if (o === "panorama") {
        chunks.push([photos[i]]);
        i += 1;
      } else if (o === "portrait") {
        let j = i + 1;
        while (j < photos.length && orientationOf(photos[j]) === "portrait" && j - i < 3) j++;
        chunks.push(photos.slice(i, j));
        i = j;
      } else if (
        i + 1 < photos.length &&
        orientationOf(photos[i + 1]) !== "portrait" &&
        orientationOf(photos[i + 1]) !== "panorama"
      ) {
        chunks.push(photos.slice(i, i + 2));
        i += 2;
      } else {
        chunks.push([photos[i]]);
        i += 1;
      }
    }
    // 收尾：把任何落單的一張併進旁邊的一組，讓每一排的欄位一定被填滿。
    // 全景照是刻意獨立的單張，跳過不併。
    for (let k = 0; k < chunks.length; k++) {
      if (chunks[k].length !== 1) continue;
      if (orientationOf(chunks[k][0]) === "panorama") continue;
      if (k + 1 < chunks.length && chunks[k + 1].length < 3) {
        chunks[k + 1] = chunks[k].concat(chunks[k + 1]);
        chunks.splice(k, 1);
        k--;
      } else if (k - 1 >= 0 && chunks[k - 1].length < 3) {
        chunks[k - 1] = chunks[k - 1].concat(chunks[k]);
        chunks.splice(k, 1);
        k--;
      }
    }
    return chunks;
  }

  // 文字永遠固定在同一個欄位（c-8 s-5），不論前後接的是哪種照片排列都
  // 不會跳動。照片的錯落感完全跟文字位置脫鉤，各自獨立成一整排。
  function renderTextBlock(root, body) {
    const el = document.createElement("div");
    el.classList.add("block", "block--text", "c-8", "s-5");
    const p = document.createElement("p");
    p.textContent = body;
    el.appendChild(p);
    root.appendChild(el);
  }

  function renderPhotoRow(root, chunk, ratioState) {
    const el = document.createElement("div");
    el.classList.add("block", "block--photos", "c-12");

    const orientations = chunk.map(orientationOf);
    const allPortrait = orientations.every((o) => o === "portrait");
    const allNonPortrait = orientations.every((o) => o !== "portrait");

    if (allPortrait) {
      el.classList.add("block--photos--portrait");
      el.style.gridTemplateColumns = chunk.map(() => "1fr").join(" ");
    } else if (allNonPortrait && chunk.length === 2) {
      let idx = ratioState.next % PAIR_RATIOS.length;
      if (idx === ratioState.last) idx = (idx + 1) % PAIR_RATIOS.length;
      ratioState.last = idx;
      ratioState.next++;
      el.style.gridTemplateColumns = PAIR_RATIOS[idx].map((r) => r + "fr").join(" ");
    } else {
      el.classList.add("block--photos--mixed");
      el.style.gridTemplateColumns = orientations.map((o) => ORIENTATION_WEIGHT[o] + "fr").join(" ");
    }

    chunk.forEach((it) => {
      const img = buildImage(it);
      if (el.classList.contains("block--photos--mixed")) {
        img.style.aspectRatio = String(it.ratio || 4 / 3);
      }
      el.appendChild(img);
    });
    root.appendChild(el);
  }

  function renderSoloContained(root, photo) {
    const el = document.createElement("div");
    el.classList.add("block", "block--solo", "c-12");
    const img = buildImage(photo);
    img.style.aspectRatio = String(photo.ratio || 16 / 9);
    el.appendChild(img);
    root.appendChild(el);
  }

  function renderContent() {
    const root = $("#content");
    root.innerHTML = "";
    const paragraphs = PROJECT.paragraphs || [];
    const chunks = makePhotoChunks(PROJECT.photos || []);

    // 照片組平均分散在整段文字裡，每個 chunk 依比例算出「該接在第幾段
    // 文字之後」，段落多、照片少時也不會失衡。
    const insertAfter = chunks.map((_, i) => Math.round(((i + 1) * paragraphs.length) / (chunks.length + 1)));

    const ratioState = { next: 0, last: -1 };
    let chunkPos = 0;
    const insertChunk = (chunk) => {
      if (chunk.length === 1) renderSoloContained(root, chunk[0]);
      else renderPhotoRow(root, chunk, ratioState);
    };

    paragraphs.forEach((body, i) => {
      renderTextBlock(root, body);
      while (chunkPos < chunks.length && insertAfter[chunkPos] === i + 1) {
        insertChunk(chunks[chunkPos++]);
      }
    });
    while (chunkPos < chunks.length) insertChunk(chunks[chunkPos++]);
  }

  function formatCoords(lat, lng) {
    if (lat == null || lng == null) return "";
    const ns = lat >= 0 ? "N" : "S";
    const ew = lng >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`;
  }

  function renderMap() {
    const m = PROJECT.map || {};
    $("#map-address").textContent = m.address || "";
    $("#map-coords").textContent = formatCoords(m.lat, m.lng);

    if (leafletMap) {
      leafletMap.remove();
      leafletMap = null;
    }
    if (typeof L === "undefined" || m.lat == null || m.lng == null) return;

    leafletMap = L.map("site-map", {
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: !L.Browser.mobile,
      attributionControl: true,
    }).setView([m.lat, m.lng], m.zoom || 14);

    // 國土測繪中心 PHOTO2：免金鑰的台灣正射影像圖磚
    L.tileLayer(
      "https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/GoogleMapsCompatible/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "圖資來源：內政部國土測繪中心" }
    ).addTo(leafletMap);

    const pinIcon = L.divIcon({
      className: "",
      html: '<div class="site-pin"><div class="site-pin__shadow"></div><div class="site-pin__drop"><div class="site-pin__ring"></div></div></div>',
      iconSize: [34, 46],
      iconAnchor: [17, 44],
    });
    L.marker([m.lat, m.lng], { icon: pinIcon }).addTo(leafletMap);
  }

  // 「一段文字接一排小縮圖」是共用的敘事版型（桌面版固定高度、寬度依
  // 照片比例自動排列），設計研究、施工過程都用同一套渲染邏輯，只是
  // 資料來源（哪個陣列）跟掛載的容器不同。
  const THUMB_RATIOS = [4 / 3, 3 / 4, 16 / 9, 1 / 1, 4 / 5, 3 / 2];

  // 縮圖兩張兩張包成一個 .thumb-pair：桌面版靠 CSS 的
  // display:contents 讓這層包裝「隱形」，維持原本 flex-wrap 依比例
  // 排列的樣子；手機版則把每個 pair 變成一個左右並排、頂部對齊的列，
  // 用陣列原本的順序配對，不會像純 CSS 多欄（masonry）那樣把配對
  // 順序打散、造成兩欄看起來對不齊。
  function buildThumbPairs(items, cellClass, onCellReady) {
    const wrap = document.createDocumentFragment();
    for (let i = 0; i < items.length; i += 2) {
      const pair = document.createElement("div");
      pair.className = "thumb-pair";
      items.slice(i, i + 2).forEach((item, j) => {
        const cell = document.createElement("div");
        cell.className = cellClass;
        onCellReady(cell, item, i + j);
        pair.appendChild(cell);
      });
      wrap.appendChild(pair);
    }
    return wrap;
  }

  function renderSteps(rootSelector, steps) {
    const root = $(rootSelector);
    root.innerHTML = "";
    let thumbIdx = 0;
    (steps || []).forEach((step) => {
      const stepEl = document.createElement("div");
      stepEl.className = "process-step";

      if (step.body) {
        const p = document.createElement("p");
        p.className = "process-step__text";
        p.textContent = step.body;
        stepEl.appendChild(p);
      }

      if (step.photos && step.photos.length) {
        const row = document.createElement("div");
        row.className = "process-thumbs";
        row.appendChild(buildThumbPairs(step.photos, "process-thumb", (cell, item, i) => {
          if (!item.src) {
            cell.style.aspectRatio = item.ratio || THUMB_RATIOS[thumbIdx++ % THUMB_RATIOS.length];
          }
          cell.appendChild(buildImage(item));
          cell.addEventListener("click", () => openLightbox(step.photos, i));
        }));
        stepEl.appendChild(row);
      }

      root.appendChild(stepEl);
    });
  }

  function renderResearch() {
    renderSteps("#research-steps", PROJECT.designResearch);
  }

  function renderProcess() {
    renderSteps("#process-steps", PROJECT.process);
  }

  // 圖面（平面圖／剖面圖／立面圖等技術圖說）獨立收納一區，跟施工過程的
  // 現場照片分開；用單純、等大的網格排列，不做錯落感。
  function renderDrawings() {
    const root = $("#drawings-grid");
    root.innerHTML = "";
    const drawings = PROJECT.drawings || [];
    root.appendChild(buildThumbPairs(drawings, "drawing-cell", (cell, item, i) => {
      if (!item.src) cell.style.aspectRatio = item.ratio || 4 / 3;
      cell.appendChild(buildImage(item));
      cell.addEventListener("click", () => openLightbox(drawings, i));
    }));
  }

  // 燈箱一次記住「目前這組照片」跟「目前是第幾張」，上一張／下一張
  // 只在同一組（同一個施工步驟、或同一份圖面清單）裡面切換，不會跳到
  // 別的區塊去，而且頭尾相接（最後一張按下一張會回到第一張）
  let lightboxItems = [];
  let lightboxIndex = 0;

  function showLightboxItem() {
    const item = lightboxItems[lightboxIndex];
    const img = $("#lightbox-img");
    const cap = $("#lightbox-caption");
    if (item.src) {
      img.src = item.src;
      img.style.display = "";
    } else {
      img.removeAttribute("src");
      img.style.display = "none";
    }
    cap.textContent = item.caption || "";
  }

  function openLightbox(items, index) {
    lightboxItems = items;
    lightboxIndex = index;
    showLightboxItem();
    $("#lightbox").classList.add("open");
  }

  function stepLightbox(delta) {
    if (!lightboxItems.length) return;
    lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
    showLightboxItem();
  }

  function bindLightboxClose() {
    const lb = $("#lightbox");
    $("#lightbox-close").addEventListener("click", () => lb.classList.remove("open"));
    $("#lightbox-prev").addEventListener("click", (e) => { e.stopPropagation(); stepLightbox(-1); });
    $("#lightbox-next").addEventListener("click", (e) => { e.stopPropagation(); stepLightbox(1); });
    lb.addEventListener("click", (e) => { if (e.target === lb) lb.classList.remove("open"); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") lb.classList.remove("open");
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    });
  }

  function bindScrollReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    $$(".block").forEach((b) => io.observe(b));
  }

  async function renderAll(project) {
    PROJECT = Object.assign({}, project, {
      photos: await withMeasuredRatios(project.photos),
    });
    renderHead();
    renderHeroPhoto();
    renderContent();
    renderMap();
    renderResearch();
    renderProcess();
    renderDrawings();
    bindScrollReveal();
  }

  async function loadCase(slug) {
    const res = await fetch(`content/projects/${slug}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error("case not found: " + slug);
    return res.json();
  }

  function showError(message) {
    $("#hero-title").textContent = message;
    $("#lede-meta").textContent = "";
  }

  // CMS 即時預覽模式：網址帶 ?preview=1 時，不去抓 JSON 檔案，改成監聽
  // 後台編輯畫面用 postMessage 送過來的即時內容，每次編輯都重新渲染，
  // 讓後台看到的預覽跟真正上線後的頁面完全一致（同一套 render.js/CSS）。
  function initPreviewMode() {
    window.addEventListener("message", (e) => {
      if (!e.data || e.data.type !== "cms-preview") return;
      renderAll(e.data.project);
    });
    if (window.parent) window.parent.postMessage({ type: "cms-preview-ready" }, "*");
  }

  async function init() {
    bindLightboxClose();
    const params = new URLSearchParams(location.search);
    if (params.get("preview") === "1") {
      initPreviewMode();
      return;
    }
    const slug = params.get("case") || "laogu-fang";
    try {
      const project = await loadCase(slug);
      await renderAll(project);
    } catch (err) {
      console.error(err);
      showError("找不到這個案例");
    }
  }

  init();
})();
