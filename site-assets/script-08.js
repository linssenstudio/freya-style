
/* Real canvas dimensions, with proportional content placement across aspect ratios. */
(() => {
  const presets=[
    {name:'原始竖版',w:800,h:1000,detail:'4:5'},
    {name:'社媒竖图',w:1080,h:1350,detail:'4:5'},
    {name:'方形帖子',w:1080,h:1080,detail:'1:1'},
    {name:'竖版故事',w:1080,h:1920,detail:'9:16'},
    {name:'横版封面',w:1920,h:1080,detail:'16:9'},
    {name:'竖版海报',w:1200,h:1600,detail:'3:4'}
  ];
  const settings=document.querySelector('.canvas-settings');
  const dimensions=settings.querySelector('.canvas-dimensions');
  const controls=document.createElement('div');controls.className='canvas-size-controls';
  controls.innerHTML=`<div class="canvas-size-title">常用画布尺寸</div><div class="canvas-size-presets">${presets.map(p=>`<button type="button" data-width="${p.w}" data-height="${p.h}" aria-label="${p.name} ${p.w} 乘 ${p.h} 像素"><strong>${p.name}</strong><small>${p.w} × ${p.h} · ${p.detail}</small></button>`).join('')}</div><div class="canvas-size-custom"><label>自定义 <input id="customCanvasW" type="number" min="200" max="2400" step="1" value="800" aria-label="自定义画布宽度"> × <input id="customCanvasH" type="number" min="200" max="2400" step="1" value="1000" aria-label="自定义画布高度"></label><button type="button" id="applyCustomCanvas">应用</button></div><p class="canvas-size-note">切换尺寸时，现有图片和文字会等比例居中，不会被裁掉。</p>`;
  dimensions.after(controls);
  function gcd(a,b){return b?gcd(b,a%b):a;}
  function projectContent(fromW,fromH,toW,toH,baseW=state.contentBaseW||800,baseH=state.contentBaseH||1000){
    const oldScale=Math.min(fromW/baseW,fromH/baseH),newScale=Math.min(toW/baseW,toH/baseH),scale=newScale/oldScale;
    const oldX=(fromW-baseW*oldScale)/2,oldY=(fromH-baseH*oldScale)/2;
    const newX=(toW-baseW*newScale)/2,newY=(toH-baseH*newScale)/2;
    state.items.forEach(item=>{item.x=(item.x-oldX)*scale+newX;item.y=(item.y-oldY)*scale+newY;item.w*=scale;item.h*=scale;if(item.baseW)item.baseW*=scale;if(item.baseH)item.baseH*=scale;});
    state.texts.forEach(item=>{item.x=(item.x-oldX)*scale+newX;item.y=(item.y-oldY)*scale+newY;item.size*=scale;if(Number.isFinite(item.letterSpacing))item.letterSpacing*=scale;});
  }
  function syncControls(){
    const divisor=gcd(CANVAS_W,CANVAS_H);
    dimensions.querySelectorAll('b')[0].textContent=CANVAS_W;
    dimensions.querySelectorAll('b')[1].textContent=CANVAS_H;
    document.querySelector('.canvas-caption').textContent=`${CANVAS_W} × ${CANVAS_H} PX · ${CANVAS_W/divisor}:${CANVAS_H/divisor}`;
    document.querySelectorAll('.canvas-size-presets button').forEach(button=>{const active=Number(button.dataset.width)===CANVAS_W&&Number(button.dataset.height)===CANVAS_H;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    document.querySelector('#customCanvasW').value=CANVAS_W;
    document.querySelector('#customCanvasH').value=CANVAS_H;
  }
  window.applyCanvasDimensions=(width,height,scaleContent=true)=>{
    const w=Math.round(Number(width)),h=Math.round(Number(height));
    if(!Number.isFinite(w)||!Number.isFinite(h)||w<200||h<200||w>2400||h>2400){showToast('画布宽高请输入 200–2400 像素');return false;}
    if(w===CANVAS_W&&h===CANVAS_H){syncControls();return true;}
    const oldW=CANVAS_W,oldH=CANVAS_H;
    if(scaleContent){
      if(!state.items.length&&!state.texts.length){state.contentBaseW=w;state.contentBaseH=h;}
      else projectContent(oldW,oldH,w,h);
    }
    CANVAS_W=w;CANVAS_H=h;canvas.width=w;canvas.height=h;
    syncControls();document.getElementById('zoomFit').click();
    renderInspector();render();
    if(scaleContent){saveHistory();showToast(`画布已调整为 ${w} × ${h}`);}
    return true;
  };
  controls.querySelectorAll('.canvas-size-presets button').forEach(button=>button.addEventListener('click',()=>applyCanvasDimensions(button.dataset.width,button.dataset.height,true)));
  controls.querySelector('#applyCustomCanvas').addEventListener('click',()=>applyCanvasDimensions(controls.querySelector('#customCanvasW').value,controls.querySelector('#customCanvasH').value,true));
  controls.querySelectorAll('.canvas-size-custom input').forEach(input=>input.addEventListener('keydown',event=>{if(event.key==='Enter')controls.querySelector('#applyCustomCanvas').click();}));
  // Templates are designed on the original 4:5 coordinate system. Adapt the result to the chosen canvas.
  const applyTemplateAtBase=applyCurrentTemplate;
  applyCurrentTemplate=function(){
    if(state.template==='none')return applyTemplateAtBase();
    if(CANVAS_W===800&&CANVAS_H===1000){const result=applyTemplateAtBase();state.contentBaseW=800;state.contentBaseH=1000;return result;}
    const targetW=CANVAS_W,targetH=CANVAS_H;
    projectContent(targetW,targetH,800,1000);
    CANVAS_W=800;CANVAS_H=1000;
    try{return applyTemplateAtBase();}
    finally{CANVAS_W=targetW;CANVAS_H=targetH;state.contentBaseW=800;state.contentBaseH=1000;projectContent(800,1000,targetW,targetH);render();}
  };
  state.contentBaseW=state.contentBaseW||800;state.contentBaseH=state.contentBaseH||1000;
  syncControls();
})();

