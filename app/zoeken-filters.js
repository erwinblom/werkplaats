'use strict';
(()=>{
 const tool=document.body.dataset.tool,$=id=>document.getElementById(id);
 if(document.querySelector('.suite-search-bar'))return;
 const names={Abonnementen:'Abonnementen',Werkbank:'Schrijven',Ping:'Factureren',Projectbord:'Doen',Bronnenkast:'Verzamelen',Uren:'Uren schrijven',Contacten:'Contact houden',Publicatieplanner:'Projecten',Offerte:'Offreren',Kasboek:'Boekhouden'};
 if(tool==='Werkbank'){
  const original=document.createElement('div');original.className='writing-search-filters';
  original.innerHTML="<label for=\"writing-search-scope\"><span data-i18n=\"Zoek in\">Zoek in</span></label><select id=\"writing-search-scope\"><option value=\"content\" data-i18n=\"Namen, titels en inhoud\">Namen, titels en inhoud</option><option value=\"names\" data-i18n=\"Alleen namen en titels\">Alleen namen en titels</option></select><p><span data-i18n=\"Zoekt in Notities of de gekozen documenten.\">Zoekt in Notities of de gekozen documenten.</span></p>";
  const input=document.createElement('input');input.id='suite-search';input.type='search';I18n.assign(input,I18n.ui("Naam, titel of tekst…",'Naam, titel of tekst…'),"placeholder");
  document.querySelector('.workspace-strip').after(original,input);
  const searchWriting=()=>{renderFileList();window.SchrijfNotities?.search();};input.oninput=searchWriting;original.querySelector('select').onchange=searchWriting;
  for(const button of document.querySelectorAll('[onclick*="openSearchPalette"]'))button.hidden=true;
 }
 const configs={
  Abonnementen:['.subscription-filters','#rows',{filter:'current'}],
  Werkbank:['.writing-search-filters','#fileList',{'writing-search-scope':'content'}],
  Projectbord:['.toolbar','#board',{'project-filter':'',filter:'all',sort:'priority'}],
  Bronnenkast:['.tools','#count',{topic:'','library-category':''}],
  Contacten:['.tools','#count',{tag:''}],
  Publicatieplanner:['.toolbar','#count',{'kind-filter':'','channel-filter':'','status-filter':'',attention:false}],
  Uren:['.toolbar','#count',{period:'all','client-filter':'','project-filter':'',kind:'all'}],
  Kasboek:['.toolbar','#count',{period:'all','type-filter':'','category-filter':'',missing:false}],
  Ping:['.list-tools','#list',{'invoice-filter':'all'}],
  Offerte:['.filter-strip','#list',{filter:''}]
 };
 const config=configs[tool];if(!config)return;
 const [selector,targetSelector,defaults]=config,original=document.querySelector(selector),target=document.querySelector(targetSelector),search=$('suite-search')||$('search');
 if(!original||!target||!search)return;
 const bar=document.createElement('section');bar.className='suite-search-bar';I18n.attribute(bar,'aria-label',I18n.ui("Zoeken en filteren",'Zoeken en filteren'));
 const row=document.createElement('div');row.className='suite-search-row';
 const label=document.createElement('label');label.htmlFor=search.id;I18n.assign(label,I18n.ui('Zoeken in '+names[tool],'Zoeken in '+names[tool]),"textContent");
 const oldLabel=search.closest('label')||document.querySelector('label[for="'+search.id+'"]');
 row.append(label,search);if(oldLabel)oldLabel.remove();
 const summary=document.createElement('button');summary.type='button';summary.className='suite-filter-toggle';I18n.assign(summary,I18n.ui("Filters",'Filters'),"textContent");
 if(tool==='Abonnementen'){const extra=original.querySelector(':scope > details');if(extra)original.before(extra);}
 const panel=document.createElement('div');panel.className='suite-filter-panel';panel.id='suite-filter-panel';panel.hidden=true;panel.append(original);
 summary.setAttribute('aria-controls',panel.id);summary.setAttribute('aria-expanded','false');
 const setOpen=open=>{panel.hidden=!open;summary.setAttribute('aria-expanded',String(open));};
 summary.onclick=()=>setOpen(panel.hidden);
 panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();setOpen(false);summary.focus();}});
 const state=document.createElement('p');state.className='suite-filter-state';state.setAttribute('role','status');
 const clear=document.createElement('button');clear.type='button';I18n.assign(clear,I18n.ui("Wis filters",'Wis filters'),"textContent");clear.className='suite-clear-filters';
 row.append(summary,clear);bar.append(row,panel,state);
 bar.id='suite-search-bar';bar.hidden=true;
 const toggle=document.createElement('button');toggle.type='button';toggle.id='suite-search-toggle';I18n.assign(toggle,I18n.ui("Zoeken",'Zoeken'),"textContent");toggle.setAttribute('aria-controls',bar.id);toggle.setAttribute('aria-expanded','false');I18n.assign(toggle,I18n.ui("Zoeken (⌘K / Ctrl+K)",'Zoeken (⌘K / Ctrl+K)'),"title");
 function placeSearch(){
  const strip=document.querySelector('.workspace-strip');
  if(!strip)return;
  if(toggle.parentElement!==strip)strip.append(toggle);
  if(strip.nextElementSibling!==bar)strip.after(bar);
 }
 placeSearch();document.addEventListener('writing-view-changed',placeSearch);
 function openSearch(){bar.hidden=false;toggle.setAttribute('aria-expanded','true');search.focus();}
 function closeSearch(){setOpen(false);bar.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}
 function toggleSearch(){if(bar.hidden){openSearch();search.select();}else closeSearch();}
 toggle.onclick=toggleSearch;
 document.addEventListener('keydown',event=>{
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)toggleSearch();}
 },true);
 bar.addEventListener('keydown',event=>{if(event.key==='Escape'&&event.target===search)closeSearch();});

 // View switches are navigation, not filters.
 const views=document.createElement('div');views.className='actions';I18n.attribute(views,'aria-label',I18n.ui("Weergave",'Weergave'));for(const id of ['list-view','calendar-view']){const button=$(id);if(button&&original.contains(button))views.append(button);}if(views.children.length)target.before(views);
 const fields=()=>Object.keys(defaults).map($).filter(Boolean);
 function active(){return fields().filter(el=>el.type==='checkbox'?el.checked!==defaults[el.id]:el.value!==defaults[el.id]);}
 function refresh(){
  const selected=active(),terms=[];
  if(search.value.trim())terms.push(I18n.t('Zoeken:')+' '+search.value.trim());
  for(const el of selected){let name=el.labels?.[0]?.textContent.trim().split('\n')[0]||el.id;name=name.replace(el.textContent||'\0','').trim()||el.id;terms.push(el.tagName==='SELECT'?el.selectedOptions[0]?.textContent||el.value:name);}
  const nav=document.querySelector('#categories [aria-pressed=true],#filters [aria-pressed=true]');
  if(nav&&nav.dataset.category!=='Alles'&&nav.dataset.filter!=='Alles'){const name=nav.dataset.category||nav.dataset.filter||nav.textContent.trim();if(!terms.includes(name))terms.push(name);}
  if(tool==='Uren'&&$('period').value==='week')terms.push($('week-label').textContent);
  if(tool==='Kasboek'&&$('period').value!=='all')terms.push($( $('period').value==='month'?'month':'year').value);
  I18n.assign(toggle,(terms.length?I18n.ui("Zoeken · actief",'Zoeken · actief'):I18n.ui("Zoeken",'Zoeken')),"textContent");
  const text=terms.length?I18n.value(I18n.ui('Actief: {0}','Actief: '+terms.join(' · '))):'';
  if(state.textContent!==text)state.textContent=text;state.hidden=!terms.length;clear.hidden=!terms.length;
  const title='Filters'+(selected.length?' ('+selected.length+')':'');if(summary.textContent!==title)summary.textContent=title;
 }
 clear.onclick=()=>{
  search.value='';
  for(const el of fields()){if(el.type==='checkbox')el.checked=defaults[el.id];else el.value=defaults[el.id];}
  const all=document.querySelector('#categories [data-category="Alles"],#filters [data-filter="Alles"]');if(all)all.click();
  for(const el of fields())el.dispatchEvent(new Event('change',{bubbles:true}));
  search.dispatchEvent(new Event('input',{bubbles:true}));refresh();search.focus();
 };
 document.addEventListener('input',refresh);document.addEventListener('change',refresh);
 const observer=new MutationObserver(refresh);observer.observe(target,{childList:true,subtree:true});
 for(const id of ['categories','filters'])if($(id))observer.observe($(id),{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});
 const help=document.querySelector('.context-help');if(help){const p=document.createElement('p');I18n.assign(p,I18n.ui("Klik op Zoeken naast Bewaar alles of gebruik ⌘K / Ctrl+K. De zoekbalk opent direct onder de kop. Nogmaals ⌘K / Ctrl+K sluit hem. Een actieve zoekterm of filter blijft behouden en herkenbaar aan Zoeken · actief. In Schrijven zoekt het in Notities of de gekozen documenten. Open Filters voor extra keuzes. Actieve filters blijven zichtbaar; Wis filters toont de volledige lijst. Bewaar alles bewaart ook het werk dat door een filter verborgen is.",'Klik op Zoeken naast Bewaar alles of gebruik ⌘K / Ctrl+K. De zoekbalk opent direct onder de kop. Nogmaals ⌘K / Ctrl+K sluit hem. Een actieve zoekterm of filter blijft behouden en herkenbaar aan Zoeken · actief. In Schrijven zoekt het in Notities of de gekozen documenten. Open Filters voor extra keuzes. Actieve filters blijven zichtbaar; Wis filters toont de volledige lijst. Bewaar alles bewaart ook het werk dat door een filter verborgen is.'),"textContent");help.append(p);}
 if(tool==='Werkbank'&&help){
  const noteHelp=document.createElement('details');noteHelp.className='help-search';
  const title=document.createElement('summary'),copy=document.createElement('p');I18n.assign(title,I18n.ui('Notities','Notities'));
  I18n.assign(copy,I18n.ui('Een inval, een nieuwsbriefidee, een concept. Geef het hier een plek.','Een inval, een nieuwsbriefidee, een concept. Geef het hier een plek.'));
  noteHelp.append(title,copy);help.append(noteHelp);
 }
 refresh();
})();
