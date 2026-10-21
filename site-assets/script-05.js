
window.LEGACY_TEMPLATE_PREVIEWS = (() => {
  const CANVAS_W=800, CANVAS_H=1000;
  let state;
  function render(){} function renderLayerList(){} function saveHistory(){} function showToast(){}
  function placeItemsInSlots(slots){
    slots.forEach((slot,index)=>Object.assign(state.items[index], {
      x:slot.x*CANVAS_W, y:slot.y*CANVAS_H,
      w:slot.w*CANVAS_W, h:slot.h*CANVAS_H, rotation:0
    }));
  }
function _t(content, font, size, weight, x, y, color, align, ls, italic) {
  const id = state.nextId++;
  state.texts.push({ id, content, font, size, color,
    weight: weight||'400', italic: italic||false,
    x, y, align: align||'left', letterSpacing: ls||0, rotation: 0, opacity: 1 });
  state.layerOrder.push({ type: 'text', id });
}

function _clearTexts() {
  state.texts = [];
  state.layerOrder = state.layerOrder.filter(r => r.type === 'item');
}

// ── Editorial Poster (Ref image 5: RECTO 22 F/W style) ──

function applyEditorialTemplate() {
  // Clear existing texts, keep images
  state.texts = [];
  state.layerOrder = state.layerOrder.filter(r => r.type === 'item');

  // Place images in center
  if (state.items.length > 0) {
    const slots = [{ x: 0.08, y: 0.12, w: 0.84, h: 0.7 }];
    placeItemsInSlots(slots);
  }

  const addTmplText = (content, font, size, weight, x, y, color, align, letterSpacing) => {
    const id = state.nextId++;
    state.texts.push({ id, content, font, size, color, weight, italic: false, x, y, align: align||'left', letterSpacing: letterSpacing||0, rotation: 0, opacity: 1 });
    state.layerOrder.push({ type: 'text', id });
  };

  addTmplText('LINSSEN', "'Bebas Neue', sans-serif", 120, '400', 60, 130, '#111111', 'left', 4);
  addTmplText('POP STYLE', "'Bebas Neue', sans-serif", 64, '400', 60, 210, '#111111', 'left', 6);
  addTmplText('2024', "'Raleway', sans-serif", 14, '300', 700, 72, '#111111', 'right', 3);
  addTmplText('THE\nMODERNIST', "'Bebas Neue', sans-serif", 88, '400', CANVAS_W/2, 860, '#111111', 'center', 2);

  render(); renderLayerList(); 
  showToast('已应用「编辑海报」排版');
}

// ── Split Text (Ref image 4: editorial grid text overlay style) ──

function applySplitTextTemplate() {
  state.texts = [];
  state.layerOrder = state.layerOrder.filter(r => r.type === 'item');

  if (state.items.length > 0) {
    const slots = [
      { x: 0.0, y: 0.05, w: 0.42, h: 0.88 },
      { x: 0.44, y: 0.05, w: 0.56, h: 0.88 }
    ];
    placeItemsInSlots(slots);
  }

  const addTmplText = (content, font, size, weight, x, y, color, align, ls) => {
    const id = state.nextId++;
    state.texts.push({ id, content, font, size, color, weight, italic: false, x, y, align: align||'left', letterSpacing: ls||0, rotation: 0, opacity: 1 });
    state.layerOrder.push({ type: 'text', id });
  };

  addTmplText('(LON)        (LA)        (NYC)        (MTL)', "'Raleway', sans-serif", 11, '400', 40, 42, '#cc2200', 'left', 1);
  addTmplText('IT\'S THE ONLY WAY TO\nFEEL SOME SEMBLANCE\nOF ORDER THROUGH\nTHREADS AND SEAMS', "'Outfit', sans-serif", 16, '700', 40, 160, '#cc2200', 'left', 0.5);
  addTmplText('SEMBLANCE\nOF ORDER', "'Bebas Neue', sans-serif", 22, '400', 40, 900, '#cc2200', 'left', 2);

  render(); renderLayerList(); 
  showToast('已应用「分割叠字」排版');
}

// ── Vogue Cover (Ref image 6: large centered letter-spaced text) ──

function applyVogueTemplate() {
  state.texts = [];
  state.layerOrder = state.layerOrder.filter(r => r.type === 'item');

  if (state.items.length > 0) {
    // Full bleed image
    const item = state.items[0];
    item.x = 0; item.y = 0; item.w = CANVAS_W; item.h = CANVAS_H;
    item.rotation = 0;
  }

  const addTmplText = (content, font, size, weight, x, y, color, align, ls) => {
    const id = state.nextId++;
    state.texts.push({ id, content, font, size, color, weight, italic: false, x, y, align: align||'center', letterSpacing: ls||0, rotation: 0, opacity: 1 });
    state.layerOrder.push({ type: 'text', id });
  };

  addTmplText('THE\nPOWER\nOF\nWORDS', "'Raleway', sans-serif", 52, '300', CANVAS_W/2, 600, '#ffffff', 'center', 12);
  addTmplText('Q U O T E  I S S U E', "'Raleway', sans-serif", 14, '400', CANVAS_W/2, 820, '#cc2200', 'center', 6);
  addTmplText('F R E Y A', "'Bebas Neue', sans-serif", 18, '400', CANVAS_W/2, 960, '#ffffff', 'center', 10);

  render(); renderLayerList(); 
  showToast('已应用「大字封面」排版');
}

// ── 品牌日记 (ref: piggie piggie poster) ──

function applyPiggieTemplate() {
  _clearTexts();
  if (state.items.length > 0) placeItemsInSlots([{ x: 0.22, y: 0.08, w: 0.76, h: 0.88 }]);
  _t('ITEM 09', "'Raleway', sans-serif", 11, '600', 60, 55, '#111', 'left', 2);
  _t('piggie piggie', "'Cormorant Garamond', serif", 52, '700', 60, 120, '#111', 'left', 0, true);
  _t('to want something to happen\nor be true and think that\nit could happen or be true', "'Raleway', sans-serif", 10, '300', 60, 170, '#555', 'left', 0.5);
  _t('Slow made in soochow', "'Raleway', sans-serif", 13, '700', 60, 220, '#111', 'left', 1);
  _t('11 . Sep . 2025', "'Raleway', sans-serif", 11, '400', 60, 242, '#111', 'left', 3);
  _t('WHITE & BLACK', "'Bebas Neue', sans-serif", 28, '400', 60, 285, '#111', 'left', 4);
  _t('09 / 11', "'Cormorant Garamond', serif", 38, '700', 60, 900, '#111', 'left', 0);
  _t('Autumn / 2025', "'Cormorant Garamond', serif", 18, '400', 60, 960, '#111', 'left', 1, true);
  render(); renderLayerList(); 
  showToast('已应用「品牌日记」排版');
}

// ── Look拼贴 (ref: look2 with brand labels) ──

function applyLookbookTemplate() {
  _clearTexts();
  if (state.items.length > 0) placeItemsInSlots([
    { x: 0.38, y: 0.06, w: 0.58, h: 0.88 },
    { x: 0.02, y: 0.04, w: 0.32, h: 0.28 },
    { x: 0.02, y: 0.36, w: 0.32, h: 0.28 },
    { x: 0.02, y: 0.68, w: 0.32, h: 0.28 },
  ]);
  _t('look 2', "'Cormorant Garamond', serif", 32, '400', 60, 50, '#8b1a1a', 'left', 2, true);
  _t('TOP CLOSET', "'Bebas Neue', sans-serif", 14, '400', 60, 310, '#8b1a1a', 'left', 3);
  _t('LA FESTIN', "'Bebas Neue', sans-serif", 14, '400', 60, 580, '#8b1a1a', 'left', 3);
  _t('TOP CLOSET', "'Bebas Neue', sans-serif", 14, '400', 60, 940, '#8b1a1a', 'left', 3);
  render(); renderLayerList(); 
  showToast('已应用「Look拼贴」排版');
}

// ── 品牌社论 (ref: ZARA About the Brand) ──

function applyZaraTemplate() {
  _clearTexts();
  if (state.items.length > 0) placeItemsInSlots([
    { x: 0.0, y: 0.0, w: 0.55, h: 0.48 },
    { x: 0.58, y: 0.04, w: 0.4, h: 0.42 },
  ]);
  _t('BRADN / WOMEN / VISUAL', "'Raleway', sans-serif", 9, '400', CANVAS_W/2, 30, '#aaa', 'center', 3);
  _t('ABOUT THE BRAND', "'Bebas Neue', sans-serif", 48, '400', CANVAS_W/2, 540, '#111', 'center', 4);
  _t('我们不定义潮流，我们让潮流走向更多人', "'Noto Sans SC', sans-serif", 11, '400', 60, 610, '#555', 'left', 1);
  _t('For this season, we interpret\n"Urban Naturalism". Designs draw\nfrom the natural world.', "'Raleway', sans-serif", 11, '300', 60, 680, '#555', 'left', 0.3);
  _t('/ SS2026', "'Bebas Neue', sans-serif", 22, '400', 480, 620, '#111', 'left', 3);
  _t('LINSSEN', "'Bebas Neue', sans-serif", 44, '400', 60, 940, '#111', 'left', 6);
  render(); renderLayerList(); 
  showToast('已应用「品牌社论」排版');
}

// ── 极简标题 (ref: BIJOUTERIE CLASSIC) ──

function applyBijouTemplate() {
  _clearTexts();
  if (state.items.length > 0) placeItemsInSlots([{ x: 0.18, y: 0.28, w: 0.66, h: 0.56 }]);
  _t('BIJOUTERIE', "'Unbounded', sans-serif", 48, '700', 60, 200, '#111', 'left', -1);
  _t('CLASSIC', "'Unbounded', sans-serif", 16, '400', 62, 258, '#111', 'left', 2);
  _t('MODERN', "'Raleway', sans-serif", 11, '400', 48, 580, '#cc2200', 'left', 4, false);
  _t('MODERNCLOTHES.COM  →', "'Raleway', sans-serif", 10, '400', 480, 870, '#111', 'left', 2);
  render(); renderLayerList(); 
  showToast('已应用「极简标题」排版');
}

// ── 工作室页 (ref: Studio Precinct — text + image coexist) ──

function applyStudioTemplate() {
  _clearTexts();
  if (state.items.length > 0) placeItemsInSlots([
    { x: 0.38, y: 0.52, w: 0.58, h: 0.42 },
    { x: 0.04, y: 0.36, w: 0.3, h: 0.22 },
  ]);
  _t('ABOUT STUDIO LINSSEN', "'Raleway', sans-serif", 10, '700', 60, 60, '#111', 'left', 2);
  _t('Studio Linssen, founded by\nLinssen, is a full-service\ncontent studio that offers\na curated atmosphere for\nyour creative projects.', "'Raleway', sans-serif", 11, '300', 60, 200, '#444', 'left', 0.3);
  _t('The space is equipped with\nversatile tools and features\ncurated sets, with in-house\nexperts available to assist\nwith any creative services.', "'Raleway', sans-serif", 11, '300', 420, 200, '#444', 'left', 0.3);
  _t('A CURATED SPACE, YET\nVERSATILE FOR YOUR\nCREATIVE PURSUITS.', "'Unbounded', sans-serif", 34, '700', 50, 820, '#111', 'left', -1);
  render(); renderLayerList(); 
  showToast('已应用「工作室页」排版');
}

// ── 杂志竖排 (ref: magazine spread with vertical text) ──

function applyMagazineTemplate() {
  _clearTexts();
  if (state.items.length > 0) placeItemsInSlots([{ x: 0.0, y: 0.0, w: 0.5, h: 1.0 }]);
  _t('PAGE 17', "'Raleway', sans-serif", 9, '400', 40, 30, '#999', 'left', 2);
  _t('END\nPAGE 18', "'Raleway', sans-serif", 9, '400', 700, 30, '#999', 'right', 1);
  _t('IT WAS KURT AND COURTNEY WHO\nBROUGHT US GRUNGE.\nWE ALL WANTED THEIR STYLING –\nLAIDBACK YET WITH IMPACT –\nAND THEIR FATEFUL RO-\nMANCE. WHENEVER I MATCH\nA WHITE OUTFIT WITH\nRED LIPSTICK,\nCOURTNEY COMES\nFLEETINGLY TO MIND.', "'Raleway', sans-serif", 13, '700', 460, 300, '#cc2200', 'left', 2);
  render(); renderLayerList(); 
  showToast('已应用「杂志竖排」排版');
}

// ── 单品卡片 (ref: piggie piggie item card style) ──

function applyItemCardTemplate() {
  _clearTexts();
  if (state.items.length > 0) placeItemsInSlots([{ x: 0.1, y: 0.18, w: 0.8, h: 0.62 }]);
  _t('ITEM 09', "'Raleway', sans-serif", 10, '700', CANVAS_W/2, 55, '#111', 'center', 3);
  _t('LINSSEN\nSTYLE', "'Bebas Neue', sans-serif", 72, '400', CANVAS_W/2, 160, '#111', 'center', 5);
  _t('Slow made · Soochow', "'Cormorant Garamond', serif", 14, '400', CANVAS_W/2, 220, '#555', 'center', 2, true);
  _t('WE LOVE THIS FOR AUTUMN', "'Raleway', sans-serif", 9, '700', CANVAS_W - 60, 920, '#111', 'right', 3);
  _t('" Excellence is to do\na common thing in an uncommon way "', "'Raleway', sans-serif", 9, '300', CANVAS_W - 60, 945, '#777', 'right', 0.5);
  render(); renderLayerList(); 
  showToast('已应用「单品卡片」排版');
}

// ── 拼贴叠加 → # FASHION TRENDS（大标题+居中主图+底部三图+季节标注）──

function applyCollage() {
  _clearTexts();
  if (state.items.length > 0) {
    placeItemsInSlots([
      { x: 0.10, y: 0.22, w: 0.80, h: 0.40 },
      { x: 0.00, y: 0.68, w: 0.32, h: 0.26 },
      { x: 0.34, y: 0.68, w: 0.32, h: 0.26 },
      { x: 0.68, y: 0.68, w: 0.32, h: 0.26 },
    ]);
  }
  _t('# FASHION TRENDS', "'Outfit', sans-serif", 52, '700', CANVAS_W/2, 95, '#111', 'center', -1);
  _t('This season\'s dress combines french pajamas with design elements\nsuch as lanyard, pleats and flowers to show the girl\'s laziness,\nor light, or distinctive girl temperament.', "'Raleway', sans-serif", 9, '300', CANVAS_W/2, 150, '#666', 'center', 0.3);
  _t("22 ' SS", "'Outfit', sans-serif", 38, '400', CANVAS_W/2, 660, '#111', 'center', 2);
  _t('I WOULDN\'T USE COLOUR AS A DRAMATIC ELEMENT,\nTHEY SHOULD BE A VERY NATURAL PART OF THE FILM FOR ME.', "'Raleway', sans-serif", 8, '300', 60, 968, '#888', 'left', 0.5);
  render(); renderLayerList(); 
  showToast('已应用「Fashion Trends」排版');
}

// ── 网格对齐 → Ida Tort（手写体品牌名 + 副标题 + 大图居中）──

function applyGrid() {
  _clearTexts();
  if (state.items.length > 0) {
    placeItemsInSlots([{ x: 0.06, y: 0.28, w: 0.88, h: 0.65 }]);
  }
  _t('Ida Tort', "'Italiana', serif", 72, '400', CANVAS_W/2, 150, '#7a1a1a', 'center', 0, true);
  _t('Our fastest selling sunglasses are finally back in stock', "'Raleway', sans-serif", 13, '300', CANVAS_W/2, 200, '#555', 'center', 0.5);
  render(); renderLayerList(); 
  showToast('已应用「Ida Tort」极简排版');
}

// ── 海报模式 → MO NDAY TO FRID AY（超大断行标题叠图左侧）──

function applyPoster() {
  _clearTexts();
  if (state.items.length > 0) {
    placeItemsInSlots([{ x: 0.2, y: 0.0, w: 0.8, h: 0.88 }]);
  }
  _t('MO\nNDAY\nTO\nFRID\nAY', "'Unbounded', sans-serif", 88, '900', 28, 60, '#111', 'left', -3);
  _t('FALL/\nWINTER 2025\nBASIC\nCOLLECTION', "'Unbounded', sans-serif", 14, '700', 28, 700, '#111', 'left', 0);
  _t('Above: WHITE SHIRT, HOUNDSTOOD BLAZER, CORDUROY TROUSERS AND BAG.', "'Raleway', sans-serif", 9, '400', CANVAS_W/2, 960, '#333', 'center', 1, true);
  render(); renderLayerList(); 
  showToast('已应用「Monday to Friday」排版');
}

// ── 自由排版(原海报) → FASHION TIPS（杂志双栏）──

function applyFashionMag() {
  _clearTexts();
  if (state.items.length > 0) {
    placeItemsInSlots([
      { x: 0.02, y: 0.10, w: 0.46, h: 0.36 },
      { x: 0.50, y: 0.34, w: 0.48, h: 0.50 },
    ]);
  }
  _t('#12', "'Raleway', sans-serif", 10, '400', 44, 38, '#333', 'left', 1);
  _t('21/02/2025', "'Raleway', sans-serif", 10, '400', CANVAS_W/2, 38, '#333', 'center', 1);
  _t('#12', "'Raleway', sans-serif", 10, '400', CANVAS_W - 44, 38, '#333', 'right', 1);
  _t('FASHION\nTIPS FOR\nEVERYONE', "'Cinzel', serif", 44, '400', 450, 130, '#111', 'left', 0);
  _t('by Linssen', "'Cormorant Garamond', serif", 14, '400', 44, 520, '#8b4513', 'left', 0, true);
  _t('This season\'s dress combines french pajamas\nwith design elements such as lanyard, pleats\nand flowers to show the girl\'s laziness,\nor light, distinctive girl temperament.', "'Raleway', sans-serif", 9, '300', 44, 552, '#444', 'left', 0.3);
  _t('I wouldn\'t use colour as a dramatic element,\nthey should be a very natural part of the film\nfor me. Excellence is to do a common thing\nin an uncommon way.', "'Raleway', sans-serif", 9, '300', 44, 650, '#444', 'left', 0.3);
  _t('To want something to happen or be true and\nthink that it could happen or be true is a very\nnatural part of the creative process for me.', "'Raleway', sans-serif", 9, '300', 44, 745, '#444', 'left', 0.3);
  render(); renderLayerList(); 
  showToast('已应用「Fashion Tips」杂志排版');
}

// ── DAILY LOOK 每日穿搭 ──

function applyDailyLookTemplate() {
  _clearTexts();
  if (state.items.length > 0) placeItemsInSlots([
    { x: 0.25, y: 0.12, w: 0.50, h: 0.72 },
    { x: 0.0,  y: 0.18, w: 0.28, h: 0.32 },
    { x: 0.0,  y: 0.54, w: 0.28, h: 0.32 },
    { x: 0.66, y: 0.24, w: 0.30, h: 0.20 },
    { x: 0.66, y: 0.48, w: 0.30, h: 0.20 },
    { x: 0.66, y: 0.72, w: 0.30, h: 0.20 },
  ]);
  _t('DAILY  LOOK', "'Unbounded', sans-serif", 72, '900', CANVAS_W/2, 65, '#333', 'center', -2);
  _t('HELLO RUISEN, inspired by\nnature and crafted for daily life.\nclothing is an intimate companion\nin our everyday lives.', "'Raleway', sans-serif", 10, '300', 44, 170, '#555', 'left', 0.3, true);
  _t('( collection )', "'Raleway', sans-serif", 11, '400', CANVAS_W - 80, 170, '#333', 'center', 1);
  _t('BLACK TOP', "'Bebas Neue', sans-serif", 14, '400', CANVAS_W - 80, 450, '#111', 'center', 2);
  _t('100% Organic Cotton', "'Raleway', sans-serif", 8, '300', CANVAS_W - 80, 468, '#777', 'center', 0.5);
  _t('SPORTS SHORTS', "'Bebas Neue', sans-serif", 14, '400', CANVAS_W - 80, 680, '#111', 'center', 2);
  _t('ECOFRIENDLY FABRIC', "'Bebas Neue', sans-serif", 10, '400', 44, 920, '#333', 'left', 3);
  render(); renderLayerList(); 
  showToast('已应用「Daily Look」穿搭排版');
}

// ── VOGUE 封面 ──

function applyVogueCoverTemplate() {
  _clearTexts();
  if (state.items.length > 0) placeItemsInSlots([{ x: 0.0, y: 0.0, w: 1.0, h: 1.0 }]);
  _t('VOGUE', "'Bebas Neue', sans-serif", 170, '400', CANVAS_W/2, 148, '#A8C4E0', 'center', 8);
  _t('SINGAPORE', "'Raleway', sans-serif", 11, '600', 160, 52, '#A8C4E0', 'left', 3);
  _t('ISSUE 39', "'Raleway', sans-serif", 9, '400', CANVAS_W - 44, 195, '#ffffff', 'right', 1);
  _t('march', "'Cormorant Garamond', serif", 10, '400', CANVAS_W - 44, 210, '#ffffff', 'right', 1, true);
  _t('Jeon Somi', "'Italiana', serif", 52, '400', 44, 860, '#A8C4E0', 'left', 0, true);
  _t('"I\'m getting\ncloser to showing\nmore of who\nI really am"', "'Cormorant Garamond', serif", 14, '400', 44, 540, '#ffffff', 'left', 0, true);
  _t('RISE OF\nTHE TITANS', "'Raleway', sans-serif", 13, '700', CANVAS_W - 44, 340, '#ffffff', 'right', 0.5);
  _t('Three cosplayers\nbreaking new\nground in\nself-expression', "'Raleway', sans-serif", 9, '300', CANVAS_W - 44, 420, '#ffffff', 'right', 0.3);
  _t('EX MACHINA', "'Raleway', sans-serif", 13, '700', CANVAS_W - 44, 530, '#ffffff', 'right', 0.5);
  _t('Cutting-edge\nbeauty in the\ncybertronic age', "'Raleway', sans-serif", 9, '300', CANVAS_W - 44, 590, '#ffffff', 'right', 0.3);
  render(); renderLayerList(); 
  showToast('已应用「VOGUE」封面排版');
}

// ── 水墨海报 ──

function applyDailyLook2Template() {
  _clearTexts();
  if (state.items.length > 0) placeItemsInSlots([
    { x: 0.38, y: 0.28, w: 0.60, h: 0.68 },
    { x: 0.32, y: 0.02, w: 0.22, h: 0.20 },
    { x: 0.55, y: 0.02, w: 0.22, h: 0.20 },
    { x: 0.78, y: 0.02, w: 0.22, h: 0.20 },
    { x: 0.0,  y: 0.62, w: 0.34, h: 0.34 },
  ]);
  _t('DAILYLOOK', "'Unbounded', sans-serif", 58, '900', 44, 50, '#333', 'left', -2);
  _t('HELLO RUISEN', "'Raleway', sans-serif", 11, '700', 44, 200, '#333', 'left', 2);
  _t('inspired by nature and crafted for daily life\nWe believe clothing is an intimate\ncompanion in our everyday lives\nThats why we design and create our pieces\nin a more eco friendly and sustainable way\ntaking gently from nature giving back\nsoftly in return. May every\nwear bring your body pure comfort and ease', "'Raleway', sans-serif", 9, '300', 44, 260, '#555', 'left', 0.3);
  _t('ECOFRIENDLY FABRIC', "'Bebas Neue', sans-serif", 10, '400', 44, 450, '#333', 'left', 3);
  _t('100% 有机棉 100% Organic Cotton\nRSTO39', "'Raleway', sans-serif", 9, '300', 44, 950, '#666', 'left', 0.5);
  render(); renderLayerList(); 
  showToast('已应用「穿搭合集」排版');
}

// ── Our Summer 甜美夏日 ──

function applyOurSummerTemplate() {
  _clearTexts();
  if (state.items.length > 0) placeItemsInSlots([
    { x: 0.08, y: 0.18, w: 0.84, h: 0.55 },
  ]);
  _t('Leanan Part 02', "'Cormorant Garamond', serif", 12, '400', 44, 40, '#ddb8b8', 'left', 1, true);
  _t('Look, It\'s her', "'Raleway', sans-serif", 11, '400', CANVAS_W/2, 100, '#999', 'center', 1);
  _t('Our Summer', "'Cormorant Garamond', serif", 48, '400', CANVAS_W/2, 148, '#ddb8b8', 'center', 1, true);
  _t('20', "'Raleway', sans-serif", 14, '400', CANVAS_W/2 - 140, 140, '#999', 'center', 0);
  _t('25', "'Raleway', sans-serif", 14, '400', CANVAS_W/2 + 140, 140, '#999', 'center', 0);
  _t('01', "'Raleway', sans-serif", 16, '400', 240, 540, '#999', 'center', 0);
  _t('02', "'Raleway', sans-serif", 16, '400', 560, 640, '#999', 'center', 0);
  _t('In the deep night of the city, the fragrance of\nsoil and leaves rises with the air, and a fresh\nbut slightly moist breath blows towards you.', "'Cormorant Garamond', serif", 11, '400', CANVAS_W/2, 860, '#777', 'center', 0.3, true);
  render(); renderLayerList(); 
  showToast('已应用「Our Summer」排版');
}

// ── The Gardener 手账拼贴 ──

function applyGardenerTemplate() {
  _clearTexts();
  if (state.items.length > 0) placeItemsInSlots([
    { x: 0.1, y: 0.12, w: 0.8, h: 0.78 },
  ]);
  _t('"THE GARDENER"', "'Cormorant Garamond', serif", 28, '400', CANVAS_W/2, 60, '#444', 'center', 1, true);
  _t('Silk scarf & Suit\nwith a lapel jacket style', "'Cormorant Garamond', serif", 13, '400', CANVAS_W - 100, 480, '#555', 'left', 0.3, true);
  _t('Pinafore-style skirt', "'Cormorant Garamond', serif", 13, '400', 100, 720, '#555', 'left', 0.3, true);
  render(); renderLayerList(); 
  showToast('已应用「The Gardener」手账排版');
}

// ── SHIRT+SHIRT 日系杂志 ──

function applyShirtMagTemplate() {
  _clearTexts();
  if (state.items.length > 0) placeItemsInSlots([
    { x: 0.12, y: 0.14, w: 0.76, h: 0.72 },
  ]);
  _t("NOW'S THE TIME FOR SHIRTS!", "'Raleway', sans-serif", 8, '400', 44, 28, '#333', 'left', 2);
  _t('( 09 )', "'Raleway', sans-serif", 12, '400', CANVAS_W/2, 28, '#333', 'center', 2);
  _t('SHIRT + SHIRT + SHIRT', "'Raleway', sans-serif", 8, '400', CANVAS_W - 44, 28, '#333', 'right', 2);
  _t('SHIRT + SHIRT + SHIRT', "'Unbounded', sans-serif", 32, '900', CANVAS_W/2, 80, '#111', 'center', -1);
  _t('Perfect from\nevery angle!', "'Cormorant Garamond', serif", 12, '400', 140, 480, '#333', 'left', 0, true);
  _t('DAY.\n25', "'Raleway', sans-serif", 11, '700', CANVAS_W - 120, 420, '#333', 'left', 1);
  _t('DAY. 25', "'Raleway', sans-serif", 9, '700', CANVAS_W - 120, 760, '#333', 'left', 1);
  _t('ベーシックで、どう選ぶ？', "'Noto Sans SC', sans-serif", 10, '700', CANVAS_W - 120, 790, '#333', 'left', 0);
  _t('FUDGE 113>', "'Raleway', sans-serif", 8, '400', CANVAS_W - 44, 960, '#999', 'right', 2);
  render(); renderLayerList(); 
  showToast('已应用「日系杂志」排版');
}



  const templates={'editorial':applyEditorialTemplate,'splittext':applySplitTextTemplate,'vogue':applyVogueTemplate,'piggie':applyPiggieTemplate,'lookbook':applyLookbookTemplate,'zara':applyZaraTemplate,'bijou':applyBijouTemplate,'studio':applyStudioTemplate,'magazine':applyMagazineTemplate,'itemcard':applyItemCardTemplate,'collage':applyCollage,'grid':applyGrid,'poster':applyPoster,'fashionmag':applyFashionMag,'dailylook':applyDailyLookTemplate,'vogue_cover':applyVogueCoverTemplate,'dailylook2':applyDailyLook2Template,'oursummer':applyOurSummerTemplate,'gardener':applyGardenerTemplate,'shirtmag':applyShirtMagTemplate};

  return Object.fromEntries(Object.entries(templates).map(([id,apply])=>{
    state={items:Array.from({length:12},(_,i)=>({id:1000+i,x:0,y:0,w:0,h:0,rotation:0})),texts:[],layerOrder:[],nextId:0};
    apply();
    return [id,{id,bg:'#FFFFFF',slots:state.items.filter(item=>item.w>0&&item.h>0).map(({x,y,w,h,rotation})=>({x,y,w,h,rotation})),texts:state.texts}];
  }));
})();

