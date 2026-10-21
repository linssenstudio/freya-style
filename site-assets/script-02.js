

function templateImageMetadata(item) {
  const keys = ['imageFit','imageFocusX','imageFocusY','imageZoom','isPlaceholder','templateFrame','frameLabel','noShadow'];
  return Object.fromEntries(keys.filter(k=>item[k]!==undefined).map(k=>[k,item[k]]));
}
function drawFittedImage(context,item) {
  if(!item.img || !item.img.complete || !item.img.naturalWidth)return;
  const iw=item.img.naturalWidth,ih=item.img.naturalHeight;
  if(item.imageFit==='contain'){
    const ratio=Math.min(item.w/iw,item.h/ih),w=iw*ratio,h=ih*ratio;
    context.drawImage(item.img,-w/2,-h/2,w,h);return;
  }
  if(item.imageFit!=='cover'){context.drawImage(item.img,-item.w/2,-item.h/2,item.w,item.h);return;}
  const ratio=Math.max(item.w/iw,item.h/ih)*Math.max(1,Number(item.imageZoom)||1);
  const sw=item.w/ratio,sh=item.h/ratio;
  const fx=Math.min(1,Math.max(0,Number(item.imageFocusX ?? .5)));
  const fy=Math.min(1,Math.max(0,Number(item.imageFocusY ?? .5)));
  context.drawImage(item.img,(iw-sw)*fx,(ih-sh)*fy,sw,sh,-item.w/2,-item.h/2,item.w,item.h);
}
// ==================== STATE ====================

const state = {
  items: [],
  texts: [],
  layerOrder: [],
  template: 'none',
  bgColor: '#FFFFFF',
  borderWidth: 0,
  borderInset: 20,
  borderColor: '#111111',
  extractedColors: [],      // 存储提取的颜色
  library: { top: [], pants: [], skirt: [], dress: [], bag: [], accessory: [], shoes: [], mood: [] }, // 本地服装库状态
  activeLibraryTab: null,   // 当前激活的服装库分类
  interactionMode: 'normal',// 新增：交互模式 'normal' | 'crop'
  cropStart: null,          // 新增：裁剪起点
  currentMouse: null,       // 新增：裁剪当前鼠标位置
  selected: null,
  dragging: null,
  dragOffset: { x: 0, y: 0 },
  hasChanged: false,        // 新增：记录拖拽中是否发生变化
  history: [],              // 新增：历史记录栈
  historyIndex: -1,         // 新增：历史索引
  nextId: 0
};

let CANVAS_W = 800;
let CANVAS_H = 1000;

const FONT_PRESETS = [
  { name: "Bebas Neue (粗体展示)", value: "'Bebas Neue', sans-serif" },
  { name: "Italiana (意式优雅)", value: "'Italiana', serif" },
  { name: "Cinzel (古典大写)", value: "'Cinzel', serif" },
  { name: "Unbounded (极简宽体)", value: "'Unbounded', sans-serif" },
  { name: "Raleway (纤细无衬线)", value: "'Raleway', sans-serif" },
  { name: "Josefin Sans (几何无衬线)", value: "'Josefin Sans', sans-serif" },
  { name: "Bodoni Moda (时尚衬线)", value: "'Bodoni Moda', serif" },
  { name: "Libre Baskerville (古典衬线)", value: "'Libre Baskerville', serif" },
  { name: "Outfit (现代圆润)", value: "'Outfit', sans-serif" },
  { name: "Space Grotesk (科技感)", value: "'Space Grotesk', sans-serif" },
  { name: "Playfair (优雅衬线)", value: "'Playfair Display', serif" },
  { name: "Cormorant (古典纤细)", value: "'Cormorant Garamond', serif" },
  { name: "Archivo Black (重黑无衬线)", value: "'Archivo Black', sans-serif" },
  { name: "思源黑体", value: "'Noto Sans SC', sans-serif" }
];

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// ==================== HISTORY (UNDO/REDO) ====================
// 全局图片缓存：任何图片加入 state 时存入，撤回时从这里恢复
const _imgCache = {};
function cacheItemImgs(item) {
  if (item.img)     _imgCache[`${item.id}_img`]     = item.img;
  if (item.origImg) _imgCache[`${item.id}_origImg`] = item.origImg;
}

function saveHistory() {
  if (state.historyIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIndex + 1);
  }
  // 把当前所有图片存入缓存（保证撤回时能找到）
  state.items.forEach(cacheItemImgs);
  // 快照只存轻量数据
  const snapshot = {
    items: state.items.map(item => ({
      id: item.id, name: item.name, ...templateImageMetadata(item), img: item.img, origImg: item.origImg,
      x: item.x, y: item.y, w: item.w, h: item.h,
      baseW: item.baseW, baseH: item.baseH,
      rotation: item.rotation, opacity: item.opacity ?? 1,
      colors: item.colors,
    })),
    texts: state.texts.map(text => ({...text})),
    layerOrder: state.layerOrder.map(lo => ({...lo})),
    bgColor: state.bgColor,
    borderWidth: state.borderWidth,
    borderInset: state.borderInset,
    borderColor: state.borderColor,
    template: state.template, canvasW: CANVAS_W, canvasH: CANVAS_H, contentBaseW: state.contentBaseW||800, contentBaseH: state.contentBaseH||1000
  };
  state.history.push(snapshot);
  if (state.history.length > 30) state.history.shift();
  state.historyIndex = state.history.length - 1;
  updateUndoRedoUI();
}

function restoreSnapshot(snapshot) {
  if (!snapshot) return;
  // 从全局缓存里取回 Image 对象（包括已被删除的图层）
  state.items = snapshot.items.map(snap => {
    const img     = snap.img || _imgCache[`${snap.id}_img`];
    const origImg = snap.origImg || _imgCache[`${snap.id}_origImg`];
    if (!img) return null;
    return { ...snap, img, origImg: origImg || img };
  }).filter(Boolean);
  state.texts = snapshot.texts.map(text => ({...text}));
  state.layerOrder = snapshot.layerOrder.map(lo => ({...lo}));
  state.bgColor = snapshot.bgColor;
  state.borderWidth = snapshot.borderWidth;
  state.borderInset = snapshot.borderInset;
  state.borderColor = snapshot.borderColor;
  state.template = snapshot.template;
  state.contentBaseW = snapshot.contentBaseW||800; state.contentBaseH = snapshot.contentBaseH||1000;
  state.selected = null;
  if(window.applyCanvasDimensions)applyCanvasDimensions(snapshot.canvasW||800,snapshot.canvasH||1000,false);
  setInteractionMode('normal');
  updateExtractedColors();
  renderLayerList();
  renderInspector();
  render();
  updateUndoRedoUI();
}

function undo() {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    restoreSnapshot(state.history[state.historyIndex]);
    showToast('已撤回');
  }
}

function redo() {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    restoreSnapshot(state.history[state.historyIndex]);
    showToast('已恢复');
  }
}

function updateUndoRedoUI() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  if (undoBtn) {
    undoBtn.style.opacity = state.historyIndex > 0 ? '1' : '0.4';
    undoBtn.style.pointerEvents = state.historyIndex > 0 ? 'auto' : 'none';
  }
  if (redoBtn) {
    redoBtn.style.opacity = state.historyIndex < state.history.length - 1 ? '1' : '0.4';
    redoBtn.style.pointerEvents = state.historyIndex < state.history.length - 1 ? 'auto' : 'none';
  }
}

// ==================== IMAGE PROCESSING & COLOR EXTRACT ====================
function removeWhiteBg(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  const d = cx.getImageData(0, 0, c.width, c.height);
  const px = d.data;
  const threshold = 230;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i+1], b = px[i+2];
    if (r > threshold && g > threshold && b > threshold) {
      const whiteness = Math.min(r, g, b);
      const alpha = whiteness > 245 ? 0 : Math.round(255 * (1 - (whiteness - threshold) / (255 - threshold)));
      px[i+3] = Math.max(0, Math.min(255, alpha));
    }
  }
  cx.putImageData(d, 0, 0);
  const resultImg = new Image();
  resultImg.src = c.toDataURL('image/png');
  return resultImg;
}

function extractColors(img, n = 5) {
  const c = document.createElement('canvas');
  const maxDim = 100;
  const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
  c.width = Math.max(1, Math.floor(img.naturalWidth * scale));
  c.height = Math.max(1, Math.floor(img.naturalHeight * scale));
  const cx = c.getContext('2d');
  cx.drawImage(img, 0, 0, c.width, c.height);
  const d = cx.getImageData(0, 0, c.width, c.height).data;
  
  const buckets = {};
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i+3];
    if (a < 200) continue;
    const r = d[i], g = d[i+1], b = d[i+2];
    const luma = 0.299*r + 0.587*g + 0.114*b;
    if (luma > 240 || luma < 15) continue; // 忽略太白或太黑
    const maxC = Math.max(r,g,b), minC = Math.min(r,g,b);
    const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
    if (sat < 0.08 && luma > 100) continue;
    
    const q = 32;
    const br = Math.round(r / q) * q;
    const bg = Math.round(g / q) * q;
    const bb = Math.round(b / q) * q;
    const key = `${br},${bg},${bb}`;
    buckets[key] = (buckets[key] || 0) + 1;
  }
  
  return Object.entries(buckets)
    .sort((a,b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => {
      const [r,g,b] = k.split(',').map(Number);
      return '#' + [r,g,b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2,'0')).join('').toUpperCase();
    });
}

function updateExtractedColors() {
  const allColors = [];
  const seen = new Set();
  state.items.forEach(item => {
    if (item.colors) item.colors.forEach(c => {
      if (!seen.has(c)) { seen.add(c); allColors.push(c); }
    });
  });
  state.extractedColors = allColors.slice(0, 12);
  
  const container = document.getElementById('extractedColors');
  if (state.extractedColors.length === 0) {
    container.innerHTML = '<span class="inspector-empty" style="padding:0;">上传单品后自动提取</span>';
  } else {
    container.innerHTML = state.extractedColors.map(c => 
      `<div class="extracted-chip" style="background:${c}" onclick="setBorderColor('${c}'); saveHistory();" title="${c}"></div>`
    ).join('');
  }
}

// ==================== UPLOAD (click / drop / paste) ====================
function handleFileInput(e) {
  processFiles(Array.from(e.target.files));
  e.target.value = '';
}

function processFiles(files) {
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  if (imageFiles.length === 0) return;
  imageFiles.forEach(file => processImageFile(file));
}

function processImageFile(file) {
  const reader = new FileReader();
  reader.onload = (ev) => addItemFromDataUrl(ev.target.result, file.name || 'Image');
  reader.readAsDataURL(file);
}

function addItemFromDataUrl(dataUrl, name) {
  const img = new Image();
  img.onload = () => {
    const id = state.nextId++;
    const scale = 0.35;
    const displayW = CANVAS_W * scale;
    const ratio = img.naturalHeight / img.naturalWidth;
    const displayH = displayW * ratio;
    
    const pos = findEmptyPosition(displayW, displayH);
    const colors = extractColors(img);
    
    state.items.push({
      id,
      name: name.replace(/\.[^.]+$/, ''),
      img: img,
      origImg: img,
      colors,
      x: pos.x, y: pos.y,
      w: displayW, h: displayH,
      baseW: displayW, baseH: displayH,
      rotation: 0,
      opacity: 1,
    });
    _imgCache[`${id}_img`] = img;
    _imgCache[`${id}_origImg`] = img;
    state.layerOrder.push({ type: 'item', id });
    
    updateExtractedColors();
    selectLayer('item', id);
    render();
    saveHistory();
    showToast('图层已添加');
  };
  img.src = dataUrl;
}

function findEmptyPosition(w, h) {
  const margin = 40;
  const cx = CANVAS_W/2 - w/2;
  const cy = CANVAS_H/2 - h/2;
  let ox = 0, oy = 0;
  while (state.items.some(i => Math.abs(i.x - (cx + ox)) < 10 && Math.abs(i.y - (cy + oy)) < 10)) {
    ox += 20; oy += 20;
  }
  return { x: cx + ox, y: cy + oy };
}

