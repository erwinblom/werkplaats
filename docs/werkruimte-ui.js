'use strict';
(()=>{
 const script=document.currentScript,base=new URL('.',script.src),tool=document.querySelector('script[data-tool]')?.dataset.tool;
 const tools={Publicatieplanner:['Projecten','Start Publicatieplanner.html'],Bronnenkast:['Verzamelen','Start Bronnenkast.html'],Werkbank:['Schrijven','▶ Begin hier.html'],Projectbord:['Doen','Start Projectbord.html'],Contacten:['Contacten','Start Contacten.html'],Offerte:['Offreren','Start Offerte.html'],Uren:['Uren schrijven','Start Uren.html'],Ping:['Factureren','Start Ping.html'],Kasboek:['Boekhouden','Start Kasboek.html'],Abonnementen:['Abonnementen','Start Abonnementen.html']};
 const shortcutText=()=>window.MijnGereedschappen?.shortcutText()||'';
 const $=id=>document.getElementById(id);
 const mode=()=>window.GereedschapskistMode?.example?'voorbeeld':'eigen';
 function report(e){document.documentElement.removeAttribute('data-workspace-building');const message=$('wm-message');if(message)I18n.assign(message,I18n.ui("Dit onderdeel kon niet worden geladen. Vernieuw de pagina en probeer het opnieuw.",'Dit onderdeel kon niet worden geladen. Vernieuw de pagina en probeer het opnieuw.'),"textContent");console.error(e);}
 const helpSteps={
  Abonnementen:['Abonnementen','Voeg naam, bedrag, betaalperiode, verlenging en uiterste opzegdatum toe.','Open een abonnement om de gegevens te bekijken. Bewaar alles bewaart je overzicht in je werkmap.'],
  Werkbank:['Schrijven','Kies + Nieuw → Nieuw document, Brief, Artikel of Gespreksverslag. Geef het een naam en bewerk de starttekst.','Bewaar werkt het document bij op de getoonde opslagplek. Een los document gaat naar Schrijven in je werkmap. Bewaar alles bewaart daarnaast de hele Werkplaats.'],
  Ping:['Factureren','Kies Nieuwe factuur, vul klant en factuurregels in en controleer het voorbeeld.','Maak de factuur pas definitief nadat je alles hebt nagekeken. Bewaar alles legt je concepten en facturen vast.'],
  Projectbord:['Doen','Voeg een taak toe. Zet haar tijdens het werk van Te doen naar Bezig en Klaar.','Zoeken staat boven je taken. Sorteren en extra filters staan onder Filters. Bewaar alles legt ook je taken vast.'],
  Bronnenkast:['Verzamelen','Voeg een link, citaat of notitie toe. Geef bronnen een onderwerp om ze later terug te vinden.','Je kunt geselecteerde bronnen gebruiken voor een document in Schrijven. Bewaar alles legt je collectie vast.'],
  Uren:['Uren schrijven','Voeg je uren toe per klant en project. De lijst toont eerst alle datums.','Kies onder Periode een week als je alleen die week wilt zien. Bewaar alles legt je registraties vast.'],
  Contacten:['Contacten','Voeg een contact toe en noteer gesprekken of vervolgafspraken.','Dit is de adressenlijst voor Offreren en Factureren. Bewaar alles legt je contacten vast.'],
  Publicatieplanner:['Projecten','Start een tijdelijk of doorlopend project. Bekijk gekoppelde taken, documenten en bronnen.','Bij een project kun je taken maken in Doen. Bewaar alles legt je planning vast.'],
  Offerte:['Offreren','Maak een nieuwe offerte, vul het werk en de afspraken in en controleer het voorbeeld.','Pas de status aan wanneer de klant reageert. Bewaar alles legt je offertes vast.'],
  Kasboek:['Boekhouden','Voeg een inkomsten- of uitgavenboeking toe. Een betaalde factuur kun je overnemen.','Voeg zo nodig een bon toe. Bewaar alles legt je boekingen vast.']
 };
 let navigating=false;
 async function navigate(url){
  if(navigating)return;navigating=true;
  const switcher=$('tool-switcher');if(switcher)switcher.disabled=true;
  try{
   window.WerkplaatsOvergangen?.leave();
   await BewaarAlles.flush();
   window.GereedschapskistNavigating=true;
   const destination=GereedschapskistKeuze.url(url,mode());if(destination.pathname===new URL('Begin hier.html',base).pathname)destination.searchParams.set('home','1');
   location.assign(destination.href);
   setTimeout(()=>window.GereedschapskistNavigating=false,1000);
  }catch(e){
   window.WerkplaatsOvergangen?.reset();
   window.GereedschapskistNavigating=false;
   if(switcher)switcher.value=['Uren','Offerte'].includes(tool)?'Ping':tool;
   const message=$('wm-message');
   if(message)I18n.assign(message,I18n.ui("Niet overgestapt: {0}. Je huidige werk blijft open.",'Niet overgestapt: '+e.message+'. Je huidige werk blijft open.'),"textContent");
   console.error(e);
  }finally{navigating=false;if(switcher)switcher.disabled=false;}
 }
 // One keyboard route for all tools; dialog cancel events retain existing draft guards.
 function installShortcuts(){
  const create=tool==='Werkbank'?$('newMenu')?.querySelector('summary'):$('new');
  if(create){I18n.assign(create,I18n.ui("Nieuw (⌥N / Alt+N)",'Nieuw (⌥N / Alt+N)'),"title");create.setAttribute('aria-keyshortcuts','Alt+N');}
  const save=$('wm-backup');
  if(save){I18n.assign(save,I18n.ui("Bewaar alles (⌘S / Ctrl+S)",'Bewaar alles (⌘S / Ctrl+S)'),"title");save.setAttribute('aria-keyshortcuts','Meta+S Control+S');}
  const visible=el=>el&&!el.hidden&&el.getClientRects().length>0;
  document.addEventListener('keydown',event=>{
   if(event.isComposing)return;
   if(event.altKey&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&/^Digit[0-9]$/.test(event.code)){
    const editing=event.composedPath?.().some(el=>el?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName))||document.activeElement?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
    const nav=$('tool-switcher');
    if(editing||document.querySelector('dialog[open]')||!nav||nav.disabled)return;
    if(event.code==='Digit0'){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)navigate(GereedschapskistKeuze.url(new URL('Begin hier.html',base)).href);return;}
    const entry=window.MijnGereedschappen?.shortcut(Number(event.code.slice(-1)));if(!entry)return;
    const option=[...nav.options].find(o=>o.value===entry[0]);if(!option)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(!event.repeat&&nav.value!==option.value){nav.value=option.value;nav.dispatchEvent(new Event('change',{bubbles:true}));}
    return;
   }

   if(event.altKey&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&event.code==='KeyN'){
    event.preventDefault();event.stopImmediatePropagation();
    const currentCreate=tool==='Werkbank'&&document.body.classList.contains('writing-notes')?$('note-new'):create;
    if(event.repeat||document.querySelector('dialog[open]')||!visible(currentCreate)||currentCreate.disabled)return;
    if(currentCreate!==create){currentCreate.click();return;}
    if(tool==='Werkbank'){$('newMenu').open=true;create.focus();}else create.click();
    return;
   }
   if((event.metaKey||event.ctrlKey)&&!event.altKey&&!event.shiftKey&&event.key.toLowerCase()==='s'){
    event.preventDefault();event.stopImmediatePropagation();
    if(!event.repeat&&visible(save)&&!save.disabled)save.click();
    return;
   }
   if(event.key!=='Escape')return;
   // Do not let a second handler cancel the writing editor underneath a panel.
   event.preventDefault();event.stopImmediatePropagation();
   if(event.repeat)return;
   const dialogs=[...document.querySelectorAll('dialog[open]')].filter(visible);
   const dialog=dialogs.find(el=>el.contains(document.activeElement))||dialogs.at(-1);
   const menus=[...document.querySelectorAll('details[open]')].filter(el=>visible(el)&&el.id!=='werkmap'&&(!dialog||dialog.contains(el)));
   const focused=menus.filter(el=>el.contains(document.activeElement)).at(-1);
   const menu=focused||menus.filter(el=>el.matches('.context-actions,.workspace-management,.workspace-more-management,.sidebar-menu')).at(-1);
   if(menu){menu.open=false;menu.querySelector('summary')?.focus();return;}
   if(dialog){if(dialog.dispatchEvent(new Event('cancel',{cancelable:true})))dialog.close();return;}
   const filters=$('suite-filter-panel');
   if(visible(filters)){document.querySelector('.suite-filter-toggle')?.click();document.querySelector('.suite-filter-toggle')?.focus();return;}
   const search=$('suite-search-bar');
   if(visible(search)){$('suite-search-toggle')?.click();return;}
   if(visible($('workspace-help'))){$('workspace-help-toggle')?.click();$('workspace-help-toggle')?.focus();return;}
   const palette=$('searchPaletteOverlay');
   if(palette?.classList.contains('visible')&&typeof closeSearchPalette==='function')closeSearchPalette();
  },true);
 }
 // Closed details have no layout boxes; inspect action styles instead.
 function applyDetailHeaders(){
  for(const dialog of document.querySelectorAll('#source-detail,#task-view,#plan-overview,#subscription-detail,#entry-view,#entry-detail,.note-dialog:has(.note-full-text)')){
   if(dialog.querySelector(':scope > .wp-detail-heading'))continue;
   const title=dialog.querySelector('h2');
   const close=[...dialog.querySelectorAll('button')].find(button=>button.hasAttribute('data-close')||button.querySelector('[data-i18n="Sluit"]')||button.textContent.trim()===I18n.t('Sluit'));
   if(!title||!close)continue;
   const heading=document.createElement('div');heading.className='wp-detail-heading';
   I18n.assign(close,I18n.ui('Sluit','Sluit'),'textContent');close.classList.add('wp-detail-close');
   heading.append(title,close);dialog.prepend(heading);
  }
 }
 function applySharedRoles(){
  applyDetailHeaders();
  const roles={
   'tool-title':'.brand .tool-name',
   'page-title':'#cash-panel>.section-head h2,.invoice-home-heading h2,.subscriptions-heading h1,.heading h1,.work-actions h1,.suite-collection-heading h1,.notes-heading h1',
   'control':'.suite-navigation button,.suite-navigation summary,.suite-navigation select,.tool-select-label,.suite-back,.workspace-strip button,.suite-tool-actions button,.suite-tool-actions summary,.work-actions>.actions>button,.work-actions>.actions>details>summary,.context-actions>summary,.context-actions-panel button,.context-actions-panel a,.sidebar-menu>summary,.writing-views button,.factureren-tabs a,.ledger-nav button,.ledger-nav a,.factureren-detail-head button,.view-switch button,body[data-tool=Contacten] #filters button',
   'item-title':'.source-open strong,.task-title,.note-card h2,.pub-title,body[data-tool=Contacten] #cards h2,body[data-tool=Contacten] .record-open,.subscription-row strong,.factureren-row-main>strong,.entry-main>strong'
  };
  for(const [role,selector]of Object.entries(roles))for(const el of document.querySelectorAll(selector))if(el.dataset.wpType!==role)el.dataset.wpType=role;
 }
 function refreshMoreMenus(){
  applySharedRoles();
  for(const menu of document.querySelectorAll('details')){
   const summary=menu.querySelector(':scope > summary');
   if(!menu.matches('.context-actions,.file-more')&&summary?.textContent.trim()!=='Meer')continue;
   const available=[...menu.querySelectorAll('button,a[href],input,select,textarea,[role="menuitem"]')].some(action=>{
    if(summary.contains(action))return false;
    for(let node=action;node&&node!==menu;node=node.parentElement){
     if(node.hidden||node.getAttribute('aria-hidden')==='true')return false;
     const style=getComputedStyle(node);
     if(style.display==='none'||style.visibility==='collapse'||(style.visibility==='hidden'&&!document.documentElement.hasAttribute('data-workspace-building')))return false;
    }
    return true;
   });
   if(menu.hidden===available)menu.hidden=!available;
   if(!available&&menu.open)menu.open=false;
  }
 }
 function applyHomeLayout(){
  const newLabels={Bronnenkast:'+ Nieuwe bron',Publicatieplanner:'+ Nieuw project',Contacten:'+ Nieuw contact',Abonnementen:'+ Nieuw abonnement',Kasboek:'+ Nieuwe boeking'};
  if(newLabels[tool]&&$('new'))I18n.assign($('new'),I18n.ui(newLabels[tool],newLabels[tool]),'textContent');
  const more=document.querySelector('#subscription-more>.context-actions-panel,#cash-panel .suite-tool-actions>.context-actions .context-actions-panel,.invoice-list-actions>.context-actions .context-actions-panel,main .suite-tool-actions>.context-actions .context-actions-panel');
  const settings=document.querySelector('#settings-advanced')||document.querySelector('.workspace-more-management')||$('werkmap');
  const help=$('workspace-help');
  const importFile=$('open');if(tool!=='Werkbank'&&importFile&&more)more.append(importFile);
  // Shared: retain the explanation, but put it with storage rather than the work.
  // Live save messages stay next to the work; general help stays in Settings.
  for(const undo of [$('undo'),$('sources-document')].filter(Boolean)){const sync=()=>{if(undo.hidden!==undo.disabled)undo.hidden=undo.disabled;};sync();new MutationObserver(sync).observe(undo,{attributes:true,attributeFilter:['disabled']});}
  if(tool==='Ping'){
   const title=document.querySelector('.layout>.sidebar>h2'),actions=document.querySelector('.invoice-list-actions');if(title&&actions){I18n.assign(title,I18n.ui('Je facturen','Je facturen'),'textContent');const heading=document.createElement('div');heading.className='invoice-home-heading suite-collection-heading';title.before(heading);heading.append(title,actions);actions.classList.add('suite-tool-actions');}
   const add=$('new'),quote=$('take-quote');
   if(add&&quote){const menu=document.createElement('details');menu.className='context-actions home-new';menu.id='invoice-new-menu';const summary=document.createElement('summary');I18n.assign(summary,I18n.ui('+ Nieuwe factuur','+ Nieuwe factuur'),'textContent');const panel=document.createElement('div');panel.className='context-actions-panel';add.before(menu);menu.append(summary,panel);panel.append(add,quote);panel.addEventListener('click',e=>{if(e.target.closest('button'))menu.open=false;});}
   const editor=document.querySelector('.factureren-detail .editor');
   if(editor){const controls=['invoice-duplicate','invoice-delete','invoice-credit'].map($).filter(Boolean);if(controls.length){const menu=document.createElement('details');menu.className='context-actions invoice-more';const summary=document.createElement('summary');I18n.assign(summary,I18n.ui('Meer','Meer'),'textContent');const panel=document.createElement('div');panel.className='context-actions-panel';controls[0].before(menu);menu.append(summary,panel);panel.append(...controls);}}
  }
  if(tool==='Abonnementen'){
   const heading=document.querySelector('.subscriptions-heading');heading?.classList.add('suite-collection-heading');
   const actions=heading?.querySelector('.suite-tool-actions');actions?.classList.add('suite-tool-actions');
  }
  if(tool==='Werkbank'){
   const folder=$('folderMenu');if(folder)I18n.assign(folder.querySelector('summary'),I18n.ui('Meer','Meer'),'textContent');
   const clear=document.querySelector('.manage-clear');if(clear&&settings)settings.append(clear);
   const theme=document.querySelector('button[onclick="toggleTheme()"]');if(theme){const section=document.querySelector('#settings-appearance')?.parentElement;if(section)section.append(theme);else if(settings){theme.id='writing-theme-settings';settings.append(theme);}}
  }
  if(tool==='Kasboek'){
   if(more&&$('take-invoice'))more.append($('take-invoice'));
   const nav=document.querySelector('.ledger-nav');
   if(more&&nav){for(const button of nav.querySelectorAll('[data-ledger-panel="categories"],[data-ledger-panel="invoices"]'))more.append(button);}
   const toolbar=document.querySelector('.suite-filter-panel .toolbar'),period=$('period');
   if(toolbar&&period){const group=document.createElement('div');group.className='home-period';group.setAttribute('role','group');I18n.attribute(group,'aria-label',I18n.ui('Periode','Periode'));for(const el of [period.closest('label'),$('month-wrap'),$('year-wrap')])if(el)group.append(el);document.querySelector('.ledger-nav')?.before(group);}
   // The visible type buttons already implement the same choice; keep one UI.
   const type=$('type-filter');if(type)type.closest('label').hidden=true;
  }
  if(tool==='Projectbord'){
   const archive=$('archive');if(archive&&more)more.append(archive);
   const blank=$('blank');if(blank&&settings)settings.append(blank);
  }
  if(tool==='Contacten'){
   const filters=$('filters'),panel=document.querySelector('.suite-filter-panel');if(filters&&panel)panel.append(filters);
   const views=document.querySelector('.view-switch');if(views&&more)more.append(views);
   if(filters){const attention=document.createElement('button');attention.type='button';attention.className='home-attention';filters.parentElement===panel&&document.querySelector('#count')?.before(attention);
    const sync=()=>{const original=filters.querySelector('[data-filter="Aandacht nodig"]');if(!original)return;const count=Number(original.textContent.match(/\d+\s*$/)?.[0]||0);attention.hidden=!count;const text=original.textContent;if(attention.textContent!==text)attention.textContent=text;attention.setAttribute('aria-pressed',original.getAttribute('aria-pressed')||'false');};
    attention.onclick=()=>filters.querySelector('[data-filter="Aandacht nodig"]')?.click();sync();new MutationObserver(sync).observe(filters,{childList:true,subtree:true,characterData:true});}
  }
 }

 async function mount(){
  await Werkmap.ready;await Werkmap.suiteReady;
  const myTools=await MijnGereedschappenReady;await myTools.ready;let filtersReady=Promise.resolve();
  // Werkmap mounts after its asynchronous permission settings lookup.
  if(!$('werkmap'))await new Promise(resolve=>{const m=new MutationObserver(()=>{if($('werkmap')){m.disconnect();resolve();}});m.observe(document.body,{childList:true,subtree:true});});
  if(tool&&!document.querySelector('.workspace-strip #workspace-help-toggle'))await new Promise(resolve=>{
   const observer=new MutationObserver(()=>{if(document.querySelector('.workspace-strip #workspace-help-toggle')){observer.disconnect();resolve();}});
   observer.observe(document.body,{childList:true,subtree:true});
  });
  if(!document.querySelector('link[href*="werkruimte-ui.css"]')){const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('werkruimte-ui.css?v=20261008-beginners-1',base);document.head.append(style);}
  const map=$('werkmap');map.open=false;
   document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||a.target||e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;const url=new URL(a.href,location.href);if(url.href.startsWith(base.href)&&url.pathname.endsWith('.html')){e.preventDefault();navigate(url.href);}},true);
  if(tool){
   document.body.dataset.tool=tool;
   installShortcuts();
   const nav=document.createElement('select');nav.id='tool-switcher';I18n.attribute(nav,'aria-label',I18n.ui("Wissel van tool",'Wissel van tool'));
   const shortcutPrefix=/Mac|iPhone|iPad/.test(navigator.platform)?'⌥':'Alt+';
   function updateNavigation(){
    nav.replaceChildren(...myTools.entries().map(([id,[name]],index)=>new Option(shortcutPrefix+(index+1)+'  '+name,id)));
    const active=['Uren','Offerte'].includes(tool)?'Ping':tool;
    if(![...nav.options].some(o=>o.value===active))nav.add(I18n.mark(new Option((['Uren','Offerte'].includes(tool)?'Factureren':tools[tool][0])+' (verborgen)',active),"{0} (verborgen)"));
    nav.value=active;I18n.assign(nav,I18n.ui("Wissel van gereedschap met {0}1 t/m {1}{2}",'Wissel van gereedschap met '+shortcutPrefix+'1 t/m '+shortcutPrefix+myTools.entries().length),"title");
    for(const p of document.querySelectorAll('.help-tool-shortcuts'))p.textContent=shortcutText();
   }
   updateNavigation();document.addEventListener('gereedschappen-gewijzigd',updateNavigation);
   nav.onchange=()=>{if(nav.value==='Zoeken'){myTools.search();nav.value=['Uren','Offerte'].includes(tool)?'Ping':tool;return;}navigate(myTools.toolURL(nav.value));};
   const header=document.querySelector('.brandbar,body>header');
   const navigation=document.createElement('div');navigation.className='suite-navigation';
   const back=header.querySelector('.suite-meta');
   const homeLink=back?.querySelector('.suite-back');
   if(homeLink){
    const logo=document.createElement('img');
    logo.className='suite-home-logo';logo.src=new URL('Symbolen/gereedschapskist.svg',base).href;logo.alt='';logo.setAttribute('aria-hidden','true');
    homeLink.replaceChildren(logo,document.createTextNode(window.WerkplaatsUiterlijk?.name()||'Werkplaats'));
   }
   if(back)navigation.append(back);
   const toolControl=document.createElement('span');toolControl.className='tool-select-control';
   const toolLabel=document.createElement('span');toolLabel.className='tool-select-label';I18n.assign(toolLabel,(['Uren','Offerte'].includes(tool)?I18n.ui("Factureren",'Factureren'):(tool==='Contacten'?I18n.ui("Contacten",'Contacten'):I18n.ui(tools[tool][0],tools[tool][0]))),"textContent");toolLabel.setAttribute('aria-hidden','true');
   toolControl.append(nav,toolLabel);navigation.append(toolControl);header.append(navigation);
   if(tool==='Abonnementen'){const heading=document.querySelector('.subscriptions-heading');const menu=$('subscription-more');if(heading&&menu){const actions=document.createElement('div');actions.className='suite-tool-actions';actions.append($('new'),menu);heading.append(actions);const panel=document.createElement('div');panel.className='context-actions-panel';for(const child of [...menu.children])if(child.tagName!=='SUMMARY')panel.append(child);menu.append(panel);}}
   const saveId=tool==='Werkbank'?'loose-save':tool==='Ping'?'save':'export';const save=$(saveId);
   if(save&&!['Werkbank','Abonnementen'].includes(tool)){save.hidden=true;save.setAttribute('aria-hidden','true');}
   const open=tool==='Werkbank'?null:$('open');if(open){I18n.assign(open,tool==='Abonnementen'?I18n.ui('Abonnementenbestand openen (vervangen)','Abonnementenbestand openen (vervangen)'):I18n.ui('Importeer bestand','Importeer bestand'),'textContent');map.querySelector('.wm-actions').append(open);}
   const helpPanel=$('workspace-help'),helpToggle=$('workspace-help-toggle');
   // Keep the existing controls and handlers, but place them beside their subject.
   const strip=document.querySelector('.workspace-strip');
   const mapMenu=document.createElement('details');mapMenu.className='workspace-management';mapMenu.hidden=true;
   const mapTitle=document.createElement('summary');I18n.assign(mapTitle,I18n.ui("Werkmap",'Werkmap'),"textContent");mapMenu.append(mapTitle,map);
   // The save button can still be inside the workmap while shared chrome mounts.
   const saveAll=$('wm-backup');
   if(saveAll){strip.insertBefore(saveAll,helpToggle);saveAll.hidden=!!GereedschapskistMode.example;}
   strip.insertBefore(mapMenu,saveAll||helpToggle);map.open=true;
   function actionMenu(parent,label){
    if(!parent)return null;
    const menu=document.createElement('details');menu.className='context-actions';menu.hidden=true;
    const title=document.createElement('summary');I18n.assign(title,I18n.ui(label,label));
    const actions=document.createElement('div');actions.className='context-actions-panel';
    menu.append(title,actions);parent.append(menu);return {menu,actions};
   }
   const collectionMenu=actionMenu(['Werkbank','Abonnementen'].includes(tool)?null:document.querySelector('main > .work-actions, main > .heading, main > .intro, aside.sidebar, .workspace > .sidebar'),'Meer');
   let documentHeading=document.querySelector('.editor-head');
   if(tool==='Ping'){
    const title=document.querySelector('.editor > h2');
    if(title){documentHeading=document.createElement('div');documentHeading.className='document-heading';title.before(documentHeading);documentHeading.append(title);}
   }
   const documentMenu=null;
   if(tool==='Ping'&&collectionMenu){
    const sidebar=document.querySelector('aside.sidebar');
    if(sidebar){const actions=document.createElement('div');actions.className='invoice-list-actions';
     sidebar.querySelector('h2').after(actions);actions.append($('new'),collectionMenu.menu);
    }
   }
   if(tool==='Projectbord'&&collectionMenu){
    const heading=document.querySelector('main > .heading');
    const actions=heading?.querySelector('.actions');if(actions){actions.classList.add('suite-tool-actions');actions.append(collectionMenu.menu);}
   }

   if(['Bronnenkast','Uren','Contacten','Publicatieplanner','Offerte','Kasboek'].includes(tool)&&collectionMenu){
    const heading=document.querySelector('main > .work-actions');
    let destination=heading;
    if(tool==='Offerte')destination=document.querySelector('.workspace > .sidebar');
    else if(tool==='Uren')destination=document.querySelector('main > .section-head');
    else if(tool==='Kasboek')destination=document.querySelector('#cash-panel > .section-head');
    if(destination){
     const actions=document.createElement('div');actions.className='suite-tool-actions';
     actions.setAttribute('role','group');I18n.attribute(actions,'aria-label',I18n.ui('Acties voor '+tools[tool][0],'Acties voor '+tools[tool][0]));
     if(tool==='Offerte')destination.querySelector('h2').after(actions);else destination.append(actions);
     // Move the original buttons, preserving their handlers and selection state.
     const newButton=$('new');if(newButton)actions.append(newButton);
     if(heading){for(const group of heading.querySelectorAll(':scope > .actions,:scope > .link-actions')){
      for(const child of [...group.children])actions.append(child);
      group.remove();
     }}
     const undo=$('undo');if(undo)(tool==='Bronnenkast'?collectionMenu.actions:actions).append(undo);
     actions.append(collectionMenu.menu);
     if(destination===heading){
      heading.classList.add('suite-collection-heading');
      if(!heading.querySelector('h1')){const title=document.createElement('h1');I18n.assign(title,(tool==='Contacten'?I18n.ui("Contacten",'Contacten'):I18n.ui("Projecten",'Projecten')),"textContent");heading.prepend(title);}
     }else if(heading)heading.hidden=true;
    }
    if(tool==='Bronnenkast'){const title=[...document.querySelectorAll('.sidebar h2')].find(el=>el.textContent===I18n.t('Bewaar'));if(title)title.hidden=true;}
    if(tool==='Offerte'&&documentMenu){const title=document.querySelector('.editor-head');if(title)title.append(documentMenu.menu);}
   }
   for(const menu of [mapMenu,collectionMenu?.menu,documentMenu?.menu].filter(Boolean)){
    menu.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();menu.open=false;menu.querySelector('summary').focus();}});
   }
   const exportButton=$('wm-copy');if(exportButton&&collectionMenu)collectionMenu.actions.append(exportButton);
   if(tool==='Kasboek'&&collectionMenu){const exports=$('export-menu');if(exports)collectionMenu.actions.append(exports);}
   const csvLabels=I18n.labels({Ping:'Exporteer factuuroverzicht (CSV)',Uren:'Exporteer geselecteerde uren (CSV)',Kasboek:'Exporteer zichtbare posten (CSV)'});
   const csv=$('export-csv')||$('csv');if(csv&&csvLabels[tool])csv.textContent=csvLabels[tool];
   // The writing export belongs to the current document, whose header is rerendered.
   const exportParking=document.createElement('div');exportParking.hidden=true;
   if(tool==='Werkbank'&&exportButton){map.append(exportParking);exportParking.append(exportButton);}

   // Keep contextual menus inside the viewport, including the last card or row.
   function positionActionMenu(menu){
    const panel=menu.querySelector(':scope > .context-actions-panel,:scope > .file-more-panel,:scope > .sidebar-menu-panel');
    if(!panel)return;
    if(!menu.open){panel.classList.remove('viewport-menu');panel.removeAttribute('style');return;}
    const anchor=menu.querySelector('summary').getBoundingClientRect();
    panel.classList.add('viewport-menu');
    panel.style.maxWidth=Math.max(0,innerWidth-24)+'px';
    const below=innerHeight-anchor.bottom-12,above=anchor.top-12;
    const up=panel.scrollHeight>below&&above>below;
    panel.style.maxHeight=Math.max(0,up?above:below)+'px';
    const bounds=panel.getBoundingClientRect();
    panel.style.left=Math.max(12,Math.min(anchor.left,innerWidth-bounds.width-12))+'px';
    panel.style.top=(up?Math.max(12,anchor.top-bounds.height):anchor.bottom)+'px';
   }
   document.addEventListener('toggle',event=>{
    if(event.target.matches?.('.context-actions,.file-more,.sidebar-menu'))positionActionMenu(event.target);
   },true);
   const repositionMenus=()=>document.querySelectorAll('details[open].context-actions,details[open].file-more,details[open].sidebar-menu').forEach(positionActionMenu);
   window.addEventListener('resize',repositionMenus);
   document.addEventListener('scroll',event=>{if(!event.target.closest?.('.viewport-menu'))repositionMenus();},true);
   const notice=$('wm-message'),fileStatus=$('file-status');
   if(notice&&fileStatus){
    const storageStatus=document.createElement('div');storageStatus.className='workspace-storage-status';
    fileStatus.before(storageStatus);storageStatus.append(fileStatus);
    const detail=document.createElement('details');detail.className='storage-details';
    const summary=document.createElement('summary');I18n.assign(summary,I18n.ui('Bewaarstatus','Bewaarstatus'));
    detail.append(summary,notice);storageStatus.append(detail);
    const refreshNotice=()=>{
     const text=notice.textContent;
     const success=/^(?:All saved(?:[ .]|$)|(?:Work|Workspace) folder(?: .+)? opened|Saved to |Export saved to |Werkmap(?: .+)? geopend\.|Opgeslagen in |Export opgeslagen in |Export bewaard: |Export saved: |Alles bewaard(?:[ .]|$)|Je werk en conceptinvoer zijn opgenomen in Bewaar alles\.|Je eigen werk en eventuele conceptinvoer zijn hersteld uit deze browser\.)/.test(text);
     const opened=/^(?:Werkmap(?: .+)? geopend|Je eigen werk en eventuele conceptinvoer zijn hersteld|Je werk en conceptinvoer zijn opgenomen|(?:Work|Workspace) folder(?: .+)? opened|Your work and)/.test(text);
     detail.hidden=!text||opened;detail.open=!!text&&!success&&!opened;
     notice.classList.toggle('save-success',success);
    };
    new MutationObserver(refreshNotice).observe(notice,{childList:true,characterData:true,subtree:true});refreshNotice();
   }

   if(helpToggle)I18n.assign(helpToggle,I18n.ui("Hulp",'Hulp'),"textContent");
   if(helpPanel){const [name,first,second]=helpSteps[tool];const guide=document.createElement('div');guide.className='context-help';const title=document.createElement('h2');I18n.assign(title,I18n.ui('Hulp bij '+name,'Hulp bij '+name),"textContent");const steps=document.createElement('ol');for(const step of [first,second]){const item=document.createElement('li');I18n.assign(item,I18n.ui(step,step));steps.append(item);}guide.append(title,steps);const shortcuts=document.createElement('p');I18n.assign(shortcuts,I18n.ui("⌘S / Ctrl+S: Bewaar alles, ook tijdens invoeren. ⌥N / Alt+N: nieuw item (in Schrijven: document of map). Sluit eerst een geopend invoervenster. Esc: sluit het bovenste menu of venster. Onvoltooide invoer blijft beschermd; Esc annuleert de tekstbewerking in Schrijven niet.",'⌘S / Ctrl+S: Bewaar alles, ook tijdens invoeren. ⌥N / Alt+N: nieuw item (in Schrijven: document of map). Sluit eerst een geopend invoervenster. Esc: sluit het bovenste menu of venster. Onvoltooide invoer blijft beschermd; Esc annuleert de tekstbewerking in Schrijven niet.'),"textContent");guide.append(shortcuts);helpPanel.prepend(guide);}
   const restoreActions=['take-hours','take-tasks','hours-resend','hours-receipt','hours-task','take-receipt','take-quote'];
   const advanced=document.createElement('details');advanced.className='legacy-imports';const title=document.createElement('summary');I18n.assign(title,I18n.ui("Los bestand importeren of eerdere overdracht herstellen",'Los bestand importeren of eerdere overdracht herstellen'),"textContent");advanced.append(title);
   for(const id of restoreActions){const b=$(id);if(b)advanced.append(b);}
   if(advanced.children.length>1)map.append(advanced);
   const help=document.querySelector('.save-help-body');if(help)help.innerHTML=tool==='Werkbank'?"<p><strong><span data-i18n=\"Bewaar\">Bewaar</span></strong> <span data-i18n=\"slaat het geopende document op als Markdown-bestand in Schrijven in je werkmap. Een document uit een andere geopende map wordt in die eigen map bijgewerkt.\">slaat het geopende document op als Markdown-bestand in Schrijven in je werkmap. Een document uit een andere geopende map wordt in die eigen map bijgewerkt.</span></p><p><strong><span data-i18n=\"Bewaar alles\">Bewaar alles</span></strong> <span data-i18n=\"bewaart daarnaast de hele Werkplaats, inclusief je nog niet afgeronde tekst. Kies bij een volgende sessie Open werkmap om je werk terug te halen.\">bewaart daarnaast de hele Werkplaats, inclusief je nog niet afgeronde tekst. Kies bij een volgende sessie Open werkmap om je werk terug te halen.</span></p><p><span data-i18n=\"Download back-up maakt een extra kopie van de laatst bewaarde werkmap.\">Download back-up maakt een extra kopie van de laatst bewaarde werkmap.</span></p>":"<p><strong><span data-i18n=\"Bewaar alles\">Bewaar alles</span></strong> <span data-i18n=\"bewaart je werk en concepten uit de hele Werkplaats in je werkmap. Kies de eerste keer een map en geef toestemming.\">bewaart je werk en concepten uit de hele Werkplaats in je werkmap. Kies de eerste keer een map en geef toestemming.</span></p><p><span data-i18n=\"Volgende keer kies je\">Volgende keer kies je</span> <strong><span data-i18n=\"Open werkmap\">Open werkmap</span></strong><span data-i18n=\". Je hoeft geen losse gegevensbestanden te zoeken. Je browser kan opnieuw om toegang tot de map vragen.\">. Je hoeft geen losse gegevensbestanden te zoeken. Je browser kan opnieuw om toegang tot de map vragen.</span></p><p><strong><span data-i18n=\"Toevoegen\">Toevoegen</span></strong> <span data-i18n=\"en\">en</span> <strong><span data-i18n=\"Bewaar\">Bewaar</span></strong> <span data-i18n=\"verwerken je invoer in de tool. Gebruik daarna Bewaar alles. Een definitieve factuur maak je apart; bewaren maakt niets definitief.\">verwerken je invoer in de tool. Gebruik daarna Bewaar alles. Een definitieve factuur maak je apart; bewaren maakt niets definitief.</span></p><p><span data-i18n=\"Meer bij de verzameling bevat de export van deze tool. CSV is beschikbaar bij lijsten die dit ondersteunen; PDF bij facturen en offertes. Download back-up kopieert de laatst bewaarde werkmap. Externe schrijfmappen en nog niet ontvangen links uit de extensie vallen buiten Bewaar alles.\">Meer bij de verzameling bevat de export van deze tool. CSV is beschikbaar bij lijsten die dit ondersteunen; PDF bij facturen en offertes. Download back-up kopieert de laatst bewaarde werkmap. Externe schrijfmappen en nog niet ontvangen links uit de extensie vallen buiten Bewaar alles.</span></p>";
   const editHelp={
    Werkbank:'Selecteer een document en kies Bewerk. Gebruik Documentacties bij het document voor bestandsacties en Koppelingen. Daar kun je bronnen, een taak en een project verbinden. Het projectoverzicht in Projecten toont gekoppelde bronnen en documenten.',
    Ping:'Selecteer een conceptfactuur en wijzig de gegevens. Controleer het voorbeeld voordat je de factuur definitief maakt. Bewaar alles maakt een factuur niet definitief.',
    Projectbord:'Klik op de titel van een taak om haar te wijzigen. Meer bij het bord bevat naam wijzigen en export.',
    Bronnenkast:'Klik op een bronkaart voor samenvatting, notities en koppelingen. Kies daar Bewerk om de bron te wijzigen. Meer bij de collectie bevat naam wijzigen en export. Importeer links haalt links uit de extensie op.',
    Uren:'Kies Bewerk bij een registratie om haar te wijzigen. Meer bij Registraties bevat de export; CSV volgt de gekozen selectie.',
    Contacten:'Kies Bewerk bij een contact om gegevens te wijzigen. Meer bij Contacten bevat de export.',
    Publicatieplanner:'Klik op een project voor het overzicht met de gekoppelde taken. Kies daar Bewerk om het te wijzigen. Meer bij Projecten bevat de export.',
    Offerte:'Selecteer een offerte, wijzig de gegevens en kies Bewaar. Meer bij Je offertes bevat export; Je vaste bedrijfsgegevens wijzig je via Instellingen → Mijn gegevens.',
    Kasboek:'Kies Bewerk bij een boeking om haar te wijzigen. Meer bij Boekingen bevat de export; CSV volgt de gekozen selectie.'
   };
   if(helpPanel){const note=document.createElement('p');note.textContent=editHelp[tool];helpPanel.querySelector('.context-help').append(note);}
   const projectHelp={
    Werkbank:'Map betekent hier een map op je computer. Met de pijlen wissel je tussen geopende mappen en Alle bestanden. Deze mapkeuze staat los van projecten in Projecten en Doen.',
    Publicatieplanner:'Een project is hier een gepland stuk werk. Je kunt er taken, documenten en bronnen aan koppelen; het maakt geen computermap aan.',
    Projectbord:'Kies bij Project een project uit Projecten, of Geen project. Bestaande projectnamen blijven beschikbaar. Open Projecten om een project toe te voegen. De koppeling blijft behouden bij hernoemen. Een project is geen computermap; de bordnaam is de naam van je takenoverzicht.',
    Uren:'Project geeft aan voor welk werk je uren registreert, bijvoorbeeld Website of Administratie. Het is geen computermap.'
   };
   if(helpPanel&&projectHelp[tool]){const explanation=document.createElement('p');I18n.assign(explanation,I18n.ui(projectHelp[tool],projectHelp[tool]));helpPanel.querySelector('.context-help').append(explanation);}

   // Recovery and reset are management actions, not explanatory help.
   const maintenance=document.createElement('details');maintenance.className='legacy-imports';
   const maintenanceTitle=document.createElement('summary');I18n.assign(maintenanceTitle,I18n.ui("Herstel en opnieuw beginnen",'Herstel en opnieuw beginnen'),"textContent");maintenance.append(maintenanceTitle);
   for(const id of ['restore','empty','reset','example','demo']){const button=$(id);if(button)maintenance.append(button);}
   if(maintenance.children.length>1)map.append(maintenance);
   const moreManagement=document.createElement('details');moreManagement.className='workspace-more-management';
   const moreTitle=document.createElement('summary');I18n.assign(moreTitle,I18n.ui("Meer beheer",'Meer beheer'),"textContent");moreManagement.append(moreTitle);
   const primaryActions=map.querySelector('.wm-actions');
   const newWorkspace=document.createElement('button');newWorkspace.type='button';newWorkspace.id='wm-new';I18n.assign(newWorkspace,I18n.ui("Nieuwe werkmap maken",'Nieuwe werkmap maken'),"textContent");
   newWorkspace.disabled=!!GereedschapskistMode.example||!('showDirectoryPicker' in window);
   newWorkspace.onclick=async()=>{newWorkspace.disabled=true;try{await Werkmap.startNew();}catch(e){report(e);}finally{newWorkspace.disabled=!!GereedschapskistMode.example||!('showDirectoryPicker' in window);}};
   primaryActions.append(newWorkspace);
   if(!GereedschapskistMode.example&&window.BewaarAlles){
    const organization=document.createElement('button');organization.type='button';organization.id='wm-organization';I18n.assign(organization,I18n.ui("Mijn organisatie",'Mijn organisatie'),"textContent");primaryActions.append(organization);
    const dialog=document.createElement('dialog');dialog.id='wm-organization-dialog';dialog.setAttribute('aria-labelledby','wm-organization-title');
    const form=document.createElement('form');form.method='dialog';
    const title=document.createElement('h2');title.id='wm-organization-title';I18n.assign(title,I18n.ui("Mijn organisatie",'Mijn organisatie'),"textContent");
    const intro=document.createElement('p');I18n.assign(intro,I18n.ui("Deze gegevens verschijnen automatisch op nieuwe offertes en conceptfacturen. Bestaande documenten behouden hun eigen gegevens.",'Deze gegevens verschijnen automatisch op nieuwe offertes en conceptfacturen. Bestaande documenten behouden hun eigen gegevens.'),"textContent");
    const fields=[['name','Bedrijfsnaam',200],['address','Adres',2000],['email','E-mail',254],['iban','IBAN',80],['kvk','KvK-nummer',100],['vat','Btw-id',100]];
    const inputs={};form.append(title,intro);
    for(const [key,labelText,max] of fields){const label=document.createElement('label');I18n.assign(label,I18n.ui(labelText,labelText));const input=document.createElement(key==='address'?'textarea':'input');input.name=key;input.maxLength=max;if(key==='email')input.type='email';if(key==='name')input.required=true;if(key==='address')input.rows=3;label.append(input);form.append(label);inputs[key]=input;}
    const message=document.createElement('p');message.className='organization-message';message.setAttribute('role','status');form.append(message);
    const actions=document.createElement('div');actions.className='organization-actions wp-actions';const cancel=document.createElement('button');cancel.type='button';I18n.assign(cancel,I18n.ui("Annuleer",'Annuleer'),"textContent");cancel.onclick=()=>dialog.close();const save=document.createElement('button');save.type='submit';save.className='primary action-primary';I18n.assign(save,I18n.ui("Bewaar gegevens",'Bewaar gegevens'),"textContent");actions.append(cancel,save);form.append(actions);dialog.append(form);document.body.append(dialog);
    organization.onclick=async()=>{try{const saved=(await BewaarAlles.readShared()).business;const current=saved?.name?saved:tool==='Offerte'?(typeof working!=='undefined'?working?.business:null)||saved||{}:tool==='Ping'?window.invoiceBusiness?.()||saved||{}:saved||{};for(const [key] of fields)inputs[key].value=current[key]||'';message.textContent='';mapMenu.open=false;dialog.showModal();inputs.name.focus();}catch(e){report(e);}};
    form.onsubmit=async event=>{event.preventDefault();if(!form.reportValidity())return;save.disabled=true;try{const next=Object.fromEntries(fields.map(([key])=>[key,inputs[key].value.trim()]));await BewaarAlles.updateShared(shared=>{shared.business=next;});document.dispatchEvent(new CustomEvent('organisatie-gewijzigd'));dialog.close();Koppelingen.notice(I18n.value(I18n.ui("Mijn organisatie bewaard voor nieuwe offertes en facturen. Gebruik Bewaar alles om de gegevens in je werkmap vast te leggen.",'Mijn organisatie bewaard voor nieuwe offertes en facturen. Gebruik Bewaar alles om de gegevens in je werkmap vast te leggen.')));}catch(e){message.textContent=e.message;}finally{save.disabled=false;}};
   }

   for(const id of ['wm-all-open','wm-open','wm-zip','wm-previous','wm-forget']){const button=$(id);if(button)moreManagement.append(button);}
   const reopen=$('wm-all-open');if(reopen)I18n.assign(reopen,I18n.ui("Laatst bewaarde werkmap opnieuw laden",'Laatst bewaarde werkmap opnieuw laden'),"textContent");
   if(open)moreManagement.append(open);
   for(const item of [...map.children])if(item!==primaryActions&&item.tagName!=='SUMMARY'&&item.id!=='wm-message')moreManagement.append(item);
   map.append(moreManagement);
   moreManagement.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();moreManagement.open=false;moreTitle.focus();}});

   if(tool==='Ping'&&helpPanel){
    const savingHelp=[...document.querySelectorAll('aside.sidebar details')].find(item=>item.querySelector('summary')?.textContent.trim()===I18n.t('Hoe werkt bewaren?'));
    if(savingHelp)helpPanel.append(savingHelp);
   }

   const labels={'Bewaar':'Bewaar','Bewaar en nog een registratie':'Bewaar en nog een','Bewaar':'Bewaar','Bewaar':'Bewaar','Bewaar':'Bewaar','Bewaar':'Bewaar','Bewaar':'Bewaar','Bewaar':'Bewaar'};
   for(const b of document.querySelectorAll('button')){const source=Object.keys(labels).find(key=>b.textContent.trim()===I18n.t(key));if(source&&b.textContent!==I18n.t(labels[source]))I18n.assign(b,I18n.ui(labels[source],labels[source]));};
   for(const d of document.querySelectorAll('dialog')){const h=d.querySelector('h2,h3');if(h){h.id=h.id||d.id+'-title';d.setAttribute('aria-labelledby',h.id);}}
   if(tool==='Ping'||tool==='Offerte'){
    const layout=document.querySelector('.factureren-detail-grid')||document.querySelector(tool==='Ping'?'.layout':'.workspace'),editor=layout.querySelector('.editor'),preview=layout.querySelector('.preview');
    const controls=document.createElement('div');controls.className='document-view-actions';
    const toggle=document.createElement('button');toggle.type='button';
    editor.id=editor.id||'document-editor';preview.id=preview.id||'document-preview';
    toggle.setAttribute('aria-controls',editor.id+' '+preview.id);
    function selectPreview(show){layout.classList.toggle('show-document-preview',show);I18n.assign(toggle,(show?I18n.ui("Terug naar gegevens",'Terug naar gegevens'):I18n.ui("Voorbeeld bekijken",'Voorbeeld bekijken')),"textContent");}
    toggle.onclick=()=>selectPreview(!layout.classList.contains('show-document-preview'));
    controls.append(toggle);layout.insertBefore(controls,editor);selectPreview(false);
    // Keep input nodes and print handlers intact when changing the visible view.
    $('new')?.addEventListener('click',()=>selectPreview(false));
    if(helpPanel){const hint=document.createElement('p');I18n.assign(hint,I18n.ui("Begin bij Bewerk. Kies Voorbeeld bekijken om het document te controleren en af te drukken of als PDF te bewaren. Terug naar gegevens behoudt je invoer. Een voorbeeld bekijken maakt niets definitief.",'Begin bij Bewerk. Kies Voorbeeld bekijken om het document te controleren en af te drukken of als PDF te bewaren. Terug naar gegevens behoudt je invoer. Een voorbeeld bekijken maakt niets definitief.'),"textContent");helpPanel.querySelector('.context-help').append(hint);}

   }
   if(tool==='Kasboek'){const label=document.createElement('p');label.className='tool-purpose';I18n.assign(label,I18n.ui("Eenvoudig kasboek · inkomsten, uitgaven en bonnen",'Eenvoudig kasboek · inkomsten, uitgaven en bonnen'),"textContent");document.querySelector('main').prepend(label);}
   if(tool==='Werkbank'){
    const hint=document.querySelector('.loose-documents > span');if(hint)I18n.assign(hint,I18n.ui("Nieuwe documenten gaan mee met Bewaar alles. Een externe map blijft op haar eigen plek.",'Nieuwe documenten gaan mee met Bewaar alles. Een externe map blijft op haar eigen plek.'),"textContent");
    const localSave=$('saveButton');if(localSave)I18n.assign(localSave,I18n.ui("Werk dit document bij in de oorspronkelijke map",'Werk dit document bij in de oorspronkelijke map'),"title");
   }
   // Place secondary actions next to their collection or document; preserve handlers.
   const simplify=()=>{
    const panel=$('workspace-help');if(!panel)return;
    if(tool==='Werkbank'&&exportButton){
     const destination=document.querySelector('#content .file-more-panel')||exportParking;
     const remove=destination.querySelector('.delete-file-btn');
     if(exportButton.parentElement!==destination||(remove&&exportButton.nextElementSibling!==remove))destination.insertBefore(exportButton,remove);
    }
    const toggle=$('workspace-help-toggle');if(toggle&&toggle.textContent!==I18n.t('Hulp'))I18n.assign(toggle,I18n.ui("Hulp",'Hulp'),"textContent");
    for(const id of ['rename','rename-collection','csv','export-csv']){
     const button=$(id),destination=collectionMenu?.actions;
     if(button&&destination&&!destination.contains(button))destination.append(button);
    }
    const receive=$('receive-local-links');
    if(tool==='Bronnenkast'&&receive&&collectionMenu){
     const actions=document.querySelector('.suite-tool-actions');
     if(receive.parentElement!==collectionMenu.actions)collectionMenu.actions.append(receive);
     if(receive.textContent!=='Opnieuw proberen')I18n.assign(receive,I18n.ui("Opnieuw proberen",'Opnieuw proberen'),"textContent");
     I18n.assign(receive,I18n.ui("Probeer links opnieuw uit de extensie te ontvangen",'Probeer links opnieuw uit de extensie te ontvangen'),"title");
     const undo=$('undo');if(undo&&undo.parentElement!==collectionMenu.actions)collectionMenu.actions.append(undo);
     const message=$('link-local-message'),heading=document.querySelector('.suite-collection-heading');
     if(message&&heading&&message.previousElementSibling!==heading)heading.after(message);
     const rename=$('rename-collection');
     if(rename&&rename.textContent!=='Naam collectie wijzigen')I18n.assign(rename,I18n.ui("Naam collectie wijzigen",'Naam collectie wijzigen'),"textContent");

     if(rename&&collectionMenu.actions.firstElementChild!==rename)collectionMenu.actions.prepend(rename);
    }
    refreshMoreMenus();

    if(tool==='Contacten'){const heading=[...document.querySelectorAll('.sidebar h2')].find(h=>h.textContent===I18n.t('Bewaar'));if(heading)heading.hidden=true;}
   };
   if(helpPanel){
    const examples=helpPanel.querySelector('.example-mode');
    const resources=document.createElement('details');resources.className='invoice-help-resources';
    const summary=document.createElement('summary');I18n.assign(summary,I18n.ui("Meer uitleg",'Meer uitleg'),"textContent");resources.append(summary);
    if(examples)resources.append(examples);
    const links=document.createElement('p');links.innerHTML="<a href=\"../../Uitleg.html\"><span data-i18n=\"Uitleg en gebruik\">Uitleg en gebruik</span></a> · <a href=\"../../Over.html\"><span data-i18n=\"Over de Werkplaats\">Over de Werkplaats</span></a>";resources.append(links);
    // Keep any functional controls from older help sections reachable.
    for(const child of [...helpPanel.children])if(child.querySelector('button,input,select'))resources.append(child);
    helpPanel.replaceChildren();helpPanel.classList.add('invoice-help');
    const guide=document.createElement('div');guide.className='invoice-help-guide';
    guide.innerHTML="<header class=\"help-heading\"><h2><span data-i18n=\"Hulp bij Factureren\">Hulp bij Factureren</span></h2><p><span data-i18n=\"Van concept naar een factuur die je kunt versturen.\">Van concept naar een factuur die je kunt versturen.</span></p></header>\n     <ol class=\"help-steps\">\n      <li><strong><span data-i18n=\"1. Vul je factuur in\">1. Vul je factuur in</span></strong><p><span data-i18n=\"Kies\">Kies</span> <b><span data-i18n=\"Nieuwe factuur\">Nieuwe factuur</span></b><span data-i18n=\". Vul je bedrijfsgegevens, klant en factuurregels in. Een bestaand concept kies je uit de lijst links.\">. Vul je bedrijfsgegevens, klant en factuurregels in. Een bestaand concept kies je uit de lijst links.</span></p></li>\n      <li><strong><span data-i18n=\"2. Controleer het voorbeeld\">2. Controleer het voorbeeld</span></strong><p><span data-i18n=\"Kies\">Kies</span> <b><span data-i18n=\"Voorbeeld bekijken\">Voorbeeld bekijken</span></b><span data-i18n=\". Nog iets aanpassen? Met\">. Nog iets aanpassen? Met</span> <b><span data-i18n=\"Terug naar gegevens\">Terug naar gegevens</span></b> <span data-i18n=\"ga je verder met dezelfde invoer.\">ga je verder met dezelfde invoer.</span></p></li>\n      <li><strong><span data-i18n=\"3. Maak definitief en verstuur\">3. Maak definitief en verstuur</span></strong><p><span data-i18n=\"Kies pas na controle\">Kies pas na controle</span> <b><span data-i18n=\"Definitief maken\">Definitief maken</span></b><span data-i18n=\". Bewaar je werk en maak via het voorbeeld een PDF. Je verstuurt de factuur zelf.\">. Bewaar je werk en maak via het voorbeeld een PDF. Je verstuurt de factuur zelf.</span></p></li>\n     </ol>\n     <div class=\"help-reference-grid\"><section><h3><span data-i18n=\"Bewaar en PDF\">Bewaar en PDF</span></h3><dl>\n      <dt><span data-i18n=\"Bewaar alles\">Bewaar alles</span></dt><dd><span data-i18n=\"Legt je werk uit alle tools vast in de werkmap, inclusief conceptinvoer.\">Legt je werk uit alle tools vast in de werkmap, inclusief conceptinvoer.</span></dd>\n      <dt><span data-i18n=\"Definitief maken\">Definitief maken</span></dt><dd><span data-i18n=\"Legt de factuurgegevens vast. Bewaar alles maakt een concept niet definitief.\">Legt de factuurgegevens vast. Bewaar alles maakt een concept niet definitief.</span></dd>\n      <dt><span data-i18n=\"Afdrukken / PDF bewaren\">Afdrukken / PDF bewaren</span></dt><dd><span data-i18n=\"Maakt een document voor je klant. Kies ‘Bewaar als PDF’ in het afdrukvenster.\">Maakt een document voor je klant. Kies ‘Bewaar als PDF’ in het afdrukvenster.</span></dd>\n     </dl></section><section><h3><span data-i18n=\"Sneltoetsen\">Sneltoetsen</span></h3><dl class=\"help-shortcuts\">\n      <dt><kbd><span data-i18n=\"⌘S\">⌘S</span></kbd> / <kbd><span data-i18n=\"Ctrl+S\">Ctrl+S</span></kbd></dt><dd><span data-i18n=\"Bewaar alles\">Bewaar alles</span></dd>\n      <dt><kbd><span data-i18n=\"⌥N\">⌥N</span></kbd> / <kbd><span data-i18n=\"Alt+N\">Alt+N</span></kbd></dt><dd><span data-i18n=\"Nieuwe factuur\">Nieuwe factuur</span></dd>\n      <dt><kbd><span data-i18n=\"⌘K\">⌘K</span></kbd> / <kbd><span data-i18n=\"Ctrl+K\">Ctrl+K</span></kbd></dt><dd><span data-i18n=\"Zoeken openen of sluiten\">Zoeken openen of sluiten</span></dd>\n      <dt><kbd><span data-i18n=\"Esc\">Esc</span></kbd></dt><dd><span data-i18n=\"Menu of venster sluiten\">Menu of venster sluiten</span></dd>\n     </dl><p class=\"help-note\"><span data-i18n=\"Sluit een invoervenster voordat je een nieuw item opent. Onvoltooide invoer blijft beschermd.\">Sluit een invoervenster voordat je een nieuw item opent. Onvoltooide invoer blijft beschermd.</span></p></section></div>\n     <details class=\"help-search\"><summary><span data-i18n=\"Een factuur terugvinden\">Een factuur terugvinden</span></summary><p><span data-i18n=\"Kies\">Kies</span> <b><span data-i18n=\"Zoeken\">Zoeken</span></b> <span data-i18n=\"bovenaan. Zoek op klant, factuurnummer of omschrijving. Onder\">bovenaan. Zoek op klant, factuurnummer of omschrijving. Onder</span> <b><span data-i18n=\"Filters\">Filters</span></b> <span data-i18n=\"beperk je de lijst op status.\">beperk je de lijst op status.</span></p><p><b><span data-i18n=\"Wis filters\">Wis filters</span></b> <span data-i18n=\"toont weer de hele lijst. Zoeken sluiten behoudt je selectie; de knop toont dan\">toont weer de hele lijst. Zoeken sluiten behoudt je selectie; de knop toont dan</span> <b><span data-i18n=\"Zoeken · actief\">Zoeken · actief</span></b><span data-i18n=\". Bewaar alles neemt ook verborgen facturen mee.\">. Bewaar alles neemt ook verborgen facturen mee.</span></p></details>";
    const guides={Abonnementen:["Houd kosten, verlengingen en opzegdatums bij.","Abonnement toevoegen",[["Voeg een abonnement toe","Vul naam, bedrag en betaalperiode in. Neem verlengdatum en uiterste opzegdatum over van de aanbieder."],["Controleer wat aandacht vraagt","Naderende opzegdatums staan bovenaan. Open een abonnement voor details en kies Bewerk om iets te wijzigen."],["Bewaar je overzicht","Bewaar alles slaat je abonnementen op in je werkmap. Opzeggen doe je zelf bij de aanbieder; markeer het daarna als Opgezegd."]],["Download abonnementen","Maakt een los bestand. Bewaar alles bewaart het overzicht in je werkmap."],"Zoek op naam of notitie en filter op Actief, Aandacht nodig of Opgezegd."],"Werkbank": ["Van een eerste tekst naar een bewaard document.", "Document of map maken", [["Maak of open een document", "Kies + Nieuw voor een document of computermap. Met Document openen open je een bestaand bestand."], ["Schrijf en werk je tekst bij", "Kies Bewerk bij het document. Focus geeft je meer ruimte voor de tekst. Meer bevat de bestandsacties."], ["Bewaar op de juiste plek", "Bewaar werkt het document bij op de getoonde opslagplek. Bewaar alles legt daarnaast je werk uit de hele Werkplaats vast."]], ["Bewaar", "Een los document gaat naar Schrijven in je werkmap. Een document uit een andere geopende map wordt daar bijgewerkt."], "Zoek een document op naam of inhoud. De gekozen computermap bepaalt waar je zoekt; Alle bestanden doorzoekt alle geopende documenten."], "Projectbord": ["Van een taak naar afgerond werk.", "Nieuwe taak", [["Voeg een taak toe", "Kies Nieuwe taak, vul de taakgegevens in en kies Toevoegen."], ["Houd de voortgang bij", "Klik op de taaktitel om gegevens te wijzigen. Onder Details staan extra gegevens en acties. Verplaats een taak naar Te doen, Bezig of Klaar."], ["Leg je werk vast", "Bewaar verwerkt je aanpassing. Bewaar alles bewaart het bord en eventuele onvoltooide invoer in de werkmap."]], ["Meer bij het bord", "Hier wijzig je de bordnaam of exporteer je de gegevens. Een export is een bestand voor gebruik elders."], "Zoek bovenaan naar een taak. Onder Filters beperk of sorteer je het overzicht."], "Bronnenkast": ["Verzamel materiaal en gebruik het in je teksten.", "Bron toevoegen", [["Voeg een bron toe", "Kies Bron toevoegen voor een link, citaat of notitie. Links uit de extensie komen automatisch in Inbox. Kies Inbox verwerken om ze één voor één in te delen."], ["Bekijk en orden", "Klik op een bronkaart voor alle informatie en koppelingen. Kies in het venster Bewerk; met de ster op de kaart markeer je een favoriet."], ["Gebruik en bewaar", "Selecteer bronnen om er een document in Schrijven van te maken. Bewaar alles legt je collectie en conceptinvoer vast."]], ["Meer bij de collectie", "Hier wijzig je de collectienaam of exporteer je gegevens. Links die nog in de extensie wachten, vallen buiten Bewaar alles."], "Zoek op titel, bron, citaat of notitie. Onder Filters kies je een onderwerp of categorie."], "Uren": ["Registreer je werk en bereid je factuur voor.", "Uren toevoegen", [["Voeg uren toe", "Kies Uren toevoegen. Vul klant, project, datum en duur in en geef aan of de uren declarabel zijn."], ["Controleer je registraties", "Kies Bewerk om een registratie aan te passen. Kopiëren helpt bij terugkerend werk."], ["Factureer en bewaar", "Selecteer declarabele registraties om een factuur voor te bereiden. Open Factureren om die te controleren. Bewaar alles legt je registraties vast."]], ["Exporteren", "Meer bij Registraties bevat export. Exporteer selectie als CSV gebruikt de gekozen selectie; Bewaar alles bewaart alle registraties."], "Zoek op klant, project of omschrijving. Onder Filters kies je onder meer een periode en declarabele of niet-declarabele uren."], "Contacten": ["Houd contactgegevens, gesprekken en afspraken bij elkaar.", "Contact toevoegen", [["Voeg een contact toe", "Kies Contact toevoegen en vul de gegevens in. Deze contacten kun je ook gebruiken in Offreren en Factureren."], ["Leg gesprekken en acties vast", "Kies Gespreksnotitie om een gesprek vast te leggen. Klik op een contact voor taken, gesprekken en achtergrond."], ["Werk bij en bewaar", "Kies Bewerk om contactgegevens te wijzigen. Bewaar alles legt je contacten, gesprekken en conceptinvoer vast."]], ["Meer bij Contacten", "Hier exporteer je contactgegevens voor gebruik elders. Gebruik Bewaar alles om ze in de werkmap vast te leggen."], "Zoek op naam, organisatie, label of notitie. Gebruik Filters voor labels en de zijbalk voor contacten die aandacht nodig hebben."], "Publicatieplanner": ["Van een idee naar gepland werk.", "Start een project", [["Start een project", "Kies Start een project. Geef het een titel en status. Kies bij projecten een looptijd met datums of Doorlopend. Doorlopende projecten blijven zichtbaar in het overzicht en onder de kalender. Het projectoverzicht toont de gekoppelde taken, bronnen en schrijfdocumenten."], ["Plan en werk uit", "Wissel tussen Lijst en Kalender. Klik op een project voor het overzicht met inhoud, notities en taken uit Doen. Kies Bewerk om gegevens te wijzigen."], ["Zet om in werk", "Bij een project kun je taken maken in Doen. Controleer de bevestiging en open die tool. Bewaar alles legt je planning vast."]], ["Meer bij Projecten", "Hier exporteer je planningsgegevens. Exporteren maakt een los bestand; Bewaar alles bewaart de planning in de werkmap."], "Zoek op titel, tekst of notitie. Onder Filters kies je soort, kanaal, status of Aandacht nodig."], "Offerte": ["Van een voorstel naar een offerte voor je klant.", "Nieuwe offerte", [["Vul je offerte in", "Kies Nieuwe offerte. Vul bedrijf, klant, werkzaamheden, prijzen en afspraken in."], ["Controleer het voorbeeld", "Kies Voorbeeld bekijken. Terug naar gegevens behoudt je invoer. Kies Bewaar om je aanpassingen in de offertelijst te verwerken."], ["Deel en volg op", "Maak via het voorbeeld een PDF en verstuur die zelf. Werk de status bij wanneer je klant reageert. Een geaccepteerde offerte kun je omzetten in een factuur."]], ["Afdrukken / PDF bewaren", "Maakt een document voor je klant. Kies Bewaar als PDF in het afdrukvenster. Bewaar alles legt daarnaast de offerte en conceptinvoer vast in je werkmap."], "Zoek op klant, titel of referentie. Onder Filters beperk je de lijst op offertestatus."], "Kasboek": ["Houd inkomsten, uitgaven en bonnen overzichtelijk bij.", "Inkomst of uitgave toevoegen", [["Voeg een post toe", "Kies Inkomst of uitgave. Vul het bedrag inclusief btw in en kies zo nodig een btw-tarief en een bon."], ["Bekijk het kasboek", "Wissel tussen alle posten, inkomsten en uitgaven. Klik op een post voor de omschrijving en bon; Bewerk opent de invoer."], ["Controleer en bewaar", "Btw, Categorieën en Facturen hebben een eigen overzicht. Bewaar alles legt je posten en bonnen vast, met losse bonkopieën in de werkmap."]], ["Exporteren", "Exporteer selectie als CSV volgt de zichtbare posten in Kasboek. Het getoonde verschil is geen banksaldo of winstberekening."], "Zoek naar een post. Onder Filters kies je periode, soort, categorie of ontbrekende bonnen."]};
    if(guides[tool]){
     const [intro,newLabel,steps,extra,search]=guides[tool];
     const heading=guide.querySelector('.help-heading');I18n.assign(heading.querySelector('h2'),I18n.ui('Hulp bij '+tools[tool][0],'Hulp bij '+tools[tool][0]));I18n.assign(heading.querySelector('p'),I18n.ui(intro,intro));
     const list=guide.querySelector('.help-steps');list.replaceChildren();
     steps.forEach(([title,text],index)=>{const li=document.createElement('li'),strong=document.createElement('strong'),p=document.createElement('p');strong.append(document.createTextNode((index+1)+'. '),I18n.node(title));I18n.assign(p,I18n.ui(text,text));li.append(strong,p);list.append(li);});
     const section=guide.querySelector('.help-reference-grid>section');I18n.assign(section.querySelector('h3'),I18n.ui("Verwerken en bewaren",'Verwerken en bewaren'),"textContent");
     const dl=section.querySelector('dl');dl.replaceChildren();
     const entries=[['Bewaar alles','Bewaart je werk uit alle tools in de werkmap, inclusief onvoltooide invoer.'],...(tool==='Werkbank'?[]:[['Toevoegen / Bewaar','Verwerkt je invoer in deze tool. Gebruik daarna Bewaar alles om je werk in de werkmap vast te leggen.']]),extra];
     for(const [title,text] of entries){const dt=document.createElement('dt'),dd=document.createElement('dd');I18n.assign(dt,I18n.ui(title,title));I18n.assign(dd,I18n.ui(text,text));dl.append(dt,dd);}
     I18n.assign(guide.querySelectorAll('.help-shortcuts dd')[1],I18n.ui(newLabel,newLabel));
     const details=guide.querySelector('.help-search');I18n.assign(details.querySelector('summary'),I18n.ui("Zoeken en filteren",'Zoeken en filteren'),"textContent");I18n.assign(details.querySelector('p'),I18n.ui(search,search));
     I18n.assign(details.querySelectorAll('p')[1],I18n.ui("Kies Zoeken bovenaan of gebruik ⌘K / Ctrl+K. Sluit behoudt je zoekterm en filters; de knop toont dan Zoeken · actief. Wis filters toont de volledige selectie. Bewaar alles neemt ook verborgen werk mee.",'Kies Zoeken bovenaan of gebruik ⌘K / Ctrl+K. Sluit behoudt je zoekterm en filters; de knop toont dan Zoeken · actief. Wis filters toont de volledige selectie. Bewaar alles neemt ook verborgen werk mee.'),"textContent");
     if(projectHelp[tool]){const d=document.createElement('details');d.className='help-search';const title=document.createElement('summary'),p=document.createElement('p');I18n.assign(title,(tool==='Werkbank'?I18n.ui("Computermappen en documenten",'Computermappen en documenten'):I18n.ui("Wat betekent project hier?",'Wat betekent project hier?')),"textContent");I18n.assign(p,I18n.ui(projectHelp[tool],projectHelp[tool]));d.append(title,p);guide.append(d);}
     if(tool==='Werkbank'){I18n.assign(guide.querySelector('.help-note'),I18n.ui("Esc sluit een menu of venster; je tekstbewerking blijft open. Externe schrijfmappen bewaar je op hun eigen plek met Bewaar.",'Esc sluit een menu of venster; je tekstbewerking blijft open. Externe schrijfmappen bewaar je op hun eigen plek met Bewaar.'),"textContent");}
    }
    const shortcutList=guide.querySelector('.help-shortcuts');
    function shortcut(keys,description){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.innerHTML=keys;I18n.assign(dd,I18n.ui(description,description));shortcutList.append(dt,dd);}
    shortcut("<kbd>⌥0</kbd> / <kbd><span data-i18n=\"Alt+0\">Alt+0</span></kbd>",'Open Werkplaats Home. Werkt niet tijdens typen of wanneer een venster openstaat.');
    shortcut("<kbd>⌥1–9</kbd> / <kbd><span data-i18n=\"Alt+1–9\">Alt+1–9</span></kbd>",'Wissel van gereedschap. ⌥0 / Alt+0 opent Werkplaats Home. De nummers volgen je gekozen toolvolgorde. Werkt niet tijdens typen of wanneer een venster openstaat.');
    const toolMap=document.createElement('p');toolMap.className='help-tool-shortcuts';toolMap.textContent=shortcutText();document.addEventListener('taal-gewijzigd',()=>{toolMap.textContent=shortcutText();});shortcutList.after(toolMap);
    if(tool==='Werkbank'){
     shortcut("<kbd><span data-i18n=\"⌘E\">⌘E</span></kbd> / <kbd><span data-i18n=\"Ctrl+E\">Ctrl+E</span></kbd>",'Bewerk schakelt de bewerkmodus voor het geopende document aan of uit.');
     shortcut("<kbd><span data-i18n=\"⌘B\">⌘B</span></kbd> / <kbd><span data-i18n=\"Ctrl+B\">Ctrl+B</span></kbd>",'Vet in de opgemaakte teksteditor.');
     shortcut("<kbd><span data-i18n=\"⌘I\">⌘I</span></kbd> / <kbd><span data-i18n=\"Ctrl+I\">Ctrl+I</span></kbd>",'Cursief in de opgemaakte teksteditor.');
     guide.querySelector('.help-note').append(I18n.node(' ⌘S / Ctrl+S bewaart de hele werkmap. Gebruik Bewaar om het document op zijn eigen plek bij te werken.'));
    }
    const resume=document.createElement('details');resume.className='help-search';const resumeTitle=document.createElement('summary');I18n.assign(resumeTitle,I18n.ui("Later verderwerken en een back-up maken",'Later verderwerken en een back-up maken'),"textContent");const resumeText=document.createElement('p');I18n.assign(resumeText,I18n.ui("Kies op de home Verder werken en open dezelfde werkmap. Instellingen → Back-up en herstel bevat opnieuw laden, herstel en Download back-up. Een back-up kopieert de laatst bewaarde werkmap; gebruik daarom eerst Bewaar alles. Opnieuw laden kan huidig browserwerk vervangen: lees de melding voordat je doorgaat.",'Kies op de home Verder werken en open dezelfde werkmap. Instellingen → Back-up en herstel bevat opnieuw laden, herstel en Download back-up. Een back-up kopieert de laatst bewaarde werkmap; gebruik daarom eerst Bewaar alles. Opnieuw laden kan huidig browserwerk vervangen: lees de melding voordat je doorgaat.'),"textContent");resume.append(resumeTitle,resumeText);guide.append(resume);
    helpPanel.append(guide,resources);
   }
   const filterScript=document.createElement('script');filterScript.src=new URL('zoeken-filters.js?v=20261009-doen-2',base);filtersReady=new Promise((resolve,reject)=>{filterScript.onload=resolve;filterScript.onerror=()=>reject(Error('Zoekbediening kon niet laden.'));});document.head.append(filterScript);
   const emptyHelp={
    Contacten:['contacts','#cards .empty','Voeg je eerste contact toe. Gebruik dit contact daarna voor offertes en facturen.'],
    Uren:['entries','#rows .empty','Voeg je eerste uren toe. Selecteer declarabele registraties om er een factuur van te maken.'],
    Bronnenkast:['items','#cards .empty','Voeg je eerste bron toe: een link, citaat of notitie. Van geselecteerde bronnen kun je een document maken.'],
    Publicatieplanner:['items','#content .empty','Voeg je eerste project, publicatie of activiteit toe. Bij een project kun je daarna taken maken.'],
    Kasboek:['entries','#rows .empty','Voeg je eerste inkomsten of uitgaven toe. Je kunt ook een betaalde factuur overnemen uit Factureren.'],
    Projectbord:['tasks','.column[data-column=todo] .empty','Voeg je eerste taak toe. Verplaats haar tijdens het werken van Te doen naar Bezig en Klaar.']};
   const refine=()=>{simplify();

if(GereedschapskistMode.example){const status=$('storage'),text='Oefeninhoud. Je eigen werk en werkmap blijven apart.';if(status&&status.textContent!==I18n.t(text))I18n.assign(status,I18n.ui(text,text));}if(!GereedschapskistMode.example&&emptyHelp[tool]){const [key,selector,text]=emptyHelp[tool],content=Werkmap.allRead();if(content&&Array.isArray(content[key])&&!content[key].length){const el=document.querySelector(selector);if(el&&el.textContent!==I18n.t(text))I18n.assign(el,I18n.ui(text,text));}}};
   refine();new MutationObserver(refine).observe(document.body,{childList:true,subtree:true});
   // Keep a current browser snapshot when following an internal link; no extra disk write.

  }else{
   const bar=document.createElement('section');bar.className='start-workspace';I18n.attribute(bar,'aria-label',I18n.ui("Beginnen of verder werken",'Beginnen of verder werken'));
   const first=document.createElement('button');I18n.assign(first,I18n.ui("Nieuw beginnen",'Nieuw beginnen'),"textContent");first.className='primary action-primary';
   const open=document.createElement('button');I18n.assign(open,I18n.ui("Verder werken",'Verder werken'),"textContent");
   const state=document.createElement('span');state.className='workspace-name';
   const workChoice=document.createElement('div');workChoice.className='home-work-choice';workChoice.setAttribute('role','group');I18n.attribute(workChoice,'aria-label',I18n.ui("Eigen werk",'Eigen werk'));workChoice.append(first,open,state);const browserHint=document.createElement('span');browserHint.className='workspace-name';I18n.assign(browserHint,I18n.ui("Gebruik Chrome of Edge op je computer voor je werkmap.",'Gebruik Chrome of Edge op je computer voor je werkmap.'),"textContent");workChoice.append(browserHint);
   const route=document.createElement('details');route.className='quick-start';route.open=!Werkmap.active;
   const routeTitle=document.createElement('summary');I18n.assign(routeTitle,I18n.ui('Begin in drie stappen','Begin in drie stappen'),'textContent');
   const steps=document.createElement('ol');
   const step=(title,text)=>{const item=document.createElement('li'),heading=document.createElement('strong'),copy=document.createElement('p');I18n.assign(heading,I18n.ui(title,title),'textContent');I18n.assign(copy,I18n.ui(text,text),'textContent');item.append(heading,copy);steps.append(item);return item;};
   const locationStep=step('Kies je werkmap','Kies Nieuw beginnen. Werkplaats maakt een map voor je bestanden. Gebruik Chrome of Edge op je computer.');
   const noteStep=step('Maak je eerste notitie','Geef je idee een titel en schrijf een paar regels.');
   const noteStart=document.createElement('button');noteStart.type='button';I18n.assign(noteStart,I18n.ui('Maak mijn eerste notitie','Maak mijn eerste notitie'),'textContent');
   noteStart.onclick=()=>{if(!Werkmap.active)return;location.assign(GereedschapskistKeuze.url('Apps/Werkbank/▶ Begin hier.html?startroute=1','eigen').href);};noteStep.append(noteStart);
   step('Bewaar en werk verder','Kies Bewaar in mijn werkmap bij je notitie. Voeg daarna een volgend idee toe, werk je notitie uit of open een andere tool. Later verdergaan? Open dezelfde werkmap.');
   route.append(routeTitle,steps);bar.append(workChoice,$('wm-backup'),route);document.querySelector('.titlebar').after(bar);
   const details=document.createElement('details');details.className='home-more';details.hidden=true;const summary=document.createElement('summary');I18n.assign(summary,I18n.ui("Hulp",'Hulp'),"textContent");const guide=document.createElement('div');guide.className='context-help';guide.innerHTML="<h2><span data-i18n=\"Zo begin je\">Zo begin je</span></h2><ol><li><span data-i18n=\"Kies\">Kies</span> <strong><span data-i18n=\"Nieuw beginnen\">Nieuw beginnen</span></strong> <span data-i18n=\"en selecteer een map voor je werk, of kies\">en selecteer een map voor je werk, of kies</span> <strong><span data-i18n=\"Verder werken\">Verder werken</span></strong> <span data-i18n=\"om een bestaande werkmap te openen.\">om een bestaande werkmap te openen.</span></li><li><span data-i18n=\"Open daarna de tool die je nodig hebt. Met\">Open daarna de tool die je nodig hebt. Met</span> <strong><span data-i18n=\"Bewaar alles\">Bewaar alles</span></strong> <span data-i18n=\"bewaar je je werk in alle tools, inclusief verborgen administratie.\">bewaar je je werk in alle tools, inclusief verborgen administratie.</span></li></ol><h3><span data-i18n=\"Sneltoetsen binnen de tools\">Sneltoetsen binnen de tools</span></h3><p><span data-i18n=\"⌘S / Ctrl+S: Bewaar alles · ⌥N / Alt+N: nieuw item · ⌘K / Ctrl+K: zoeken · Esc: menu of venster sluiten. ⌥0 / Alt+0 opent Werkplaats Home. De nummers volgen je gekozen toolvolgorde en staan hieronder; dit werkt niet tijdens typen of wanneer een venster openstaat.\">⌘S / Ctrl+S: Bewaar alles · ⌥N / Alt+N: nieuw item · ⌘K / Ctrl+K: zoeken · Esc: menu of venster sluiten. ⌥0 / Alt+0 opent Werkplaats Home. De nummers volgen je gekozen toolvolgorde en staan hieronder; dit werkt niet tijdens typen of wanneer een venster openstaat.</span></p><p><span data-i18n=\"Alleen in Schrijven: ⌘E / Ctrl+E zet bewerken aan of uit; in de opgemaakte teksteditor gebruik je ⌘B / Ctrl+B voor vet en ⌘I / Ctrl+I voor cursief.\">Alleen in Schrijven: ⌘E / Ctrl+E zet bewerken aan of uit; in de opgemaakte teksteditor gebruik je ⌘B / Ctrl+B voor vet en ⌘I / Ctrl+I voor cursief.</span></p>";const toolMap=document.createElement('p');toolMap.className='help-tool-shortcuts';toolMap.textContent=shortcutText();document.addEventListener('taal-gewijzigd',()=>{toolMap.textContent=shortcutText();});guide.append(toolMap);details.append(summary,guide,map);const distribution=document.querySelector('.distribution'),opening=document.querySelector('.opening');if(distribution)details.append(distribution);if(opening)details.append(opening);bar.after(details);
   const message=$('wm-message');bar.after(message);
   async function begin(){const configured=myTools.configured,business=myTools.business();if(await Werkmap.startNew()){if(configured)await myTools.setBusiness(business);await GereedschapskistKeuze.choose('eigen');}}
   async function resume(){
    if(!await Werkmap.continueWork())return;await myTools.reload();
    if(GereedschapskistKeuze.mode!=='eigen'){
     try{sessionStorage.setItem('gereedschapskist-just-opened',Werkmap.name);}catch{}
     await GereedschapskistKeuze.choose('eigen');
     return;
    }
    refresh();I18n.assign(message,I18n.ui("Werkmap geopend. Kies hieronder de tool waarmee je verder wilt.",'Werkmap geopend. Kies hieronder de tool waarmee je verder wilt.'),"textContent");
   }
   let guidanceRevision=0;
   async function hasSavedWork(){
    if(!Werkmap.active)return false;
    try{
     await Werkmap.suiteReady;
     const {root}=await Werkmap.allAccess(false);
     if(await root.queryPermission({mode:'readwrite'})!=='granted')return false;
     return !!await BewaarAlles.readRound(root);
    }catch{return false;}
   }
   async function refresh(){const current=++guidanceRevision;const example=GereedschapskistKeuze.mode==='voorbeeld'||!GereedschapskistKeuze.mode&&!Werkmap.active;
    document.documentElement.classList.toggle('has-workmap',!!Werkmap.active&&!example);
    first.hidden=false;I18n.assign(first,I18n.ui("Nieuw beginnen",'Nieuw beginnen'),"textContent");first.onclick=()=>begin().catch(report);I18n.assign(open,I18n.ui("Verder werken",'Verder werken'),"textContent");open.onclick=()=>resume().catch(report);

    if(first.parentElement!==workChoice)workChoice.prepend(first);
    if(open.parentElement!==workChoice)first.after(open);
    if(state.parentElement!==workChoice)workChoice.append(state);
    state.hidden=!!Werkmap.active;
    I18n.assign(state,(Werkmap.active?'':I18n.ui("Nieuw beginnen: kies een opslagplek. Wij maken de mappen voor je werk.",'Nieuw beginnen: kies een opslagplek. Wij maken de mappen voor je werk.')),"textContent");
    browserHint.hidden='showDirectoryPicker' in window&&!!window.indexedDB;
    const continuePrimary=Werkmap.active&&!example;
    first.classList.toggle('primary',!continuePrimary);first.classList.toggle('action-primary',!continuePrimary);
    open.classList.toggle('primary',continuePrimary);open.classList.toggle('action-primary',continuePrimary);
    $('wm-backup').hidden=!Werkmap.active||example;
    noteStart.disabled=!Werkmap.active||example;locationStep.dataset.complete=String(Werkmap.active&&!example);
    for(const a of document.querySelectorAll('.grid a'))a.href=GereedschapskistKeuze.url(a.href,example?'voorbeeld':'eigen').href;
    const experienced=!example&&await hasSavedWork();
    if(current!==guidanceRevision)return;
    if(experienced){guide.before(route);route.open=false;}else{bar.append(route);route.open=true;}
   }
   document.addEventListener('werkmap-gekozen',refresh);refresh();
   try{const opened=sessionStorage.getItem('gereedschapskist-just-opened');if(opened){sessionStorage.removeItem('gereedschapskist-just-opened');I18n.assign(message,I18n.ui("Werkmap geopend. Kies hieronder de tool waarmee je verder wilt.",'Werkmap geopend. Kies hieronder de tool waarmee je verder wilt.'),"textContent");}}catch{}
  }
  await myTools.mount();
  if(!tool){
   const help=document.querySelector('.home-more'),header=document.querySelector('.shell > header'),settingsButton=header?.querySelector('.my-tools-trigger');
   if(help&&header&&settingsButton){
    const helpDialog=document.createElement('dialog');helpDialog.className='home-help-dialog';helpDialog.id='home-help-dialog';I18n.attribute(helpDialog,'aria-label',I18n.ui('Hulp','Hulp'));
    help.open=true;help.querySelector(':scope > summary').hidden=true;
    const actions=document.createElement('div');actions.className='wp-actions';
    const close=document.createElement('button');close.type='button';I18n.assign(close,I18n.ui('Sluit','Sluit'),'textContent');close.onclick=()=>helpDialog.close();actions.append(close);
    helpDialog.append(help,actions);help.hidden=false;document.body.append(helpDialog);
    const group=document.createElement('div');group.className='suite-tool-actions';settingsButton.before(group);
    const helpButton=document.createElement('button');helpButton.type='button';helpButton.className='home-help-trigger';helpButton.setAttribute('aria-haspopup','dialog');helpButton.setAttribute('aria-controls','home-help-dialog');I18n.assign(helpButton,I18n.ui('Hulp','Hulp'),'textContent');helpButton.onclick=()=>helpDialog.showModal();
    group.append(settingsButton,helpButton);
   }
  }
  if(tool){
   const navigationBar=document.querySelector('.suite-navigation');
   const settingsButton=navigationBar?.querySelector('.my-tools-trigger');
   const helpButton=document.getElementById('workspace-help-toggle');
   const workmapMenu=document.querySelector('.workspace-management');
   const globalMore=document.createElement('details');globalMore.className='context-actions suite-global-more';
   const globalMoreTitle=document.createElement('summary');I18n.assign(globalMoreTitle,I18n.ui('Instellingen en hulp','Instellingen en hulp'),"textContent");
   const globalMorePanel=document.createElement('div');globalMorePanel.className='context-actions-panel';
   globalMore.append(globalMoreTitle,globalMorePanel);
   if(settingsButton)globalMorePanel.append(settingsButton);
   if(helpButton)globalMorePanel.append(helpButton);
   if(workmapMenu)globalMorePanel.append(workmapMenu);
   navigationBar?.append(globalMore);
   for(const link of document.querySelectorAll('.hint a[href*="Uitleg.html#koppelingen"]'))link.closest('.hint')?.setAttribute('hidden','');
   const localStatus=document.querySelector('.storage');
   if(localStatus){
    const simplifyStatus=()=>{localStatus.hidden=/^(?:Je wijzigingen staan nu in deze browser\.|Your changes are now in this browser\.)/.test(localStatus.textContent.trim());};
    new MutationObserver(simplifyStatus).observe(localStatus,{childList:true,subtree:true,characterData:true});simplifyStatus();
   }
  }
  refreshMoreMenus();
  let menuFrame=null;
  const scheduleMenus=()=>{if(menuFrame!==null)return;menuFrame=requestAnimationFrame(()=>{menuFrame=null;refreshMoreMenus();});};
  new MutationObserver(scheduleMenus).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','style','class','aria-hidden']});

  if(!tool)document.addEventListener('gereedschappen-gewijzigd',()=>{for(const p of document.querySelectorAll('.help-tool-shortcuts'))p.textContent=shortcutText();});
  for(const p of document.querySelectorAll('.help-tool-shortcuts'))p.textContent=shortcutText();
  await filtersReady;
  applyHomeLayout();refreshMoreMenus();
  document.documentElement.removeAttribute('data-workspace-building');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mount().catch(report),{once:true});else mount().catch(report);
})();
