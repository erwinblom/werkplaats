'use strict';
(()=>{
 const layout=document.querySelector('.layout'),sidebar=document.querySelector('.sidebar'),tools=document.querySelector('.tools');
 layout.classList.add('library-layout');
 const nav=$('categories');I18n.attribute(nav,'aria-label',I18n.ui("Bibliotheekweergave",'Bibliotheekweergave'));tools.before(nav);
 const footer=document.createElement('div');footer.className='library-footer';footer.append($('undo'),$('storage'));$('cards').after(footer);sidebar.remove();
 const detail=document.createElement('dialog');detail.id='library-detail';detail.setAttribute('aria-labelledby','library-detail-title');document.body.append(detail);
 function show(id){const i=data.items.find(x=>x.id===id);if(!i)return;detail.innerHTML="<div class=\"library-detail-body\"><button class=\"detail-close\" type=\"button\" aria-label=\"Sluit\" data-i18n-aria-label=\"Sluit\"><span data-i18n=\"×\">×</span></button><p class=\"eyebrow\"><span data-i18n=\"BEWAARDE BRON ·\">BEWAARDE BRON ·</span> "+(esc(i.category))+"</p><h2 id=\"library-detail-title\">"+(esc(i.title))+"</h2><p class=\"source\">"+(esc(i.source))+"</p>"+(i.summary?"<h3><span data-i18n=\"Samenvatting\">Samenvatting</span></h3><p class=\"detail-text\">"+(esc(i.summary))+"</p>":'')+(i.quote?"<h3><span data-i18n=\"Citaat\">Citaat</span></h3><blockquote class=\"detail-text\">"+(esc(i.quote))+"</blockquote>":'')+(i.notes?"<h3><span data-i18n=\"Eigen notities\">Eigen notities</span></h3><p class=\"detail-text\">"+(esc(i.notes))+"</p>":'')+"<div class=\"actions\">"+(i.url?"<a href=\""+(esc(safeURL(i.url)))+"\" target=\"_blank\" rel=\"noopener noreferrer\"><span data-i18n=\"Open bron ↗\">Open bron ↗</span></a>":'')+"<button class=\"detail-edit\" type=\"button\"><span data-i18n=\"Bewerk\">Bewerk</span></button></div></div>";detail.querySelector('.detail-close').onclick=()=>detail.close();detail.querySelector('.detail-edit').onclick=()=>{detail.close();edit(id)};detail.showModal();}
 const expandedSources=new Set();
 $('cards').addEventListener('toggle',event=>{
  const d=event.target;if(!d.matches?.('.source-details')||!d.isConnected)return;
  if(d.open)expandedSources.add(d.dataset.sourceId);else expandedSources.delete(d.dataset.sourceId);
 },true);
 function decorate(){
  for(const card of $('cards').querySelectorAll('.card')){const id=card.querySelector('[data-edit]')?.dataset.edit,i=data.items.find(i=>i.id===id);if(!i)continue;card.classList.toggle('inbox',i.category==='Inbox');const heading=card.querySelector('h2'),title=document.createElement('button');title.className='library-title';title.textContent=i.title;title.onclick=()=>show(id);heading.replaceChildren(title);const preview=document.createElement('p');preview.className='library-note';I18n.assign(preview,(i.notes||i.quote||i.summary||I18n.ui("Nog geen notitie.",'Nog geen notitie.')),"textContent");heading.after(preview);const summary=card.querySelector(':scope > p:not(.source):not(.library-note)');if(summary)summary.remove();card.querySelector('details')?.remove();
   const tags=card.querySelector('.tags'),extra=document.createElement('details');extra.className='source-details';extra.dataset.sourceId=id;
   extra.innerHTML="<summary><span data-i18n=\"Details\">Details</span></summary><div class=\"source-detail-body\">"+(i.summary?"<h3><span data-i18n=\"Samenvatting\">Samenvatting</span></h3><p>"+(esc(i.summary))+"</p>":'')+(i.quote?"<h3><span data-i18n=\"Citaat\">Citaat</span></h3><blockquote>"+(esc(i.quote))+"</blockquote>":'')+(i.notes?"<h3><span data-i18n=\"Eigen notities\">Eigen notities</span></h3><p>"+(esc(i.notes))+"</p>":'')+(i.checked?"<p class=\"source\"><span data-i18n=\"Startbron geraadpleegd\">Startbron geraadpleegd</span> "+(esc(i.checked))+"</p>":'')+"</div>";
   if(tags&&i.tags.length)extra.lastElementChild.append(tags);else tags?.remove();
   card.querySelector('.source').textContent=i.source;
   if(i.summary||i.quote||i.notes||i.checked||i.tags.length){extra.open=expandedSources.has(id);card.querySelector('.card-foot').before(extra);}
}
 }
 const original=render;render=function(){original();decorate()};$('search').oninput=()=>render();$('topic').onchange=()=>render();render();
 const style=document.createElement('link');style.rel='stylesheet';style.href='../../bibliotheek.css?v=20261012-categories-1';document.head.append(style);
})();