// Drag & drop logic
['dragenter','dragover'].forEach(ev => {
  document.addEventListener(ev, (e) => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
      e.preventDefault();
      document.getElementById('uploadZone').classList.add('drag-over');
      document.getElementById('canvasWrapper').classList.add('drop-target');
    }
  });
});
['dragleave','drop'].forEach(ev => {
  document.addEventListener(ev, (e) => {
    if (ev === 'dragleave' && e.relatedTarget && document.body.contains(e.relatedTarget)) return;
    document.getElementById('uploadZone').classList.remove('drag-over');
    document.getElementById('canvasWrapper').classList.remove('drop-target');
  });
});
document.addEventListener('drop', (e) => {
  if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
  e.preventDefault();
  processFiles(Array.from(e.dataTransfer.files));
});

// Paste from clipboard
document.addEventListener('paste', (e) => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return; 
  const items = (e.clipboardData || window.clipboardData).items;
  if (!items) return;
  for (const it of items) {
    if (it.type && it.type.startsWith('image/')) {
      const file = it.getAsFile();
      if (file) { processImageFile(file); showToast('已从剪贴板粘贴'); }
    }
  }
});

// ==================== LIBRARY LOGIC (新增服装库逻辑) ====================
function toggleLibrary(cat) {
  if (state.activeLibraryTab === cat) {
    // 再次点击相同分类，收起抽屉
    state.activeLibraryTab = null;
    document.getElementById('libraryDrawer').style.display = 'none';
  } else {
    // 切换或打开分类抽屉
    state.activeLibraryTab = cat;
    document.getElementById('libraryDrawer').style.display = 'flex';
  }
  
  document.querySelectorAll('.library-tab').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === state.activeLibraryTab);
  });
  
  if (state.activeLibraryTab) {
    renderLibraryDrawer();
  }
}

function renderLibraryDrawer() {
  const drawer = document.getElementById('libraryDrawer');
  const cat = state.activeLibraryTab;
  if (!cat) return;
  
  const items = state.library[cat];
  const catName = document.querySelector(`.library-tab[data-cat="${cat}"]`).innerText;
  
  let html = `
    <div class="library-upload-btn" onclick="document.getElementById('libraryInput').click()">
      <div class="geo-icon">✚</div>
      <div style="font-size:11px; font-weight:600;">上传至${catName}</div>
    </div>
  `;
  
  items.forEach((item, idx) => {
    html += `
      <div class="library-item"
        onclick="addItemFromLibrary('${cat}', ${idx})"
        onmouseenter="showLibPreview(this, '${item.img.src}')"
        onmouseleave="hideLibPreview()">
        <img src="${item.img.src}" alt="${escapeHtml(item.name)}">
        <button class="library-item-del" onclick="event.stopPropagation(); deleteLibraryItem('${cat}', ${idx})" title="删除">✕</button>
      </div>
    `;
  });
  
  drawer.innerHTML = html;
}

function deleteLibraryItem(cat, idx) {
  state.library[cat].splice(idx, 1);
  renderLibraryDrawer();
  showToast('已从图库删除');
}

function handleLibraryUpload(e) {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  if (files.length === 0) return;
  
  const cat = state.activeLibraryTab;
  if (!cat) return;

  showToast('正在处理图库素材...');

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        state.library[cat].push({
          name: file.name || '图库单品',
          img: img,
          origImg: img
        });
        renderLibraryDrawer();
        showToast('已保存至当前分类图库');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function addItemFromLibrary(cat, idx) {
  const libItem = state.library[cat][idx];
  if (!libItem) return;

  const id = state.nextId++;
  const scale = 0.35;
  const displayW = CANVAS_W * scale;
  const ratio = libItem.img.naturalHeight / libItem.img.naturalWidth;
  const displayH = displayW * ratio;
  
  const pos = findEmptyPosition(displayW, displayH);
  const colors = extractColors(libItem.img);
  
  state.items.push({
    id,
    name: libItem.name.replace(/\.[^.]+$/, ''),
    img: libItem.img,
    origImg: libItem.origImg,
    colors,
    x: pos.x, y: pos.y,
    w: displayW, h: displayH,
    baseW: displayW, baseH: displayH,
    rotation: 0,
    opacity: 1,
  });
  state.layerOrder.push({ type: 'item', id });
  _imgCache[`${id}_img`]     = libItem.img;
  _imgCache[`${id}_origImg`] = libItem.origImg || libItem.img;
  
  updateExtractedColors();
  selectLayer('item', id);
  render();
  saveHistory();
  showToast('已从图库添加到画布');
}

// ==================== TEXT LAYERS ====================
function addText() {
  const id = state.nextId++;
  state.texts.push({
    id, content: 'LINSSEN STYLE',
    font: "'Bebas Neue', sans-serif",
    size: 72, color: '#111111',
    weight: '400', italic: false,
    x: CANVAS_W / 2, y: CANVAS_H / 2,
    align: 'center', letterSpacing: 4, rotation: 0,
    opacity: 1,
  });
  state.layerOrder.push({ type: 'text', id });
  selectLayer('text', id);
  render();
  saveHistory();
  showToast('文字已添加 · 双击画布文字直接编辑');
}

// ==================== UI RENDERING ====================
function renderLayerList() {
  const list = document.getElementById('layerList');
  if (state.layerOrder.length === 0) {
    list.innerHTML = '<div class="inspector-empty">暂无图层</div>';
    return;
  }
  
  const dragHandle = `<div class="layer-drag-handle" title="长按拖动排序"><span></span><span></span><span></span></div>`;
  
  const reversed = [...state.layerOrder].reverse();
  list.innerHTML = reversed.map((ref, uiIdx) => {
    const realIdx = state.layerOrder.length - 1 - uiIdx;
    const isSelected = state.selected && state.selected.type === ref.type && state.selected.id === ref.id;
    
    if (ref.type === 'item') {
      const item = state.items.find(i => i.id === ref.id);
      if (!item) return '';
      return `
        <div class="layer-card ${isSelected?'selected':''}"
          draggable="true"
          data-realidx="${realIdx}"
          onclick="selectLayer('item',${item.id})"
          ondragstart="onLayerDragStart(event,${realIdx})"
          ondragover="onLayerDragOver(event)"
          ondragleave="onLayerDragLeave(event)"
          ondrop="onLayerDrop(event,${realIdx})"
          ondragend="onLayerDragEnd(event)">
          ${dragHandle}
          <div class="layer-thumb"><img src="${item.origImg.src}" alt=""></div>
          <div class="layer-info"><div class="layer-name">${escapeHtml(item.name)}</div></div>
          <div class="layer-actions" onclick="event.stopPropagation()">
            <button class="icon-btn" onclick="moveLayer(${realIdx}, 1)">▲</button>
            <button class="icon-btn" onclick="moveLayer(${realIdx}, -1)">▼</button>
            <button class="icon-btn danger" onclick="removeLayer('item',${item.id})">✖</button>
          </div>
        </div>
      `;
    } else {
      const text = state.texts.find(t => t.id === ref.id);
      if (!text) return '';
      return `
        <div class="layer-card ${isSelected?'selected':''}"
          draggable="true"
          data-realidx="${realIdx}"
          onclick="selectLayer('text',${text.id})"
          ondragstart="onLayerDragStart(event,${realIdx})"
          ondragover="onLayerDragOver(event)"
          ondragleave="onLayerDragLeave(event)"
          ondrop="onLayerDrop(event,${realIdx})"
          ondragend="onLayerDragEnd(event)">
          ${dragHandle}
          <div class="layer-thumb" style="color:${text.color};font-size:18px;font-weight:700;">T</div>
          <div class="layer-info"><div class="layer-name">${escapeHtml((text.content||'').substring(0,16)) || '(空)'}</div></div>
          <div class="layer-actions" onclick="event.stopPropagation()">
            <button class="icon-btn" onclick="moveLayer(${realIdx}, 1)">▲</button>
            <button class="icon-btn" onclick="moveLayer(${realIdx}, -1)">▼</button>
            <button class="icon-btn danger" onclick="removeLayer('text',${text.id})">✖</button>
          </div>
        </div>
      `;
    }
  }).join('');
}

function escapeHtml(s) {
  return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function moveLayer(idx, dir) {
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= state.layerOrder.length) return;
  const item = state.layerOrder.splice(idx, 1)[0];
  state.layerOrder.splice(newIdx, 0, item);
  renderLayerList(); render(); saveHistory();
}

// ==================== LAYER DRAG-AND-DROP REORDER ====================
let _dragSrcRealIdx = null;

function onLayerDragStart(e, realIdx) {
  _dragSrcRealIdx = realIdx;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(realIdx));
  // Slight delay so the clone renders before we add the class
  setTimeout(() => {
    const cards = document.querySelectorAll('.layer-card');
    cards.forEach(c => {
      if (parseInt(c.dataset.realidx) === realIdx) c.classList.add('dragging-source');
    });
  }, 0);
}

function onLayerDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const card = e.currentTarget;
  card.classList.add('drag-over');
}

function onLayerDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onLayerDrop(e, targetRealIdx) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (_dragSrcRealIdx === null || _dragSrcRealIdx === targetRealIdx) return;

  // layerOrder is bottom-to-top; UI shows top-to-bottom (reversed)
  // realIdx maps directly into layerOrder array
  const src = _dragSrcRealIdx;
  const dst = targetRealIdx;

  const moved = state.layerOrder.splice(src, 1)[0];
  // After removing src, destination index may shift by 1
  const adjustedDst = dst > src ? dst - 1 : dst;
  state.layerOrder.splice(adjustedDst, 0, moved);

  _dragSrcRealIdx = null;
  renderLayerList();
  render();
  saveHistory();
}

function onLayerDragEnd(e) {
  _dragSrcRealIdx = null;
  document.querySelectorAll('.layer-card').forEach(c => {
    c.classList.remove('dragging-source', 'drag-over');
  });
}

function removeLayer(type, id) {
  if (type === 'item') state.items = state.items.filter(i => i.id !== id);
  else state.texts = state.texts.filter(t => t.id !== id);
  state.layerOrder = state.layerOrder.filter(r => !(r.type === type && r.id === id));
  if (state.selected && state.selected.type === type && state.selected.id === id) state.selected = null;
  updateExtractedColors();
  renderLayerList();
  renderInspector();
  render();
  saveHistory();
}

function clearAll() {
  state.items = []; state.texts = []; state.layerOrder = []; state.selected = null;
  updateExtractedColors();
  setInteractionMode('normal');
  renderLayerList(); renderInspector(); render();
  saveHistory();
  showToast('画布已清空');
}

function selectLayer(type, id) {
  if (type === null) state.selected = null;
  else state.selected = { type, id };
  setInteractionMode('normal');
  renderLayerList();
  renderInspector();
  render();
}

