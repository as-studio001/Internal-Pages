/* ============================================================
   PROJECT 的多語系翻譯資料（AI 翻譯，非 Google 網頁翻譯）
   ------------------------------------------------------------
   跟 data-sample.js 的 PROJECT 物件同一份資料，只列出「文字類」
   欄位（照片路徑/比例/地圖經緯度不變，不需要每語言重複一份）。
   由 js/i18n-select.js 在 render.js 執行前，依網址 ?lang= 參數
   把對應語言的文字覆蓋回 PROJECT 上。

   之後新增案例時，這份翻譯資料也要跟著 data-sample.js 的文字內容
   一起更新——兩份檔案的段落/照片數量必須完全對應（用陣列索引比對），
   數量對不上時 i18n-select.js 會直接跳過該筆，不會報錯但也不會生效。
   ============================================================ */

const PROJECT_TRANSLATIONS = {

  "zh-Hans": {
    htmlLang: "zh-Hans",
    title: "台南硓𥑮石．芳宅",
    ledeMeta: "台南市 / 台湾 / 2025 / 展览空间",
    intro: "基地位于大肚山缓坡与人工渠道交会之处，设计以一道折线量体回应地形高差，让建筑在保有隐私的同时，把光与水的路径一并带进日常生活之中。",
    paragraphs: [
      "旧时代的三落建筑静静伫立于信义街巷道之间，厚实的砖墙、细致的山墙线脚与长屋量体，在今日快速变动的城市中显得格外庄严。人们步行经过此处，总会被这座历经百年的宅邸吸引而停下脚步。推开大门，原本封闭的街屋逐渐向内展开，量体与庭院彼此错落，而「缝隙」则成为本次修复与再设计中回应新旧关系的核心手法。光线、视线与人的行走在实体与空隙之间交替，使不同时代的建筑语汇得以并置，也让时间仿佛在此产生错置。",
      "这座宅邸的历史，可以追溯至清末府城的武举人胡澄渊。胡澄渊幼年渡海来台，迁居府城，早年专心习文，后转而习武，并高中武举人。当时的台南正处于繁盛的城市发展阶段，他于府城中街兴建宅第。乙未战争期间，他曾运送粮草支援刘永福抗日；府城陷落后，则携家人返回祖籍绍安暂避。多年后再度回到台南，选择隐居生活，却仍持续关心地方事务。日治时期，日本官方曾多次邀请他任职，他皆予以婉拒，坚持不仕异族。由于为人正直公道，也经常协调地方纷争，因此深受邻里敬重。这段历史，使老宅不只是建筑本身，更承载了府城人物、家族与时代变迁的记忆。",
      "其后，一户来自屏东的黄姓家族迁居台南，对原有的二进式街屋与前庭宽阔的三合院进行改造。左右两侧狭长街屋延续原有形式，作为商业使用；位于中央86番地的空间，则兴建规模较大、具有高度私密性的四合院，成为家族生活的核心。宅邸所在的新港墘邻近五条港，过去是台南重要的水运与商业中心，货船往来、商贩聚集，城市生活在此高度交织。黄家选择于此兴建宅第，也反映其家族当时的经济条件与社会地位。然而，随着城市发展与生活型态改变，黄家后代陆续迁离，老宅逐渐沉寂，原本热闹的家族生活也成为城市记忆的一部分。",
      "多年后，现任屋主许志锋先生购入这座老宅，最初原计画拆除并兴建大楼，却因夫人认为如此深具文化底蕴的建筑应当被保留下来，最终改变了原先的想法。屋主选择保留既有格局、材料与历史痕迹，并与原型建筑团队合作，重新整理老宅的空间与构造，使建筑不以单纯「复原」为目标，而是在保存与介入之间寻找新的可能。",
      "设计以「缝隙」作为串联过去与现在的空间策略。原有厚重的砖墙被完整保留，新设的木构屋顶则以较为轻盈的姿态介入其中，两者之间嵌入透明玻璃，使台南澄澈的天空、自然光与庭院景色渗入室内。新旧材料并非刻意模仿，而是透过材质、尺度与重量的对比彼此映照。开放式环绕露台取代传统合院较为封闭的回廊，让原本内向的院落重新与城市产生关系；匠人留下的砖饰、木门与立面细节则成为中庭最重要的视觉主景，使人在行走之间感受到不同时代留下的痕迹。",
      "而在老宅的前院，我们刻意放入一座当代的白色空间，如同一个介于过去与未来之间的「留白盒子」。透明的玻璃界面削弱了新建筑自身的存在感，使人在盒子内部反而能更加清楚地观看周围老屋的砖墙、雕花与细部纹理。这个空间不是为了取代老宅，而是成为观看老宅的另一个角度。阳光穿过玻璃，空气在新旧量体之间流动，也让水、风与自然重新进入原本封闭的院落。我们希望人在这个近乎空白的空间里，不只是观看历史，也能暂时脱离既有的叙事，感受台南的光、空气与季节变化。白色盒子因此成为一个开放的想像容器，承接着老宅过去的记忆，也将问题留给未来：当一座百年老宅不再只是被保存的古迹，它还能与今日的城市产生什么样的关系？",
      "中央大院则以最轻的方式进行修复，尽可能维持原有空间尺度与结构秩序，使三座量体重新取得平衡。登上二楼，原本厚重桧木门后的隔间被适度打开，新的折板木屋顶将原先零散的空间重新整合为开阔展厅。屋顶起伏的山形节奏与既有木构件相互呼应，像是一个崭新的木质心脏，在老宅之中注入新的生命。新旧肌理在此交织，使老宅不再只是承载过去的容器，而成为可以持续发生文化活动与交流的空间，逐渐转化为一座面向大众开放的文化场所。",
      "如今的信义街台南硓𥑮石．芳宅，不再只是保存百年历史的老房子，而是一座介于住宅、展览与城市公共文化之间的建筑美术馆。人们可以在砖墙、木门、庭院与新的空间缝隙之间行走，看见不同时代彼此重叠的痕迹。建筑没有试图抹去时间，而是让时间成为空间的一部分。从胡澄渊的府城宅第，到黄家的家族生活，再到今日向城市开放的文化场域，老宅持续承载着台南的城市记忆，也在历史与当代的交会之中重新获得生命。它所保存的，不仅是一座房子的形式，更是地方生活、人物故事与城市文化持续流动的轨迹；而那座留白的白色盒子，则让这段历史不只停留在过去，也为芳宅与台南的下一个百年，留下了可以继续想像的空间。"
    ],
    photos: [
      "中央大院立面，巴洛克式山墙与双侧回旋梯，木作大门居中",
      "后院夹巷，新旧材料交界处的砖墙与木构露台",
      "折板木屋顶与红砖墙交界，光线洒落室内",
      "木屋顶节点细部，仰视砖墙与玻璃天窗交会",
      "前院白色玻璃盒子，映照老宅立面与木门",
      "老宅室内展间，斑驳墙面与建筑模型展示",
      "回廊列柱与红色旋转楼梯"
    ],
    designResearch: [
      {
        body: "设计初期以手绘推演回应老宅时间刻痕与裂缝的处理方式，思考如何以新肌理（UHPC）补强原有柱体结构，并比对新旧构造的受力逻辑，找出新旧接合的合理节点。",
        photos: ["柱体补强设计推演手稿", "新旧屋顶结构轴测手稿"]
      },
      {
        body: "透过实体模型验证新旧量体的空间关系，测试中庭回廊、白盒子与既有砖墙、木构屋顶之间的交接方式，反复比对整体配置与量体比例。",
        photos: [
          "整体配置模型，俯视三座量体与中庭关系",
          "模型局部，木构屋顶与砖墙量体交界",
          "模型细部，新旧材料交界处理",
          "模型俯视，中庭回廊柱列与白盒子屋顶节点"
        ]
      }
    ],
    process: [
      "中庭回廊以 UHPC（超高性能混凝土）重新浇置柱体，依 1C1～1C6 各柱位分批施作，取代原有损毁严重的柱身，同时延续既有柱列的节奏与尺寸。",
      "既有砖墙与楼板进行结构补强工程，针对裂损严重的区域以钢构加固，确保老屋量体在新设计介入后仍维持足够的结构安全。",
      "曲面木构屋顶于地面组装完成后整体吊装定位，再进行屋面构造的细部收边，让折板屋顶与下方砖墙准确对齐接合。"
    ],
    drawings: [
      "设计一楼平面图",
      "设计二楼平面图",
      "B-B、D-D 剖立面图",
      "山墙立面大样图",
      "曲面屋顶剖面节点大样图"
    ],
    mapAddress: "700 台南市中西区兑悦里信义街46巷15号"
  },

  en: {
    htmlLang: "en",
    title: "Tainan Coral Stone · Fang Residence",
    ledeMeta: "Tainan City / Taiwan / 2025 / Exhibition Space",
    intro: "The site sits where the gentle slope of Dadu Mountain meets a man-made canal. The design answers the shift in terrain with a single folded volume, keeping the building private while still drawing the paths of light and water into everyday life.",
    paragraphs: [
      "An old three-section house stands quietly along the lanes of Xinyi Street — its thick brick walls, finely detailed gable cornices, and elongated volume feel especially dignified against today's fast-changing city. People passing on foot are drawn to pause before this century-old residence. Push open the gate, and the once-closed street house gradually unfolds inward, volumes and courtyards falling into a loose rhythm — and the \"gap\" becomes the core move of this restoration, the way old and new are made to answer each other. Light, sightlines, and movement alternate between solid and void, letting the architectural language of different eras sit side by side, as if time itself had come slightly out of joint here.",
      "The residence's history traces back to Hu Chengyuan, a military scholar (wuju ren) of the late Qing-era Fucheng (old Tainan). Hu crossed the strait to Taiwan as a boy, settled in Fucheng, first devoted himself to letters, then turned to martial studies and passed the military examination. Tainan was then in a period of thriving urban growth, and he built his residence on Fucheng's central street. During the 1895 Yiwei War he helped ship provisions in support of Liu Yongfu's resistance; after Fucheng fell, he took his family back to their ancestral home in Zhao'an to wait it out. Years later he returned to Tainan and chose a life of quiet retirement, though he never stopped caring about local affairs. Under Japanese rule, colonial officials repeatedly invited him to take office; he always declined, refusing to serve a foreign power. Known for his fairness, he often mediated local disputes and was deeply respected by his neighbors. This history means the old house is more than a building — it carries the memory of a Fucheng figure, a family, and a changing era.",
      "Later, a family surnamed Huang from Pingtung settled in Tainan and renovated the existing two-bay street house and its wide-fronted courtyard compound. The narrow street-facing wings on either side kept their original form and were used commercially; the space at the central lot 86 became a larger, highly private courtyard house — the heart of family life. The residence sits near Xingangqian, close to the historic Five Channels, once a major hub of water transport and commerce in Tainan, where cargo boats and traders converged and city life was tightly interwoven. The Huang family's choice to build here reflected their economic standing and social position at the time. But as the city developed and ways of life changed, the Huang descendants gradually moved away, the old house grew quiet, and the once-lively family life became part of the city's memory.",
      "Years later, the current owner, Mr. Xu Zhifeng, purchased the old house, originally planning to tear it down and build a new tower — until his wife argued that a building of such cultural depth deserved to be kept, changing his mind. He chose to preserve the existing layout, materials, and historical traces, and worked with the Prototype Architecture team to reorganize the house's spaces and structure — not aiming for simple \"restoration,\" but seeking new possibilities between preservation and intervention.",
      "The design uses the \"gap\" as the spatial strategy linking past and present. The existing heavy brick walls were kept intact; the newly built timber roof intervenes with a lighter touch, and clear glass is set between the two, letting Tainan's clear sky, natural light, and courtyard views seep into the interior. Old and new materials don't imitate one another — they reflect each other through contrasts of texture, scale, and weight. An open wraparound terrace replaces the more enclosed corridor of a traditional courtyard house, reconnecting the once-inward-facing courtyard with the city; brick ornament, timber doors, and facade details left by the original craftsmen become the courtyard's central visual anchor, letting people feel the traces different eras have left as they walk through.",
      "In the old house's front courtyard, we deliberately placed a contemporary white volume — a \"blank box\" suspended between past and future. Its transparent glass skin softens the new building's own presence, so that from inside the box one can see the surrounding old house's brick walls, carvings, and details even more clearly. This space isn't meant to replace the old house, but to offer another way of looking at it. Sunlight passes through the glass, air moves between old and new volumes, and water, wind, and nature re-enter what was once an enclosed courtyard. We hope people in this near-empty space can not only look at history, but also step briefly outside its existing narrative and feel Tainan's light, air, and shifting seasons. The white box becomes an open vessel for imagination — holding the old house's past memories while leaving a question for the future: once a century-old house is no longer just a preserved monument, what relationship can it still have with today's city?",
      "The central courtyard was restored with the lightest possible touch, keeping the original spatial scale and structural order as intact as possible so the three volumes could find balance again. Upstairs, the partitions once hidden behind heavy cypress doors were opened up where appropriate, and a new folded timber roof reintegrates what had been scattered spaces into an open hall. The roof's rising and falling gable rhythm echoes the existing timber members, like a brand-new wooden heart pumping new life into the old house. Old and new textures interweave here, so the old house is no longer just a vessel holding the past, but a space where cultural activity and exchange can keep happening — gradually becoming a cultural venue open to the public.",
      "Today, the Coral Stone Fang Residence on Xinyi Street is no longer just a century-old house being preserved — it's an architectural museum somewhere between a home, an exhibition, and public urban culture. People can walk among brick walls, timber doors, courtyards, and the new spatial gaps, seeing traces of different eras overlapping one another. The architecture doesn't try to erase time — it lets time become part of the space. From Hu Chengyuan's Fucheng residence, to the Huang family's domestic life, to a cultural field open to the city today, the old house continues to carry Tainan's urban memory, gaining new life at the meeting point of history and the present. What it preserves isn't just the form of a house, but the continuing flow of local life, personal stories, and urban culture — and that blank white box lets this history stay open, leaving room to keep imagining the next hundred years for both the Fang Residence and Tainan."
    ],
    photos: [
      "Facade of the central courtyard — a Baroque-style gable with spiral stairs on either side, the timber main door centered",
      "Rear courtyard alley — brick wall and timber terrace where old and new materials meet",
      "Where the folded timber roof meets the red brick wall, light spilling into the interior",
      "Detail of a timber-roof joint, looking up at where brick wall meets glass skylight",
      "The white glass box in the front courtyard, reflecting the old house's facade and timber doors",
      "An interior exhibition room in the old house, with weathered walls and an architectural model on display",
      "Colonnade and the red spiral staircase"
    ],
    designResearch: [
      {
        body: "Early design work used hand-drawn studies to respond to the old house's cracks and marks of time, exploring how a new material (UHPC) could reinforce the existing columns, comparing old and new structural load logic to find sensible joints between them.",
        photos: ["Hand-drawn studies for column reinforcement", "Axonometric hand sketches of the old and new roof structure"]
      },
      {
        body: "Physical models were used to test the spatial relationship between old and new volumes — how the courtyard corridor, the white box, and the existing brick walls and timber roof meet — repeatedly checking the overall layout and proportions.",
        photos: [
          "Overall massing model, plan view of the three volumes and the courtyard",
          "Model detail — where the timber roof meets the brick volume",
          "Model detail — treatment of the old/new material joint",
          "Model plan view — courtyard colonnade and the white box's roof joint"
        ]
      }
    ],
    process: [
      "The courtyard colonnade's columns were recast in UHPC (ultra-high-performance concrete), worked through column positions 1C1–1C6 in batches, replacing the badly damaged originals while keeping the rhythm and dimensions of the existing colonnade.",
      "Structural reinforcement was carried out on the existing brick walls and floor slabs, with steel bracing added in the most heavily cracked areas, ensuring the old house's volumes remain structurally safe after the new design intervenes.",
      "The curved timber roof was assembled on the ground, then lifted and set into place as a whole, followed by detailed edge work on the roofing so the folded roof aligns precisely with the brick wall below."
    ],
    drawings: [
      "Design first-floor plan",
      "Design second-floor plan",
      "Sections B-B and D-D",
      "Gable facade detail drawing",
      "Curved roof section joint detail drawing"
    ],
    mapAddress: "No. 15, Lane 46, Xinyi Street, Duiyue Village, West Central District, Tainan City 700"
  },

  ja: {
    htmlLang: "ja",
    title: "台南珊瑚石．芳邸",
    ledeMeta: "台南市／台湾／2025年／展示空間",
    intro: "敷地は大肚山の緩やかな斜面と人工水路が交わる場所に位置する。設計は一本の折れ線状のヴォリュームで地形の高低差に応え、プライバシーを保ちながら、光と水の道筋を日常のなかへと引き込む。",
    paragraphs: [
      "古い時代の三落建築が信義街の路地にひっそりと佇んでいる。厚みのある煉瓦壁、繊細な破風のラインと細長い建物のヴォリュームは、めまぐるしく変化する今日の街のなかでひときわ荘厳に映る。道を歩く人々は、百年の時を経たこの邸宅に惹かれて足を止める。門を開けば、かつて閉ざされていた街屋は内側へとゆっくり開かれ、建物と庭が入り組みながら並ぶ。今回の修復と再設計では、新旧の関係に応えるための核心的な手法として「隙間」を用いた。光、視線、そして人の歩みが実体と余白のあいだを行き来し、異なる時代の建築言語を並置させ、時間そのものがこの場でわずかにずれていくかのようだ。",
      "この邸宅の歴史は、清朝末期の府城（旧台南）の武挙人、胡澄淵にまで遡る。胡澄淵は幼い頃に海を渡って台湾に来て府城に居を移し、はじめは文を学び、のちに武術に転じて武挙人の試験に合格した。当時の台南は都市として大きく発展していた時期であり、彼は府城の中街に邸宅を構えた。乙未戦争の間には、糧食を運び劉永福の抗日を支援したこともある。府城が陥落した後は、家族を連れて祖籍の紹安へと一時避難した。数年後に再び台南へ戻り、隠居生活を選びながらも地域の事柄には関心を持ち続けた。日本統治時代、日本側から幾度も出仕を求められたが、彼はそのたびに固辞し、異民族への出仕を拒み続けた。公正な人柄で知られ、地域の紛争もしばしば取り持ったことから、近隣から厚い信頼を得ていた。この歴史によって、この古い邸宅は建築そのものだけでなく、府城の人物、家族、そして時代の変遷の記憶をも宿す存在となっている。",
      "その後、屏東出身の黄姓の一族が台南に移り住み、既存の二進式街屋と広い前庭を持つ三合院を改築した。左右の細長い街屋は元の形式を保ちながら商業用途として使われ、中央の86番地にあたる空間には、規模が大きく高いプライバシーを備えた四合院が建てられ、一族の生活の中心となった。邸宅が位置する新港墘は五條港に近く、かつては台南における水運と商業の要地であった。荷船が行き交い商人が集まり、都市の暮らしが濃密に交差する場所であった。黄家がこの地に邸宅を構えたことは、当時の一族の経済力と社会的地位を映し出してもいる。しかし都市の発展と生活様式の変化にともない、黄家の子孫は次第にこの地を離れ、古い邸宅は静けさを増していき、かつて賑わっていた一族の暮らしも都市の記憶の一部となっていった。",
      "その後、現在の所有者である許志鋒氏がこの古い邸宅を購入した。当初は取り壊して新しいビルを建てる計画であったが、これほど文化的な深みを持つ建築は残されるべきだという夫人の考えにより、方針を変えることとなった。所有者は既存の間取り、材料、歴史の痕跡を残すことを選び、原型建築（プロトタイプ・アーキテクチャー）のチームとともに、古い邸宅の空間と構造を再構成した。単純な「復元」を目指すのではなく、保存と介入のあいだに新たな可能性を見出そうとする試みである。",
      "設計は「隙間」を、過去と現在をつなぐ空間戦略として用いている。既存の厚い煉瓦壁はそのまま残し、新たに設けた木造屋根はより軽やかな身振りでそこに介入する。両者のあいだには透明なガラスが挟み込まれ、台南の澄んだ空、自然光、そして庭の景色が室内へと滲み込む。新旧の材料はあえて模倣し合うのではなく、質感、スケール、重さの対比を通して互いを映し合う。開放的に周囲を取り囲むテラスは、伝統的な合院建築のより閉じた回廊に代わって設けられ、かつて内向きだった中庭を再び都市とつなげる。職人たちが残した煉瓦の装飾、木の門、ファサードのディテールは、中庭における最も重要な視覚的な主景となり、人々は歩きながら異なる時代が残した痕跡を感じ取ることができる。",
      "そして古い邸宅の前庭には、あえて現代的な白い空間を差し込んだ。過去と未来のあいだに置かれた「余白の箱」のような存在である。透明なガラスのファサードは新しい建築自体の存在感を弱め、その内部にいる人は、周囲にある古い邸宅の煉瓦壁、彫刻、細部の質感をむしろより明瞭に眺めることができる。この空間は古い邸宅に取って代わるためのものではなく、古い邸宅を見るためのもうひとつの視点となる。陽光はガラスを通り抜け、空気は新旧のヴォリュームのあいだを流れ、水や風、自然もまた、かつて閉ざされていた庭へと戻ってくる。私たちは、この限りなく余白に近い空間のなかで、人々がただ歴史を眺めるだけでなく、既存の物語から一時的に離れ、台南の光や空気、季節の移ろいを感じ取ってくれることを願っている。この白い箱は、開かれた想像の器となり、古い邸宅の過去の記憶を受け止めながらも、未来へ向けた問いを残す——百年の古い邸宅が、単に保存された遺構ではなくなったとき、それは今日の都市とどのような関係を結び得るのだろうか。",
      "中央の大きな中庭は、できる限り軽やかな手法で修復され、既存の空間の尺度と構造の秩序をなるべく保ちながら、三つのヴォリュームが再びバランスを取り戻せるようにしている。二階に上がると、かつて重厚な檜の扉の奥にあった間仕切りが適度に開かれ、新たな折板構造の木造屋根が、もともと分散していた空間をひとつの開放的なホールへと再統合している。屋根の起伏する山形のリズムは既存の木造部材と呼応し、まるで新しい木の心臓のように、古い邸宅に新たな生命を注ぎ込む。新旧の質感がここで織り合わされ、古い邸宅はもはや過去を収める容器であるだけでなく、文化的な活動や交流が継続的に生まれる空間へ、そして大衆に開かれた文化的な場所へと少しずつ姿を変えていく。",
      "今日の信義街・台南珊瑚石．芳邸は、もはや百年の歴史を保存するだけの古民家ではなく、住宅と展示、そして都市の公共文化のあいだに位置する建築美術館となっている。人々は煉瓦壁、木の門、庭、そして新たな空間の隙間のあいだを歩きながら、異なる時代が重なり合う痕跡を目にすることができる。この建築は時間を消し去ろうとするのではなく、時間そのものを空間の一部として取り込んでいる。胡澄淵の府城の邸宅から、黄家の家族の暮らし、そして今日、都市へと開かれた文化の場へ——この古い邸宅は台南の都市の記憶を担い続け、歴史と現代が出会うなかで、新たな生命を得ている。この場所が守り続けているのは、一軒の家のかたちだけではなく、地域の暮らし、人々の物語、そして都市文化が絶えず流れ続ける軌跡である。そして、あの余白の白い箱は、この歴史をただ過去にとどめておくのではなく、芳邸と台南の次なる百年のために、想像を続けることのできる余地を残している。"
    ],
    photos: [
      "中庭のファサード。バロック風の破風と両側の螺旋階段、中央に木製の大扉",
      "裏庭の路地。新旧の材料が出会う煉瓦壁と木造テラス",
      "折板木造屋根と赤煉瓦壁の接合部。光が室内に降り注ぐ",
      "木造屋根の接合ディテール。煉瓦壁とガラス天窓の交わりを見上げる",
      "前庭の白いガラスの箱。古い邸宅のファサードと木の門を映す",
      "邸宅内部の展示室。斑（まだら）のある壁面と建築模型の展示",
      "回廊の列柱と赤い螺旋階段"
    ],
    designResearch: [
      {
        body: "設計初期段階では、古い邸宅に刻まれた時間の痕跡やひび割れへの対応を手描きのスタディで検討し、新しい素材（UHPC）による既存柱の補強方法を考え、新旧構造の力の伝わり方を比較しながら、新旧が合理的に接合するポイントを見出した。",
        photos: ["柱の補強設計に関する手描きスタディ", "新旧屋根構造のアクソメ手描きスケッチ"]
      },
      {
        body: "実物模型を通して新旧ヴォリュームの空間関係を検証し、中庭の回廊、白い箱、そして既存の煉瓦壁・木造屋根との接合方法を試しながら、全体の配置とヴォリュームの比率を繰り返し確認した。",
        photos: [
          "全体配置模型。三つのヴォリュームと中庭の関係を俯瞰",
          "模型部分。木造屋根と煉瓦ヴォリュームの接合部",
          "模型ディテール。新旧材料の接合部の処理",
          "模型俯瞰。中庭回廊の列柱と白い箱の屋根接合部"
        ]
      }
    ],
    process: [
      "中庭の回廊はUHPC（超高性能コンクリート）で柱を打ち直し、1C1〜1C6の各柱位置ごとに順次施工することで、損傷の激しかった既存の柱に代わりながらも、既存の列柱のリズムと寸法を引き継いだ。",
      "既存の煉瓦壁と床スラブに構造補強工事を行い、亀裂や損傷の激しい箇所には鉄骨で補強を加え、新たな設計が介入した後も古い建物のヴォリュームが十分な構造的安全性を保てるようにした。",
      "曲面の木造屋根は地上で組み立てを完了させたのち、一体として吊り上げて設置し、その後屋根まわりのディテールの納まりを整え、折板屋根が下部の煉瓦壁と正確に噛み合うようにした。"
    ],
    drawings: [
      "設計1階平面図",
      "設計2階平面図",
      "B-B・D-D断面立面図",
      "破風立面ディテール図",
      "曲面屋根断面ディテール図"
    ],
    mapAddress: "台南市中西区兌悦里信義街46巷15号（〒700）"
  },

  ko: {
    htmlLang: "ko",
    title: "타이난 산호석·팡씨 저택",
    ledeMeta: "타이난시 / 대만 / 2025 / 전시 공간",
    intro: "대지는 다두산 완경사면과 인공 수로가 만나는 지점에 위치한다. 설계는 하나의 절곡된 매스로 지형의 고저차에 대응하며, 프라이버시를 지키는 동시에 빛과 물의 경로를 일상 속으로 함께 끌어들인다.",
    paragraphs: [
      "오래된 시대의 삼락(三落) 건축이 신이가(信義街) 골목 사이에 고요히 서 있다. 두꺼운 벽돌벽, 섬세한 박공 몰딩과 긴 매스는 빠르게 변화하는 오늘날의 도시 속에서 유독 장엄하게 느껴진다. 걸어서 이곳을 지나는 사람들은 백 년의 시간을 지나온 이 저택에 이끌려 걸음을 멈추곤 한다. 대문을 열면, 원래 닫혀 있던 거리집은 점차 안쪽으로 펼쳐지고, 매스와 정원이 서로 어긋나며 자리한다. 이번 복원과 재설계에서는 신구 관계에 응답하는 핵심 수법으로 '틈'을 사용했다. 빛과 시선, 그리고 사람의 걸음이 실체와 공극 사이를 오가며, 서로 다른 시대의 건축 언어가 나란히 놓이게 하고, 시간 자체가 이곳에서 살짝 어긋나는 듯한 감각을 만들어낸다.",
      "이 저택의 역사는 청나라 말기 부성(府城, 옛 타이난)의 무거인(武擧人) 후청위안(胡澄淵)까지 거슬러 올라간다. 후청위안은 어린 시절 바다를 건너 타이완으로 와 부성에 정착했으며, 처음에는 문(文)을 익히다가 이후 무예로 전향해 무거인 시험에 합격했다. 당시 타이난은 도시가 크게 발전하던 시기였고, 그는 부성의 중가(中街)에 저택을 지었다. 을미전쟁 당시에는 군량을 운송하며 류융푸(劉永福)의 항일을 지원하기도 했다. 부성이 함락된 이후에는 가족을 이끌고 본적지인 사오안(紹安)으로 잠시 피신했다. 여러 해가 지난 뒤 다시 타이난으로 돌아와 은거 생활을 선택했지만, 지역의 일에는 계속 관심을 기울였다. 일제강점기, 일본 측은 여러 차례 그에게 관직을 제안했으나 그는 매번 이를 완곡히 거절하며 이민족 아래서 관직에 나아가지 않겠다는 뜻을 지켰다. 공정하고 올곧은 인품으로 알려져 지역의 분쟁을 자주 중재했으며, 그로 인해 이웃들의 깊은 존경을 받았다. 이러한 역사로 인해 이 오래된 저택은 건축 그 자체를 넘어, 부성의 인물과 가문, 그리고 시대 변천의 기억을 함께 담고 있다.",
      "그 후 핑둥(屏東) 출신의 황씨 일가가 타이난으로 이주해 기존의 이진식(二進式) 거리집과 넓은 앞마당을 가진 삼합원을 개조했다. 좌우의 좁고 긴 거리집은 원래 형식을 유지한 채 상업 공간으로 쓰였고, 중앙의 86번지에 해당하는 공간에는 규모가 크고 높은 프라이버시를 갖춘 사합원이 지어져 가족 생활의 중심이 되었다. 저택이 위치한 신강첸(新港墘)은 오조항(五條港)과 가까워, 과거 타이난의 중요한 수운과 상업의 중심지였다. 화물선이 오가고 상인들이 모여들며 도시의 삶이 촘촘히 얽혀 있던 곳이다. 황씨 일가가 이곳에 저택을 지은 것 역시 당시 그들의 경제적 여건과 사회적 지위를 반영한다. 그러나 도시가 발전하고 생활 방식이 변화하면서 황씨 후손들은 점차 이곳을 떠났고, 오래된 저택은 서서히 조용해졌으며, 한때 북적이던 가족의 삶 역시 도시의 기억 일부가 되었다.",
      "여러 해가 지난 뒤, 현재의 소유주인 쉬즈펑(許志鋒) 씨가 이 오래된 저택을 매입했다. 처음에는 철거 후 빌딩을 신축할 계획이었으나, 이렇게 문화적 깊이를 지닌 건축은 보존되어야 한다는 부인의 생각에 따라 계획을 바꾸게 되었다. 소유주는 기존의 배치, 재료, 역사의 흔적을 남기기로 결정하고, 원형건축(原型建築, Prototype Architecture) 팀과 함께 오래된 저택의 공간과 구조를 다시 정리했다. 단순한 '복원'을 목표로 삼기보다, 보존과 개입 사이에서 새로운 가능성을 찾고자 했다.",
      "설계는 '틈'을 과거와 현재를 잇는 공간 전략으로 삼는다. 기존의 두꺼운 벽돌벽은 그대로 보존하고, 새로 설치한 목구조 지붕은 한층 가벼운 태도로 그 사이에 개입한다. 두 요소 사이에는 투명한 유리를 끼워 넣어, 타이난의 맑은 하늘과 자연광, 그리고 정원의 풍경이 실내로 스며들게 한다. 신구 재료는 서로를 흉내 내기보다, 질감과 스케일, 무게의 대비를 통해 서로를 비추어낸다. 개방형으로 둘러싸는 테라스는 전통 사합원의 비교적 폐쇄적인 회랑을 대신하며, 원래 내향적이던 안뜰을 다시 도시와 관계 맺게 한다. 장인들이 남긴 벽돌 장식과 목재 대문, 파사드의 디테일은 중정에서 가장 중요한 시각적 중심이 되어, 사람들이 걸으며 서로 다른 시대가 남긴 흔적을 느낄 수 있게 한다.",
      "그리고 오래된 저택의 앞마당에는 의도적으로 하나의 현대적인 흰색 공간을 삽입했다. 과거와 미래 사이에 놓인 '여백의 상자'와도 같은 존재다. 투명한 유리 파사드는 새 건축 자체의 존재감을 옅게 만들어, 그 안에 있는 사람이 오히려 주변 오래된 저택의 벽돌벽과 조각, 세부 질감을 더욱 또렷하게 바라볼 수 있게 한다. 이 공간은 오래된 저택을 대체하기 위한 것이 아니라, 오래된 저택을 바라보는 또 하나의 시선이 된다. 햇빛은 유리를 통과하고, 공기는 신구 매스 사이를 흐르며, 물과 바람, 자연 또한 한때 닫혀 있던 안뜰로 다시 들어온다. 우리는 이 거의 비어 있는 듯한 공간 속에서 사람들이 단지 역사를 바라보는 데 그치지 않고, 기존의 서사에서 잠시 벗어나 타이난의 빛과 공기, 계절의 변화를 느낄 수 있기를 바란다. 흰색 상자는 그렇게 열린 상상의 그릇이 되어, 오래된 저택의 지난 기억을 받아들이는 동시에 미래를 향한 질문을 남긴다. 백 년 된 오래된 저택이 더 이상 단순히 보존된 유적이 아니게 되었을 때, 그것은 오늘의 도시와 어떤 관계를 맺을 수 있을까.",
      "중앙의 큰 안뜰은 가장 가벼운 방식으로 복원되어, 기존 공간의 스케일과 구조 질서를 최대한 유지함으로써 세 매스가 다시 균형을 찾게 했다. 이층으로 올라가면, 원래 묵직한 편백나무 문 뒤에 있던 칸막이가 적절히 열리고, 새로 설치한 절판형 목구조 지붕이 흩어져 있던 공간을 하나의 개방적인 전시홀로 재통합한다. 지붕이 오르내리는 산 모양의 리듬은 기존 목구조 부재와 서로 호응하며, 마치 새로운 목재 심장처럼 오래된 저택에 새로운 생명을 불어넣는다. 신구의 질감이 이곳에서 서로 엮이며, 오래된 저택은 더 이상 과거를 담아두는 그릇에 머무르지 않고, 문화 활동과 교류가 계속 일어날 수 있는 공간으로, 나아가 대중에게 열린 문화 공간으로 점차 변모해간다.",
      "오늘날 신이가의 타이난 산호석·팡씨 저택은 더 이상 백 년의 역사를 보존하기만 하는 옛집이 아니라, 주거와 전시, 그리고 도시의 공공 문화 사이 어딘가에 자리한 건축 미술관이다. 사람들은 벽돌벽과 목재 대문, 정원, 그리고 새로 만들어진 공간의 틈 사이를 걸으며, 서로 다른 시대가 겹쳐진 흔적을 마주할 수 있다. 이 건축은 시간을 지우려 하지 않고, 오히려 시간을 공간의 일부로 만든다. 후청위안의 부성 저택에서 황씨 일가의 가족 생활을 거쳐, 오늘날 도시를 향해 열린 문화의 장에 이르기까지, 이 오래된 저택은 타이난의 도시 기억을 계속 품어 왔으며, 역사와 현재가 만나는 지점에서 다시금 새로운 생명을 얻는다. 이곳이 지켜온 것은 한 채의 집이라는 형식만이 아니라, 지역의 삶과 사람들의 이야기, 그리고 도시 문화가 끊임없이 흘러가는 궤적이다. 그리고 저 여백의 흰색 상자는 이 역사를 과거에만 머물게 하지 않고, 팡씨 저택과 타이난의 다음 백 년을 위해 계속 상상할 수 있는 여지를 남겨둔다."
    ],
    photos: [
      "중정 파사드. 바로크 양식의 박공과 양옆의 나선 계단, 중앙의 목재 대문",
      "뒷마당 골목. 신구 재료가 만나는 벽돌벽과 목구조 테라스",
      "절판형 목구조 지붕과 붉은 벽돌벽이 만나는 지점. 실내로 쏟아지는 빛",
      "목구조 지붕 접합부 디테일. 벽돌벽과 유리 천창이 만나는 지점을 올려다본 모습",
      "앞마당의 흰색 유리 상자. 오래된 저택의 파사드와 목재 대문을 비춘다",
      "저택 내부 전시실. 얼룩진 벽면과 건축 모형 전시",
      "회랑의 열주와 붉은 나선 계단"
    ],
    designResearch: [
      {
        body: "설계 초기에는 손그림 스터디를 통해 오래된 저택에 새겨진 시간의 흔적과 균열에 대응하는 방식을 검토하고, 새로운 재료(UHPC)로 기존 기둥 구조를 보강하는 방법을 고민했으며, 신구 구조의 하중 전달 논리를 비교하며 합리적인 신구 접합 지점을 찾아냈다.",
        photos: ["기둥 보강 설계 스터디 손그림", "신구 지붕 구조 축측 스케치"]
      },
      {
        body: "실물 모형을 통해 신구 매스의 공간 관계를 검증하고, 중정 회랑과 흰색 상자, 기존 벽돌벽 및 목구조 지붕이 만나는 방식을 시험하며, 전체 배치와 매스 비율을 반복적으로 비교했다.",
        photos: [
          "전체 배치 모형. 세 매스와 중정의 관계를 내려다본 모습",
          "모형 부분. 목구조 지붕과 벽돌 매스가 만나는 지점",
          "모형 디테일. 신구 재료 접합부 처리",
          "모형 평면 조망. 중정 회랑 열주와 흰색 상자 지붕 접합부"
        ]
      }
    ],
    process: [
      "중정 회랑은 UHPC(초고성능 콘크리트)로 기둥을 다시 타설했으며, 1C1~1C6 각 기둥 위치별로 단계적으로 시공해 심하게 손상된 기존 기둥을 대체하면서도 기존 열주의 리듬과 치수를 이어갔다.",
      "기존 벽돌벽과 바닥 슬래브에 구조 보강 공사를 진행했으며, 균열이 심한 구역에는 철골로 보강해 새로운 설계가 개입한 이후에도 오래된 건물의 매스가 충분한 구조 안전성을 유지하도록 했다.",
      "곡면 목구조 지붕은 지상에서 조립을 마친 뒤 전체를 한 번에 들어 올려 제자리에 설치했으며, 이후 지붕 마감 디테일 작업을 진행해 절판 지붕이 아래쪽 벽돌벽과 정확히 맞물리도록 했다."
    ],
    drawings: [
      "설계 1층 평면도",
      "설계 2층 평면도",
      "B-B, D-D 단면 입면도",
      "박공 입면 디테일도",
      "곡면 지붕 단면 접합부 디테일도"
    ],
    mapAddress: "700 타이난시 중시구 뒤웨리 신이가 46항 15호"
  }

};
