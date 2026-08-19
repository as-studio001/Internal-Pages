/* ============================================================
   版型渲染邏輯 —— 這個檔案通常不需要修改。
   讀取 data-sample.js 內的 PROJECT 物件，自動組出頁面內容。
   ============================================================ */

(function () {
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /**
   * 建立一張圖片。
   * - 若資料含有 src（真實照片路徑），就輸出 <img>
   * - 若只有 ph（示意色塊代號），輸出示意色塊 div
   * 正式上線、有真實照片後，只要在資料裡填 src 即可自動切換。
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

  function renderHead() {
    const tagEl = $("#hero-tag");
    if (PROJECT.tag) {
      tagEl.textContent = PROJECT.tag;
    } else {
      tagEl.remove();
    }
    $("#hero-title").textContent = PROJECT.title || "";
    $("#lede-meta").textContent = PROJECT.ledeMeta || "";
  }

  function renderHeroPhoto() {
    const slot = $("#hero-photo .ph");
    const img = buildImage(PROJECT.hero);
    img.classList.add("ph");
    slot.replaceWith(img);
  }

  /**
   * 自動把「段落陣列」跟「照片陣列」交錯排版，不需要手動指定版型，
   * 完全由照片本身的比例與陣列長度決定結果——不是死板的張數循環。
   *
   * 分組規則：
   *   - 照片可選填 ratio（寬/高，例如橫幅 1.5、直幅 0.75、正方 1），
   *     沒填就當作預設橫幅 4:3。真的換成 <img src> 之後，這裡也可以
   *     直接讀圖片自己的 naturalWidth/naturalHeight，不需要再手動填。
   *   - 連續的直幅照片收成一組（最多 3 張）等寬等高並排；
   *     橫幅／方形照片兩張一組、寬度不對稱地並排。
   *   - 絕不落單：分組後如果還有單張（例如直幅照片前後剛好都是橫幅），
   *     一律併入相鄰的一組，改成依各自方向給不同欄寬的混合並排，
   *     不會出現「一張圖旁邊留白」的狀況。
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
        // 特別寬幅的全景照（例如接近 2:1 以上）直接獨立成一整排全幅，
        // 不與其他照片並排擠壓，也不會被下面的收尾邏輯併回去
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
    // 收尾：把任何落單的一張併進旁邊的一組（優先併後面，沒有就併前面），
    // 讓每一排的欄位一定被填滿，不留空白。全景照是刻意獨立的單張，跳過不併。
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
      // 唯一留下單張的情況：整份案例就只有 1 張照片，此時沒有任何一組可以併
    }
    return chunks;
  }

  // 文字永遠固定在同一個欄位（c-8 s-5，比例上比 Snøhetta 原始的 c-6 s-7
  // 再往左收一些，減少左側空白），
  // 不論前後接的是哪種照片排列都不會跳動。照片的錯落感（大小不一、上下
  // 錯開、2～3 張一組）完全跟文字位置脫鉤，各自獨立成一整排。
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
      // 直幅照片：等寬等高並排，不做大小不一
      el.classList.add("block--photos--portrait");
      el.style.gridTemplateColumns = chunk.map(() => "1fr").join(" ");
    } else if (allNonPortrait && chunk.length === 2) {
      // 橫幅／方形兩張一組：寬度不對稱並排，且避開跟上一組同樣的比例
      let idx = ratioState.next % PAIR_RATIOS.length;
      if (idx === ratioState.last) idx = (idx + 1) % PAIR_RATIOS.length;
      ratioState.last = idx;
      ratioState.next++;
      el.style.gridTemplateColumns = PAIR_RATIOS[idx].map((r) => r + "fr").join(" ");
    } else {
      // 混合方向（落單照片併組後的結果）：欄寬依各自方向給權重，
      // 每張圖維持自己的比例，不強制統一
      el.classList.add("block--photos--mixed");
      el.style.gridTemplateColumns = orientations.map((o) => ORIENTATION_WEIGHT[o] + "fr").join(" ");
    }

    // 統一貼齊上緣（align-items:start），寬度不同造成的大小差只顯示在下緣，
    // 不做上下錯位，確保至少一邊永遠對齊
    chunk.forEach((it, i) => {
      const img = buildImage(it);
      if (el.classList.contains("block--photos--mixed")) {
        img.style.aspectRatio = String(it.ratio || 4 / 3);
      }
      el.appendChild(img);
    });
    root.appendChild(el);
  }

  function renderSoloContained(root, photo) {
    // 兩種情況會走到這裡：整份案例僅 1 張照片，或該張是刻意獨立
    // 全幅呈現的全景照（見 orientationOf 的 panorama 判斷）
    const el = document.createElement("div");
    el.classList.add("block", "block--solo", "c-12");
    const img = buildImage(photo);
    img.style.aspectRatio = String(photo.ratio || 16 / 9);
    el.appendChild(img);
    root.appendChild(el);
  }

  function renderContent() {
    const root = $("#content");
    const paragraphs = PROJECT.paragraphs || [];
    const chunks = makePhotoChunks(PROJECT.photos || []);

    // 照片組平均分散在整段文字裡（而不是全部擠在最前面、後面留一長串純文字）：
    // 每個 chunk 依比例算出「該接在第幾段文字之後」，段落多、照片少時也不會失衡。
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

  function renderMap() {
    const m = PROJECT.map || {};
    $("#map-address").textContent = m.address || "";
    $("#map-coords").textContent = m.coords || "";

    if (typeof L === "undefined" || m.lat == null || m.lng == null) return;

    const map = L.map("site-map", {
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: !L.Browser.mobile,
      attributionControl: true,
    }).setView([m.lat, m.lng], m.zoom || 14);

    // 國土測繪中心 PHOTO2：免金鑰的台灣正射影像圖磚
    L.tileLayer(
      "https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/GoogleMapsCompatible/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "圖資來源：內政部國土測繪中心" }
    ).addTo(map);

    const pinIcon = L.divIcon({
      className: "",
      html: '<div class="site-pin"><div class="site-pin__shadow"></div><div class="site-pin__drop"><div class="site-pin__ring"></div></div></div>',
      iconSize: [34, 46],
      iconAnchor: [17, 44],
    });
    L.marker([m.lat, m.lng], { icon: pinIcon }).addTo(map);
  }

  // 「一段文字接一排小縮圖」是共用的敘事版型（固定高度、寬度依照片比例
  // 自動排列），照 herzogdemeuron.com 專案頁「Process」段落的做法——
  // 不做成分類拼貼牆。設計研究、施工過程都用同一套渲染邏輯，
  // 只是資料來源（哪個陣列）跟掛載的容器不同。
  const THUMB_RATIOS = [4 / 3, 3 / 4, 16 / 9, 1 / 1, 4 / 5, 3 / 2];

  function renderSteps(rootSelector, steps) {
    const root = $(rootSelector);
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
        step.photos.forEach((item) => {
          const cell = document.createElement("div");
          cell.className = "process-thumb";
          if (!item.src) {
            cell.style.aspectRatio = item.ratio || THUMB_RATIOS[thumbIdx++ % THUMB_RATIOS.length];
          }
          cell.appendChild(buildImage(item));
          cell.addEventListener("click", () => openLightbox(item));
          row.appendChild(cell);
        });
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
  // 現場照片分開；用單純、等大的網格排列，不做錯落感——圖面講究的是
  // 一致的比例好比對，不是照片式的視覺變化。
  function renderDrawings() {
    const root = $("#drawings-grid");
    (PROJECT.drawings || []).forEach((item) => {
      const cell = document.createElement("div");
      cell.className = "drawing-cell";
      if (!item.src) cell.style.aspectRatio = item.ratio || 4 / 3;
      cell.appendChild(buildImage(item));
      cell.addEventListener("click", () => openLightbox(item));
      root.appendChild(cell);
    });
  }

  function openLightbox(item) {
    const lb = $("#lightbox");
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
    lb.classList.add("open");
  }

  function bindLightboxClose() {
    const lb = $("#lightbox");
    $("#lightbox-close").addEventListener("click", () => lb.classList.remove("open"));
    lb.addEventListener("click", (e) => { if (e.target === lb) lb.classList.remove("open"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") lb.classList.remove("open"); });
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

  renderHead();
  renderHeroPhoto();
  renderContent();
  renderMap();
  renderResearch();
  renderProcess();
  renderDrawings();
  bindLightboxClose();
  bindScrollReveal();
})();