// ==================== INSPECTOR ====================
function renderInspector() {
  const panel = document.getElementById('inspectorPanel');
  if (!state.selected) {
    panel.innerHTML = '<div class="section-title">属性设置 Properties</div><div class="inspector-empty">选中图层后<br>在此调整细节属性</div>';
    return;
  }
  
  if (state.selected.type === 'item') {
    const item = state.items.find(i => i.id === state.selected.id);
    if (!item) { state.selected = null; renderInspector(); return; }
    panel.innerHTML = `
      <div class="section-title">图片属性 Image</div>
      <div style="font-size:12px; font-weight:600; margin-bottom:12px;">${escapeHtml(item.name)}</div>
      
      <div style="display:flex; gap:10px; margin-bottom:16px;">
        <button class="pill-btn ${state.interactionMode==='crop'?'pill-btn-primary':'pill-btn-outline'}" style="flex:1" onclick="setInteractionMode('crop')">✂️ 自由裁剪</button>
        <button class="pill-btn pill-btn-outline" style="flex:1" onclick="applyMattingToItem(${item.id})">🔲 抠图</button>
      </div>

      <div class="slider-row">
        <label>大小</label>
        <input type="range" min="40" max="${Math.max(760,CANVAS_W)}" value="${Math.round(item.w)}" oninput="resizeItem(${item.id}, this.value)" onchange="saveHistory()">
        <span class="val" id="itemSizeVal">${Math.round(item.w)}</span>
      </div>
      <div class="slider-row">
        <label>旋转</label>
        <input type="range" min="-180" max="180" value="${item.rotation||0}" oninput="rotateItem(${item.id}, this.value)" onchange="saveHistory()">
        <span class="val" id="itemRotVal">${item.rotation||0}°</span>
      </div>
      <div class="slider-row">
        <label>透明度</label>
        <input type="range" min="0" max="100" value="${Math.round((item.opacity??1)*100)}" oninput="setItemOpacity(${item.id}, this.value/100)" onchange="saveHistory()">
        <span class="val" id="itemOpacityVal">${Math.round((item.opacity??1)*100)}%</span>
      </div>
      
      ${item.colors && item.colors.length ? `
        <div style="margin-top:16px;">
          <div style="font-size:10px;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;">提取颜色 (点击设为背景)</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            ${item.colors.map(c => `<div class="extracted-chip" style="background:${c}" onclick="setBg('${c}'); saveHistory();" title="${c}"></div>`).join('')}
          </div>
        </div>
      ` : ''}
    `;
  } else {
    const text = state.texts.find(t => t.id === state.selected.id);
    if (!text) { state.selected = null; renderInspector(); return; }
    panel.innerHTML = `
      <div class="section-title">文字属性 Text</div>
      <div style="font-size:10px; color:var(--text-muted); margin-bottom:8px;">💡 双击画布文字可直接编辑</div>
      <input type="text" class="text-input" value="${escapeHtml(text.content)}" oninput="updateText(${text.id},'content',this.value)" onchange="saveHistory()" placeholder="输入文字...">
      
      <select class="font-select" onchange="updateText(${text.id},'font',this.value); saveHistory();">
        ${FONT_PRESETS.map(f => `<option value="${f.value.replace(/"/g,'&quot;')}" ${f.value===text.font?'selected':''}>${f.name}</option>`).join('')}
      </select>
      
      <div class="slider-row">
        <label>字号</label>
        <input type="range" min="12" max="300" value="${text.size}" oninput="updateText(${text.id},'size',+this.value, true)" onchange="saveHistory()">
        <span class="val">${text.size}</span>
      </div>
      <div class="slider-row">
        <label>字距</label>
        <input type="range" min="-5" max="40" value="${text.letterSpacing}" oninput="updateText(${text.id},'letterSpacing',+this.value, true)" onchange="saveHistory()">
        <span class="val">${text.letterSpacing}</span>
      </div>
      <div class="slider-row">
        <label>旋转</label>
        <input type="range" min="-180" max="180" value="${text.rotation}" oninput="updateText(${text.id},'rotation',+this.value, true)" onchange="saveHistory()">
        <span class="val">${text.rotation}°</span>
      </div>
      <div class="slider-row">
        <label>透明度</label>
        <input type="range" min="0" max="100" value="${Math.round((text.opacity??1)*100)}" oninput="updateText(${text.id},'opacity',this.value/100, true)" onchange="saveHistory()">
        <span class="val">${Math.round((text.opacity??1)*100)}%</span>
      </div>
      <div class="color-row">
        <label>颜色</label>
        <div class="color-input-wrap">
          <input type="color" class="color-input" value="${text.color}" oninput="updateText(${text.id},'color',this.value)" onchange="saveHistory()">
          <input type="text" class="color-hex" value="${text.color.toUpperCase()}" onchange="updateText(${text.id},'color',this.value); saveHistory();">
        </div>
      </div>
      
      <div class="toggle-group" style="margin-top:10px;">
        <button class="toggle-btn ${text.weight==='400'?'active':''}" onclick="updateText(${text.id},'weight','400'); saveHistory();">常规</button>
        <button class="toggle-btn ${text.weight==='700'?'active':''}" onclick="updateText(${text.id},'weight','700'); saveHistory();">粗体</button>
        <button class="toggle-btn ${text.italic?'active':''}" onclick="updateText(${text.id},'italic',${!text.italic}); saveHistory();">斜体</button>
      </div>
      <div class="toggle-group" style="margin-top:6px;">
        <button class="toggle-btn ${text.align==='left'?'active':''}" onclick="updateText(${text.id},'align','left'); saveHistory();">左对齐</button>
        <button class="toggle-btn ${text.align==='center'?'active':''}" onclick="updateText(${text.id},'align','center'); saveHistory();">居中</button>
        <button class="toggle-btn ${text.align==='right'?'active':''}" onclick="updateText(${text.id},'align','right'); saveHistory();">右对齐</button>
      </div>
    `;
  }
}

function updateText(id, key, value, skipRerender) {
  const text = state.texts.find(t => t.id === id);
  if (!text) return;
  text[key] = value;
  renderLayerList();
  render();
  if (!skipRerender && !['content','color'].includes(key)) renderInspector();
  if (skipRerender && document.activeElement?.type === 'range') { const value = document.activeElement.closest('.slider-row')?.querySelector('.val'); if (value) value.textContent = key === 'opacity' ? Math.round(text.opacity * 100)+'%' : key === 'rotation' ? text.rotation+'°' : text[key]; }
}

function resizeItem(id, newW) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  const ratio = item.h / item.w;
  const oldW = item.w, oldH = item.h;
  item.w = +newW;
  item.h = item.w * ratio;
  item.x -= (item.w - oldW) / 2;
  item.y -= (item.h - oldH) / 2;
  render();
  const el = document.getElementById('itemSizeVal');
  if (el) el.textContent = Math.round(item.w);
}

function rotateItem(id, deg) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  item.rotation = +deg;
  render();
  const el = document.getElementById('itemRotVal');
  if (el) el.textContent = deg + '°';
}

function setItemOpacity(id, val) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  item.opacity = Math.max(0, Math.min(1, +val));
  render();
  const el = document.getElementById('itemOpacityVal');
  if (el) el.textContent = Math.round(item.opacity * 100) + '%';
}

function applyMattingToItem(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  showToast('正在抠图...');
  setTimeout(() => {
    const mattedImg = removeWhiteBg(item.origImg);
    mattedImg.onload = () => {
      item.img = mattedImg;
      item.colors = extractColors(mattedImg);
      updateExtractedColors();
      render();
      saveHistory();
      showToast('抠图完成');
    };
  }, 50);
}

function setBg(color, el) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return;
  state.bgColor = color;
  document.querySelectorAll('.bg-swatch').forEach(s => s.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('bgCustom').value = color;
  document.getElementById('bgHex').value = color.toUpperCase();
  render();
}

function setBorderWidth(v) { state.borderWidth = +v; document.getElementById('borderWidthVal').textContent = v; render(); }
function setBorderInset(v) { state.borderInset = +v; document.getElementById('borderInsetVal').textContent = v; render(); }
function setBorderColor(c) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(c)) return;
  state.borderColor = c;
  document.getElementById('borderColorInput').value = c;
  document.getElementById('borderHex').value = c.toUpperCase();
  render();
}

// ==================== TOOLS (CROP) ====================
function setInteractionMode(mode) {
  state.interactionMode = mode;
  state.cropStart = null;
  state.currentMouse = null;
  const hint = document.getElementById('interactionHint');
  if (mode === 'crop') {
    if (state.selected && state.selected.type === 'item') {
      const item = state.items.find(i => i.id === state.selected.id);
      if (item) { item.rotation = 0; render(); }
    }
    hint.textContent = '✂️ 点击并拖拽框选需要保留的区域';
    hint.className = 'interaction-hint show';
  } else {
    hint.className = 'interaction-hint';
  }
  renderInspector();
}

function applyCrop(rect) {
  const item = state.items.find(i => i.id === state.selected.id);
  if (!item) return;
  const relX = rect.x - item.x;
  const relY = rect.y - item.y;
  const coverScale = Math.max(item.w / item.img.naturalWidth, item.h / item.img.naturalHeight) * Math.max(1,Number(item.imageZoom)||1);
  const scaleX = item.imageFit === 'cover' ? 1 / coverScale : item.img.naturalWidth / item.w;
  const scaleY = item.imageFit === 'cover' ? 1 / coverScale : item.img.naturalHeight / item.h;
  const offsetX = item.imageFit === 'cover' ? (item.img.naturalWidth - item.w * scaleX) * Math.min(1,Math.max(0,Number(item.imageFocusX ?? .5))) : 0;
  const offsetY = item.imageFit === 'cover' ? (item.img.naturalHeight - item.h * scaleY) * Math.min(1,Math.max(0,Number(item.imageFocusY ?? .5))) : 0;
  const sx = Math.max(0, offsetX + relX * scaleX);
  const sy = Math.max(0, offsetY + relY * scaleY);
  const sw = Math.min(item.img.naturalWidth - sx, rect.w * scaleX);
  const sh = Math.min(item.img.naturalHeight - sy, rect.h * scaleY);
  if (sw <= 0 || sh <= 0) return;
  const c = document.createElement('canvas');
  c.width = sw; c.height = sh;
  c.getContext('2d').drawImage(item.img, sx, sy, sw, sh, 0, 0, sw, sh);
  const newImg = new Image();
  newImg.onload = () => {
    item.img = newImg;
    item.x = item.x + Math.max(0, relX);
    item.y = item.y + Math.max(0, relY);
    item.w = sw / scaleX;
    item.h = sh / scaleY;
    item.baseW = item.w;
    item.baseH = item.h;
    render();
    renderInspector();
    saveHistory();
  };
  newImg.src = c.toDataURL('image/png');
}

// ==================== TEMPLATES ====================
function applyTemplate(tmpl) {
  state.selected = null;
  renderInspector();
  state.template = tmpl;
  document.querySelectorAll('.template-card').forEach(el => {
    el.classList.toggle('active', el.dataset.tmpl === tmpl);
  });
  applyCurrentTemplate();
  saveHistory();
}

function applyCurrentTemplate() {
  if (state.template === 'none') { render(); return; }
  if (state.template === 'editorial')  { applyEditorialTemplate(); return; }
  if (state.template === 'splittext')  { applySplitTextTemplate(); return; }
  if (state.template === 'vogue')      { applyVogueTemplate(); return; }
  if (state.template === 'piggie')     { applyPiggieTemplate(); return; }
  if (state.template === 'lookbook')   { applyLookbookTemplate(); return; }
  if (state.template === 'zara')       { applyZaraTemplate(); return; }
  if (state.template === 'bijou')      { applyBijouTemplate(); return; }
  if (state.template === 'studio')     { applyStudioTemplate(); return; }
  if (state.template === 'magazine')   { applyMagazineTemplate(); return; }
  if (state.template === 'itemcard')   { applyItemCardTemplate(); return; }
  if (state.items.length === 0 && !['editorial','splittext','vogue','piggie','lookbook','zara','bijou','studio','magazine','itemcard','collage','grid','poster','fashionmag','dailylook','vogue_cover','dailylook2','oursummer','gardener','shirtmag'].includes(state.template)) { render(); return; }
  if (state.template === 'collage') applyCollage();
  else if (state.template === 'grid') applyGrid();
  else if (state.template === 'poster') applyPoster();
  else if (state.template === 'fashionmag') applyFashionMag();
  else if (state.template === 'dailylook')   applyDailyLookTemplate();
  else if (state.template === 'vogue_cover') applyVogueCoverTemplate();
  else if (state.template === 'dailylook2')  applyDailyLook2Template();
  else if (state.template === 'oursummer')   applyOurSummerTemplate();
  else if (state.template === 'gardener')    applyGardenerTemplate();
  else if (state.template === 'shirtmag')    applyShirtMagTemplate();
  render();
}

// 公共辅助：快速添加文字图层
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


function placeItemsInSlots(slots) {
  const n = Math.min(state.items.length, slots.length);
  for (let i = 0; i < n; i++) {
    const slot = slots[i];
    const item = state.items[i];
    const slotW = slot.w * CANVAS_W; const slotH = slot.h * CANVAS_H;
    const slotX = slot.x * CANVAS_W; const slotY = slot.y * CANVAS_H;
    
    const imgRatio = item.img.naturalWidth / item.img.naturalHeight;
    const slotRatio = slotW / slotH;
    
    let w, h;
    if (imgRatio > slotRatio) { w = slotW; h = w / imgRatio; }
    else { h = slotH; w = h * imgRatio; }
    
    item.w = w; item.h = h;
    item.x = slotX + (slotW - w) / 2; item.y = slotY + (slotH - h) / 2;
    item.rotation = 0;
  }
}

function resetPositions() {
  state.items.forEach((item) => {
    item.w = item.baseW; item.h = item.baseH; item.rotation = 0;
  });
  if (state.template !== 'none') {
    applyCurrentTemplate();
  } else {
    state.items.forEach((item) => {
      const pos = findEmptyPosition(item.w, item.h);
      item.x = pos.x; item.y = pos.y;
    });
    render();
  }
  saveHistory();
  showToast('位置已重置');
}

// ==================== RENDER (RAF throttled) ====================
let _rafPending = false;
function render() {
  if (_rafPending) return;
  _rafPending = true;
  requestAnimationFrame(_doRender);
}

function _doRender() {
  _rafPending = false;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  
  
  if (state.items.length === 0 && state.texts.length === 0) {
    ctx.fillStyle = '#cccccc';
    ctx.font = '14px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('上传 · 拖放 · 或粘贴单品开始创作', CANVAS_W/2, CANVAS_H/2);
    return;
  }
  
  state.layerOrder.forEach(ref => {
    if (ref.type === 'item') {
      const item = state.items.find(i => i.id === ref.id);
      if (item) drawItem(item);
    } else {
      const text = state.texts.find(t => t.id === ref.id);
      if (text) drawText(text);
    }
  });
  
  if (state.selected) {
    if (state.selected.type === 'item') {
      const item = state.items.find(i => i.id === state.selected.id);
      if (item) drawItemSelection(item);
    } else {
      const text = state.texts.find(t => t.id === state.selected.id);
      if (text) drawTextSelection(text);
    }
  }
  
  if (state.borderWidth > 0) {
    const inset = state.borderInset;
    const bw = state.borderWidth;
    ctx.strokeStyle = state.borderColor;
    ctx.lineWidth = bw;
    ctx.strokeRect(inset + bw/2, inset + bw/2, CANVAS_W - 2*inset - bw, CANVAS_H - 2*inset - bw);
  }

  if (state.interactionMode === 'crop' && state.cropStart && state.currentMouse) {
    const x = Math.min(state.cropStart.x, state.currentMouse.x);
    const y = Math.min(state.cropStart.y, state.currentMouse.y);
    const w = Math.abs(state.cropStart.x - state.currentMouse.x);
    const h = Math.abs(state.cropStart.y - state.currentMouse.y);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
    ctx.setLineDash([]);
  }
} // end _doRender

function drawItem(item) {
  ctx.save();
  ctx.globalAlpha = item.opacity ?? 1;
  ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
  ctx.rotate((item.rotation || 0) * Math.PI / 180);
  if (!state.dragging && !item.noShadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.06)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
  }
  drawFittedImage(ctx,item);
  ctx.restore();
}

function drawText(text) {
  ctx.save();
  ctx.globalAlpha = text.opacity ?? 1;
  ctx.translate(text.x, text.y);
  ctx.rotate(text.rotation * Math.PI / 180);
  
  const fontStyle = text.italic ? 'italic' : 'normal';
  ctx.font = `${fontStyle} ${text.weight} ${text.size}px ${text.font}`;
  ctx.fillStyle = text.color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = text.align;

  // 优先用原生 letterSpacing（精确无误差）
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = (text.letterSpacing || 0) + 'px';
  }

  const lines = (text.content || '').split('\n');
  const lineHeight = text.size * 1.3;
  
  lines.forEach((line, i) => {
    const yOffset = (i - (lines.length - 1) / 2) * lineHeight;
    if (!('letterSpacing' in ctx) && text.letterSpacing && text.letterSpacing !== 0) {
      // 降级：逐字符绘制（旧浏览器）
      const chars = [...line];
      const widths = chars.map(c => ctx.measureText(c).width);
      const totalWidth = widths.reduce((a,b) => a+b, 0) + (chars.length - 1) * text.letterSpacing;
      let startX = 0;
      if (text.align === 'center') startX = -totalWidth / 2;
      else if (text.align === 'right') startX = -totalWidth;
      let x = startX;
      ctx.textAlign = 'left';
      for (let j = 0; j < chars.length; j++) {
        ctx.fillText(chars[j], x, yOffset);
        x += widths[j] + text.letterSpacing;
      }
    } else {
      ctx.fillText(line, 0, yOffset);
    }
  });
  ctx.restore();
}

function drawItemSelection(item) {
  ctx.save();
  ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
  ctx.rotate((item.rotation || 0) * Math.PI / 180);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-item.w/2 - 4, -item.h/2 - 4, item.w + 8, item.h + 8);
  
  const handles = [{x: -item.w/2-4, y: -item.h/2-4}, {x: item.w/2+4, y: -item.h/2-4}, {x: -item.w/2-4, y: item.h/2+4}, {x: item.w/2+4, y: item.h/2+4}];
  ctx.fillStyle = '#fff';
  handles.forEach(h => {
    ctx.beginPath(); ctx.arc(h.x, h.y, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  });
  
  const handleOffset = -item.h/2 - 32;
  ctx.beginPath(); ctx.moveTo(0, -item.h/2 - 4); ctx.lineTo(0, handleOffset + 6); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, handleOffset, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawTextSelection(text) {
  ctx.save();
  ctx.translate(text.x, text.y);
  ctx.rotate(text.rotation * Math.PI / 180);
  const fontStyle = text.italic ? 'italic' : 'normal';
  ctx.font = `${fontStyle} ${text.weight} ${text.size}px ${text.font}`;
  
  const lines = (text.content || ' ').split('\n');
  let maxW = 0;
  for (const line of lines) {
    let lw = ctx.measureText(line).width;
    if (text.letterSpacing) lw += Math.max(0, [...line].length - 1) * text.letterSpacing;
    if (lw > maxW) maxW = lw;
  }
  const h = text.size * 1.3 * lines.length;
  let left = 0;
  if (text.align === 'center') left = -maxW/2;
  else if (text.align === 'right') left = -maxW;
  
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(left - 8, -h/2 - 4, maxW + 16, h + 8);
  
  // Corner resize handles
  const corners = [
    { x: left - 8, y: -h/2 - 4 },
    { x: left + maxW + 8, y: -h/2 - 4 },
    { x: left - 8, y: h/2 + 4 },
    { x: left + maxW + 8, y: h/2 + 4 }
  ];
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1.5;
  corners.forEach(c => {
    ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  });
  
  const handleOffset = -h/2 - 28;
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -h/2 - 4); ctx.lineTo(0, handleOffset + 6); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, handleOffset, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ==================== HIT TESTING ====================
function hitTestItem(mx, my, item) {
  const cx = item.x + item.w / 2; const cy = item.y + item.h / 2;
  const rad = -(item.rotation || 0) * Math.PI / 180;
  const lx = (mx-cx)*Math.cos(rad) - (my-cy)*Math.sin(rad);
  const ly = (mx-cx)*Math.sin(rad) + (my-cy)*Math.cos(rad);
  return lx >= -item.w/2 && lx <= item.w/2 && ly >= -item.h/2 && ly <= item.h/2;
}

function hitTestText(mx, my, text) {
  ctx.save();
  const fontStyle = text.italic ? 'italic' : 'normal';
  ctx.font = `${fontStyle} ${text.weight} ${text.size}px ${text.font}`;
  const lines = (text.content || ' ').split('\n');
  let maxW = 0;
  for (const line of lines) {
    let lw = ctx.measureText(line).width;
    if (text.letterSpacing) lw += Math.max(0, [...line].length - 1) * text.letterSpacing;
    if (lw > maxW) maxW = lw;
  }
  const h = text.size * 1.3 * lines.length;
  ctx.restore();
  
  const rad = -(text.rotation || 0) * Math.PI / 180;
  const lx = (mx-text.x)*Math.cos(rad) - (my-text.y)*Math.sin(rad);
  const ly = (mx-text.x)*Math.sin(rad) + (my-text.y)*Math.cos(rad);
  
  let left = 0;
  if (text.align === 'center') left = -maxW/2;
  else if (text.align === 'right') left = -maxW;
  return lx >= left - 6 && lx <= left + maxW + 6 && ly >= -h/2 && ly <= h/2;
}

function hitTestResizeHandles(mx, my, item) {
  const cx = item.x + item.w / 2; const cy = item.y + item.h / 2;
  const rad = -(item.rotation || 0) * Math.PI / 180;
  const lx = (mx-cx)*Math.cos(rad) - (my-cy)*Math.sin(rad);
  const ly = (mx-cx)*Math.sin(rad) + (my-cy)*Math.cos(rad);
  const hw = item.w / 2; const hh = item.h / 2; const threshold = 12;
  if (Math.abs(lx - (-hw)) < threshold && Math.abs(ly - (-hh)) < threshold) return 'nw';
  if (Math.abs(lx - hw) < threshold && Math.abs(ly - (-hh)) < threshold) return 'ne';
  if (Math.abs(lx - (-hw)) < threshold && Math.abs(ly - hh) < threshold) return 'sw';
  if (Math.abs(lx - hw) < threshold && Math.abs(ly - hh) < threshold) return 'se';
  return null;
}

function getTextBounds(text) {
  ctx.save();
  const fontStyle = text.italic ? 'italic' : 'normal';
  ctx.font = `${fontStyle} ${text.weight} ${text.size}px ${text.font}`;
  const lines = (text.content || ' ').split('\n');
  let maxW = 0;
  for (const line of lines) {
    let lw = ctx.measureText(line).width;
    if (text.letterSpacing) lw += Math.max(0, [...line].length - 1) * text.letterSpacing;
    if (lw > maxW) maxW = lw;
  }
  const h = text.size * 1.3 * lines.length;
  ctx.restore();
  let left = 0;
  if (text.align === 'center') left = -maxW/2;
  else if (text.align === 'right') left = -maxW;
  return { left, maxW, h };
}

function hitTestTextResizeHandle(mx, my, text) {
  const rad = -(text.rotation || 0) * Math.PI / 180;
  const lx = (mx - text.x) * Math.cos(rad) - (my - text.y) * Math.sin(rad);
  const ly = (mx - text.x) * Math.sin(rad) + (my - text.y) * Math.cos(rad);
  const { left, maxW, h } = getTextBounds(text);
  const threshold = 12;
  const corners = [
    { x: left - 8, y: -h/2 - 4, name: 'nw' },
    { x: left + maxW + 8, y: -h/2 - 4, name: 'ne' },
    { x: left - 8, y: h/2 + 4, name: 'sw' },
    { x: left + maxW + 8, y: h/2 + 4, name: 'se' }
  ];
  for (const c of corners) {
    if (Math.abs(lx - c.x) < threshold && Math.abs(ly - c.y) < threshold) return c.name;
  }
  return null;
}

function hitTestRotationHandle(mx, my) {
  if (!state.selected) return false;
  let cx, cy, halfH, rotDeg;
  if (state.selected.type === 'item') {
    const item = state.items.find(i => i.id === state.selected.id);
    if (!item) return false;
    cx = item.x + item.w / 2; cy = item.y + item.h / 2; halfH = item.h / 2; rotDeg = item.rotation || 0;
  } else {
    const text = state.texts.find(t => t.id === state.selected.id);
    if (!text) return false;
    ctx.save(); ctx.font = `${text.italic?'italic':'normal'} ${text.weight} ${text.size}px ${text.font}`;
    const h = text.size * 1.3 * (text.content||' ').split('\n').length;
    ctx.restore();
    cx = text.x; cy = text.y; halfH = h / 2; rotDeg = text.rotation || 0;
  }
  const rad = rotDeg * Math.PI / 180;
  const hx = cx - (-halfH - 30) * Math.sin(rad);
  const hy = cy + (-halfH - 30) * Math.cos(rad);
  return Math.hypot(mx - hx, my - hy) <= 12;
}

// ==================== INTERACTION ====================
function getMouseCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
    y: (e.clientY - rect.top) * (CANVAS_H / rect.height)
  };
}

canvas.addEventListener('mousedown', (e) => {
  // 开始拖拽时清除任何待执行的定时器
  if (typeof autosaveTimer !== 'undefined') clearTimeout(autosaveTimer);
  const { x: mx, y: my } = getMouseCoords(e);
  
  if (state.interactionMode === 'crop' && state.selected && state.selected.type === 'item') {
    state.cropStart = { x: mx, y: my };
    return;
  }

  if (state.selected && hitTestRotationHandle(mx, my)) {
    const obj = state.selected.type === 'item' ? state.items.find(i=>i.id===state.selected.id) : state.texts.find(t=>t.id===state.selected.id);
    if (obj) { state.dragging = { mode: 'rotate', type: state.selected.type, obj }; return; }
  }
  
  if (state.selected && state.selected.type === 'item') {
    const item = state.items.find(i=>i.id===state.selected.id);
    if (item) {
      const handle = hitTestResizeHandles(mx, my, item);
      if (handle) { state.dragging = { mode: 'resize', type: 'item', obj: item, handle }; return; }
    }
  }

  if (state.selected && state.selected.type === 'text') {
    const text = state.texts.find(t=>t.id===state.selected.id);
    if (text) {
      const handle = hitTestTextResizeHandle(mx, my, text);
      if (handle) {
        state.dragging = { mode: 'textresize', type: 'text', obj: text, handle, startSize: text.size, startX: mx, startY: my };
        return;
      }
    }
  }
  
  let hit = null;
  for (let i = state.layerOrder.length - 1; i >= 0; i--) {
    const ref = state.layerOrder[i];
    if (ref.type === 'item') {
      const item = state.items.find(it => it.id === ref.id);
      if (item && hitTestItem(mx, my, item)) { hit = { type: 'item', obj: item }; break; }
    } else {
      const text = state.texts.find(t => t.id === ref.id);
      if (text && hitTestText(mx, my, text)) { hit = { type: 'text', obj: text }; break; }
    }
  }
  
  if (hit) {
    if(!state.selected || state.selected.id !== hit.obj.id || state.selected.type !== hit.type) selectLayer(hit.type, hit.obj.id);
    state.dragging = { mode: 'move', type: hit.type, obj: hit.obj };
    state.dragOffset.x = mx - hit.obj.x; state.dragOffset.y = my - hit.obj.y;
  } else {
    selectLayer(null, null);
  }
});

let _mouseMoveRaf = false;
canvas.addEventListener('mousemove', (e) => {
  const { x: mx, y: my } = getMouseCoords(e);

  // 裁剪模式
  if (state.interactionMode === 'crop' && state.cropStart) {
    state.currentMouse = { x: mx, y: my };
    render();
    return;
  }

  // 拖拽中：直接更新数据 + 触发渲染，不做任何 hit-test
  if (state.dragging) {
    state.hasChanged = true;
    if (state.dragging.mode === 'move') {
      state.dragging.obj.x = mx - state.dragOffset.x;
      state.dragging.obj.y = my - state.dragOffset.y;
    } else if (state.dragging.mode === 'rotate') {
      const obj = state.dragging.obj;
      const cx = state.dragging.type === 'item' ? obj.x + obj.w/2 : obj.x;
      const cy = state.dragging.type === 'item' ? obj.y + obj.h/2 : obj.y;
      obj.rotation = Math.round(Math.atan2(my - cy, mx - cx) * 180 / Math.PI + 90);
      const el = document.getElementById('itemRotVal');
      if (el) el.textContent = obj.rotation + '°';
    } else if (state.dragging.mode === 'resize') {
      const obj = state.dragging.obj;
      const cx = obj.x + obj.w / 2; const cy = obj.y + obj.h / 2;
      const dist = Math.hypot(mx - cx, my - cy);
      const ratio = obj.baseH / obj.baseW;
      let newW = (dist * 2) / Math.sqrt(1 + ratio*ratio);
      newW = Math.max(40, newW);
      obj.x = cx - newW / 2; obj.y = cy - (newW * ratio) / 2;
      obj.w = newW; obj.h = newW * ratio;
      const el = document.getElementById('itemSizeVal');
      if (el) el.textContent = Math.round(newW);
    } else if (state.dragging.mode === 'textresize') {
      const obj = state.dragging.obj;
      const dx = mx - state.dragging.startX;
      const dy = my - state.dragging.startY;
      const delta = Math.hypot(dx, dy) * (dx + dy > 0 ? 1 : -1);
      obj.size = Math.max(8, Math.min(300, Math.round(state.dragging.startSize + delta * 0.3)));
    }
    render();
    return;
  }

  // 非拖拽：cursor / hover 检测用 RAF 节流，避免每帧都跑 hit-test
  if (_mouseMoveRaf) return;
  _mouseMoveRaf = true;
  requestAnimationFrame(() => {
    _mouseMoveRaf = false;
    if (state.selected && hitTestRotationHandle(mx, my)) { canvas.style.cursor = 'grab'; return; }
    if (state.selected && state.selected.type === 'item') {
      const selItem = state.items.find(i=>i.id===state.selected.id);
      if (selItem && hitTestResizeHandles(mx, my, selItem)) { canvas.style.cursor = 'nwse-resize'; return; }
    }
    if (state.selected && state.selected.type === 'text') {
      const selText = state.texts.find(t=>t.id===state.selected.id);
      if (selText && hitTestTextResizeHandle(mx, my, selText)) { canvas.style.cursor = 'nwse-resize'; return; }
    }
    let hover = false;
    for (let i = state.layerOrder.length - 1; i >= 0; i--) {
      const ref = state.layerOrder[i];
      if (ref.type === 'item') { if (hitTestItem(mx, my, state.items.find(it=>it.id===ref.id))) { hover=true; break; } }
      else { if (hitTestText(mx, my, state.texts.find(t=>t.id===ref.id))) { hover=true; break; } }
    }
    canvas.style.cursor = hover ? 'grab' : 'default';
  });
});

canvas.addEventListener('mouseup', () => { 
  if (state.interactionMode === 'crop' && state.cropStart && state.currentMouse) {
    const x = Math.min(state.cropStart.x, state.currentMouse.x);
    const y = Math.min(state.cropStart.y, state.currentMouse.y);
    const w = Math.abs(state.cropStart.x - state.currentMouse.x);
    const h = Math.abs(state.cropStart.y - state.currentMouse.y);
    if (w > 10 && h > 10) applyCrop({x, y, w, h});
    setInteractionMode('normal');
  } else if (state.dragging && state.hasChanged) {
    saveHistory(); // 拖拽操作完成后记录历史
  }
  state.dragging = null; 
  state.cropStart = null;
  state.currentMouse = null;
  state.hasChanged = false;
  canvas.style.cursor = 'default'; 
});

canvas.addEventListener('mouseleave', () => { 
  if (state.dragging && state.hasChanged) { saveHistory(); }
  state.dragging = null; 
  state.cropStart = null;
  state.currentMouse = null;
  state.hasChanged = false;
});

canvas.addEventListener('wheel', (e) => {
  const { x: mx, y: my } = getMouseCoords(e);
  for (let i = state.layerOrder.length - 1; i >= 0; i--) {
    const ref = state.layerOrder[i];
    if (ref.type === 'item') {
      const item = state.items.find(it => it.id === ref.id);
      if (item && hitTestItem(mx, my, item)) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.05 : 0.95;
        const newW = item.w * factor; const newH = item.h * factor;
        item.x -= (newW - item.w) / 2; item.y -= (newH - item.h) / 2;
        item.w = newW; item.h = newH;
        render();
        if (state.selected && state.selected.id === item.id) { const el = document.getElementById('itemSizeVal'); if(el) el.textContent = Math.round(item.w); }
        
        clearTimeout(item._wheelTimer);
        item._wheelTimer = setTimeout(() => saveHistory(), 300); // 滚轮缩放防抖记录历史
        return;
      }
    } else {
      const text = state.texts.find(t => t.id === ref.id);
      if (text && hitTestText(mx, my, text)) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 0.93;
        text.size = Math.max(8, Math.min(300, Math.round(text.size * factor)));
        render(); if (state.selected && state.selected.id === text.id) renderInspector();
        
        clearTimeout(text._wheelTimer);
        text._wheelTimer = setTimeout(() => saveHistory(), 300);
        return;
      }
    }
  }
}, { passive: false });

canvas.addEventListener('dblclick', (e) => {
  const { x: mx, y: my } = getMouseCoords(e);
  for (let i = state.layerOrder.length - 1; i >= 0; i--) {
    const ref = state.layerOrder[i];
    if (ref.type === 'text') {
      const text = state.texts.find(t => t.id === ref.id);
      if (text && hitTestText(mx, my, text)) {
        selectLayer('text', text.id);
        startInlineTextEdit(text, e);
        return;
      }
    }
  }
});

function startInlineTextEdit(text, mouseEvent) {
  // Create floating textarea overlaid on the canvas
  const existingEditor = document.getElementById('inlineTextEditor');
  if (existingEditor) existingEditor.remove();

  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / CANVAS_W;
  const scaleY = rect.height / CANVAS_H;

  const { left, maxW, h } = getTextBounds(text);
  const cosR = Math.cos(text.rotation * Math.PI / 180);
  const sinR = Math.sin(text.rotation * Math.PI / 180);
  const centerX = text.x; const centerY = text.y;
  const boxLeft = centerX + left - 10;
  const boxTop = centerY - h / 2 - 8;

  const textarea = document.createElement('textarea');
  textarea.id = 'inlineTextEditor';
  textarea.value = text.content;
  textarea.style.cssText = `
    position: fixed;
    left: ${rect.left + boxLeft * scaleX}px;
    top: ${rect.top + boxTop * scaleY}px;
    width: ${Math.max(maxW + 40, 120) * scaleX}px;
    min-height: ${(h + 20) * scaleY}px;
    font-family: ${text.font};
    font-size: ${text.size * scaleY}px;
    font-weight: ${text.weight};
    font-style: ${text.italic ? 'italic' : 'normal'};
    color: ${text.color};
    text-align: ${text.align};
    letter-spacing: ${text.letterSpacing * scaleX}px;
    background: rgba(255,255,255,0.92);
    border: 2px solid #111;
    border-radius: 6px;
    padding: 6px 10px;
    resize: none;
    outline: none;
    z-index: 9999;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    line-height: 1.3;
    transform: rotate(${text.rotation}deg);
    transform-origin: top left;
  `;
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const commit = () => {
    const newContent = textarea.value;
    if (textarea.parentNode) textarea.remove();
    if (newContent !== text.content) {
      text.content = newContent;
      renderLayerList();
      render();
      renderInspector();
      saveHistory();
    }
  };

  textarea.addEventListener('blur', commit);
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { textarea.remove(); }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
    // auto-grow
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  });
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  });
}

// 监听系统 paste 事件（兼容不支持 clipboard.read 的浏览器）
window.addEventListener('paste', (e) => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const blob = item.getAsFile();
      if (!blob) continue;
      const reader = new FileReader();
      reader.onload = (ev) => {
        addItemFromDataUrl(ev.target.result, '粘贴图片');
        showToast('已粘贴图片');
      };
      reader.readAsDataURL(blob);
      return;
    }
  }
});
let _clipboard = null; // { type, data }

function copySelected() {
  if (!state.selected) return;
  if (state.selected.type === 'item') {
    const item = state.items.find(i => i.id === state.selected.id);
    if (!item) return;
    // 浅拷贝数据，img 引用共享（不需要重新加载）
    _clipboard = { type: 'item', data: { ...item } };
    showToast('已复制图片图层');
  } else {
    const text = state.texts.find(t => t.id === state.selected.id);
    if (!text) return;
    _clipboard = { type: 'text', data: { ...text } };
    showToast('已复制文字图层');
  }
}

async function pasteClipboard(preferInternal = false) {
  // 优先尝试系统剪贴板（从外部复制的图片）
  if (!preferInternal && navigator.clipboard && navigator.clipboard.read) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find(t => t.startsWith('image/'));
        if (imgType) {
          const blob = await item.getType(imgType);
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(url);
            addItemFromDataUrl(imgToDataUrl(img), '粘贴图片');
            showToast('已从系统剪贴板粘贴图片');
          };
          img.onerror = () => URL.revokeObjectURL(url);
          img.src = url;
          return;
        }
      }
    } catch(e) {
      // 用户拒绝剪贴板权限，或浏览器不支持，继续走内部剪贴板
    }
  }

  // 内部剪贴板（复制画布上已有图层）
  if (!_clipboard) { showToast('剪贴板为空'); return; }
  const OFFSET = 20;
  const newId = state.nextId++;

  if (_clipboard.type === 'item') {
    const src = _clipboard.data;
    const newItem = { ...src, id: newId, x: src.x + OFFSET, y: src.y + OFFSET };
    state.items.push(newItem);
    state.layerOrder.push({ type: 'item', id: newId });
    _imgCache[`${newId}_img`]     = newItem.img;
    _imgCache[`${newId}_origImg`] = newItem.origImg || newItem.img;
    selectLayer('item', newId);
  } else {
    const src = _clipboard.data;
    const newText = { ...src, id: newId, x: src.x + OFFSET, y: src.y + OFFSET };
    state.texts.push(newText);
    state.layerOrder.push({ type: 'text', id: newId });
    selectLayer('text', newId);
  }

  render();
  renderLayerList();
  saveHistory();
  showToast('已粘贴');
}

window.addEventListener('keydown', (e) => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    e.preventDefault(); copySelected(); return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
    if (_clipboard) { e.preventDefault(); pasteClipboard(); } return;
  }
  // 连续粘贴时自动追加偏移，避免所有副本堆在同一位置
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    if (state.selected) { copySelected(); pasteClipboard(true); }
    return;
  }

  if ((e.key === 'Delete' || e.key === 'Backspace') && state.selected) {
    e.preventDefault();
    removeLayer(state.selected.type, state.selected.id);
    showToast('图层已删除');
  }
});

function exportCanvas() {
  if (state.items.length === 0 && state.texts.length === 0) { showToast('画布为空'); return; }
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#F5F2ED;border-radius:24px;padding:32px;width:360px;box-shadow:0 24px 60px rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.8);">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;margin-bottom:6px;">导出分辨率</div>
      <div style="font-size:11px;color:#999;margin-bottom:22px;">分辨率越高越清晰，文件也越大</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button onclick="doExport(1,this.closest('div[style*=fixed]'))" style="padding:14px 20px;border-radius:14px;border:1px solid rgba(0,0,0,0.1);background:rgba(255,255,255,0.6);cursor:pointer;text-align:left;" onmouseover="this.style.background='#fff'" onmouseout="this.style.background='rgba(255,255,255,0.6)'">
          <div style="font-weight:700;font-size:13px;">标准 1× <span style="font-size:11px;color:#999;font-weight:400;">${CANVAS_W} × ${CANVAS_H}px</span></div>
          <div style="font-size:11px;color:#999;margin-top:2px;">适合预览，文件小</div>
        </button>
        <button onclick="doExport(2,this.closest('div[style*=fixed]'))" style="padding:14px 20px;border-radius:14px;border:1px solid rgba(0,0,0,0.1);background:rgba(255,255,255,0.6);cursor:pointer;text-align:left;" onmouseover="this.style.background='#fff'" onmouseout="this.style.background='rgba(255,255,255,0.6)'">
          <div style="font-weight:700;font-size:13px;">高清 2× <span style="font-size:11px;color:#999;font-weight:400;">${CANVAS_W*2} × ${CANVAS_H*2}px</span></div>
          <div style="font-size:11px;color:#999;margin-top:2px;">适合微信/小红书发布</div>
        </button>
        <button onclick="doExport(3,this.closest('div[style*=fixed]'))" style="padding:14px 20px;border-radius:14px;border:2px solid #111;background:#111;cursor:pointer;text-align:left;" onmouseover="this.style.background='#333'" onmouseout="this.style.background='#111'">
          <div style="font-weight:700;font-size:13px;color:#fff;">超清 3× ✦ 默认 <span style="font-size:11px;color:#aaa;font-weight:400;">${CANVAS_W*3} × ${CANVAS_H*3}px</span></div>
          <div style="font-size:11px;color:#aaa;margin-top:2px;">最高画质，适合印刷/大图</div>
        </button>
      </div>
      <button onclick="this.closest('div[style*=fixed]').remove()" style="width:100%;margin-top:14px;padding:11px;border-radius:12px;border:1px solid rgba(0,0,0,0.1);background:transparent;cursor:pointer;font-size:12px;color:#999;">取消</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  overlay.classList.add('studio-export');
  overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true'); overlay.setAttribute('aria-label','导出分辨率');
  const previousFocus = document.activeElement;
  const exportButtons = [...overlay.querySelectorAll('button')];
  const onExportKey = e => {
    if (e.key === 'Escape') { overlay.remove(); previousFocus?.focus(); }
    if (e.key === 'Tab') { const first=exportButtons[0], last=exportButtons[exportButtons.length-1]; if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();} else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();} }
  };
  overlay.addEventListener('keydown', onExportKey);
  exportButtons[0].focus();
}

function doExport(scale, overlayEl) {
  if (overlayEl) overlayEl.remove();
  showToast('正在生成图片...');
  const saved = state.selected;
  state.selected = null;
  const hiCanvas = document.createElement('canvas');
  hiCanvas.width  = CANVAS_W * scale;
  hiCanvas.height = CANVAS_H * scale;
  const hiCtx = hiCanvas.getContext('2d');
  hiCtx.scale(scale, scale);
  hiCtx.imageSmoothingEnabled = true;
  hiCtx.imageSmoothingQuality = 'high';
  hiCtx.fillStyle = state.bgColor;
  hiCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  for (const ref of state.layerOrder) {
    if (ref.type === 'item') {
      const item = state.items.find(i => i.id === ref.id);
      if (!item) continue;
      hiCtx.save();
      hiCtx.globalAlpha = item.opacity ?? 1;
      hiCtx.translate(item.x + item.w/2, item.y + item.h/2);
      hiCtx.rotate((item.rotation||0) * Math.PI / 180);
      // Render at the selected output resolution.
      if (scale <= 2 && !item.noShadow) {
        hiCtx.shadowColor = 'rgba(0,0,0,0.06)';
        hiCtx.shadowBlur = 24;
        hiCtx.shadowOffsetY = 12;
      }
      drawFittedImage(hiCtx,item);
      hiCtx.restore();
    } else {
      const text = state.texts.find(t => t.id === ref.id);
      if (!text) continue;
      hiCtx.save();
      hiCtx.globalAlpha = text.opacity ?? 1;
      hiCtx.translate(text.x, text.y);
      hiCtx.rotate(text.rotation * Math.PI / 180);
      const fontStyle = text.italic ? 'italic' : 'normal';
      hiCtx.font = `${fontStyle} ${text.weight} ${text.size}px ${text.font}`;
      hiCtx.fillStyle = text.color;
      hiCtx.textAlign = text.align;
      hiCtx.textBaseline = 'middle';
      // 使用 canvas 原生 letterSpacing（Chrome 99+），避免逐字符累积误差
      if ('letterSpacing' in hiCtx) {
        hiCtx.letterSpacing = (text.letterSpacing || 0) + 'px';
      }
      const lines = (text.content||'').split('\n');
      const lh = text.size * 1.3;
      const totalH = lh * lines.length;
      lines.forEach((line, li) => {
        const y = -totalH/2 + li*lh + lh/2;
        if (!('letterSpacing' in hiCtx) && text.letterSpacing && text.letterSpacing !== 0) {
          // 降级方案：逐字符绘制（旧浏览器）
          const chars = [...line];
          // 先测量整行宽度用于对齐起点
          let totalW = 0;
          chars.forEach(ch => { totalW += hiCtx.measureText(ch).width + text.letterSpacing; });
          totalW -= text.letterSpacing; // 最后一个字符不加间距
          let cx2 = text.align==='center' ? -totalW/2
                  : text.align==='right'  ? -totalW : 0;
          chars.forEach(ch => {
            hiCtx.fillText(ch, cx2, y);
            cx2 += hiCtx.measureText(ch).width + text.letterSpacing;
          });
        } else {
          hiCtx.fillText(line, 0, y);
        }
      });
      hiCtx.restore();
    }
  }
  if (state.borderWidth > 0) {
    const inset = state.borderInset, bw = state.borderWidth;
    hiCtx.strokeStyle = state.borderColor; hiCtx.lineWidth = bw;
    hiCtx.strokeRect(inset+bw/2, inset+bw/2, CANVAS_W-2*inset-bw, CANVAS_H-2*inset-bw);
  }
  // 用 toBlob 替代 toDataURL，避免大图导出时内存溢出崩溃
  showToast('正在生成图片，请稍候...');
  hiCanvas.toBlob((blob) => {
    if (!blob) {
      showToast('❌ 导出失败，请减少图层数量或选择较低分辨率');
      state.selected = saved; render();
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `Linssen-Design-${scale}x-${Date.now()}.png`;
    link.href = url;
    link.click();
    // 延迟释放，确保下载触发
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    render();
    showToast(`✅ 已导出 ${CANVAS_W*scale}×${CANVAS_H*scale}px`);
  }, 'image/png');
  state.selected = saved;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// ==================== LIBRARY HOVER PREVIEW ====================
const previewPopup = document.getElementById('libPreviewPopup');
const previewImg = document.getElementById('libPreviewImg');
let previewTimer = null;

function showLibPreview(el, src) {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    previewImg.src = src;
    previewPopup.classList.add('show');
    positionPreview(el);
  }, 180);
}

function hideLibPreview() {
  clearTimeout(previewTimer);
  previewPopup.classList.remove('show');
}

function positionPreview(el) {
  const rect = el.getBoundingClientRect();
  const pw = 220; const ph = 220;
  let left = rect.right + 12;
  let top = rect.top + rect.height / 2 - ph / 2;
  if (left + pw > window.innerWidth - 16) left = rect.left - pw - 12;
  if (top < 8) top = 8;
  if (top + ph > window.innerHeight - 8) top = window.innerHeight - ph - 8;
  previewPopup.style.left = left + 'px';
  previewPopup.style.top = top + 'px';
}

document.addEventListener('mousemove', (e) => {
  if (previewPopup.classList.contains('show')) {
    const el = document.querySelector('.library-item:hover');
    if (el) positionPreview(el);
  }
});

// ==================== IMPORT MODAL ====================
let importSelectedCat = 'top';

function openImportModal() {
  // Pre-select the active library tab if open
  if (state.activeLibraryTab) {
    const btn = document.querySelector(`#importCatRow .import-cat-btn[data-cat="${state.activeLibraryTab}"]`);
    if (btn) {
      document.querySelectorAll('.import-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      importSelectedCat = state.activeLibraryTab;
    }
  }
  document.getElementById('importProgress').innerHTML = '';
  document.getElementById('importUrlArea').value = '';
  document.getElementById('importModalOverlay').classList.add('show');
}

