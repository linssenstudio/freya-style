
/* Miniatures come from the same template definitions as the editor. */
(() => {
  const previews={...window.LEGACY_TEMPLATE_PREVIEWS,...window.REFERENCE_TEMPLATES};
  const palette=['#d8d9d1','#c7ccbf','#e3ddd1','#c9ceca','#ded3c5','#d4d6c9'];
  function drawPreview(layout){
    const preview=document.createElement('canvas');preview.width=320;preview.height=400;
    const c=preview.getContext('2d');c.scale(.4,.4);c.fillStyle=layout.bg||'#FFFFFF';c.fillRect(0,0,800,1000);
    const fullBleed=layout.slots.length===1&&layout.slots[0].w>=790&&layout.slots[0].h>=990;
    layout.slots.forEach((slot,index)=>{
      c.save();c.translate(slot.x+slot.w/2,slot.y+slot.h/2);c.rotate((slot.rotation||0)*Math.PI/180);
      c.fillStyle=slot.color||(fullBleed?'#747b70':palette[index%palette.length]);c.fillRect(-slot.w/2,-slot.h/2,slot.w,slot.h);
      c.fillStyle=fullBleed?'#bfc5b6':'#979e8d';c.textAlign='center';c.textBaseline='middle';c.font=`400 ${Math.min(18,slot.w*.09,slot.h*.15)}px Arial`;
      c.fillText(String(index+1).padStart(2,'0'),0,0);c.restore();
    });
    layout.texts.forEach(text=>{
      c.save();c.translate(text.x,text.y);c.rotate((text.rotation||0)*Math.PI/180);c.globalAlpha=text.opacity??1;
      c.font=`${text.italic?'italic':'normal'} ${text.weight||'400'} ${text.size}px ${text.font}`;
      c.fillStyle=text.color;c.textAlign=text.align||'left';c.textBaseline='middle';
      if('letterSpacing'in c)c.letterSpacing=(text.letterSpacing||0)+'px';
      const lines=(text.content||'').split('\n');
      lines.forEach((line,index)=>c.fillText(line,0,(index-(lines.length-1)/2)*text.size*1.3));
      c.restore();
    });
    if(layout.id==='none'){
      c.strokeStyle='#c5cdbb';c.lineWidth=2;c.setLineDash([10,10]);c.strokeRect(90,100,620,800);c.setLineDash([]);
      c.strokeStyle='#9ca98f';c.lineWidth=3;c.beginPath();c.moveTo(360,470);c.lineTo(440,470);c.moveTo(400,430);c.lineTo(400,510);c.stroke();
      c.fillStyle='#909c84';c.textAlign='center';c.font='18px Arial';c.fillText('自由创作',400,565);
    }
    return preview.toDataURL('image/png');
  }
  window.refreshTemplateThumbnails=()=>{
    document.querySelectorAll('.template-card').forEach(card=>{
      const id=card.dataset.tmpl;
      const layout=id==='none'?{id,slots:[],texts:[],bg:'#FFFFFF'}:previews[id];
      if(!layout)return;
      const label=card.querySelector('.template-label');
      const name=label.firstChild?.textContent.trim()||id;
      card.classList.add('layout-preview');
      const area=card.querySelector('.geo-icon');
      let image=area.querySelector('img');
      if(!image){image=document.createElement('img');area.replaceChildren(image);}
      image.alt=`${name}版式预览`;image.width=320;image.height=400;image.src=drawPreview(layout);image.draggable=false;
      let count=label.querySelector('small');if(!count){count=document.createElement('small');label.append(count);}
      count.textContent=layout.slots.length?`${layout.slots.length} 图`:'空白';
      card.title=id==='none'?'自由排版 · 从空白画布开始':`${name} · ${layout.slots.length} 个图片区域`;
      card.setAttribute('aria-label',name);
    });
  };
  refreshTemplateThumbnails();
  document.fonts.ready.then(refreshTemplateThumbnails);
  document.fonts.addEventListener('loadingdone',refreshTemplateThumbnails);
})();

