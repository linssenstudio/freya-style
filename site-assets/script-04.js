
/* Editable layouts based on the six user-supplied composition references. */
(() => {
  const serif = "'Bodoni Moda', 'Times New Roman', serif";
  const sans = "'Inter', Arial, sans-serif";
  const t = (content,x,y,size=12,options={}) => ({content,x,y,size,font:serif,weight:'400',color:'#292924',align:'left',letterSpacing:0,rotation:0,opacity:1,italic:false,...options});
  const slot = (x,y,w,h,color='#e7e5df') => ({x,y,w,h,color});
  const layouts = [
    {id:'ref_daily_record',name:'留白三联',description:'上方留白 · 横向三图 · 页脚小字',bg:'#FFFFFF',
      slots:[slot(5,470,368,260),slot(377,470,208,260),slot(589,470,206,260)],
      texts:[t('2026 DAILY JOURNAL',400,252,24,{align:'center'}),t('A COLLECTION OF EVERYDAY MOMENTS, QUIET DETAILS AND PERSONAL STYLE.\nFIND BEAUTY IN THE ORDINARY. DRESS FOR THE WAY YOU WANT TO FEEL.\nTHOUGHTFULLY CURATED, NATURALLY YOURS.\nLINSSEN DESIGN / EVERYDAY STORIES',5,795,6.8,{color:'#77766e',font:sans})]},
    {id:'ref_mood_six',name:'六格灵感板',description:'三列两行 · 细编号 · 极简留白',bg:'#FFFFFF',
      slots:[slot(120,244,160,228),slot(330,244,160,228),slot(540,244,160,228),slot(120,535,160,228),slot(330,535,160,228),slot(540,535,160,228)],
      texts:[t('MOODBOARD 001',400,114,7,{font:sans,align:'center',letterSpacing:3}),...[0,1,2,3,4,5].map(i=>t(String(i+1).padStart(2,'0'),120+(i%3)*210,i<3?489:780,8,{font:sans,letterSpacing:1.6})),t('LINSSEN DESIGN',400,912,7,{font:sans,align:'center',letterSpacing:2.7})]},
    {id:'ref_neutral_nine',name:'九宫格收藏',description:'等距九宫格 · 底部双栏标题',bg:'#F5F5F3',
      slots:Array.from({length:9},(_,i)=>slot(96+(i%3)*210,187+Math.floor(i/3)*198,188,176,i%2?'#e2e2dd':'#e8e7e2')),
      texts:[t('L I N S S E N',400,70,8,{font:sans,align:'center',letterSpacing:2.4}),t('VISUAL COLLECTION 01',96,904,13,{font:sans,letterSpacing:4}),t('NEUTRAL',704,904,14,{font:sans,weight:'700',align:'right',letterSpacing:1.4}),t('A STUDY IN FORM, TEXTURE AND QUIET CONTRAST. CONSIDERED OBJECTS, NATURAL TONES AND EVERYDAY INSPIRATION.\nCOLLECTED WITH INTENTION. ARRANGED WITH FEELING. LINSSEN DESIGN / VISUAL NOTES.',96,938,6.6,{font:sans,color:'#686862'})]},
    {id:'ref_september_collage',name:'错落拼贴',description:'七张图片 · 错位叠放 · 季节情绪',bg:'#F2F1EB',
      slots:[slot(256,272,157,158),slot(427,303,102,127),slot(190,443,302,76,'#c8bbaa'),slot(190,533,131,166),slot(335,533,194,244,'#b9c2be'),slot(505,443,110,133,'#c6b38e'),slot(394,168,49,188,'#ddd6c7')],
      texts:[t('STUDIO   LINSSEN',400,55,16,{align:'center',letterSpacing:3}),t('SEPTEMBER MOOD',400,950,11,{font:sans,align:'center',letterSpacing:3})]},
    {id:'ref_red_editorial',name:'红字侧标题',description:'单张主图 · 竖排衬线字 · 红色圆点',bg:'#FFFFFF',
      slots:[slot(188,161,612,761,'#d4d3cf')],
      texts:[t('LINSSEN DESIGN.',111,84,17,{color:'#BA372F',italic:true}),t('MAKE ROOM FOR BEAUTY,\nIN YOUR OWN WAY.',379,91,17,{color:'#BA372F',italic:true}),t('●',188,204,215,{font:'Arial, sans-serif',align:'center',color:'#BA372F'}),t('Linssen',172,565,153,{align:'center',color:'#BA372F',rotation:-90}),t('THE EDIT',96,873,15,{color:'#BA372F'})]},
    {id:'ref_full_collection',name:'满版型录',description:'满版照片 · 底部白字 · 季节系列',bg:'#D4D1CA',
      slots:[slot(0,0,800,1000,'#73766d')],
      texts:[t('26 F/W\nCOLLECTION',400,850,35,{align:'center',color:'#FFFFFF'}),t('WARMTH IN EVERY THREAD. SIMPLICITY IN EVERY DETAIL.\nA CONSIDERED WARDROBE FOR THE CHANGING SEASON, CREATED TO MOVE WITH YOU.\nSOFT TEXTURES, QUIET CONFIDENCE AND EVERYDAY EASE.\nLINSSEN DESIGN — THE AUTUMN / WINTER COLLECTION.',400,941,9,{font:sans,align:'center',color:'#FFFFFF'})]}
  ];
  window.REFERENCE_TEMPLATES = Object.fromEntries(layouts.map(l=>[l.id,l]));
  const byId = window.REFERENCE_TEMPLATES;
  function placeholderCanvas(frame,index,thumbnail=false){
    const c=document.createElement('canvas');c.width=Math.round(frame.w);c.height=Math.round(frame.h);const x=c.getContext('2d');
    x.fillStyle=frame.color;x.fillRect(0,0,c.width,c.height);
    const light=frame.color==='#73766d';x.fillStyle=light?'#b8bcb0':'#a3a89b';x.textAlign='center';x.textBaseline='middle';
    x.font='400 '+Math.min(19,c.width*.08)+'px Arial';x.fillText(String(index+1).padStart(2,'0'),c.width/2,c.height/2-(thumbnail?0:9));
    if(!thumbnail&&c.width>100&&c.height>90){x.font='10px Arial';x.fillText('双击替换图片',c.width/2,c.height/2+12);}
    return c;
  }
  function createPlaceholder(frame,index){
    const img=new Image();img.onload=()=>render();img.src=placeholderCanvas(frame,index).toDataURL('image/png');
    return {id:state.nextId++,name:`图框 ${String(index+1).padStart(2,'0')} · 双击换图`,img,origImg:img,colors:[],opacity:1,rotation:0,isPlaceholder:true};
  }
  function chooseImageFit(image,frame){
    if(!image?.naturalWidth||!image?.naturalHeight)return 'cover';
    const mismatch=Math.max((image.naturalWidth/image.naturalHeight)/(frame.w/frame.h),(frame.w/frame.h)/(image.naturalWidth/image.naturalHeight));
    if(mismatch>1.75)return 'contain';
    try{
      const sample=document.createElement('canvas');sample.width=sample.height=32;
      const sampleContext=sample.getContext('2d',{willReadFrequently:true});
      sampleContext.drawImage(image,0,0,32,32);
      const pixels=sampleContext.getImageData(0,0,32,32).data;
      for(let p=3;p<pixels.length;p+=4)if(pixels[p]<245)return 'contain';
    }catch(e){}
    return 'cover';
  }
  function applyReference(layout){
    const realImages=state.items.filter(i=>!i.isPlaceholder);
    state.texts=[];state.layerOrder=[];state.items=[];state.selected=null;
    setInteractionMode('normal');state.bgColor=layout.bg;state.borderWidth=0;
    layout.slots.forEach((frame,index)=>{
      const item=realImages[index]||createPlaceholder(frame,index);
      Object.assign(item,{x:frame.x,y:frame.y,w:frame.w,h:frame.h,baseW:frame.w,baseH:frame.h,rotation:0,imageFit:item.isPlaceholder?'cover':chooseImageFit(item.img,frame),imageFocusX:.5,imageFocusY:.5,imageZoom:1,noShadow:true,templateFrame:layout.id,frameLabel:String(index+1).padStart(2,'0')});
      state.items.push(item);state.layerOrder.push({type:'item',id:item.id});cacheItemImgs(item);
    });
    // Extra source images stay available in Layers, outside the export area.
    realImages.slice(layout.slots.length).forEach((item,index)=>{
      item.x=CANVAS_W+40;item.y=40+index*60;delete item.templateFrame;
      state.items.push(item);state.layerOrder.push({type:'item',id:item.id});
    });
    layout.texts.forEach(spec=>{const id=state.nextId++;state.texts.push({...spec,id});state.layerOrder.push({type:'text',id});});
    syncUIFromState();renderLayerList();renderInspector();updateExtractedColors();render();
    const extra=realImages.length-layout.slots.length;
    showToast(extra>0?`已应用「${layout.name}」· ${extra} 张多余图片保留在图层中`:`已应用「${layout.name}」· 上传图片填入图框`);
  }
  const legacyApply=applyCurrentTemplate;
  applyCurrentTemplate=function(){
    if(byId[state.template]){applyReference(byId[state.template]);return;}
    if(state.template==='ink_poster')state.template='none';
    const placeholderIds=new Set(state.items.filter(i=>i.isPlaceholder).map(i=>i.id));
    state.items=state.items.filter(i=>!i.isPlaceholder);
    state.items.forEach(item=>{if(item.templateFrame){delete item.templateFrame;delete item.imageFit;delete item.imageFocusX;delete item.imageFocusY;delete item.imageZoom;delete item.noShadow;delete item.frameLabel;}});
    state.layerOrder=state.layerOrder.filter(ref=>!(ref.type==='item'&&placeholderIds.has(ref.id)));
    legacyApply();renderLayerList();renderInspector();
  };
  // Reference thumbnails are generated from their actual layout coordinates and type.
  function thumbnail(layout){
    const c=document.createElement('canvas');c.width=240;c.height=300;const x=c.getContext('2d');x.scale(.3,.3);x.fillStyle=layout.bg;x.fillRect(0,0,800,1000);
    layout.slots.forEach((frame,index)=>x.drawImage(placeholderCanvas(frame,index,true),frame.x,frame.y,frame.w,frame.h));
    layout.texts.forEach(spec=>{x.save();x.translate(spec.x,spec.y);x.rotate(spec.rotation*Math.PI/180);x.font=`${spec.italic?'italic':'normal'} ${spec.weight} ${spec.size}px ${spec.font}`;x.fillStyle=spec.color;x.textAlign=spec.align;x.textBaseline='middle';if('letterSpacing'in x)x.letterSpacing=spec.letterSpacing+'px';const lines=spec.content.split('\n');lines.forEach((line,i)=>x.fillText(line,0,(i-(lines.length-1)/2)*spec.size*1.3));x.restore();});
    return c.toDataURL('image/png');
  }
  const grid=document.querySelector('.template-grid');
  const anchor=grid.querySelector('[data-tmpl="none"]');
  const fragment=document.createDocumentFragment();
  layouts.forEach(layout=>{
    const card=document.createElement('div');card.className='template-card reference-template';card.dataset.tmpl=layout.id;card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',layout.name);card.title=layout.description;
    card.innerHTML=`<div class="geo-icon"><img alt="${layout.name}版式预览" src="${thumbnail(layout)}"></div><div class="template-label">${layout.name}<small>${layout.slots.length} 图</small></div>`;
    card.onclick=()=>applyTemplate(layout.id);card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click();}};fragment.append(card);
  });
  anchor.after(fragment);
  document.querySelector('#panel-templates .section-count').textContent=document.querySelectorAll('.template-card').length+' STYLES';
  document.fonts.ready.then(()=>layouts.forEach(layout=>{grid.querySelector(`[data-tmpl="${layout.id}"] img`).src=thumbnail(layout);}));

  // Fill empty frames sequentially; replacing one frame is a single undoable edit.
  function fillFrame(frame,image,name){
    frame.img=image;frame.origImg=image;frame.name=(name||'图片').replace(/\.[^.]+$/,'');frame.isPlaceholder=false;frame.colors=extractColors(image);delete frame.ossPath;
    frame.imageFit=chooseImageFit(image,frame);frame.imageFocusX=.5;frame.imageFocusY=.5;frame.imageZoom=1;
    cacheItemImgs(frame);updateExtractedColors();selectLayer('item',frame.id);render();saveHistory();showToast('图片已填入图框 · 双击可再次替换');
  }
  window.setTemplateImageFit=(id,fit)=>{
    const item=state.items.find(i=>i.id===id&&i.templateFrame&&!i.isPlaceholder);
    if(!item||!['contain','cover'].includes(fit)||item.imageFit===fit)return;
    item.imageFit=fit;renderInspector();render();saveHistory();
  };
  window.adjustTemplateImage=(id,key,value,commit=false)=>{
    const item=state.items.find(i=>i.id===id&&i.templateFrame&&!i.isPlaceholder);
    if(!item||!['imageFocusX','imageFocusY','imageZoom'].includes(key))return;
    item[key]=key==='imageZoom'?Math.max(1,Math.min(2.5,Number(value)/100)):Math.max(0,Math.min(1,Number(value)/100));
    render();if(commit)saveHistory();
  };
  function nextEmpty(){return state.items.find(item=>item.isPlaceholder);}
  function readFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});}
  function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('图片无法读取'));image.src=src;});}
  const legacyAdd=addItemFromDataUrl;
  let uploadQueue=Promise.resolve();
  addItemFromDataUrl=function(src,name){
    if(!byId[state.template]||!nextEmpty())return legacyAdd(src,name);
    const templateAtStart=state.template;
    uploadQueue=uploadQueue.then(async()=>{const image=await loadImage(src);const frame=state.template===templateAtStart?nextEmpty():null;if(frame)fillFrame(frame,image,name);else legacyAdd(src,name);}).catch(()=>showToast('图片无法读取，请选择 PNG、JPG 或 WebP'));
    return uploadQueue;
  };
  const legacyFiles=processFiles;
  processFiles=function(files){
    if(!byId[state.template])return legacyFiles(files);
    const valid=files.filter(f=>f.type.startsWith('image/'));
    if(!valid.length){showToast('请选择图片文件');return;}
    (async()=>{for(const file of valid){try{await addItemFromDataUrl(await readFile(file),file.name);}catch(e){showToast('图片读取失败：'+file.name);}}})();
  };
  const legacyFromLibrary=addItemFromLibrary;
  addItemFromLibrary=function(cat,index){const entry=state.library[cat]?.[index],frame=byId[state.template]&&nextEmpty();if(entry&&frame){fillFrame(frame,entry.img,entry.name);return;}legacyFromLibrary(cat,index);};
  const fileInput=document.createElement('input');fileInput.type='file';fileInput.accept='image/*';fileInput.id='replaceFrameInput';fileInput.hidden=true;document.body.append(fileInput);
  let replaceId=null;
  window.replaceTemplateImage=id=>{replaceId=id;fileInput.value='';fileInput.click();};
  fileInput.onchange=async()=>{
    const file=fileInput.files[0],id=replaceId;if(!file)return;
    try{const image=await loadImage(await readFile(file));const frame=state.items.find(i=>i.id===id);if(frame)fillFrame(frame,image,file.name);}catch(e){showToast('图片无法读取，请选择其他文件');}
  };
  canvas.addEventListener('dblclick',e=>{
    const point=getMouseCoords(e);
    for(const ref of [...state.layerOrder].reverse()){
      if(ref.type==='text'){const text=state.texts.find(t=>t.id===ref.id);if(text&&hitTestText(point.x,point.y,text))return;}
      else{const item=state.items.find(i=>i.id===ref.id);if(item&&hitTestItem(point.x,point.y,item)){if(item.templateFrame){e.stopImmediatePropagation();selectLayer('item',item.id);replaceTemplateImage(item.id);}return;}}
    }
  },true);
  // Shift + drag changes the visible crop without moving the frame itself.
  let focusDrag=null;
  canvas.addEventListener('mousedown',e=>{
    if(!e.shiftKey||state.interactionMode!=='normal')return;
    const point=getMouseCoords(e);
    const item=[...state.layerOrder].reverse().filter(ref=>ref.type==='item').map(ref=>state.items.find(i=>i.id===ref.id)).find(i=>i?.templateFrame&&!i.isPlaceholder&&i.imageFit==='cover'&&hitTestItem(point.x,point.y,i));
    if(!item)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(state.selected?.id!==item.id)selectLayer('item',item.id);
    const scale=Math.max(item.w/item.img.naturalWidth,item.h/item.img.naturalHeight)*Math.max(1,item.imageZoom||1);
    focusDrag={item,startX:point.x,startY:point.y,focusX:item.imageFocusX??.5,focusY:item.imageFocusY??.5,overflowX:Math.max(0,item.img.naturalWidth*scale-item.w),overflowY:Math.max(0,item.img.naturalHeight*scale-item.h),changed:false};
    canvas.style.cursor='grabbing';
  },true);
  canvas.addEventListener('mousemove',e=>{
    if(!focusDrag)return;
    e.preventDefault();e.stopImmediatePropagation();
    const point=getMouseCoords(e),drag=focusDrag;
    if(drag.overflowX>0)drag.item.imageFocusX=Math.max(0,Math.min(1,drag.focusX-(point.x-drag.startX)/drag.overflowX));
    if(drag.overflowY>0)drag.item.imageFocusY=Math.max(0,Math.min(1,drag.focusY-(point.y-drag.startY)/drag.overflowY));
    drag.changed=true;render();
  },true);
  function finishFocusDrag(e){
    if(!focusDrag)return;
    e.stopImmediatePropagation();
    if(focusDrag.changed){renderInspector();saveHistory();}
    focusDrag=null;canvas.style.cursor='default';
  }
  canvas.addEventListener('mouseup',finishFocusDrag,true);
  canvas.addEventListener('mouseleave',finishFocusDrag,true);
  const priorInspector=renderInspector;
  renderInspector=function(){
    priorInspector();const item=state.selected?.type==='item'?state.items.find(i=>i.id===state.selected.id):null;
    if(!item?.templateFrame)return;
    const panel=document.querySelector('#inspectorPanel');
    const fit=item.imageFit==='contain'?'contain':'cover';
    panel.insertAdjacentHTML('afterbegin',`<div class="frame-tools"><span>图框 ${escapeHtml(item.frameLabel||'')} · 图片显示</span><button class="pill-btn pill-btn-primary" onclick="replaceTemplateImage(${item.id})">${item.isPlaceholder?'上传图片':'替换图片'}</button>${item.isPlaceholder?'':`<div class="frame-fit-buttons" role="group" aria-label="图框图片显示方式"><button type="button" class="${fit==='contain'?'active':''}" onclick="setTemplateImageFit(${item.id},'contain')">完整显示</button><button type="button" class="${fit==='cover'?'active':''}" onclick="setTemplateImageFit(${item.id},'cover')">铺满裁切</button></div>${fit==='cover'?`<div class="frame-adjust"><label>图片放大 <input type="range" min="100" max="250" value="${Math.round((item.imageZoom||1)*100)}" oninput="adjustTemplateImage(${item.id},'imageZoom',this.value)" onchange="adjustTemplateImage(${item.id},'imageZoom',this.value,true)"></label><label>左右位置 <input type="range" min="0" max="100" value="${Math.round((item.imageFocusX??.5)*100)}" oninput="adjustTemplateImage(${item.id},'imageFocusX',this.value)" onchange="adjustTemplateImage(${item.id},'imageFocusX',this.value,true)"></label><label>上下位置 <input type="range" min="0" max="100" value="${Math.round((item.imageFocusY??.5)*100)}" oninput="adjustTemplateImage(${item.id},'imageFocusY',this.value)" onchange="adjustTemplateImage(${item.id},'imageFocusY',this.value,true)"></label></div>`:''}`}<p>${fit==='contain'?'完整保留图片，空余区域显示画布背景。':'铺满图框；Shift + 拖动图片或拖动滑块调整画面。'}<br>双击画布中的图片可替换。</p></div>`);
    if(item.isPlaceholder||fit==='contain'){panel.querySelectorAll('button').forEach(button=>{if(/自由裁剪/.test(button.textContent))button.disabled=true;});}
    if(item.isPlaceholder){panel.querySelectorAll('button').forEach(button=>{if(/抠图/.test(button.textContent))button.disabled=true;});}
  };
  const priorExport=exportCanvas;
  exportCanvas=function(){const missing=state.items.filter(i=>i.isPlaceholder).length;if(missing&&!confirm(`还有 ${missing} 个图框没有替换图片。继续导出会保留占位图，是否继续？`))return;priorExport();};
  renderInspector();
})();