function closeImportModal() {
  document.getElementById('importModalOverlay').classList.remove('show');
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('importModalOverlay')) closeImportModal();
}

function selectImportCat(el) {
  document.querySelectorAll('.import-cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  importSelectedCat = el.dataset.cat;
}

async function startImportFromUrls() {
  const raw = document.getElementById('importUrlArea').value.trim();
  if (!raw) { showToast('请先粘贴图片地址'); return; }

  const urls = raw.split('\n')
    .map(u => u.trim())
    .filter(u => u.length > 0 && (u.startsWith('http://') || u.startsWith('https://')));

  if (urls.length === 0) { showToast('未识别到有效图片地址'); return; }

  const cat = importSelectedCat;
  const progressEl = document.getElementById('importProgress');
  progressEl.innerHTML = `
    <span id="importStatusText">准备导入 ${urls.length} 张图片...</span>
    <div class="prog-bar-wrap" style="display:block"><div class="prog-bar" id="importProgBar"></div></div>
  `;

  let success = 0; let fail = 0;

  // 尝试加载图片，直接加载失败则走 CORS 代理
  function loadImgWithFallback(originalUrl) {
    return new Promise((resolve) => {
      // 代理列表：直接 → corsproxy.io → allorigins
      const proxies = [
        originalUrl,
        'https://corsproxy.io/?' + encodeURIComponent(originalUrl),
        'https://api.allorigins.win/raw?url=' + encodeURIComponent(originalUrl),
      ];
      let idx = 0;

      function tryNext() {
        if (idx >= proxies.length) { resolve(null); return; }
        const src = proxies[idx++];
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => { img.src = ''; tryNext(); }, 8000);
        img.onload = () => {
          clearTimeout(timer);
          resolve(img);
        };
        img.onerror = () => {
          clearTimeout(timer);
          tryNext();
        };
        img.src = src;
      }
      tryNext();
    });
  }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    document.getElementById('importStatusText').textContent = `正在导入 ${i + 1} / ${urls.length}`;
    document.getElementById('importProgBar').style.width = ((i / urls.length) * 100) + '%';

    const img = await loadImgWithFallback(url);
    if (img) {
      state.library[cat].push({ name: url.split('/').pop().split('?')[0] || 'image', img, origImg: img });
      success++;
    } else {
      fail++;
    }
  }

  document.getElementById('importProgBar').style.width = '100%';
  const catBtn = document.querySelector(`#importCatRow .import-cat-btn[data-cat="${cat}"]`);
  const catName = catBtn ? catBtn.textContent : cat;
  const msg = fail === 0
    ? `✅ 成功导入 ${success} 张图片至「${catName}」`
    : `导入完成：${success} 成功 / ${fail} 失败`;
  document.getElementById('importStatusText').textContent = msg;

  if (success > 0) {
    if (state.activeLibraryTab !== cat) toggleLibrary(cat);
    else renderLibraryDrawer();
    showToast(`已导入 ${success} 张`);
    setTimeout(closeImportModal, 1800);
  }
}

