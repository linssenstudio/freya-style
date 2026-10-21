
/* A quiet, image-first shell inspired by the references; editor behavior stays in studio.js. */
(() => {
  const icon=window.studioIcon;
  const rail=document.createElement('nav');
  rail.className='social-rail';rail.setAttribute('aria-label','工作台导航');
  rail.innerHTML=`<div class="social-rail-brand" aria-label="Linssen Design">L</div>
    <div class="social-rail-actions">
      <button type="button" class="social-nav active" data-go="templates" aria-label="精选排版" title="精选排版">${icon('grid')}<span>排版</span></button>
      <button type="button" class="social-nav" data-go="assets" aria-label="素材图库" title="素材图库">${icon('image')}<span>素材</span></button>
      <button type="button" class="social-nav" data-go="layers" aria-label="图层" title="图层">${icon('layers')}<span>图层</span></button>
      <div class="social-rail-divider"></div>
      <button type="button" class="social-nav social-nav-create" id="quickUpload" aria-label="上传图片" title="上传图片">${icon('plus')}<span>上传</span></button>
    </div>
    <button type="button" class="social-nav social-rail-help" id="railHelp" aria-label="快捷键帮助" title="快捷键帮助">${icon('help')}<span>帮助</span></button>`;
  document.body.prepend(rail);
  const header=document.querySelector('.header');
  const headerSearch=document.createElement('label');
  headerSearch.className='header-search';
  headerSearch.innerHTML=`${icon('search')}<input id="headerTemplateSearch" type="search" placeholder="搜索排版、灵感与风格" aria-label="搜索排版模板"><span>⌘ K</span>`;
  header.insertBefore(headerSearch,header.querySelector('.header-actions'));
  const mainSearch=document.getElementById('templateSearch');
  const headerInput=headerSearch.querySelector('input');
  headerInput.addEventListener('input',()=>{
    mainSearch.value=headerInput.value;
    mainSearch.dispatchEvent(new Event('input',{bubbles:true}));
    switchPanel('templates');
    syncRail();
  });
  mainSearch.addEventListener('input',()=>{if(document.activeElement!==headerInput)headerInput.value=mainSearch.value;});
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
      event.preventDefault();
      if(getComputedStyle(headerSearch).display==='none'){
        switchPanel('templates');
        document.querySelector('.studio-left').classList.add('mobile-open');
        mainSearch.focus();mainSearch.select();
      }else{headerInput.focus();headerInput.select();}
      syncRail();
    }
  });
  function syncRail(){
    document.querySelectorAll('.social-nav[data-go]').forEach(button=>{
      const active=document.querySelector(`[data-panel="${button.dataset.go}"]`)?.classList.contains('active');
      button.classList.toggle('active',!!active);
      button.setAttribute('aria-current',active?'page':'false');
    });
  }
  document.querySelectorAll('.social-nav[data-go]').forEach(button=>button.addEventListener('click',()=>{
    switchPanel(button.dataset.go);
    if(matchMedia('(max-width:600px)').matches)document.querySelector('.studio-left').classList.add('mobile-open');
    syncRail();
  }));
  document.querySelectorAll('[data-panel]').forEach(button=>button.addEventListener('click',syncRail));
  document.getElementById('quickUpload').addEventListener('click',()=>document.getElementById('fileInput').click());
  document.getElementById('railHelp').addEventListener('click',()=>document.getElementById('shortcutsDialog').showModal());
  syncRail();
})();

