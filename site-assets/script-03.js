
/* Studio shell. Original canvas, templates and project format remain compatible. */
(() => {
  const $ = (s) => document.querySelector(s);
  const paths = {
    grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    image:'M3 3h18v18H3z M3 16l5-5 4 4 3-3 6 6 M8 7h.01',
    layers:'m12 3 10 6-10 6L2 9z M2 13l10 6 10-6 M2 17l10 6 10-6',
    plus:'M12 5v14 M5 12h14', undo:'M9 5 4 10l5 5 M4 10h10a6 6 0 0 1 0 12', redo:'m15 5 5 5-5 5 M20 10H10a6 6 0 0 0 0 12',
    export:'M12 3v12 m-4-4 4 4 4-4 M4 15v6h16v-6', save:'M4 3h13l3 3v15H4z M8 3v6h8V3 M8 21v-8h8v8',
    search:'M17 17l4 4 M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    cursor:'m5 3 14 9-7 1-3 7z', text:'M4 5V3h16v2 M12 3v18 M8 21h8',
    help:'M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5 M12 17h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    sliders:'M5 3v18 M12 3v18 M19 3v18 M2 7h6 M9 16h6 M16 9h6',
    arrow:'M5 12h14 m-5-5 5 5-5 5', refresh:'M20 7v5h-5 M20 12a8 8 0 1 0-2 6',
    trash:'M3 6h18 M8 6V3h8v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
    check:'m5 12 4 4L19 6', spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z'
  };
  const icon = (name) => `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.grid}"/></svg>`;
  window.studioIcon = icon;
  $('.header-brand').innerHTML = '<div class="brand-mark">L.</div><div><h1>Linssen Design</h1><div class="brand-sub">搭配图设计</div></div><div class="brand-divider"></div><span class="workspace-name">搭配灵感工作台</span>';
  $('.header-actions').innerHTML = `<span class="session-badge">${IS_LOCAL ? '本地工作台' : '云端工作台'}</span>
    <button class="pill-btn pill-btn-outline history-btn" id="undoBtn" onclick="undo()" title="撤销 · ⌘/Ctrl Z" aria-label="撤销">${icon('undo')}</button>
    <button class="pill-btn pill-btn-outline history-btn" id="redoBtn" onclick="redo()" title="重做 · ⌘/Ctrl Shift Z" aria-label="重做">${icon('redo')}</button>
    <span class="separator"></span>
    <button class="pill-btn pill-btn-outline" onclick="openProjectModal()" title="保存 / 打开工程">${icon('save')}<span class="save-label">工程</span></button>
    <button class="pill-btn pill-btn-primary" onclick="exportCanvas()">${icon('export')}导出图片</button>
    <button class="pill-btn pill-btn-outline" onclick="doLogout()" id="logoutBtn" style="display:none">退出</button>`;

  const [left,right] = document.querySelectorAll('.app-layout > .sidebar');
  left.classList.add('studio-left'); right.classList.add('studio-right');
  const [templates,custom,assets,layers] = [...left.children];
  templates.querySelector('.section-title').innerHTML = '<strong>精选排版</strong><span class="section-count">22 STYLES</span>';
  templates.insertAdjacentHTML('afterbegin',`<label class="template-search">${icon('search')}<input id="templateSearch" placeholder="搜索模板风格…" aria-label="搜索模板"></label>`);
  custom.classList.add('custom-block');
  custom.querySelector('.section-title').textContent = '我的模板';
  const panels = {};
  ['templates','assets','layers'].forEach(name => {
    const panel = document.createElement('section');panel.className='side-content';panel.id='panel-'+name;panel.hidden=name!=='templates';panel.setAttribute('role','tabpanel');panels[name]=panel;
  });
  panels.templates.append(templates,custom);
  assets.querySelector('.section-title').innerHTML='<strong>添加到画布</strong>';
  assets.querySelector('.upload-zone .geo-icon').innerHTML=icon('image');
  assets.querySelector('.upload-zone').insertAdjacentHTML('beforeend','<p class="upload-note">支持 PNG、JPG、WebP<br>也可以直接粘贴或拖入画布</p>');
  panels.assets.append(assets,$('.library-wrapper'));
  layers.querySelector('.section-title').innerHTML='<strong>图层顺序</strong><span class="section-count" id="layerCount">0 LAYERS</span>';
  layers.insertAdjacentHTML('beforeend','<button class="save-tmpl-btn" onclick="resetPositions()">散开图片图层</button><p class="upload-note">拖动图层调整前后顺序<br>双击画布上的文字即可编辑</p>');
  panels.layers.append(layers);
  left.innerHTML=`<div class="panel-heading"><h2>创作工具</h2><span>YOUR TOOLKIT</span><button class="mobile-close" aria-label="关闭创作工具" onclick="this.closest('.studio-left').classList.remove('mobile-open')">×</button></div><div class="panel-tabs" role="tablist" aria-label="创作工具">
    <button class="active" role="tab" aria-selected="true" aria-controls="panel-templates" data-panel="templates">${icon('grid')}模板</button>
    <button role="tab" aria-selected="false" aria-controls="panel-assets" data-panel="assets">${icon('image')}素材</button>
    <button role="tab" aria-selected="false" aria-controls="panel-layers" data-panel="layers">${icon('layers')}图层</button></div>`;
  left.append(...Object.values(panels));
  left.insertAdjacentHTML('beforeend',`<div class="side-footer">${icon('spark')}一点灵感，无限搭配。</div>`);
  window.switchPanel = (name) => {
    Object.entries(panels).forEach(([key,panel])=>panel.hidden=key!==name);
    document.querySelectorAll('[data-panel]').forEach(b=>{b.classList.toggle('active',b.dataset.panel===name);b.setAttribute('aria-selected',b.dataset.panel===name);});
    if(name==='assets'&&!state.activeLibraryTab)toggleLibrary('top');
  };
  document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>switchPanel(b.dataset.panel)));
  $('#templateSearch').addEventListener('input',e=>{
    const q=e.target.value.trim().toLowerCase();let count=0;
    document.querySelectorAll('.template-card').forEach(card=>{card.hidden=!((card.textContent+card.dataset.tmpl).toLowerCase().includes(q));card.style.display=card.hidden?'none':'';if(!card.hidden)count++;});
    let empty=$('#noTemplates');if(!empty){empty=document.createElement('p');empty.id='noTemplates';empty.className='no-results';templates.append(empty);}empty.textContent=count?'':'没有找到匹配模板，试试“杂志”或“极简”。';
  });
  document.querySelectorAll('.template-card,.library-tab,.upload-zone,.bg-swatch').forEach(el=>{
    el.tabIndex=0;el.setAttribute('role','button');
    el.setAttribute('aria-label',el.classList.contains('bg-swatch')?'画布背景 '+el.style.background:el.textContent.trim());
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});
  });
  // Keep the canvas centered with independent scrolling and fit-to-window scaling.
  const area=$('.canvas-area'),wrapper=$('#canvasWrapper');
  const hint=$('#interactionHint');
  wrapper.remove();hint.remove();area.innerHTML=`
    <div class="workspace-toolbar"><div class="canvas-title"><button class="tool-button mobile-assets" style="display:none" aria-label="打开创作工具">${icon('grid')}</button>搭配画布 <small>01 / ARTBOARD</small></div>
      <div class="canvas-tools"><button class="tool-button" onclick="document.getElementById('fileInput').click()" title="上传图片" aria-label="上传图片">${icon('image')}<span>图片</span></button><button class="tool-button" onclick="addText()" title="添加文字 · T" aria-label="添加文字">${icon('text')}<span>文字</span></button><button class="tool-button" onclick="applyCurrentTemplate();saveHistory()" title="重新应用排版" aria-label="重新应用排版">${icon('refresh')}</button><button class="tool-button" id="clearCanvasBtn" title="清空画布" aria-label="清空画布">${icon('trash')}</button><button class="tool-button mobile-properties" style="display:none" aria-label="打开属性设置">${icon('sliders')}</button></div></div>
    <div class="draft-recovery" id="draftRecovery" hidden><span>有一份上次编辑的本地草稿</span><button id="restoreDraft">恢复</button><button id="dismissDraft" aria-label="忽略草稿">×</button></div>
    <div class="canvas-scroll"><div class="canvas-stage"><span class="canvas-caption">800 × 1000 PX · 4:5</span></div></div>
    <div class="canvas-bottom"><span class="canvas-tip">拖入图片，让灵感开始。</span><div class="zoom-control"><button id="zoomOut" aria-label="缩小画布">−</button><output id="zoomValue">50%</output><button id="zoomIn" aria-label="放大画布">＋</button><button class="zoom-fit" id="zoomFit">适应</button></div></div>`;
  $('.canvas-stage').append(wrapper);area.append(hint);
  wrapper.insertAdjacentHTML('beforeend',`<div class="canvas-empty" id="canvasEmpty"><span class="empty-eyebrow">A LITTLE INSPIRATION, A NEW LOOK.</span><div class="empty-symbol">L.</div><h2>Your next look,<br><em>starts here.</em></h2><p>把喜欢的单品放在一起<br>让每一种搭配，都有你的风格</p><button class="pill-btn pill-btn-primary" onclick="document.getElementById('fileInput').click()">${icon('plus')}上传第一件单品</button><span class="empty-hint">或从左侧选择一个排版开始</span><span class="empty-bottom">CURATED BY YOU · CREATED WITH LINSSEN DESIGN</span></div>`);
  $('#clearCanvasBtn').onclick=()=>{if(!state.layerOrder.length)return;if(confirm('清空当前画布？清空后仍可撤销。'))clearAll();};
  let zoom=0.5,autoFit=true;
  function setZoom(value){zoom=Math.max(.08,Math.min(2,value));wrapper.style.width=(CANVAS_W*zoom)+'px';wrapper.style.height=(CANVAS_H*zoom)+'px';$('#zoomValue').textContent=Math.round(zoom*100)+'%';$('#zoomOut').disabled=zoom<=.08;$('#zoomIn').disabled=zoom>=2;}
  function fit(){const box=$('.canvas-scroll');setZoom(Math.min((box.clientWidth-64)/CANVAS_W,(box.clientHeight-54)/CANVAS_H,1));}
  $('#zoomIn').onclick=()=>{autoFit=false;setZoom(zoom+.1);};$('#zoomOut').onclick=()=>{autoFit=false;setZoom(zoom-.1);};$('#zoomFit').onclick=()=>{autoFit=true;fit();};
  new ResizeObserver(()=>{if(autoFit)fit();}).observe($('.canvas-scroll'));
  $('.mobile-assets').onclick=()=>{left.classList.toggle('mobile-open');right.classList.remove('mobile-open');};
  $('.mobile-properties').onclick=()=>{right.classList.toggle('mobile-open');left.classList.remove('mobile-open');};
  $('.canvas-scroll').addEventListener('click',()=>{left.classList.remove('mobile-open');right.classList.remove('mobile-open');});
  // Plain scrolling pans the workspace. Alt + wheel retains the original object scaling.
  canvas.addEventListener('wheel',e=>{if(!e.altKey){e.stopImmediatePropagation();if(e.ctrlKey||e.metaKey){e.preventDefault();autoFit=false;setZoom(zoom+(e.deltaY<0?.05:-.05));}}},{capture:true,passive:false});
  // Touch and pen use the existing canvas transformations.
  let touchPointer=null;
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;touchPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);e.preventDefault();canvas.dispatchEvent(new MouseEvent('mousedown',{clientX:e.clientX,clientY:e.clientY,bubbles:true}));});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId===touchPointer){e.preventDefault();canvas.dispatchEvent(new MouseEvent('mousemove',{clientX:e.clientX,clientY:e.clientY,bubbles:true}));}});
  const endTouch=e=>{if(e.pointerId===touchPointer){canvas.dispatchEvent(new MouseEvent('mouseup',{clientX:e.clientX,clientY:e.clientY,bubbles:true}));touchPointer=null;}};
  canvas.addEventListener('pointerup',endTouch);canvas.addEventListener('pointercancel',endTouch);

  right.insertAdjacentHTML('afterbegin',`<div class="inspector-header"><h2>${icon('sliders')}设计属性<button class="mobile-close" aria-label="关闭属性设置" onclick="this.closest('.studio-right').classList.remove('mobile-open')">×</button></h2><p>每一个细节，都刚刚好。</p></div>`);
  const settings=right.lastElementChild;settings.classList.add('canvas-settings');
  settings.querySelector('.section-title').textContent='画布设置';
  settings.querySelector('.section-title').insertAdjacentHTML('afterend','<div class="canvas-dimensions"><span>宽 <b>800</b></span>×<span>高 <b>1000</b></span>px</div>');
  right.insertAdjacentHTML('beforeend',`<div class="right-note">${icon('spark')}<span>从单品提取的颜色，可以用来设置<br>画布背景和边框，让搭配更协调。</span></div>`);
  document.body.insertAdjacentHTML('beforeend',`<footer class="status-footer"><span id="studioStatus">${icon('check')}准备就绪</span><span class="footer-tagline">MADE FOR YOUR EVERYDAY INSPIRATION</span><button id="showShortcuts">? &nbsp; 快捷键</button></footer>
    <dialog class="help-dialog" id="shortcutsDialog"><h2>更顺手的创作方式</h2><dl><dt>添加文字</dt><dd>T</dd><dt>上传图片</dt><dd>⌘ / Ctrl U</dd><dt>复制选中图层</dt><dd>⌘ / Ctrl D</dd><dt>撤销 / 重做</dt><dd>⌘ / Ctrl Z / Shift Z</dd><dt>微调位置</dt><dd>方向键 · 1 px</dd><dt>快速移动</dt><dd>Shift + 方向键 · 10 px</dd><dt>缩放图层</dt><dd>Alt + 滚轮</dd><dt>保存工程</dt><dd>⌘ / Ctrl S</dd><dt>取消选择 / 裁剪</dt><dd>Esc</dd></dl><button class="pill-btn pill-btn-primary" onclick="document.getElementById('shortcutsDialog').close()">知道了</button></dialog>`);
  $('#showShortcuts').onclick=()=>$('#shortcutsDialog').showModal();
  $('#shortcutsDialog').addEventListener('click',e=>{if(e.target===$('#shortcutsDialog'))$('#shortcutsDialog').close();});
  function currentObject(){return state.selected?(state.selected.type==='item'?state.items:state.texts).find(o=>o.id===state.selected.id):null;}
  window.studioAction=(action)=>{
    const obj=currentObject();if(!obj)return;
    if(action==='duplicate'){copySelected();pasteClipboard(true);return;}
    if(action==='delete'){removeLayer(state.selected.type,obj.id);return;}
    if(action==='centerX'){
      if(state.selected.type==='item')obj.x=(CANVAS_W-obj.w)/2;
      else {const bounds=getTextBounds(obj);const offset=bounds.left+bounds.maxW/2;obj.x=CANVAS_W/2-offset*Math.cos((obj.rotation||0)*Math.PI/180);}
    }
    if(action==='centerY'){
      if(state.selected.type==='item')obj.y=(CANVAS_H-obj.h)/2;
      else {const bounds=getTextBounds(obj);obj.y=CANVAS_H/2-(bounds.left+bounds.maxW/2)*Math.sin((obj.rotation||0)*Math.PI/180);}
    }
    render();saveHistory();
  };
  const oldInspector=renderInspector;
  renderInspector=function(){
    oldInspector();
    const panel=$('#inspectorPanel');
    if(!state.selected){panel.innerHTML=`<div class="section-title">图层属性</div><div class="inspector-empty"><div class="inspector-graphic">${icon('cursor')}</div>选中图片或文字<br>在这里调整它的细节</div>`;return;}
    panel.insertAdjacentHTML('beforeend','<div class="selection-actions"><p>快捷操作</p><div class="selection-buttons"><button onclick="studioAction(\'centerX\')">水平居中</button><button onclick="studioAction(\'centerY\')">垂直居中</button></div><div class="selection-buttons" style="margin-top:6px"><button onclick="studioAction(\'duplicate\')">复制图层</button><button onclick="studioAction(\'delete\')">删除图层</button></div></div>');
    panel.querySelectorAll('input').forEach(input=>{if(!input.getAttribute('aria-label'))input.setAttribute('aria-label',input.closest('.slider-row,.color-row')?.querySelector('label')?.textContent||input.placeholder||'图层属性');});
  };
  const oldRender=render;
  render=function(){oldRender();syncShell();};
  function syncShell(){
    if(!$('#canvasEmpty'))return;
    $('#canvasEmpty').hidden=state.layerOrder.length>0;
    $('#layerCount').textContent=state.layerOrder.length+' LAYERS';
    $('.canvas-tip').textContent=state.layerOrder.length?'双击编辑文字 · 方向键微调位置':'拖入图片，让灵感开始。';
    $('#clearCanvasBtn').disabled=!state.layerOrder.length;
    $('#undoBtn').disabled=state.historyIndex<=0;
    $('#redoBtn').disabled=state.historyIndex>=state.history.length-1;
    document.querySelectorAll('.bg-swatch').forEach(el=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=el.style.background;el.classList.toggle('active',c.fillStyle.toLowerCase()===state.bgColor.toLowerCase());});
  }
  const oldHistoryUI=updateUndoRedoUI;updateUndoRedoUI=function(){oldHistoryUI();syncShell();};
  const oldRestore=restoreSnapshot;restoreSnapshot=function(s){oldRestore(s);syncUIFromState();queueDraft();};
  document.addEventListener('keydown',e=>{
    if($('#loginPage').style.display!=='none')return;
    const editing=e.target.matches('input,textarea,select,[contenteditable=true]');
    const mod=e.ctrlKey||e.metaKey;
    if(mod&&e.key.toLowerCase()==='s'){e.preventDefault();e.stopImmediatePropagation();openProjectModal();return;}
    if(editing)return;
    if(e.key==='Escape'){selectLayer(null,null);left.classList.remove('mobile-open');right.classList.remove('mobile-open');closeImportModal();closeProjectModal();closeNameTmplModal();return;}
    if(document.querySelector('dialog[open],.project-modal-overlay.show,.import-modal-overlay.show,.name-modal-overlay.show,.studio-export'))return;
    if(mod&&e.shiftKey&&e.key.toLowerCase()==='z'){e.preventDefault();e.stopImmediatePropagation();redo();return;}
    if(mod&&e.key.toLowerCase()==='u'){e.preventDefault();$('#fileInput').click();return;}
    if(!mod&&!e.altKey&&e.key.toLowerCase()==='t'){e.preventDefault();addText();return;}
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&state.selected){
      e.preventDefault();const obj=currentObject(),step=e.shiftKey?10:1;if(!obj)return;obj.x+=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0;obj.y+=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;render();
      clearTimeout(window.studioNudgeTimer);window.studioNudgeTimer=setTimeout(()=>saveHistory(),180);
    }
  },true);
  // IndexedDB stores images without the small localStorage limit. Recovery is explicit.
  let draftDB=null,draftTimer=null,draftReady=false,draftBusy=false,draftAgain=false;
  const status=message=>{$('#studioStatus').innerHTML=icon('check')+escapeHtml(message);};
  function queueDraft(){
    if(!IS_LOCAL||!draftReady)return;
    status('编辑中 · 即将保存到本机');clearTimeout(draftTimer);draftTimer=setTimeout(saveDraft,900);
  }
  async function saveDraft(){
    if(!draftDB||!draftReady)return;if(draftBusy){draftAgain=true;return;}draftBusy=true;
    try {
      const data=await serializeStateAsync();const tx=draftDB.transaction('drafts','readwrite');tx.objectStore('drafts').put(data,'current');
      await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});status('已保存到本机 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}));
    }catch(e){status('本地草稿保存失败，请使用「工程」保存文件');}finally{draftBusy=false;if(draftAgain){draftAgain=false;queueDraft();}}
  }
  const priorHistory=saveHistory;saveHistory=function(){priorHistory();queueDraft();};
  const priorLibraryRender=renderLibraryDrawer;renderLibraryDrawer=function(){priorLibraryRender();queueDraft();};
  if(IS_LOCAL){
    try{
      const request=indexedDB.open('freya-studio-local-v1',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('drafts');
      request.onerror=()=>status('请使用「工程」保存到本机');
      request.onsuccess=()=>{
        draftDB=request.result;const get=draftDB.transaction('drafts').objectStore('drafts').get('current');
        get.onsuccess=()=>{
          const draft=get.result;
          if(draft&&(draft.items?.length||draft.texts?.length||Object.values(draft.library||{}).some(a=>a.length))){
            $('#draftRecovery').hidden=false;status('上次的草稿可恢复');
            $('#restoreDraft').onclick=async()=>{
              if(state.layerOrder.length&&!confirm('恢复上次草稿将替换当前画布，是否继续？'))return;
              $('#restoreDraft').disabled=true;
              try{if(await deserializeState(draft)){syncUIFromState();updateExtractedColors();renderLayerList();renderInspector();render();state.history=[];state.historyIndex=-1;draftReady=true;saveHistory();if(state.activeLibraryTab)renderLibraryDrawer();$('#draftRecovery').hidden=true;showToast('已恢复上次的搭配');}}
              catch(e){showToast('草稿恢复失败，请打开工程文件');$('#restoreDraft').disabled=false;}
            };
            $('#dismissDraft').onclick=()=>{$('#draftRecovery').hidden=true;draftReady=true;queueDraft();};
          }else{draftReady=true;status('本地模式 · 编辑后自动保存');}
        };
      };
    }catch(e){status('请使用「工程」保存到本机');}
  }else status('云端模式 · 登录后同步');
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&draftReady){clearTimeout(draftTimer);saveDraft();}});
  renderInspector();updateUndoRedoUI();render();requestAnimationFrame(fit);
  document.fonts.ready.then(()=>render());
})();