// ==================== 工程存档 (PS风格) ====================
const PS_LAST_NAME_KEY = 'freyaLastSaveName';

function setPmProgress(text, pct, showBar) {
  const el = document.getElementById('pmProgressText');
  const wrap = document.getElementById('pmProgWrap');
  const bar = document.getElementById('pmProgBar');
  if (el) el.textContent = text;
  if (wrap) wrap.style.display = showBar ? 'block' : 'none';
  if (bar) bar.style.width = Math.round(pct * 100) + '%';
}
function openProjectModal() {
  setPmProgress('', 0, false);
  document.getElementById('projectModalOverlay').classList.add('show');
}
function closeProjectModal() {
  document.getElementById('projectModalOverlay').classList.remove('show');
}
function handleProjectOverlayClick(e) {
  if (e.target === document.getElementById('projectModalOverlay')) closeProjectModal();
}
async function psSave() {
  const lastName = localStorage.getItem(PS_LAST_NAME_KEY);
  if (!lastName) { await psSaveAs(); return; }
  await doSaveProject(lastName);
}
async function psSaveAs() {
  const name = prompt('输入工程名称：', localStorage.getItem(PS_LAST_NAME_KEY)?.replace('.freya','') || 'LINSSEN工程');
  if (name === null) return;
  await doSaveProject((name.trim() || 'LINSSEN工程'));
}
async function doSaveProject(name) {
  setPmProgress('正在打包工程...', 0, true);
  try {
    const data = await serializeStateAsync((p) => setPmProgress(`打包中 ${Math.round(p*100)}%...`, p, true));
    setPmProgress('正在写入文件...', 0.95, true);
    const filename = name.endsWith('.freya') ? name : name + '.freya';
    // 用 Blob 流式写入，避免大 JSON 字符串撑爆内存
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = filename;
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    localStorage.setItem(PS_LAST_NAME_KEY, filename);
    setPmProgress('✅ 已保存：' + filename, 1, true);
    showToast('✅ 工程已保存');
    setTimeout(closeProjectModal, 1500);
  } catch(e) {
    setPmProgress('❌ 保存失败：' + (e.message || '图片数量过多，请减少服装库图片'), 0, false);
    console.error('Save error:', e);
  }
}
function importProject(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data || data.version !== 2) { setPmProgress('❌ 文件格式不正确', 0, false); return; }
      if (!confirm('载入此工程将替换当前所有内容，确定继续？')) return;
      openProjectModal();
      setPmProgress('正在载入...', 0, true);
      const ok = await deserializeState(data, (p) => setPmProgress('载入中 ' + Math.round(p*100) + '%...', p, true));
      if (ok) {
        updateExtractedColors(); renderLayerList(); renderInspector(); render();
        syncUIFromState(); saveHistory();
        localStorage.setItem(PS_LAST_NAME_KEY, file.name);
        setPmProgress('✅ 工程已载入', 1, true);
        showToast('✅ 工程已载入');
        setTimeout(closeProjectModal, 1500);
      } else {
        setPmProgress('❌ 载入失败，文件可能已损坏', 0, false);
      }
    } catch(err) {
      setPmProgress('❌ 解析失败：' + err.message, 0, false);
    }
  };
  reader.readAsText(file);
}
function syncUIFromState() {
  try {
    document.getElementById('bgCustom').value = state.bgColor;
    document.getElementById('bgHex').value = state.bgColor.toUpperCase();
    document.getElementById('borderWidth').value = state.borderWidth;
    document.getElementById('borderWidthVal').textContent = state.borderWidth;
    document.getElementById('borderInset').value = state.borderInset;
    document.getElementById('borderInsetVal').textContent = state.borderInset;
    document.getElementById('borderColorInput').value = state.borderColor;
    document.getElementById('borderHex').value = state.borderColor.toUpperCase();
    document.querySelectorAll('.template-card').forEach(el => {
      el.classList.toggle('active', el.dataset.tmpl === state.template);
    });
  } catch(e) {}
}

