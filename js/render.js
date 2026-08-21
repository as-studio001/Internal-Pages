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
  // 後台預覽（?preview=1）時開啟：讓標題、內文段落可以直接點下去打字，
  // 讓主視覺／內文照片可以直接點擊更換——後台編輯畫面看到的就是這個
  // render.js 真正產生的頁面，所見即所得，不是另外做一份長得像的介面。
  let EDITABLE = false;

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
  function renderTextBlock(root, body, index) {
    const el = document.createElement("div");
    el.classList.add("block", "block--text", "c-8", "s-5");
    const p = document.createElement("p");
    p.textContent = body;
    if (index != null) p.dataset.paragraphIndex = String(index);
    el.appendChild(p);
    root.appendChild(el);
  }

  function renderPhotoRow(root, chunk, ratioState, ratioOverride) {
    const el = document.createElement("div");
    el.classList.add("block", "block--photos", "c-12");

    const orientations = chunk.map(orientationOf);
    const allPortrait = orientations.every((o) => o === "portrait");
    const allNonPortrait = orientations.every((o) => o !== "portrait");

    if (allPortrait) {
      el.classList.add("block--photos--portrait");
      el.style.gridTemplateColumns = chunk.map(() => "1fr").join(" ");
    } else if (allNonPortrait && chunk.length === 2) {
      // ratioOverride：後台「照片排版」裡使用者手動選的並排比例（0~2，
      // 對應 PAIR_RATIOS 的索引）；沒有的話（自動排版模式）照原本邏輯
      // 依序輪替，同一組不連續選到一樣的比例。
      let idx;
      if (ratioOverride != null && PAIR_RATIOS[ratioOverride]) {
        idx = ratioOverride;
      } else {
        idx = ratioState.next % PAIR_RATIOS.length;
        if (idx === ratioState.last) idx = (idx + 1) % PAIR_RATIOS.length;
        ratioState.last = idx;
        ratioState.next++;
      }
      el.style.gridTemplateColumns = PAIR_RATIOS[idx].map((r) => r + "fr").join(" ");
    } else {
      el.classList.add("block--photos--mixed");
      el.style.gridTemplateColumns = orientations.map((o) => ORIENTATION_WEIGHT[o] + "fr").join(" ");
    }

    chunk.forEach((it) => {
      const img = buildImage(it);
      if (it._i != null) img.dataset.photoIndex = String(it._i);
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
    if (photo._i != null) img.dataset.photoIndex = String(photo._i);
    img.style.aspectRatio = String(photo.ratio || 16 / 9);
    el.appendChild(img);
    root.appendChild(el);
  }

  // 檢查後台存的「照片排版」是否還跟現在的照片陣列吻合（張數變了、或
  // 陣列本身有問題就視為失效），失效就整組回退成全自動排版，不會讓
  // 頁面壞掉或漏顯示照片。
  function validPhotoLayout(layout, photoCount) {
    if (!Array.isArray(layout) || layout.length === 0) return null;
    const seen = new Set();
    for (const g of layout) {
      if (!Array.isArray(g.photos) || g.photos.length === 0) return null;
      for (const i of g.photos) {
        if (typeof i !== "number" || i < 0 || i >= photoCount || seen.has(i)) return null;
        seen.add(i);
      }
    }
    return seen.size === photoCount ? layout : null;
  }

  function renderContent() {
    const root = $("#content");
    root.innerHTML = "";
    const paragraphs = PROJECT.paragraphs || [];
    // 幫每張照片標上它在原始 photos 陣列裡的位置（_i），分組演算法只是
    // 把陣列切成連續的小段、不會重排順序，所以可以安全地在切之前先標
    // 好，後台點擊某張照片要更換時才知道對應到 PROJECT.photos 的哪一筆
    const taggedPhotos = (PROJECT.photos || []).map((p, i) => Object.assign({}, p, { _i: i }));

    // 後台「照片排版」讓使用者微調過的話（PROJECT.photoLayout），直接
    // 照這份清單分組＋插入位置＋並排比例；沒有（或已經跟照片對不上）
    // 就照舊完全自動分組，兩種案例都用同一套渲染，不影響既有案例。
    const manualLayout = validPhotoLayout(PROJECT.photoLayout, taggedPhotos.length);
    const chunks = manualLayout
      ? manualLayout.map((g) => g.photos.map((i) => taggedPhotos[i]))
      : makePhotoChunks(taggedPhotos);
    const insertAfter = manualLayout
      ? manualLayout.map((g) => g.afterParagraph)
      : chunks.map((_, i) => Math.round(((i + 1) * paragraphs.length) / (chunks.length + 1)));
    const ratioOverrides = manualLayout ? manualLayout.map((g) => g.pairRatio) : chunks.map(() => undefined);

    const ratioState = { next: 0, last: -1 };
    let chunkPos = 0;
    const insertChunk = (chunk, override) => {
      if (chunk.length === 1) renderSoloContained(root, chunk[0]);
      else renderPhotoRow(root, chunk, ratioState, override);
    };

    // 插在「第 0 段之後」＝最前面，先處理掉，其餘照原順序跟著段落跑。
    while (chunkPos < chunks.length && insertAfter[chunkPos] === 0) {
      insertChunk(chunks[chunkPos], ratioOverrides[chunkPos]);
      chunkPos++;
    }
    paragraphs.forEach((body, i) => {
      renderTextBlock(root, body, i);
      while (chunkPos < chunks.length && insertAfter[chunkPos] === i + 1) {
        insertChunk(chunks[chunkPos], ratioOverrides[chunkPos]);
        chunkPos++;
      }
    });
    while (chunkPos < chunks.length) {
      insertChunk(chunks[chunkPos], ratioOverrides[chunkPos]);
      chunkPos++;
    }
  }

  // 後台「產生自動排版」用：跑一次跟 renderContent 全自動模式一樣的分組
  // /插入位置/並排比例演算法，但不畫出來，而是回傳一份使用者可以微調
  // 的清單（存進 PROJECT.photoLayout 就會變成手動排版）。
  function computeAutoPhotoLayout() {
    const paragraphs = PROJECT.paragraphs || [];
    const taggedPhotos = (PROJECT.photos || []).map((p, i) => Object.assign({}, p, { _i: i }));
    const chunks = makePhotoChunks(taggedPhotos);
    const insertAfter = chunks.map((_, i) => Math.round(((i + 1) * paragraphs.length) / (chunks.length + 1)));
    const ratioState = { next: 0, last: -1 };
    return chunks.map((chunk, i) => {
      const group = { photos: chunk.map((p) => p._i), afterParagraph: insertAfter[i] };
      const orientations = chunk.map(orientationOf);
      const allNonPortrait = orientations.every((o) => o !== "portrait");
      if (allNonPortrait && chunk.length === 2) {
        let idx = ratioState.next % PAIR_RATIOS.length;
        if (idx === ratioState.last) idx = (idx + 1) % PAIR_RATIOS.length;
        ratioState.last = idx;
        ratioState.next++;
        group.pairRatio = idx;
      }
      return group;
    });
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

  function isMobileLayout() {
    return window.matchMedia && window.matchMedia("(max-width:900px)").matches;
  }

  // 手機版兩欄縮圖的大概欄寬：對應 style.css 的 --side:6vw 跟兩欄
  // 之間 10px 的 gap，用來估算每張照片縮放後的高度
  function estimateColumnWidth() {
    const side = window.innerWidth * 0.06;
    return (window.innerWidth - side * 2 - 10) / 2;
  }

  // 手機版縮圖排列：真的像 Pinterest 那樣，每張照片依序丟進「目前
  // 累積高度比較矮」的那一欄（貪婪演算法），不是死板的兩張兩張配對
  // ——配對順序好懂，但只要中間出現一張特別高或特別矮的照片，那一整排
  // 還是會看起來卡卡的、對不齊。貪婪演算法看的是兩欄「目前實際的
  // 高度」，兩欄的總高度會盡量接近，不會留下大塊空白，也不強求同一排
  // 內誰跟誰對齊——這本來就是 masonry 排列的樣子，柱狀交錯是預期中的
  // 視覺語言，不是排列錯誤。
  //
  // 桌面版完全不受影響：維持原本單排、依實際比例 flex-wrap 排列。
  function renderThumbGroup(container, items, cellClass, onCellReady, groupMeta) {
    container.innerHTML = "";
    if (!items.length) return;

    const makeCell = (item, i) => {
      const cell = document.createElement("div");
      cell.className = cellClass;
      onCellReady(cell, item, i);
      // 後台編輯模式下，點縮圖是「換照片」，不是開燈箱——兩件事互斥，
      // 用同一顆縮圖做哪一個由 EDITABLE 決定，不會兩個行為疊在一起。
      if (EDITABLE && groupMeta) {
        cell.classList.add("cms-editable-photo");
        cell.title = "點擊更換照片";
        cell.addEventListener("click", (e) => {
          e.preventDefault();
          postCmsEdit({
            field: "step-photo-replace",
            kind: groupMeta.kind,
            stepIndex: groupMeta.stepIndex,
            photoIndex: i,
          });
        });
      } else {
        cell.addEventListener("click", () => openLightbox(items, i));
      }
      return cell;
    };

    if (!isMobileLayout()) {
      items.forEach((item, i) => container.appendChild(makeCell(item, i)));
      return;
    }

    const colWidth = estimateColumnWidth();
    const heights = [0, 0];
    const cols = [document.createElement("div"), document.createElement("div")];
    cols.forEach((c) => (c.className = "thumb-col"));
    items.forEach((item, i) => {
      const ratio = item.ratio || 4 / 3;
      const estHeight = colWidth / ratio;
      const shortIdx = heights[0] <= heights[1] ? 0 : 1;
      cols[shortIdx].appendChild(makeCell(item, i));
      heights[shortIdx] += estHeight + 10;
    });
    const masonry = document.createElement("div");
    masonry.className = "thumb-masonry";
    cols.forEach((c) => masonry.appendChild(c));
    container.appendChild(masonry);
  }

  function renderSteps(rootSelector, steps, kind) {
    const root = $(rootSelector);
    root.innerHTML = "";
    let thumbIdx = 0;
    (steps || []).forEach((step, stepIndex) => {
      const stepEl = document.createElement("div");
      stepEl.className = "process-step";

      if (step.body) {
        const p = document.createElement("p");
        p.className = "process-step__text";
        p.textContent = step.body;
        p.dataset.stepKind = kind;
        p.dataset.stepIndex = String(stepIndex);
        stepEl.appendChild(p);
      }

      if (step.photos && step.photos.length) {
        const row = document.createElement("div");
        row.className = "process-thumbs";
        renderThumbGroup(row, step.photos, "process-thumb", (cell, item) => {
          if (!item.src) {
            cell.style.aspectRatio = item.ratio || THUMB_RATIOS[thumbIdx++ % THUMB_RATIOS.length];
          }
          cell.appendChild(buildImage(item));
        }, { kind, stepIndex });
        stepEl.appendChild(row);
      }

      root.appendChild(stepEl);
    });
  }

  function renderResearch() {
    renderSteps("#research-steps", PROJECT.designResearch, "designResearch");
  }

  function renderProcess() {
    renderSteps("#process-steps", PROJECT.process, "process");
  }

  // 圖面（平面圖／剖面圖／立面圖等技術圖說）獨立收納一區，跟施工過程的
  // 現場照片分開；用單純、等大的網格排列，不做錯落感。
  function renderDrawings() {
    const root = $("#drawings-grid");
    const drawings = PROJECT.drawings || [];
    renderThumbGroup(root, drawings, "drawing-cell", (cell, item) => {
      if (!item.src) cell.style.aspectRatio = item.ratio || 4 / 3;
      cell.appendChild(buildImage(item));
    }, { kind: "drawings" });
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

  // 設計研究／施工過程是「一段文字接一組照片」的陣列，量測比例時
  // 要連著每個 step 的 photos 一起處理
  async function withMeasuredSteps(steps) {
    const list = steps || [];
    const measured = await Promise.all(list.map((s) => withMeasuredRatios(s.photos)));
    return list.map((s, i) => Object.assign({}, s, { photos: measured[i] }));
  }

  async function renderAll(project) {
    const [photos, designResearch, process, drawings] = await Promise.all([
      withMeasuredRatios(project.photos),
      withMeasuredSteps(project.designResearch),
      withMeasuredSteps(project.process),
      withMeasuredRatios(project.drawings),
    ]);
    PROJECT = Object.assign({}, project, { photos, designResearch, process, drawings });
    renderHead();
    renderHeroPhoto();
    renderContent();
    renderMap();
    renderResearch();
    renderProcess();
    renderDrawings();
    bindScrollReveal();
    if (EDITABLE) enableEditing();
  }

  // ============================================================
  // 後台即時編輯：點文字直接改文字、點照片直接換照片，操作的就是這個
  // render.js 真正渲染出來的頁面本身，不是另外做一個像的介面。文字用
  // contenteditable 直接改；照片是靜態 <img>，沒辦法「直接改」，點下去
  // 改成回報給後台（父視窗）「使用者想換這張圖」，由後台負責挑檔案、
  // 上傳，再把新的一份內容整個重新 post 回來、重畫一次頁面。
  // ============================================================
  function postCmsEdit(payload) {
    if (window.parent) window.parent.postMessage(Object.assign({ type: "cms-edit" }, payload), "*");
  }

  function makeTextEditable(el, onCommit) {
    if (!el) return;
    // #hero-title/#lede-meta 是 index.html 裡本來就存在的固定元素，每次
    // 編輯觸發重新整個 renderAll() 時不會被重新建立，只是換內容——如果
    // 每次都重新綁一次事件，監聽器會一直疊加。用這個標記確保只綁一次。
    if (el.dataset.cmsBound) return;
    el.dataset.cmsBound = "1";
    el.contentEditable = "true";
    el.classList.add("cms-editable-text");
    let last = el.textContent;
    el.addEventListener("blur", () => {
      const val = el.textContent;
      if (val !== last) {
        last = val;
        onCommit(val);
      }
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && el.id) {
        // 單行欄位（標題、副標）按 Enter 直接算打完，不要真的換行
        e.preventDefault();
        el.blur();
      }
    });
  }

  function makePhotoClickable(el, onReplace) {
    if (!el) return;
    el.classList.add("cms-editable-photo");
    el.title = "點擊更換照片";
    el.addEventListener("click", (e) => {
      e.preventDefault();
      onReplace();
    });
  }

  function injectEditableStyles() {
    if ($("#cms-editable-styles")) return;
    const style = document.createElement("style");
    style.id = "cms-editable-styles";
    style.textContent = `
      /* 文字框隨時（不用等 hover）就用淺藍色虛線框＋淡藍底標出「這裡可以
         點下去打字」，不用 hover 也看得出來；hover／focus 時加深顏色，
         正在打字時邊框變實線更明顯。（不用浮動標籤文字——怕在頁面最上面
         的標題那種位置會被頭部裁到，純用邊框＋底色比較不會有位置風險）*/
      .cms-editable-text{
        outline:1.5px dashed rgba(90,150,255,0.5); outline-offset:4px;
        background:rgba(90,150,255,0.06); border-radius:2px; cursor:text;
        transition:outline-color .15s ease, background-color .15s ease;
      }
      .cms-editable-text:hover{ outline-color:rgba(90,150,255,0.85); background:rgba(90,150,255,0.12); }
      .cms-editable-text:focus{ outline:2px solid #4d8dff; background:rgba(90,150,255,0.16); }
      .cms-editable-photo{ cursor:pointer; transition:filter .15s ease, outline-color .15s ease; outline:2px dashed rgba(90,150,255,0.4); outline-offset:-2px; }
      .cms-editable-photo:hover{ filter:brightness(0.72); outline-color:rgba(90,150,255,0.85); }
      /* 空白的灰底佔位圖（還沒有照片）光靠虛線框不夠明顯，容易讓人
         看不出來這塊是可以點的——直接疊字說明「點擊上傳照片」。 */
      .ph.cms-editable-photo::after{
        content:"點擊上傳照片"; position:absolute; inset:0; display:flex;
        align-items:center; justify-content:center; text-align:center;
        font-size:13px; font-weight:600; color:rgba(20,20,20,0.55);
        background:rgba(255,255,255,0.15); pointer-events:none;
      }
      .cms-add-btn{
        display:inline-block; margin:16px 8px 16px 0; padding:10px 18px; border-radius:6px;
        border:1.5px dashed rgba(90,150,255,0.6); background:rgba(90,150,255,0.08); color:#4d8dff;
        font-size:13px; font-weight:600; cursor:pointer; font-family:inherit;
      }
      .cms-add-btn:hover{ background:rgba(90,150,255,0.18); }
    `;
    document.head.appendChild(style);
  }

  // 「新增」類的按鈕（新增段落、新增照片、新增圖面…）——這些是全新內容，
  // 沒有既有元素可以點，所以在對應區塊最後面直接放一顆按鈕，點下去就
  // 跟後台編輯畫面下方清單的「新增」按鈕做一樣的事：選檔案／插入空白
  // 段落，讓「從零開始新增一個案例」也能完全在這個即時預覽裡完成。
  function makeAddButton(label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cms-add-btn";
    btn.textContent = "+ " + label;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      onClick();
    });
    return btn;
  }

  function enableEditing() {
    injectEditableStyles();

    makeTextEditable($("#hero-title"), (val) => postCmsEdit({ field: "title", value: val }));
    makeTextEditable($("#lede-meta"), (val) => postCmsEdit({ field: "ledeMeta", value: val }));

    $$("[data-paragraph-index]").forEach((p) => {
      makeTextEditable(p, (val) => postCmsEdit({ field: "paragraph", index: Number(p.dataset.paragraphIndex), value: val }));
    });

    const heroPhotoEl = $("#hero-photo img") || $("#hero-photo .ph");
    makePhotoClickable(heroPhotoEl, () => postCmsEdit({ field: "hero-replace" }));

    $$("#content [data-photo-index]").forEach((img) => {
      makePhotoClickable(img, () => postCmsEdit({ field: "photo-replace", index: Number(img.dataset.photoIndex) }));
    });

    // 設計研究／施工過程的每一段文字說明；縮圖（含圖面）的點擊換照片
    // 行為已經在 renderThumbGroup 裡依 EDITABLE 直接處理，這裡不用重複做
    $$("[data-step-kind]").forEach((p) => {
      makeTextEditable(p, (val) =>
        postCmsEdit({ field: "step-body", kind: p.dataset.stepKind, stepIndex: Number(p.dataset.stepIndex), value: val })
      );
    });

    // 「新增」按鈕：讓全新案例（內文段落、照片、設計研究／施工過程、
    // 圖面都還是空的）也能整個從這個即時預覽直接開始建立內容，不用
    // 先跑去下面的清單新增第一筆之後才看得到東西可以點。
    // #content 是 CSS Grid（12 欄），直接把按鈕塞進去會被當成一般格子
    // 自動分配寬度，擠成又窄又高的長條——包一層 c-12（跟其他區塊一樣
    // 佔滿整排）才會正常，裡面再用 flex 排這兩顆按鈕。
    const contentRoot = $("#content");
    if (contentRoot) {
      const addRow = document.createElement("div");
      addRow.className = "block c-12";
      addRow.style.display = "flex";
      addRow.style.gap = "8px";
      addRow.appendChild(makeAddButton("新增段落", () => postCmsEdit({ field: "paragraph-add" })));
      addRow.appendChild(makeAddButton("新增照片", () => postCmsEdit({ field: "photo-add" })));
      contentRoot.appendChild(addRow);
    }
    const researchRoot = $("#research-steps");
    if (researchRoot) {
      researchRoot.appendChild(makeAddButton("新增一段設計研究", () => postCmsEdit({ field: "step-add", kind: "designResearch" })));
    }
    const processRoot = $("#process-steps");
    if (processRoot) {
      processRoot.appendChild(makeAddButton("新增一段施工過程", () => postCmsEdit({ field: "step-add", kind: "process" })));
    }
    const drawingsRoot = $("#drawings-grid");
    if (drawingsRoot) {
      drawingsRoot.appendChild(makeAddButton("新增圖面", () => postCmsEdit({ field: "drawing-add" })));
    }
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

  // 後台四個分區各自的 iframe 只需要顯示自己那一塊：把最上面共用的導覽列
  // （漢堡選單／語言切換，不是這裡在編輯的東西）跟 <main> 裡其他不相關的
  // 區塊都藏起來，讓每個 iframe 看起來就是「只截了需要編輯的那部分」，
  // 而不是整個網頁只是捲到某個位置、旁邊還露出一截別的區塊。
  const FOCUS_SELECTORS = {
    hero: [".page-head", ".hero-photo"],
    content: ["#content"],
    detail: [".detail-section"],
    map: [".map-full"],
  };

  let focused = false;

  function focusSection(key) {
    const header = document.querySelector(".site-header");
    if (header) header.style.display = "none";
    const footer = document.querySelector(".site-footer");
    if (footer) footer.style.display = "none";
    const keep = FOCUS_SELECTORS[key] || [];
    $$("main > *").forEach((el) => {
      el.style.display = keep.some((sel) => el.matches(sel)) ? "" : "none";
    });
    window.scrollTo(0, 0);
    focused = true;
    reportContentHeight();
  }

  // 裁切之後，iframe 的外框高度也要跟著只剩下的那一小塊內容調整，不然
  // 後台那邊還是留著一個很高的框、裡面卻只有一小塊東西、大半是空白。
  // 之後每次編輯內容變動（例如多打一段文字）高度也可能跟著變，所以
  // 每次重畫完都回報一次，讓後台把 iframe 高度貼著內容調整。
  function reportContentHeight() {
    if (!focused || !window.parent) return;
    window.parent.postMessage({ type: "cms-content-height", height: document.documentElement.scrollHeight }, "*");
  }

  // CMS 即時預覽模式：網址帶 ?preview=1 時，不去抓 JSON 檔案，改成監聽
  // 後台編輯畫面用 postMessage 送過來的即時內容，每次編輯都重新渲染，
  // 讓後台看到的預覽跟真正上線後的頁面完全一致（同一套 render.js/CSS）。
  function initPreviewMode() {
    EDITABLE = true;
    // 後台預覽時，設計研究／施工過程／圖面預設直接展開，編輯者才不用
    // 每次存檔、切換欄位都要手動點一次「+」才看得到內容有沒有跑版
    const toggle = $("#detail-toggle");
    const panel = $("#detail-panel");
    if (toggle && panel) {
      toggle.setAttribute("aria-expanded", "true");
      panel.hidden = false;
    }
    window.addEventListener("message", (e) => {
      if (!e.data) return;
      if (e.data.type === "cms-preview") {
        // renderAll 是 async（要等照片量測完實際比例），排版是不是要自動
        // 產生要等這次重畫真的完成、PROJECT 已經是最新的才能算，所以完成
        // 後才回報 cms-rendered，讓後台知道現在可以來要一份自動排版。
        renderAll(e.data.project).then(() => {
          if (window.parent) window.parent.postMessage({ type: "cms-rendered" }, "*");
          reportContentHeight();
        });
        return;
      }
      // 後台一個分區一個 iframe，每個只需要顯示自己負責的那一塊——把頁首
      // 導覽列跟其他不相關的區塊都藏起來，不要整頁都在，只留使用者真正
      // 要編輯的部分。
      if (e.data.type === "cms-focus-section") {
        focusSection(e.data.key);
        return;
      }
      // 後台「照片排版」還沒產生過（或已失效）時，來要一份自動排版當
      // 起點，讓使用者接著微調，而不是從零手動分組。
      if (e.data.type === "cms-compute-auto-layout") {
        if (window.parent) window.parent.postMessage({ type: "cms-auto-layout", layout: computeAutoPhotoLayout() }, "*");
        return;
      }
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
