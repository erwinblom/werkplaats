"use strict";
(()=>{
 const tool=document.querySelector('script[data-tool]')?.dataset.tool;if(!['Ping','Offerte','Uren'].includes(tool))return;
 const scriptURL=document.currentScript.src;
 const main=document.querySelector('main'),nav=document.createElement('nav');nav.className='factureren-tabs';I18n.attribute(nav,'aria-label',I18n.ui("Factureren",'Factureren'));
 for(const [id,label,file]of [['Ping','Facturen','Start Ping.html'],['Offerte','Offertes','Start Offerte.html'],['Uren','Uren','Start Uren.html']]){
  const a=document.createElement('a');I18n.assign(a,I18n.ui(label,label));a.href=GereedschapskistKeuze.url(new URL('../'+id+'/'+file,location.href)).href;
  if(id===tool)a.setAttribute('aria-current','page');
  a.onclick=async event=>{if(event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();try{await BewaarAlles.flush();location.assign(a.href);}catch(error){const status=document.getElementById('wm-message');if(status)I18n.assign(status,I18n.ui("Niet overgestapt: {0}",'Niet overgestapt: '+error.message),"textContent");}};
  nav.append(a);
 }
 main.prepend(nav);
 if(tool==='Offerte'){I18n.assign(document,I18n.ui("Factureren · Offertes — Werkplaats",'Factureren · Offertes — Werkplaats'),"title");const brand=document.querySelector('.brand .tool-name');if(brand)I18n.assign(brand,I18n.ui("FACTUREREN",'FACTUREREN'),"textContent");}
 document.addEventListener('DOMContentLoaded',()=>{
  const title=document.createElement('h2');title.className='factureren-section-title';I18n.assign(title,I18n.ui({Ping:'Facturen',Offerte:'Offertes',Uren:'Urenregistraties'}[tool],{Ping:'Facturen',Offerte:'Offertes',Uren:'Urenregistraties'}[tool]));
  main.querySelector(':scope>.heading,:scope>.intro')?.prepend(title);
  if(tool!=='Uren'){
   const sidebar=main.querySelector(tool==='Ping'?'.layout>.sidebar':'.workspace>.sidebar');
   const search=document.createElement('div'),tools=document.createElement('div'),count=document.createElement('p');
   search.className='factureren-overview-search';tools.className='factureren-overview-tools';count.className='factureren-overview-count';count.setAttribute('aria-live','polite');
   search.append(sidebar.querySelector('label[for="suite-search"]'),sidebar.querySelector('#suite-search'));
   tools.append(search,sidebar.querySelector(tool==='Ping'?'.list-tools':'.filter-strip'));
   sidebar.querySelector('h2').after(tools,count);
   const list=sidebar.querySelector('#list');
   const updateCount=()=>{const shown=list.querySelectorAll(tool==='Ping'?'.invoice-btn':'.quote-button').length;I18n.assign(count,I18n.ui(tool==='Ping'?(shown===1?'{0} factuur in dit overzicht':'{0} facturen in dit overzicht'):(shown===1?'{0} offerte in dit overzicht':'{0} offertes in dit overzicht'),shown+' '+(shown===1?(tool==='Ping'?'factuur':'offerte'):(tool==='Ping'?'facturen':'offertes'))+' in dit overzicht'),"textContent");};
   new MutationObserver(updateCount).observe(list,{childList:true});updateCount();
   const editor=main.querySelector(tool==='Ping'?'.layout>.editor':'.workspace>.editor');
   const preview=main.querySelector(tool==='Ping'?'.layout>.preview':'.workspace>.preview');
   const detail=document.createElement('dialog'),head=document.createElement('div'),grid=document.createElement('div');
   detail.className='factureren-detail';I18n.attribute(detail,'aria-label',I18n.ui(tool==='Ping'?'Factuur':'Offerte',tool==='Ping'?'Factuur':'Offerte'));
   head.className='factureren-detail-head';grid.className='factureren-detail-grid';
   const label=document.createElement('strong'),close=document.createElement('button');
   I18n.assign(label,(tool==='Ping'?I18n.ui("Factuur",'Factuur'):I18n.ui("Offerte",'Offerte')),"textContent");close.type='button';I18n.assign(close,I18n.ui("Sluit",'Sluit'),"textContent");
   const closeDetail=()=>{
    if((tool==='Ping'&&!validInputs())||(tool==='Offerte'&&!discardOK()))return;
    detail.close();
    if(tool==='Ping'){selected=null;invoiceEditing=false;invoiceEditBaseline=null;render();}
    else select(null);
   };
   close.onclick=closeDetail;detail.oncancel=event=>{event.preventDefault();closeDetail();};
   head.append(label,close);grid.append(editor,preview);detail.append(head,grid);main.append(detail);
   const openDetail=()=>{if(!detail.open)detail.showModal();close.focus();};
   if(tool==='Ping')document.addEventListener('factuur-aangemaakt',event=>{if(current()?.id===event.detail.id){openDetail();editor.querySelector('input:not([type=hidden]),textarea')?.focus();}});
   if(tool==='Ping')document.getElementById('quote-file')?.addEventListener('change',()=>{const before=selected;const observer=new MutationObserver(()=>{if(selected&&selected!==before){observer.disconnect();openDetail();}});observer.observe(list,{childList:true});setTimeout(()=>observer.disconnect(),10000);});
   list.addEventListener('click',event=>{const row=event.target.closest(tool==='Ping'?'.invoice-btn':'.quote-button');if(!row)return;const id=row.dataset.select;requestAnimationFrame(()=>{if(list.querySelector(tool==='Ping'?'.invoice-btn.active':'.quote-button.selected')?.dataset.select===id)openDetail();});});
   document.getElementById('new')?.addEventListener('click',()=>{
    if(tool==='Ping'){requestAnimationFrame(()=>{if(selected)openDetail();});return;}
    const before=working;
    const observer=new MutationObserver(()=>{if(working&&working!==before){observer.disconnect();openDetail();}});
    observer.observe(editor,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),10000);
   });
   document.getElementById('demo')?.addEventListener('click',()=>requestAnimationFrame(()=>{
    if(tool==='Ping'?selected:working)openDetail();
   }));
   const requested=new URLSearchParams(location.search),deepLink=tool==='Ping'?(requested.has('factuur')||requested.has('offerte')):requested.has('offerte');
   if(deepLink){const active=tool==='Ping'?'.invoice-btn.active':'.quote-button.selected';const reveal=()=>{if(list.querySelector(active)){openDetail();observer.disconnect();}};const observer=new MutationObserver(reveal);observer.observe(list,{childList:true});reveal();}
  }
  const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('factureren-overzicht.css?v=20261006-personal-title-1',scriptURL).href;document.head.append(style);
 });
})();