// ==================== SERIALIZE / DESERIALIZE ====================
// 把 Image 转为 base64，全程保留原始画质
function imgToDataUrl(img, maxDim, quality) {
  try {
    let w = img.naturalWidth || img.width || 1;
    let h = img.naturalHeight || img.height || 1;
    if (maxDim && (w > maxDim || h > maxDim)) {
      const s = maxDim / Math.max(w, h);
      w = Math.round(w * s); h = Math.round(h * s);
    }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0, w, h);
    if (quality && quality < 1) {
      // 检测是否有透明像素（抠图后的图必须用 PNG）
      const px = cx.getImageData(0, 0, w, h).data;
      let hasAlpha = false;
      for (let i = 3; i < px.length; i += 4) { if (px[i] < 250) { hasAlpha = true; break; } }
      if (!hasAlpha) return c.toDataURL('image/jpeg', quality);
    }
    return c.toDataURL('image/png');
  } catch(e) {
    return img.src && img.src.startsWith('data:') ? img.src : null;
  }
}
function dataUrlToImg(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl) { resolve(null); return; }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
function serializeStateAsync(onProgress) {
  const source = { ...state, canvasW: CANVAS_W, canvasH: CANVAS_H, items: state.items.map(i=>({...i})), texts: state.texts.map(t=>({...t})),
    layerOrder: state.layerOrder.map(l=>({...l})),
    library: Object.fromEntries(Object.entries(state.library).map(([k,items])=>[k,items.map(i=>({...i}))])) };

  return new Promise((resolve) => {
    const libCats = Object.keys(source.library);
    const libTasks = [];
    for (const cat of libCats) {
      for (let i = 0; i < source.library[cat].length; i++) libTasks.push({ cat, i });
    }
    const itemTasks = source.items.map((_, i) => i);
    const total = libTasks.length + itemTasks.length + 1;
    let done = 0;
    const libData = {};
    libCats.forEach(c => libData[c] = []);
    const itemsData = [];
    const BATCH = 3;
    function processLibBatch(start) {
      const end = Math.min(start + BATCH, libTasks.length);
      for (let k = start; k < end; k++) {
        const { cat, i } = libTasks[k];
        const item = source.library[cat][i];
        // 服装库图片：压缩到 800px JPEG，体积减少 90%
        libData[cat].push({ name: item.name, dataUrl: imgToDataUrl(item.img, 800, 0.85) });
        done++; if (onProgress) onProgress(done / total);
      }
      if (end < libTasks.length) setTimeout(() => processLibBatch(end), 0);
      else setTimeout(() => processItemBatch(0), 0);
    }
    function processItemBatch(start) {
      const end = Math.min(start + BATCH, itemTasks.length);
      for (let k = start; k < end; k++) {
        const item = source.items[itemTasks[k]];
        itemsData.push({
          id: item.id, name: item.name, ...templateImageMetadata(item),
          // 画布图层：压缩到 1200px JPEG，保留足够画质
          dataUrl: imgToDataUrl(item.img, 1200, 0.90),
          origDataUrl: imgToDataUrl(item.origImg, 1200, 0.90),
          colors: item.colors, x: item.x, y: item.y, w: item.w, h: item.h,
          baseW: item.baseW, baseH: item.baseH, rotation: item.rotation, opacity: item.opacity ?? 1,
        });
        done++; if (onProgress) onProgress(done / total);
      }
      if (end < itemTasks.length) setTimeout(() => processItemBatch(end), 0);
      else resolve({
        version: 2, savedAt: new Date().toISOString(),
        bgColor: source.bgColor, borderWidth: source.borderWidth,
        borderInset: source.borderInset, borderColor: source.borderColor,
        template: source.template, canvasW: source.canvasW, canvasH: source.canvasH, contentBaseW: source.contentBaseW||800, contentBaseH: source.contentBaseH||1000, layerOrder: source.layerOrder.map(l => ({...l})),
        nextId: source.nextId, library: libData,
        items: itemsData, texts: source.texts.map(t => ({...t})),
      });
    }
    if (libTasks.length > 0) setTimeout(() => processLibBatch(0), 0);
    else setTimeout(() => processItemBatch(0), 0);
  });
}
async function deserializeState(data, onProgress) {
  if (!data || data.version !== 2) return false;
  const libCats = Object.keys(data.library || {});
  const total = libCats.reduce((s,c) => s+(data.library[c]||[]).length,0) + (data.items||[]).length + 1;
  let done = 0;
  const newLibrary = { top:[], pants:[], skirt:[], dress:[], bag:[], accessory:[], shoes:[], mood:[] };
  for (const cat of libCats) {
    if (!newLibrary[cat]) newLibrary[cat] = [];
    for (const entry of (data.library[cat]||[])) {
      const img = await dataUrlToImg(entry.dataUrl);
      if (img) newLibrary[cat].push({ name: entry.name, img, origImg: img });
      done++; if (onProgress) onProgress(done/total);
    }
  }
  const newItems = [];
  for (const entry of (data.items||[])) {
    const img = await dataUrlToImg(entry.dataUrl);
    const origImg = await dataUrlToImg(entry.origDataUrl);
    if (img) {
      const item = { id:entry.id, name:entry.name, ...templateImageMetadata(entry), img, origImg:origImg||img,
        colors:entry.colors||[], x:entry.x, y:entry.y, w:entry.w, h:entry.h,
        baseW:entry.baseW, baseH:entry.baseH, rotation:entry.rotation||0, opacity:entry.opacity??1 };
      newItems.push(item);
      _imgCache[entry.id+'_img'] = img;
      _imgCache[entry.id+'_origImg'] = origImg||img;
    }
    done++; if (onProgress) onProgress(done/total);
  }
  state.library = newLibrary; state.items = newItems;
  state.texts = (data.texts||[]).map(t=>({...t}));
  state.layerOrder = (data.layerOrder||[]).filter(ref => {
    if (ref.type==='item') return newItems.some(i=>i.id===ref.id);
    if (ref.type==='text') return state.texts.some(t=>t.id===ref.id);
    return false;
  });
  state.bgColor = data.bgColor||'#FFFFFF'; state.borderWidth = data.borderWidth||0;
  state.borderInset = data.borderInset??20; state.borderColor = data.borderColor||'#111111';
  state.template = data.template === 'ink_poster' ? 'none' : (data.template||'none');
  state.nextId = data.nextId||(state.items.length+state.texts.length+10);
  state.contentBaseW = data.contentBaseW||data.canvasW||800; state.contentBaseH = data.contentBaseH||data.canvasH||1000;
  state.selected = null;
  if(window.applyCanvasDimensions)applyCanvasDimensions(data.canvasW||800,data.canvasH||1000,false);
  state.selected = null;
  if (onProgress) onProgress(1);
  return true;
}

// ==================== 自定义模板 ====================
const CUSTOM_TMPL_KEY = 'freyaCustomTemplates';
function loadCustomTemplates() { try { return JSON.parse(localStorage.getItem(CUSTOM_TMPL_KEY)||'[]'); } catch(e){return[];} }
function saveCustomTemplates(t) { localStorage.setItem(CUSTOM_TMPL_KEY, JSON.stringify(t)); }
function renderCustomTmplGrid() {
  const grid = document.getElementById('customTmplGrid'); if(!grid) return;
  const tmpls = loadCustomTemplates();
  if(tmpls.length===0){grid.innerHTML='<div style="grid-column:1/-1;font-size:11px;color:var(--text-muted);text-align:center;padding:8px 0;">暂无自定义模板</div>';return;}
  grid.innerHTML = tmpls.map((tmpl,idx)=>`
    <div class="custom-tmpl-card" onclick="applyCustomTmpl(${idx})" title="${tmpl.name.replace(/"/g,'&quot;')}">
      <button class="custom-tmpl-del" onclick="event.stopPropagation();deleteCustomTmpl(${idx})">✕</button>
      <div class="custom-tmpl-thumb">✦</div>
      <div class="custom-tmpl-name">${tmpl.name.replace(/</g,'&lt;')}</div>
    </div>`).join('');
}
function openSaveTmplModal() {
  if(state.texts.length===0){showToast('请先在画布上添加文字图层');return;}
  document.getElementById('tmplNameInput').value='';
  document.getElementById('nameTmplOverlay').classList.add('show');
  setTimeout(()=>document.getElementById('tmplNameInput').focus(),100);
}
function closeNameTmplModal(){document.getElementById('nameTmplOverlay').classList.remove('show');}
function handleNameOverlayClick(e){if(e.target===document.getElementById('nameTmplOverlay'))closeNameTmplModal();}
function confirmSaveTmpl(){
  const name=document.getElementById('tmplNameInput').value.trim();
  if(!name){showToast('请输入模板名称');return;}
  const tmpl={name,createdAt:new Date().toISOString(),texts:state.texts.map(t=>({...t})),textOrder:state.layerOrder.filter(r=>r.type==='text').map(r=>r.id)};
  const tmpls=loadCustomTemplates();
  const idx=tmpls.findIndex(t=>t.name===name);
  if(idx>=0){if(!confirm('已有同名模板，要覆盖吗？'))return;tmpls[idx]=tmpl;}else tmpls.push(tmpl);
  saveCustomTemplates(tmpls);renderCustomTmplGrid();closeNameTmplModal();showToast('✅ 模板「'+name+'」已保存');
}
function applyCustomTmpl(idx){
  const tmpl=loadCustomTemplates()[idx];if(!tmpl)return;
  state.texts=[];state.layerOrder=state.layerOrder.filter(r=>r.type==='item');
  const idMap={};
  tmpl.texts.forEach(t=>{const nid=state.nextId++;idMap[t.id]=nid;state.texts.push({...t,id:nid});});
  const ordered=(tmpl.textOrder||tmpl.texts.map(t=>t.id)).map(oid=>({type:'text',id:idMap[oid]})).filter(r=>r.id!==undefined);
  state.layerOrder.push(...ordered);
  state.selected=null;renderLayerList();renderInspector();render();saveHistory();
  showToast('已应用模板「'+tmpl.name+'」');
}
function deleteCustomTmpl(idx){
  const tmpls=loadCustomTemplates();if(!confirm('确定删除模板「'+tmpls[idx]?.name+'」吗？'))return;
  tmpls.splice(idx,1);saveCustomTemplates(tmpls);renderCustomTmplGrid();showToast('模板已删除');
}
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('tmplNameInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')confirmSaveTmpl();});
});

// ==================== SUPABASE 登录 ====================
const SUPABASE_URL = 'https://igvqlegawbtioqdtwdwk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_81KKr8aZCEr3lBv1cvBUJg_ORyZ_C9C';
const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
let _currentUser = null;

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pwd   = document.getElementById('loginPassword').value;
  const btn   = document.getElementById('loginBtn');
  const err   = document.getElementById('loginErr');
  if (!email || !pwd) { err.textContent = '请填写邮箱和密码'; return; }
  btn.disabled = true; btn.textContent = '登录中...'; err.textContent = '';
  if (!sb) { err.textContent = '登录服务暂时无法连接，请刷新后重试'; btn.disabled = false; btn.textContent = '登录'; return; }
  let response;
  try { response = await sb.auth.signInWithPassword({ email, password: pwd }); }
  catch (e) { err.textContent = '连接失败，请检查网络后重试'; btn.disabled = false; btn.textContent = '登录'; return; }
  const { data, error } = response;
  if (error) {
    err.textContent = '登录失败：' + (error.message === 'Invalid login credentials' ? '邮箱或密码错误' : error.message);
    btn.disabled = false; btn.textContent = '登 录';
    return;
  }
  _currentUser = data.user;
  onLoginSuccess();
}

async function doLogout() {
  await sb.auth.signOut();
  _currentUser = null;
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginErr').textContent = '';
}

function onLoginSuccess() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('logoutBtn').style.display = '';
  showToast('✅ 登录成功，正在加载云端数据...');
  loadFromCloud();
}

async function checkSession() {
  if (IS_LOCAL) { document.getElementById('loginPage').style.display = 'none'; return; }
  if (!sb) { document.getElementById('loginErr').textContent = '登录服务暂时无法连接，请刷新重试'; return; }
  let session;
  try { ({ data: { session } } = await sb.auth.getSession()); }
  catch (e) { document.getElementById('loginErr').textContent = '连接失败，请检查网络'; return; }
  if (session?.user) {
    _currentUser = session.user;
    onLoginSuccess();
  }
}

// Enter 键触发登录
document.addEventListener('keydown', (e) => {
  const loginPage = document.getElementById('loginPage');
  if (e.key === 'Enter' && loginPage && loginPage.style.display !== 'none') {
    doLogin();
  }
});

// ==================== 云端存储（OSS + 后端） ====================
const BACKEND_URL = ''; // 同源部署，使用相对路径

// 上传图片到 OSS（通过后端获取签名URL）
async function uploadToOSS(img, userId, filename) {
  try {
    const dataUrl = imgToDataUrl(img, 800, 0.85);
    if (!dataUrl) return null;
    // 转成 Blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    // 从后端获取签名上传URL
    const signRes = await fetch(BACKEND_URL + '/api/oss/sign-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, filename }),
    });
    const { url, ossPath } = await signRes.json();
    if (!url) return null;
    // 直接上传到 OSS
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': blob.type || 'image/jpeg' },
      body: blob,
    });
    return ossPath;
  } catch(e) {
    console.warn('uploadToOSS error:', e);
    return null;
  }
}

// 从 OSS 下载图片
async function loadFromOSS(ossPath) {
  try {
    const res = await fetch(BACKEND_URL + '/api/oss/get-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ossPath }),
    });
    const { url } = await res.json();
    if (!url) return null;
    return await dataUrlToImg(url);
  } catch(e) {
    console.warn('loadFromOSS error:', e);
    return null;
  }
}

// 保存工程到云端
let _cloudSaveTimer = null;
let _isCloudSaving = false;

async function saveToCloud() {
  if (!_currentUser || _isCloudSaving) return;
  _isCloudSaving = true;
  try {
    const userId = _currentUser.id;
    showToast('☁️ 正在同步到云端...');

    // 上传所有图片到 OSS（跳过已上传的）
    for (const item of state.items) {
      if (!item.ossPath && item.img) {
        item.ossPath = await uploadToOSS(item.img, userId, 'item_' + item.id);
      }
    }
    for (const cat of Object.keys(state.library)) {
      for (const libItem of state.library[cat]) {
        if (!libItem.ossPath && libItem.img) {
          libItem.ossPath = await uploadToOSS(libItem.img, userId, 'lib_' + cat + '_' + Date.now());
        }
      }
    }

    // 序列化（不含 base64，只含 OSS 路径）
    const projectData = {
      version: 3,
      savedAt: new Date().toISOString(),
      bgColor: state.bgColor,
      borderWidth: state.borderWidth,
      borderInset: state.borderInset,
      borderColor: state.borderColor,
      template: state.template,
      layerOrder: state.layerOrder.map(l => ({...l})),
      nextId: state.nextId,
      items: state.items.map(item => ({
        id: item.id, name: item.name, ...templateImageMetadata(item), ossPath: item.ossPath || null,
        colors: item.colors, x: item.x, y: item.y, w: item.w, h: item.h,
        baseW: item.baseW, baseH: item.baseH, rotation: item.rotation, opacity: item.opacity ?? 1,
      })),
      texts: state.texts.map(t => ({...t})),
      library: Object.fromEntries(
        Object.entries(state.library).map(([cat, items]) => [
          cat, items.map(li => ({ name: li.name, ossPath: li.ossPath || null }))
        ])
      ),
    };

    // 发送到后端保存
    const res = await fetch(BACKEND_URL + '/api/project/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, data: projectData }),
    });
    const result = await res.json();
    if (result.ok) {
      showToast('☁️ 已同步到云端');
    }
  } catch(e) {
    console.warn('saveToCloud error:', e);
  } finally {
    _isCloudSaving = false;
  }
}

function triggerCloudSave() {
  if (!_currentUser) return;
  clearTimeout(_cloudSaveTimer);
  _cloudSaveTimer = setTimeout(saveToCloud, 8000); // 8秒防抖
}

// 从云端加载工程
async function loadFromCloud() {
  if (!_currentUser) return;
  try {
    const res = await fetch(BACKEND_URL + '/api/project/load/' + _currentUser.id);
    const { data } = await res.json();
    if (!data || data.version !== 3) {
      showToast('暂无云端数据，从空白开始');
      return;
    }

    showToast('☁️ 正在恢复云端数据...');

    // 恢复图片图层
    const newItems = [];
    for (const entry of (data.items || [])) {
      if (!entry.ossPath) continue;
      const img = await loadFromOSS(entry.ossPath);
      if (!img) continue;
      const item = {
        id: entry.id, name: entry.name, ...templateImageMetadata(entry), img, origImg: img,
        ossPath: entry.ossPath, colors: entry.colors || [],
        x: entry.x, y: entry.y, w: entry.w, h: entry.h,
        baseW: entry.baseW, baseH: entry.baseH,
        rotation: entry.rotation || 0, opacity: entry.opacity ?? 1,
      };
      newItems.push(item);
      _imgCache[entry.id + '_img'] = img;
      _imgCache[entry.id + '_origImg'] = img;
    }

    // 恢复服装库
    const newLibrary = { top:[], pants:[], skirt:[], dress:[], bag:[], accessory:[], shoes:[], mood:[] };
    for (const [cat, items] of Object.entries(data.library || {})) {
      if (!newLibrary[cat]) newLibrary[cat] = [];
      for (const entry of items) {
        if (!entry.ossPath) continue;
        const img = await loadFromOSS(entry.ossPath);
        if (!img) continue;
        newLibrary[cat].push({ name: entry.name, img, origImg: img, ossPath: entry.ossPath });
      }
    }

    // 应用到 state
    state.items = newItems;
    state.library = newLibrary;
    state.texts = (data.texts || []).map(t => ({...t}));
    state.layerOrder = (data.layerOrder || []).filter(ref => {
      if (ref.type === 'item') return newItems.some(i => i.id === ref.id);
      if (ref.type === 'text') return state.texts.some(t => t.id === ref.id);
      return false;
    });
    state.bgColor = data.bgColor || '#FFFFFF';
    state.borderWidth = data.borderWidth || 0;
    state.borderInset = data.borderInset ?? 20;
    state.borderColor = data.borderColor || '#111111';
    state.template = data.template || 'none';
    state.nextId = data.nextId || 100;
    state.selected = null;

    updateExtractedColors();
    renderLibraryDrawer();
    renderLayerList();
    renderInspector();
    render();
    syncUIFromState();
    showToast('✅ 云端工程已恢复');
  } catch(e) {
    console.warn('loadFromCloud error:', e);
    showToast('加载云端数据失败');
  }
}

// ==================== BOOT ====================
saveHistory();
render();
renderCustomTmplGrid();
checkSession();

// Hook: 操作后自动触发云端保存
const _origSaveHistory = saveHistory;
saveHistory = function() {
  _origSaveHistory();
  triggerCloudSave();
}; // 检查已有登录状态
