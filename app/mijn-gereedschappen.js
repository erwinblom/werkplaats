'use strict';
window.MijnGereedschappen=(()=>{
 const base=new URL('.',document.currentScript.src),businessTools=['Offerte','Ping','Uren','Kasboek','Abonnementen'];
 const catalog={Bronnenkast:['Verzamelen','Start Bronnenkast.html'],Werkbank:['Schrijven','▶ Begin hier.html'],Publicatieplanner:['Projecten','Start Publicatieplanner.html'],Projectbord:['Doen','Start Projectbord.html'],Contacten:['Contacten','Start Contacten.html'],Ping:['Facturen','Start Ping.html'],Abonnementen:['Abonnementen','Start Abonnementen.html'],Kasboek:['Boekhouding','Start Kasboek.html'],Databases:['Ordenen','Start Databases.html']};
 let preferences={},channel,mounted=false;
 const business=()=>preferences.business===true;
 for(const entry of Object.values(catalog)){const source=entry[0];Object.defineProperty(entry,0,{get:()=>I18n.t(source),enumerable:true});}
 const ordered=()=>[...new Set([...(Array.isArray(preferences.order)?preferences.order:[]).filter(id=>catalog[id]),...Object.keys(catalog)])];
 const visible=id=>!!catalog[id]&&!(preferences.hidden||[]).includes(id)&&(business()||!businessTools.includes(id));
 const entries=()=>ordered().filter(visible).map(id=>[id,catalog[id]]);
 const startTool=()=>preferences.startTool!=='Zoeken'&&visible(preferences.startTool)?preferences.startTool:'';
 const shortcut=number=>entries()[number-1]||null;
 const shortcutText=()=>entries().slice(0,9).map(([id,[name]],index)=>(index+1)+' '+name).join(' · ');
 const toolURL=(id,params={})=>{const file=id==='Uren'?'Start Uren.html':id==='Offerte'?'Start Offerte.html':catalog[id][1],url=new URL('Apps/'+id+'/'+file,base);for(const [key,value]of Object.entries(params))if(value)url.searchParams.set(key,value);return GereedschapskistKeuze.url(url).href;};
 function apply(){I18n.set(preferences.language||I18n.language);window.WerkplaatsUiterlijk?.apply(preferences.appearance);document.documentElement.dataset.business=business()?'on':'off';renderHome();window.WerkplaatsPersonalisatie?.renderHome();document.dispatchEvent(new CustomEvent('gereedschappen-gewijzigd'));}
 async function reload(){preferences=(await BewaarAlles.readShared()).toolPreferences||{};await window.WerkplaatsPersonalisatie?.reload();apply();}
 const ready=(async()=>{await Werkmap.suiteReady;await BewaarAlles.ready;try{await reload();}catch(error){console.error('Indeling nog niet geladen:',error);apply();}})();
 ready.catch(()=>{});
 try{channel=new BroadcastChannel('mijn-gereedschappen:'+base.href);channel.onmessage=()=>reload().catch(console.error);}catch{}
 async function setBusiness(value){const shared=await BewaarAlles.updateShared(s=>{s.toolPreferences={...s.toolPreferences,business:!!value};});preferences=shared.toolPreferences;apply();channel?.postMessage('changed');}
 async function setPreferences(value){
  const order=[...new Set([...(value.order||[]).filter(id=>catalog[id]),...Object.keys(catalog)])];
  const hidden=[...new Set((value.hidden||[]).filter(id=>catalog[id]))];
  const shared=await BewaarAlles.updateShared(s=>{
   const current=s.toolPreferences||{};
   const enabled=id=>!hidden.includes(id)&&(current.business===true||!businessTools.includes(id));
   if(!order.some(enabled))throw Error(I18n.value(I18n.ui("Laat minstens één gereedschap zichtbaar.",'Laat minstens één gereedschap zichtbaar.')));
   const start=value.startTool||'';
   if(start&&(!catalog[start]||start==='Zoeken'||!enabled(start)))throw Error(I18n.value(I18n.ui("Kies een zichtbare tool om mee te starten.",'Kies een zichtbare tool om mee te starten.')));
   s.toolPreferences={...current,order,hidden,startTool:start};
  });
  preferences=shared.toolPreferences;apply();channel?.postMessage('changed');
 }
 async function setAppearance(value){
  if(typeof value.name!=='string'||value.name.trim().length>60)throw Error(I18n.value(I18n.ui("Gebruik maximaal 60 tekens voor de naam.",'Gebruik maximaal 60 tekens voor de naam.')));
  if(!WerkplaatsUiterlijk.colors[value.color])throw Error(I18n.value(I18n.ui("Kies een van de vier accentkleuren.",'Kies een van de vier accentkleuren.')));
  if(!WerkplaatsUiterlijk.desktops[value.desktop])throw Error(I18n.value(I18n.ui("Kies een bureaublad.",'Kies een bureaublad.')));
  if(value.desktop==='custom'&&!WerkplaatsUiterlijk.validImage(value.customImage))throw Error(I18n.value(I18n.ui("Kies eerst een eigen afbeelding.",'Kies eerst een eigen afbeelding.')));
  const appearance=WerkplaatsUiterlijk.normalize(value);
  const shared=await BewaarAlles.updateShared(s=>{s.toolPreferences={...s.toolPreferences,appearance};});
  preferences=shared.toolPreferences;apply();window.Werkstatus?.changed();channel?.postMessage('changed');
 }
 async function prepareDesktopImage(file){
  if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error(I18n.value(I18n.ui("Kies een JPG-, PNG- of WebP-afbeelding.",'Kies een JPG-, PNG- of WebP-afbeelding.')));
  if(file.size>20*1024*1024)throw Error(I18n.value(I18n.ui("Deze afbeelding is groter dan 20 MB. Kies een kleiner bestand.",'Deze afbeelding is groter dan 20 MB. Kies een kleiner bestand.')));
  const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});let scale=Math.min(1,1920/bitmap.width,1080/bitmap.height),data='';
  try{
   for(let attempt=0;attempt<6;attempt++){
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const context=canvas.getContext('2d',{alpha:false});context.fillStyle='#171717';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);data=canvas.toDataURL('image/webp',Math.max(.58,.86-attempt*.06));
    if(WerkplaatsUiterlijk.validImage(data))return data;scale*=.8;
   }
  }finally{bitmap.close?.();}
  throw Error(I18n.value(I18n.ui("De afbeelding kon niet klein genoeg worden gemaakt. Kies een eenvoudiger of kleiner beeld.",'De afbeelding kon niet klein genoeg worden gemaakt. Kies een eenvoudiger of kleiner beeld.')));
 }
 async function setLanguage(language){
  if(!['nl','en'].includes(language))throw Error('Unsupported interface language.');
  if(window.GereedschapskistMode?.example){preferences={...preferences,language};apply();return;}
  const shared=await BewaarAlles.updateShared(s=>{s.toolPreferences={...s.toolPreferences,language};});preferences=shared.toolPreferences;apply();window.Werkstatus?.changed();channel?.postMessage('changed');
 }
 let homeCards,homeParents;
 function renderHome(){
  const layers=[...document.querySelectorAll('.shell main>.tool-layer')];if(!layers.length)return;
  if(!homeCards){homeCards=new Map();homeParents=new Map();for(const card of document.querySelectorAll('.shell .tool-layer .card')){
   const link=card.querySelector('a'),id=link?Object.keys(catalog).find(id=>catalog[id][1]&&link.getAttribute('href').includes('Apps/'+id+'/')):null;
   if(id){const heading=card.querySelector('h2,h3');if(heading)I18n.assign(heading,I18n.ui(catalog[id][0],catalog[id][0]));if(businessTools.includes(id))card.dataset.business='';homeCards.set(id,card);homeParents.set(id,card.parentElement);}
  }}
  if(!preferences.order&&!preferences.hidden?.length){document.getElementById('personal-tools')?.remove();for(const [id,card]of homeCards){card.hidden=false;homeParents.get(id).append(card);}for(const layer of layers)layer.hidden=false;return;}
  let section=document.getElementById('personal-tools');
  if(!section){section=document.createElement('section');section.id='personal-tools';section.className='tool-layer';const heading=document.createElement('div');heading.className='layer-heading';const title=document.createElement('h2');title.id='personal-tools-title';I18n.assign(title,I18n.ui("Mijn Werkplaats",'Mijn Werkplaats'),"textContent");const edit=I18n.mark(button('Indeling wijzigen',settings),"Indeling wijzigen");heading.append(title,edit);const list=document.createElement('ol');list.className='grid';list.setAttribute('aria-labelledby',title.id);section.append(heading,list);layers[0].before(section);}
  const list=section.querySelector('ol');for(const id of ordered()){const card=homeCards.get(id);if(card){card.hidden=!visible(id);list.append(card);}}
  for(const layer of layers)layer.hidden=true;
 }
 function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;if(label==='Mijn gereedschappen'||label==='Instellingen')b.className='my-tools-trigger';b.onclick=fn;return b;}
 let settingsDialog;
 function settings(){if(!settingsDialog)return;settingsDialog.showModal();settingsDialog.dispatchEvent(new Event('settings-open'));}
 function mountSettings(parent){
  const d=document.createElement('dialog');settingsDialog=d;d.id='suite-settings';d.className='my-tools-dialog';d.setAttribute('aria-labelledby','suite-settings-title');
  d.innerHTML="<h2 id=\"suite-settings-title\"><span data-i18n=\"Instellingen\">Instellingen</span></h2><p><span data-i18n=\"Voor je hele Werkplaats. Je hebt geen account nodig.\">Voor je hele Werkplaats. Je hebt geen account nodig.</span></p><section><h3><span data-i18n=\"Opslag\">Opslag</span></h3><p id=\"settings-location\"></p><p><span data-i18n=\"Kies één map op je computer. Hier bewaren we je werk uit alle gereedschappen.\">Kies één map op je computer. Hier bewaren we je werk uit alle gereedschappen.</span></p><div id=\"settings-storage\" class=\"settings-actions wp-actions\"></div></section><section><h3><span data-i18n=\"Mijn gegevens\">Mijn gegevens</span></h3><form id=\"settings-profile\"><label><span data-i18n=\"Naam\">Naam</span><input name=\"personalName\" maxlength=\"200\" autocomplete=\"name\"></label><label><span data-i18n=\"E-mail\">E-mail</span><input name=\"personalEmail\" type=\"email\" maxlength=\"254\" autocomplete=\"email\"></label><div data-business><h4><span data-i18n=\"Organisatiegegevens\">Organisatiegegevens</span></h4><p><span data-i18n=\"Voor nieuwe offertes en facturen. Bestaande documenten behouden hun gegevens.\">Voor nieuwe offertes en facturen. Bestaande documenten behouden hun gegevens.</span></p><label><span data-i18n=\"Organisatienaam\">Organisatienaam</span><input name=\"name\" maxlength=\"200\"></label><label><span data-i18n=\"Adres\">Adres</span><textarea name=\"address\" maxlength=\"2000\" rows=\"3\"></textarea></label><label><span data-i18n=\"Zakelijk e-mailadres\">Zakelijk e-mailadres</span><input name=\"email\" type=\"email\" maxlength=\"254\"></label><label><span data-i18n=\"IBAN\">IBAN</span><input name=\"iban\" maxlength=\"80\"></label><label><span data-i18n=\"KvK-nummer\">KvK-nummer</span><input name=\"kvk\" maxlength=\"100\"></label><label><span data-i18n=\"Btw-id\">Btw-id</span><input name=\"vat\" maxlength=\"100\"></label><fieldset class=\"tax-rates\"><legend><span data-i18n=\"Btw-tarieven\">Btw-tarieven</span></legend><p><span data-i18n=\"Deze keuzes worden gebruikt in Factureren en Boekhouden.\">Deze keuzes worden gebruikt in Factureren en Boekhouden.</span></p><div id=\"settings-tax-rates\"></div></fieldset></div><button type=\"submit\"><span data-i18n=\"Bewaar gegevens\">Bewaar gegevens</span></button><p id=\"settings-profile-status\" role=\"status\"></p></form></section><section><h3><span data-i18n=\"Naam en kleur\">Naam en kleur</span></h3><form id=\"settings-appearance\"><label><span data-i18n=\"Naam van je Werkplaats\">Naam van je Werkplaats</span><input name=\"workspaceName\" maxlength=\"60\" placeholder=\"Werkplaats\" data-i18n-placeholder=\"Werkplaats\" autocomplete=\"off\"></label><fieldset><legend><span data-i18n=\"Accentkleur\">Accentkleur</span></legend><div class=\"appearance-colors\"></div></fieldset><p class=\"appearance-preview\" aria-label=\"Voorbeeld van naam en kleur\" data-i18n-aria-label=\"Voorbeeld van naam en kleur\"></p><div class=\"settings-actions wp-actions\"><button type=\"submit\"><span data-i18n=\"Naam en kleur toepassen\">Naam en kleur toepassen</span></button><button type=\"button\" id=\"appearance-reset\"><span data-i18n=\"Standaard herstellen\">Standaard herstellen</span></button></div><p id=\"appearance-status\" role=\"status\"></p></form></section><section><h3><span data-i18n=\"Taal\">Taal</span></h3><label for=\"settings-language\"><span data-i18n=\"Taalkeuze\">Taalkeuze</span></label><select id=\"settings-language\"><option value=\"nl\">Nederlands</option><option value=\"en\">English</option></select><p><span data-i18n=\"De interface verandert; je eigen teksten blijven zoals je ze schreef.\">De interface verandert; je eigen teksten blijven zoals je ze schreef.</span></p><p id=\"settings-language-status\" role=\"status\"></p></section><section><h3><span data-i18n=\"Mijn Werkplaats\">Mijn Werkplaats</span></h3><p><span data-i18n=\"Kies je gereedschappen, hun volgorde en waar je begint.\">Kies je gereedschappen, hun volgorde en waar je begint.</span></p><label class=\"business-choice\"><input id=\"settings-business\" type=\"checkbox\"> <span data-i18n=\"Administratie: Factureren, Abonnementen en Boekhouden\">Administratie: Factureren, Abonnementen en Boekhouden</span></label><p><span data-i18n=\"Uitzetten verbergt deze onderdelen. Je gegevens blijven bewaard.\">Uitzetten verbergt deze onderdelen. Je gegevens blijven bewaard.</span></p><form id=\"settings-tools\"><div id=\"settings-tool-list\"></div><label><span data-i18n=\"Open Werkplaats met\">Open Werkplaats met</span><select id=\"settings-start-tool\"></select></label><p><span data-i18n=\"Verborgen tools behouden hun gegevens. Je kunt ze hier weer aanzetten.\">Verborgen tools behouden hun gegevens. Je kunt ze hier weer aanzetten.</span></p><button type=\"submit\"><span data-i18n=\"Indeling toepassen\">Indeling toepassen</span></button><p id=\"settings-tools-status\" role=\"status\"></p></form></section><section><h3><span data-i18n=\"Back-up en herstel\">Back-up en herstel</span></h3><p><span data-i18n=\"Bewaar alles slaat je werk op. Download back-up maakt een extra kopie van het laatst bewaarde werk.\">Bewaar alles slaat je werk op. Download back-up maakt een extra kopie van het laatst bewaarde werk.</span></p><div id=\"settings-backup\" class=\"settings-actions wp-actions\"></div><details id=\"settings-advanced\"><summary><span data-i18n=\"Meer beheer en importeren\">Meer beheer en importeren</span></summary></details></section><p id=\"settings-message\" role=\"status\"></p><div class=\"my-tools-actions wp-actions\"></div>";
  for(const section of [...d.querySelectorAll(':scope > section')]){
   const heading=section.querySelector(':scope > h3');if(!heading)continue;
   const details=document.createElement('details');details.className='settings-section';
   const summary=document.createElement('summary');summary.append(...heading.childNodes);
   heading.remove();details.append(summary,...section.childNodes);section.replaceWith(details);
  }
  const workspaceSection=d.querySelector('#settings-tools').closest('.settings-section'),workspaceIntro=workspaceSection.querySelector(':scope > p'),businessChoice=workspaceSection.querySelector('.business-choice'),appearanceFormInSettings=d.querySelector('#settings-appearance'),appearanceSection=appearanceFormInSettings.closest('.settings-section');workspaceSection.id='settings-my-workspace';
  I18n.assign(workspaceIntro,I18n.ui('Stel in wat je ziet, waar je begint en welke vaste keuzes bij jouw manier van werken passen.','Stel in wat je ziet, waar je begint en welke vaste keuzes bij jouw manier van werken passen.'),'textContent');
  const appearanceHeading=document.createElement('h4');I18n.assign(appearanceHeading,I18n.ui('Naam, kleur en bureaublad','Naam, kleur en bureaublad'),'textContent');
  const appearanceIntro=document.createElement('p');I18n.assign(appearanceIntro,I18n.ui('Kies je naam, accentkleur en bureaublad. Je kunt ook een eigen afbeelding gebruiken.','Kies je naam, accentkleur en bureaublad. Je kunt ook een eigen afbeelding gebruiken.'),'textContent');
  workspaceIntro.after(appearanceHeading,appearanceIntro,appearanceFormInSettings);appearanceSection.remove();
  const layoutHeading=document.createElement('h4');I18n.assign(layoutHeading,I18n.ui('Indeling','Indeling'),'textContent');businessChoice.before(layoutHeading);
  const personalization=document.createElement('div');personalization.id='settings-personalization';workspaceSection.append(personalization);
  const videoHelp=document.createElement('details');videoHelp.className='instruction-video';
  const videoTitle=document.createElement('summary');I18n.assign(videoTitle,I18n.ui('Maak hem van jou · 1 minuut','Maak hem van jou · 1 minuut'),'textContent');
  const video=document.createElement('video');video.controls=true;video.preload='none';video.src=new URL('Video/Werkplaats-personaliseren.mp4',base).href;d.addEventListener('close',()=>video.pause());workspaceSection.addEventListener('toggle',()=>{if(!workspaceSection.open)video.pause();});videoHelp.append(videoTitle,video);videoHelp.addEventListener('toggle',()=>{if(!videoHelp.open)video.pause();});workspaceIntro.after(videoHelp);

  document.body.append(d);parent?.append(I18n.mark(button('Instellingen',settings),"Instellingen"));d.querySelector('.my-tools-actions').append(I18n.mark(button('Sluit',()=>d.close()),"Sluit"));window.WerkplaatsPersonalisatie?.mountSettings(d);
  const languageSelect=d.querySelector('#settings-language');languageSelect.value=I18n.language;languageSelect.onchange=async()=>{languageSelect.disabled=true;try{await setLanguage(languageSelect.value);I18n.assign(d.querySelector('#settings-language-status'),I18n.ui('Taal toegepast. Gebruik Bewaar alles voor je werkmap.','Taal toegepast. Gebruik Bewaar alles voor je werkmap.'));}catch(error){languageSelect.value=I18n.language;d.querySelector('#settings-language-status').textContent=error.message;}finally{languageSelect.disabled=false;}};
  const profile=d.querySelector('form'),status=d.querySelector('#settings-profile-status'),check=d.querySelector('#settings-business');
  const toolsForm=d.querySelector('#settings-tools'),toolList=d.querySelector('#settings-tool-list'),startSelect=d.querySelector('#settings-start-tool');
  let draftOrder=[],draftHidden=new Set(),toolsBaseline='';
  const toolsSnapshot=()=>JSON.stringify({order:draftOrder,hidden:[...draftHidden].sort(),startTool:startSelect.value});
  function startOptions(selected=startSelect.value){
   const available=draftOrder.filter(id=>id!=='Zoeken'&&!draftHidden.has(id)&&(business()||!businessTools.includes(id)));
   startSelect.replaceChildren(I18n.mark(new Option('Home — overzicht',''),"Home — overzicht"),...available.map(id=>new Option(catalog[id][0],id)));
   startSelect.value=available.includes(selected)?selected:'';
  }
  function drawTools(){
   toolList.replaceChildren();
   for(const [index,id] of draftOrder.entries()){
    const row=document.createElement('div');row.className='settings-tool-row';
    const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=!draftHidden.has(id);input.disabled=businessTools.includes(id)&&!business();
    I18n.attribute(input,'aria-label',I18n.ui('{0} tonen',catalog[id][0]+' tonen'));label.append(input,document.createTextNode(catalog[id][0]+(input.disabled?' '+I18n.t('(Administratie staat uit)'):'')));
    input.onchange=()=>{if(input.checked)draftHidden.delete(id);else draftHidden.add(id);startOptions();};
    const up=button('↑',()=>moveTool(index,-1)),down=button('↓',()=>moveTool(index,1));I18n.attribute(up,'aria-label',I18n.ui('{0} omhoog',catalog[id][0]+' omhoog'));I18n.attribute(down,'aria-label',I18n.ui('{0} omlaag',catalog[id][0]+' omlaag'));up.disabled=index===0;down.disabled=index===draftOrder.length-1;
    row.append(label,up,down);toolList.append(row);
   }
  }
  function moveTool(index,direction){const target=index+direction;[draftOrder[index],draftOrder[target]]=[draftOrder[target],draftOrder[index]];drawTools();startOptions();toolList.children[target].querySelector(direction<0?'button':'button:last-child').focus();}
  function loadTools(){draftOrder=ordered();draftHidden=new Set(preferences.hidden||[]);drawTools();startOptions(startTool());toolsBaseline=toolsSnapshot();}
  toolsForm.onsubmit=async event=>{
   event.preventDefault();const submit=toolsForm.querySelector('button[type=submit]');submit.disabled=true;
   try{await setPreferences({order:draftOrder,hidden:[...draftHidden],startTool:startSelect.value});loadTools();I18n.assign(d.querySelector('#settings-tools-status'),I18n.ui("Indeling toegepast. Gebruik Bewaar alles voor je werkmap.",'Indeling toegepast. Gebruik Bewaar alles voor je werkmap.'),"textContent");}
   catch(error){d.querySelector('#settings-tools-status').textContent=error.message;}
   finally{submit.disabled=false;}
  };
  const appearanceForm=d.querySelector('#settings-appearance'),appearanceName=appearanceForm.elements.workspaceName,appearanceStatus=d.querySelector('#appearance-status');let appearanceBaseline='',customImage='';
  I18n.assign(appearanceForm.querySelector('button[type=submit]'),I18n.ui('Uiterlijk toepassen','Uiterlijk toepassen'),'textContent');
  const desktopField=document.createElement('fieldset'),desktopLegend=document.createElement('legend'),desktopHelp=document.createElement('p'),desktopChoices=document.createElement('div'),customPanel=document.createElement('div'),uploadLabel=document.createElement('label'),uploadInput=document.createElement('input'),customName=document.createElement('span'),fitLabel=document.createElement('label'),fitSelect=document.createElement('select'),removeImage=button('Verwijder eigen afbeelding',()=>{});
  desktopField.className='desktop-field';desktopChoices.className='desktop-choices';customPanel.className='desktop-custom';I18n.assign(desktopLegend,I18n.ui('Bureaublad','Bureaublad'),'textContent');I18n.assign(desktopHelp,I18n.ui('Kies het vlak achter je Werkplaats. De gereedschappen zelf blijven hetzelfde.','Kies het vlak achter je Werkplaats. De gereedschappen zelf blijven hetzelfde.'),'textContent');desktopField.append(desktopLegend,desktopHelp,desktopChoices,customPanel);appearanceForm.querySelector('fieldset').after(desktopField);
  for(const [id,[label,description]]of Object.entries(WerkplaatsUiterlijk.desktops)){
   const choice=document.createElement('label'),input=document.createElement('input'),sample=document.createElement('span'),copy=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small');choice.className='desktop-choice';input.type='radio';input.name='desktop';input.value=id;sample.className='desktop-sample';sample.dataset.desktopSample=id;sample.setAttribute('aria-hidden','true');I18n.assign(name,I18n.ui(label,label),'textContent');I18n.assign(detail,I18n.ui(description,description),'textContent');copy.append(name,detail);choice.append(input,sample,copy);desktopChoices.append(choice);
  }
  uploadLabel.className='desktop-upload-button';I18n.assign(uploadLabel,I18n.ui('Kies afbeelding','Kies afbeelding'),'textContent');uploadInput.type='file';uploadInput.accept='image/jpeg,image/png,image/webp';uploadInput.hidden=true;uploadLabel.append(uploadInput);customName.className='desktop-file-name';fitLabel.className='desktop-fit';fitLabel.append(I18n.node('Weergave'));fitSelect.name='desktopFit';fitSelect.append(I18n.mark(new Option('Vullen','cover'),'Vullen'),I18n.mark(new Option('Passend','contain'),'Passend'));customPanel.append(uploadLabel,customName,fitLabel,fitSelect,I18n.mark(removeImage,'Verwijder eigen afbeelding'));
  const appearanceSnapshot=()=>JSON.stringify({name:appearanceName.value,color:appearanceForm.querySelector('input[name=accentColor]:checked')?.value||'red',desktop:appearanceForm.querySelector('input[name=desktop]:checked')?.value||'erwin',customImage,desktopFit:fitSelect.value||'cover'});
  function previewAppearance(){const value=JSON.parse(appearanceSnapshot()),preview=appearanceForm.querySelector('.appearance-preview');I18n.assign(preview,(value.name.trim()||I18n.ui("Werkplaats",'Werkplaats')),"textContent");preview.style.setProperty('--preview-accent',WerkplaatsUiterlijk.colors[value.color][1]);customPanel.hidden=value.desktop!=='custom';const customSample=appearanceForm.querySelector('[data-desktop-sample=custom]');customSample.style.backgroundImage=value.customImage?`url("${value.customImage}")`:'';customName.textContent=value.customImage?I18n.t('Eigen afbeelding staat klaar.'):I18n.t('Nog geen eigen afbeelding gekozen.');}
  for(const [id,[label,color]]of Object.entries(WerkplaatsUiterlijk.colors)){
   const choice=document.createElement('label'),input=document.createElement('input'),swatch=document.createElement('span');input.type='radio';input.name='accentColor';input.value=id;swatch.className='appearance-swatch';swatch.style.background=color;swatch.setAttribute('aria-hidden','true');choice.append(input,swatch,I18n.node(label));appearanceForm.querySelector('.appearance-colors').append(choice);
  }
  function loadAppearance(){const value=WerkplaatsUiterlijk.normalize(preferences.appearance);appearanceName.value=value.name;customImage=value.customImage;fitSelect.value=value.desktopFit;for(const input of appearanceForm.querySelectorAll('input[name=accentColor]'))input.checked=input.value===value.color;for(const input of appearanceForm.querySelectorAll('input[name=desktop]'))input.checked=input.value===value.desktop;previewAppearance();appearanceBaseline=appearanceSnapshot();}
  appearanceForm.addEventListener('input',previewAppearance);
  uploadInput.onchange=async()=>{const file=uploadInput.files?.[0];if(!file)return;uploadLabel.setAttribute('aria-busy','true');I18n.assign(appearanceStatus,I18n.ui('Afbeelding voorbereiden…','Afbeelding voorbereiden…'),'textContent');try{customImage=await prepareDesktopImage(file);const own=appearanceForm.querySelector('input[name=desktop][value=custom]');own.checked=true;customName.textContent=file.name;appearanceStatus.textContent='';previewAppearance();}catch(error){appearanceStatus.textContent=error.message;}finally{uploadInput.value='';uploadLabel.removeAttribute('aria-busy');}};
  removeImage.onclick=()=>{customImage='';const fallback=appearanceForm.querySelector('input[name=desktop][value=erwin]');fallback.checked=true;previewAppearance();};
  async function saveAppearance(value){const buttons=[...appearanceForm.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);try{await setAppearance(value);loadAppearance();I18n.assign(appearanceStatus,I18n.ui("Uiterlijk toegepast. Gebruik Bewaar alles voor je werkmap.",'Uiterlijk toegepast. Gebruik Bewaar alles voor je werkmap.'),"textContent");}catch(error){appearanceStatus.textContent=error.message;}finally{buttons.forEach(b=>b.disabled=false);}}
  appearanceForm.onsubmit=event=>{event.preventDefault();if(appearanceForm.reportValidity())saveAppearance(JSON.parse(appearanceSnapshot()));};
  d.querySelector('#appearance-reset').onclick=()=>saveAppearance({name:'',color:'red',desktop:'erwin',customImage:'',desktopFit:'cover'});
  const businessKeys=['name','address','email','iban','kvk','vat'];let baseline='',loaded=false;
  // Briefgegevens zijn beschikbaar zonder de financiële tools aan te zetten.
  const letterOrganization=profile.querySelector('[data-business]');letterOrganization.removeAttribute('data-business');
  for(const key of ['iban','kvk','vat'])profile.elements[key].closest('label').setAttribute('data-business','');
  profile.querySelector('.tax-rates').setAttribute('data-business','');
  const organizationIntro=letterOrganization.querySelector('p');organizationIntro.textContent=I18n.t('Voor nieuwe brieven, offertes en facturen. Bestaande documenten behouden hun gegevens.');
  let organizationLogo='',logoGeneration=0,logoBusy=false,profileLoadGeneration=0;
  const logoField=document.createElement('div');logoField.className='organization-logo';
  const logoLabel=document.createElement('label');logoLabel.textContent=I18n.t('Logo voor brieven');
  const logoInput=document.createElement('input');logoInput.type='file';logoInput.accept='image/png,image/jpeg,image/webp';logoInput.setAttribute('aria-label',I18n.t('Logo voor brieven'));logoLabel.append(logoInput);
  const logoHint=document.createElement('p');logoHint.textContent=I18n.t('PNG, JPEG of WebP, maximaal 2 MB. Het logo wordt lokaal verkleind en in nieuwe brieven opgenomen.');
  const logoPreview=document.createElement('img');logoPreview.alt=I18n.t('Voorbeeld organisatielogo');logoPreview.style.cssText='display:block;max-width:200px;max-height:100px;object-fit:contain';
  const logoRemove=document.createElement('button');logoRemove.type='button';logoRemove.textContent=I18n.t('Logo verwijderen');
  const profileSave=profile.querySelector('button[type=submit]');
  const showLogo=()=>{const visible=window.WerkplaatsOrganizationLogo?.previewable(organizationLogo);logoPreview.hidden=!visible;logoPreview.style.display=visible?'block':'none';if(visible)logoPreview.src=organizationLogo;else logoPreview.removeAttribute('src');logoRemove.hidden=!organizationLogo;};
  logoRemove.onclick=()=>{if(!loaded)return;logoGeneration++;organizationLogo='';logoInput.value='';logoBusy=false;profileSave.disabled=!loaded;status.textContent='';showLogo();};
  logoInput.onchange=async()=>{if(!loaded)return;const generation=++logoGeneration,file=logoInput.files?.[0];if(!file)return;logoBusy=true;profileSave.disabled=true;status.textContent=I18n.t('Logo verwerken…');try{const result=await WerkplaatsOrganizationLogo.fromFile(file);if(generation!==logoGeneration||!d.open)return;organizationLogo=result;showLogo();status.textContent=I18n.t('Logo gereed. Kies Bewaar gegevens om het te bewaren.');}catch(error){if(generation===logoGeneration&&d.open)status.textContent=error.message;}finally{if(generation===logoGeneration){logoBusy=false;profileSave.disabled=!loaded;logoInput.value='';}}};
  d.addEventListener('close',()=>{profileLoadGeneration++;loaded=false;logoGeneration++;logoBusy=false;logoInput.value='';logoInput.disabled=logoRemove.disabled=true;profileSave.disabled=true;});
  logoField.append(logoLabel,logoHint,logoPreview,logoRemove);profile.elements.email.closest('label').after(logoField);

  const taxBox=d.querySelector('#settings-tax-rates');function drawTaxRates(items=Belastingtarieven.defaults()){taxBox.replaceChildren(...items.map(item=>{const row=document.createElement('div');row.className='tax-rate-row';const name=document.createElement('input');name.name='taxName_'+item.id;name.value=item.name;name.maxLength=60;name.setAttribute('aria-label',I18n.t('Tariefnaam'));row.append(name);if(item.rate!==null){const rate=document.createElement('input');rate.name='taxRate_'+item.id;rate.type='number';rate.min='0';rate.max='100';rate.step='0.01';rate.value=item.rate;rate.setAttribute('aria-label',I18n.t('Percentage'));row.append(rate,document.createTextNode('%'));}else{const special=document.createElement('span');special.textContent='—';special.title=I18n.t('Geen percentage');row.append(special);}return row;}));}
  const taxValues=()=>Belastingtarieven.defaults().map(item=>({id:item.id,name:profile.elements['taxName_'+item.id].value,rate:item.rate===null?null:Number(profile.elements['taxRate_'+item.id].value)}));drawTaxRates();
  const snapshot=()=>JSON.stringify({fields:[...profile.elements].filter(e=>e.name).map(e=>[e.name,e.value]),logo:organizationLogo});
  async function load(){const loadGeneration=++profileLoadGeneration;loaded=false;logoInput.disabled=logoRemove.disabled=true;I18n.assign(status,I18n.ui("Gegevens laden…",'Gegevens laden…'),"textContent");profile.querySelector('button[type=submit]').disabled=true;try{const shared=await BewaarAlles.readShared();if(loadGeneration!==profileLoadGeneration||!d.open)return;profile.elements.personalName.value=shared.profile?.name||'';profile.elements.personalEmail.value=shared.profile?.email||'';for(const key of businessKeys)profile.elements[key].value=shared.business?.[key]||'';logoGeneration++;logoBusy=false;logoInput.value='';organizationLogo=typeof shared.business?.logo==='string'?shared.business.logo:'';showLogo();drawTaxRates(Belastingtarieven.normalize(shared.taxRates));baseline=snapshot();status.textContent='';
    baseline=snapshot();loaded=true;}catch(e){if(loadGeneration!==profileLoadGeneration||!d.open)return;I18n.assign(status,I18n.ui("Gegevens niet geladen: {0}",'Gegevens niet geladen: '+e.message),"textContent");}finally{if(loadGeneration===profileLoadGeneration){profileSave.disabled=!loaded;logoInput.disabled=logoRemove.disabled=!loaded;}}}
  profile.onsubmit=async e=>{
   e.preventDefault();if(!loaded||logoBusy||!profile.reportValidity())return;
   const save=profile.querySelector('button[type=submit]');save.disabled=true;
   try{
    if(!Werkmap.active)throw Error(I18n.value(I18n.ui("Kies eerst bij Opslag een map voor je werk. Je invoer blijft hier staan.",'Kies eerst bij Opslag een map voor je werk. Je invoer blijft hier staan.')));
    I18n.assign(status,I18n.ui("Bewaar gegevens…",'Bewaar gegevens…'),"textContent");
    await BewaarAlles.updateShared(shared=>{shared.profile={...shared.profile,name:profile.elements.personalName.value.trim(),email:profile.elements.personalEmail.value.trim()};shared.business={...shared.business,...Object.fromEntries(businessKeys.filter(key=>business()||['name','address','email'].includes(key)).map(key=>[key,profile.elements[key].value.trim()])),logo:organizationLogo};if(business())shared.taxRates=Belastingtarieven.normalize(taxValues());});
    if(business())await Belastingtarieven.save(taxValues());
    document.dispatchEvent(new CustomEvent('organisatie-gewijzigd'));
    await BewaarAlles.save();
    baseline=snapshot();I18n.assign(status,I18n.ui("Je gegevens zijn bewaard.",'Je gegevens zijn bewaard.'),"textContent");
   }catch(error){I18n.assign(status,I18n.ui("Bewaar niet bevestigd. {0}",'Bewaar niet bevestigd. '+error.message),"textContent");}
   finally{save.disabled=false;}
  };
  check.onchange=async()=>{check.disabled=true;try{await setBusiness(check.checked);I18n.assign(d.querySelector('#settings-tools-status'),I18n.ui("Indeling toegepast. Gebruik Bewaar alles om deze te bewaren.",'Indeling toegepast. Gebruik Bewaar alles om deze te bewaren.'),"textContent");}catch(e){check.checked=business();I18n.assign(d.querySelector('#settings-tools-status'),I18n.ui("Niet aangepast: {0}",'Niet aangepast: '+e.message),"textContent");}finally{check.disabled=false;}};
  function refresh(){languageSelect.value=I18n.language;check.checked=business();for(const key of businessKeys)profile.elements[key].disabled=!business()&&!['name','address','email'].includes(key);I18n.assign(d.querySelector('#settings-location'),(Werkmap.active?I18n.ui("Je werk wordt bewaard in: {0}",'Je werk wordt bewaard in: '+Werkmap.name):I18n.ui("Nog geen opslagmap gekozen.",'Nog geen opslagmap gekozen.')),"textContent");const choose=document.getElementById('wm-choose');if(choose)I18n.assign(choose,I18n.ui("Bestaand werk openen",'Bestaand werk openen'),"textContent");}
  d.addEventListener('settings-open',()=>{refresh();load();loadTools();loadAppearance();});document.addEventListener('gereedschappen-gewijzigd',()=>{refresh();if(d.open){drawTools();startOptions();}});document.addEventListener('werkmap-gekozen',()=>{refresh();if(d.open)load();});
  function close(){if(((baseline&&snapshot()!==baseline)||(toolsBaseline&&toolsSnapshot()!==toolsBaseline)||(appearanceBaseline&&appearanceSnapshot()!==appearanceBaseline)||window.WerkplaatsPersonalisatie?.dirty())&&!confirm(I18n.value(I18n.ui("Je gewijzigde gegevens nog niet toepassen en dit venster sluiten?",'Je gewijzigde gegevens nog niet toepassen en dit venster sluiten?'))))return;d.close();}
  d.querySelector('.my-tools-actions button').onclick=close;d.addEventListener('cancel',e=>{e.preventDefault();close();});
  const storage=d.querySelector('#settings-storage'),backup=d.querySelector('#settings-backup'),advanced=d.querySelector('#settings-advanced');
  function move(id,target,label){const el=document.getElementById(id);if(el){target.append(el);if(label)I18n.assign(el,I18n.ui(label,label));}return el;}
  move('wm-choose',storage,'Bestaand werk openen');
  const storageBrowser=Werkmap.browserNotice();storageBrowser.id='settings-storage-browser';storage.prepend(storageBrowser);
  const create=move('wm-new',storage,'Nieuwe opslagmap kiezen')||I18n.mark(button('Nieuwe opslagmap kiezen',null),"Nieuwe opslagmap kiezen");storage.append(create);create.disabled=!!window.GereedschapskistMode?.example;create.setAttribute('aria-describedby','settings-storage-browser');create.onclick=async()=>{create.disabled=true;try{if(!await Werkmap.startNew())return;await reload();refresh();if(d.open)await load();}catch(e){d.querySelector('#settings-message').textContent=e.message;}finally{create.disabled=!!window.GereedschapskistMode?.example;}};
  backup.append(I18n.mark(button('Prullenbak',()=>Prullenbak.open(d).catch(error=>{d.querySelector('#settings-message').textContent=error.message;})),"Prullenbak"));
  const theme=document.getElementById('writing-theme-settings');if(theme)d.querySelector('#settings-appearance').parentElement.append(theme);
  move('wm-zip',backup,'Download back-up');move('wm-previous',backup,'Herstel vorige bewaarkopie');move('wm-all-open',backup,'Laatst bewaarde werk opnieuw laden');move('wm-forget',advanced,'Opslagmap loskoppelen');
  const storageHelp=document.querySelector('.save-help-body');if(storageHelp)storage.append(storageHelp);
  if(document.querySelector('script[data-tool]')?.dataset.tool==='Abonnementen'){const hint=document.getElementById('storage');if(hint)storage.append(hint);}
  const map=document.getElementById('werkmap');if(map){for(const el of [...map.querySelectorAll('.legacy-imports,.manage-clear')])backup.append(el);const info=map.querySelector('.storage-details');if(info)storage.append(info);const extra=map.querySelector('.workspace-more-management');if(extra){for(const el of [...extra.children])if(el.tagName!=='SUMMARY'&&el.tagName!=='P')advanced.append(el);}map.hidden=true;document.body.append(map);}
  document.querySelector('.workspace-management')?.remove();
  const organization=document.getElementById('wm-organization');if(organization){organization.onclick=settings;organization.hidden=true;}
  const message=document.getElementById('wm-message');if(message){const sync=()=>{d.querySelector('#settings-message').textContent=message.textContent;};new MutationObserver(sync).observe(message,{childList:true,subtree:true,characterData:true});sync();}
  refresh();
 }
 function searchRows(id,session,shared={}){
  const data=session.data||{},field={Bronnenkast:'items',Publicatieplanner:'items',Projectbord:'tasks',Contacten:'contacts',Offerte:'quotes',Ping:'invoices',Uren:'entries',Kasboek:'entries',Abonnementen:'items'}[id];
  const items=id==='Werkbank'?[...(session.documents||[]),...(shared.writingNotes||[]).map(note=>({...note,kind:'note',projectIds:(shared.projectMaterials||[]).filter(record=>(record.noteIds||[]).includes(note.id)).map(record=>record.projectId)}))]:data[field]||[];
  return items.map(item=>({id, item,title:item.title||item.name||item.description||item.number||'Zonder titel',text:[item.title,item.name,item.content,item.body,item.topic,item.description,item.text,item.notes,item.quote,item.summary,item.url,item.organization,item.email,item.client,item.customer,item.source,item.project,item.number].filter(v=>typeof v==='string').join(' ').toLocaleLowerCase('nl')}));
 }
 // Normaliseer schrijfwijzen zonder termen of persoonsgegevens extern te versturen.
 const normalize=value=>String(value||'').toLocaleLowerCase('nl').normalize('NFD').replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
 const words=value=>normalize(value).split(' ').filter(Boolean);
 const containsTerm=(text,term)=>term.length<=3?(' '+text+' ').includes(' '+term+' '):text.includes(term);
 function strictMatch(text,query){const terms=words(query);if(!terms.length)return false;const normalized=normalize(text);if(terms.every(term=>containsTerm(normalized,term)))return true;const compact=terms.join(''),parts=normalized.split(' ');if(compact.length<5)return false;for(let i=0;i<parts.length;i++){let joined='';for(let j=i;j<parts.length&&joined.length<compact.length;j++){joined+=parts[j];if(joined===compact)return true;}}return false;}
 // Alleen de expliciet gekozen familie; overige zoekwoorden blijven verplicht.
 const conceptPattern=/(?:^| )(self driving|selfdriving|autonomous driving|zelfrijdende?)(?= |$)/;
 const conceptDisplay=/\b(?:self[\s\u2010-\u2015-]*driving|autonomous[\s\u2010-\u2015-]+driving|zelfrijdende?)\b/iu;
 function relatedMatch(text,query){const parsed=normalize(query),hit=conceptPattern.exec(parsed);if(!hit)return false;const rest=(parsed.slice(0,hit.index)+' '+parsed.slice(hit.index+hit[0].length)).trim();const normalized=normalize(text);let match;const patterns=/(?:^| )(self driving|selfdriving|autonomous driving|zelfrijdende?)(?= |$)/g;while((match=patterns.exec(normalized))){const remaining=(normalized.slice(0,match.index)+' '+normalized.slice(match.index+match[0].length)).trim();if(!rest||strictMatch(remaining,rest))return true;}return false;}
 function editOne(a,b){if(Math.abs(a.length-b.length)>1)return false;if(a===b)return true;if(a.length===b.length){const diffs=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])diffs.push(i);return diffs.length===1||diffs.length===2&&diffs[1]===diffs[0]+1&&a[diffs[0]]===b[diffs[1]]&&a[diffs[1]]===b[diffs[0]];}if(a.length>b.length)[a,b]=[b,a];let i=0,j=0;while(i<a.length&&a[i]===b[j]){i++;j++;}j++;while(i<a.length&&a[i]===b[j]){i++;j++;}return i===a.length;}
 function fuzzyMatch(text,query){const terms=words(query),normalized=normalize(text);let missing=terms.filter(term=>!containsTerm(normalized,term));if(missing.length!==1||missing[0].length<5)return false;return normalized.split(' ').some(word=>word.length>=5&&editOne(word,missing[0]));}
 function searchExcerpt(item,query,related=false){
  const fields=[item.content,item.body,item.topic,item.description,item.text,item.notes,item.quote,item.summary,item.organization,item.email,item.client,item.customer,item.source,item.project,item.url,item.title,item.name,item.number]
   .filter(v=>typeof v==='string').map(v=>v.replace(/!\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/<[^>]*>/g,' ').replace(/(^|\n)\s{0,3}#{1,6}\s+/g,' ').replace(/[*_`]/g,'').replace(/\s+/g,' ').trim());
  const text=fields.find(v=>strictMatch(v,query))||(related?fields.find(v=>conceptDisplay.test(v)):null)||fields.find(v=>fuzzyMatch(v,query))||fields.find(Boolean)||'';
  let match=text.toLocaleLowerCase('nl').indexOf(query);if(match<0&&related)match=text.search(conceptDisplay);if(match<0){const term=words(query).find(t=>t.length>=2);if(term){const m=[...text.matchAll(/[\p{L}\p{N}]+/gu)].find(m=>normalize(m[0]).includes(term)||term.length>=5&&editOne(normalize(m[0]),term));if(m)match=m.index;}}let start=Math.max(0,match-65),end=Math.min(text.length,Math.max(start+190,match+query.length+65));
  if(start>0){const boundary=text.indexOf(' ',start);if(boundary>=0&&boundary<match)start=boundary+1;}
  if(end<text.length){const boundary=text.lastIndexOf(' ',end);if(boundary>Math.max(start,match+query.length))end=boundary;}
  return (start?'… ':'')+text.slice(start,end)+(end<text.length?' …':'');
 }
 function appendSearchExcerpt(parent,item,query,related=false){
  const text=searchExcerpt(item,query,related);if(!text)return;
  const p=document.createElement('p');p.className='search-excerpt';
  const terms=words(query);let cursor=0;
  if(related){const hit=conceptDisplay.exec(text);if(hit){p.append(document.createTextNode(text.slice(0,hit.index)));const mark=document.createElement('mark');mark.textContent=hit[0];p.append(mark,document.createTextNode(text.slice(hit.index+hit[0].length)));parent.append(p);return;}}
  for(const match of text.matchAll(/[\p{L}\p{N}]+/gu)){const token=normalize(match[0]);if(!terms.some(term=>term.length<=3?token===term:token.includes(term)||term.length>=5&&editOne(token,term)))continue;p.append(document.createTextNode(text.slice(cursor,match.index)));const mark=document.createElement('mark');mark.textContent=match[0];p.append(mark);cursor=match.index+match[0].length;}
  if(cursor===0&&terms.length===1&&terms[0].length>=5){const matches=[...text.matchAll(/[\p{L}\p{N}]+/gu)];for(let i=0;i<matches.length;i++){let joined='';for(let j=i;j<matches.length&&j<i+5;j++){joined+=normalize(matches[j][0]);if(joined.includes(terms[0])){const start=matches[i].index,end=matches[j].index+matches[j][0].length;p.append(document.createTextNode(text.slice(0,start)));const mark=document.createElement('mark');mark.textContent=text.slice(start,end);p.append(mark);cursor=end;break;}if(joined.length>terms[0].length*2)break;}if(cursor)break;}}
  p.append(document.createTextNode(text.slice(cursor)));parent.append(p);
 }
 const icons={Databases:"<path d=\"M4 7c0-3 24-3 24 0v20c0 3-24 3-24 0z M4 7c0 3 24 3 24 0 M4 17c0 3 24 3 24 0\"></path>","Magazine": "<path d=\"M3 4h12l2 2h12v24H17l-2-2H3z M17 6v24 M7 10h5 M7 15h5 M7 20h5 M21 12h4 M21 17h4 M21 22h4\"></path>", "Bronnenkast": "<path d=\"M3 6h6v20H3z M9 3h7v23H9z M20 5l6-1 4 21-6 1z M2 29h28 M4 11h4 M11 8h3\"></path>", "Werkbank": "<path d=\"M7 3h12l6 6v20H7z M19 3v7h6 M11 15h10 M11 20h10 M11 25h6\"></path>", "Publicatieplanner": "<path d=\"M4 7h24v22H4z M10 3v8 M22 3v8 M4 14h24 M10 20h3v3h-3z M20 20h3\"></path>", "Projectbord": "<path d=\"M3 5h6v22H3z M13 5h6v22h-6z M23 5h6v22h-6z M3 13h6 M13 18h6 M23 11h6\"></path>", "Contacten": "<path d=\"M5 4h7v8H5z M20 4h7v8h-7z M2 28v-9l4-3h5l4 3v9 M17 28v-9l4-3h5l4 3v9\"></path>", "Ping": "<path d=\"M6 23h20l-3-5v-7l-4-4h-6l-4 4v7z M16 3v4 M13 28h6 M3 8l3-3 M26 5l3 3\"></path>", "Abonnementen": "<path d=\"M6 3h13l6 6v7 M6 3v26h9 M19 3v7h6 M10 15h5 M16 19h8l6 6-6 6-8-8z\"></path><path d=\"M21 23h.01\" stroke-width=\"3\"></path>", "Kasboek": "<path d=\"M3 9h12 M9 3v12 M18 23h12 M4 29L28 3\"></path>", "Uren": "<path d=\"M10 3h12l7 7v12l-7 7H10l-7-7V10z M16 8v9h7\"/>", "Offerte": "<path d=\"M6 3h13l6 6v7 M6 3v26h9 M19 3v7h6 M10 15h5 M16 19h8l6 6-6 6-8-8z\"/><path d=\"M21 23h.01\" stroke-width=\"3\"/>"};
 let previousSearch={query:'',tool:'',kind:'',project:''};
 function search(){
  if(document.getElementById('all-search-dialog'))return;
  const localToggle=document.getElementById('suite-search-toggle'),localBar=document.getElementById('suite-search-bar');if(localBar){localBar.hidden=true;localToggle?.setAttribute('aria-expanded','false');}
  const d=document.createElement('dialog');d.id='all-search-dialog';d.className='my-tools-dialog';d.setAttribute('aria-labelledby','all-search-title');d.innerHTML="<h2 id=\"all-search-title\"><span data-i18n=\"Zoeken in je werk\">Zoeken in je werk</span></h2><label for=\"all-search-input\"><span data-i18n=\"Zoekterm\">Zoekterm</span></label><input id=\"all-search-input\" type=\"search\" placeholder=\"Een titel, naam of woord uit je tekst\" data-i18n-placeholder=\"Een titel, naam of woord uit je tekst\"><p class=\"my-tools-status\" role=\"status\"><span data-i18n=\"Je werk wordt geladen…\">Je werk wordt geladen…</span></p><ul class=\"all-search-results\"></ul>";
  const actions=document.createElement('div');actions.className='my-tools-actions wp-actions';actions.append(I18n.mark(button('Sluit',()=>d.close()),"Sluit"));const heading=document.createElement('div');heading.className='all-search-heading';const searchTitle=d.querySelector('h2');searchTitle.insertAdjacentHTML('afterbegin',"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 34\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"square\" stroke-linejoin=\"miter\" class=\"tool-symbol\" aria-hidden=\"true\" focusable=\"false\"><circle cx=\"13\" cy=\"13\" r=\"9\"/><path d=\"M20 20L29 29\"/></svg>");heading.append(searchTitle,actions);d.prepend(heading);document.body.append(d);d.addEventListener('close',()=>d.remove(),{once:true});d.showModal();const input=d.querySelector('input'),status=d.querySelector('[role=status]'),list=d.querySelector('ul');input.value=previousSearch.query;input.focus();let rows=[],errors=[],loading=true,limit=100;const more=I18n.mark(button('Meer resultaten',()=>{limit+=100;render();}), 'Meer resultaten');more.className='all-search-more';more.hidden=true;list.after(more);input.setAttribute('aria-describedby','all-search-status');status.id='all-search-status';
  if(localToggle){const localAction=I18n.mark(button('Filter dit overzicht',()=>{d.close();localToggle.click();}), 'Filter dit overzicht');localAction.setAttribute('aria-controls','suite-search-bar');d.querySelector('.my-tools-actions').prepend(localAction);}
  const filters=document.createElement('details');filters.className='all-search-filters';
  const filterTitle=document.createElement('summary');I18n.assign(filterTitle,I18n.ui('Filters','Filters'),'textContent');filters.append(filterTitle);
  const toolFilter=document.createElement('select'),kindFilter=document.createElement('select'),projectFilter=document.createElement('select');
  const kindOf=row=>row.item.kind||row.item.type||row.id;
  const option=(select,value,text,content=false)=>{const node=document.createElement('option');node.value=value;node.textContent=text;if(!content){const key=I18n.language==='en'?Object.entries(window.WerkplaatsVertalingen||{}).find(([,translation])=>translation===text)?.[0]||text:text;I18n.mark(node,key);}select.append(node);};
  for(const [select,label]of [[toolFilter,'Tool'],[kindFilter,'Soort'],[projectFilter,'Project']]){const field=document.createElement('label');field.append(I18n.node(label),select);filters.append(field);option(select,'',I18n.t('Alles'));}
  for(const id of Object.keys(catalog).filter(id=>!['Zoeken','Databases'].includes(id)&&(business()||!businessTools.includes(id))))option(toolFilter,id,catalog[id][0]);
  if(business()){option(toolFilter,'Offerte',I18n.t('Offertes'));option(toolFilter,'Uren',I18n.t('Uren'));}
  const clear=I18n.mark(button('Wis filters',()=>{toolFilter.value=kindFilter.value=projectFilter.value='';limit=100;render();}),'Wis filters');filters.append(clear);input.after(filters);
  const sourceFilters=document.createElement('div');sourceFilters.className='all-search-sources';sourceFilters.setAttribute('role','group');sourceFilters.setAttribute('aria-label',I18n.language==='en'?'Filter by source':'Filter op bron');filters.before(sourceFilters);
  const scope=document.createElement('p');scope.className='all-search-scope';filters.after(scope);
  for(const control of [toolFilter,kindFilter,projectFilter,clear])control.disabled=true;
  const kinds={note:'Notitie',project:'Project',publication:'Publicatie',meeting:'Bijeenkomst',other:'Overig',income:'Inkomst',expense:'Uitgave'};
  const fillFilters=()=>{for(const kind of [...new Set(rows.map(kindOf))])option(kindFilter,kind,I18n.t(kinds[kind]||catalog[kind]?.[0]||kind));
   for(const row of rows.filter(row=>row.id==='Publicatieplanner'&&row.item.kind==='project'))option(projectFilter,row.item.id,row.title,true);};
  for(const select of [toolFilter,kindFilter,projectFilter])select.onchange=()=>{limit=100;render();};
  function render(){
   const q=input.value.trim().toLocaleLowerCase('nl');list.replaceChildren();
   const criteria=[toolFilter,kindFilter,projectFilter].filter(select=>select.value).map(select=>select.selectedOptions[0].textContent);
   I18n.assign(scope,I18n.ui('Zoekbereik: {0}','Zoekbereik: '+(criteria.join(' · ')||I18n.t('Alle tools'))),'textContent');
   const eligible=q?rows.filter(r=>(business()||!businessTools.includes(r.id))&&(!kindFilter.value||kindOf(r)===kindFilter.value)&&(!projectFilter.value||r.item.projectId===projectFilter.value||(r.item.projectIds||[]).includes(projectFilter.value)||r.id==='Publicatieplanner'&&r.item.id===projectFilter.value)):[];
   const exact=eligible.filter(r=>strictMatch(r.text,q)),exactSet=new Set(exact);
   const related=eligible.filter(r=>!exactSet.has(r)&&relatedMatch(r.text,q)),relatedSet=new Set(related);
   const withinScope=[...exact,...related].filter(r=>!toolFilter.value||r.id===toolFilter.value).length;
   const approximate=withinScope<3?eligible.filter(r=>!exactSet.has(r)&&!relatedSet.has(r)&&fuzzyMatch(r.text,q)):[];
   const matched=[...exact,...related,...approximate];
   sourceFilters.replaceChildren();
   for(const id of ['',...new Set(rows.map(r=>r.id))]){const count=id?matched.filter(r=>r.id===id).length:matched.length;const name=id?(id==='Uren'?I18n.t('Uren'):id==='Offerte'?I18n.t('Offertes'):catalog[id][0]):I18n.t('Alles');const b=button(name+' ('+count+')',()=>{toolFilter.value=id;limit=100;render();sourceFilters.querySelector('[aria-pressed=true]')?.focus();});b.disabled=loading;b.setAttribute('aria-pressed',String(toolFilter.value===id));sourceFilters.append(b);}
   const score=r=>(exactSet.has(r)?20:relatedSet.has(r)?10:0)+(normalize(r.title)===normalize(q)?3:strictMatch(r.title,q)?2:0);
   const found=matched.filter(r=>!toolFilter.value||r.id===toolFilter.value).map((row,index)=>({row,index})).sort((a,b)=>score(b.row)-score(a.row)||a.index-b.index).map(x=>x.row);
   list.setAttribute('aria-busy',String(loading));
   more.hidden=loading||found.length<=limit;
   const text=loading?I18n.t('Je werk wordt geladen…'):(q?found.length+' '+I18n.t(found.length===1?'resultaat':'resultaten')+(found.length>limit?' · '+I18n.value(I18n.ui('eerste {0} getoond','eerste '+limit+' getoond')):'')+(found.length===0?' · '+I18n.t('Probeer een ander woord.'):''):I18n.t('Zoek in alle tools of beperk je zoekbereik met Filters.'))+(errors.length?' '+I18n.value(I18n.ui('Niet geladen: {0}. Open Zoeken opnieuw.','Niet geladen: '+errors.join(', ')+'. Open Zoeken opnieuw.')):'');
   status.textContent=text;
   for(const row of found.slice(0,limit)){
    const li=document.createElement('li'),a=document.createElement('a'),meta=document.createElement('small');const param={Bronnenkast:'bron',Publicatieplanner:'plan',Contacten:'contact',Projectbord:'taak-bekijken',Werkbank:row.item.kind==='note'?'notitie':'document-pad'}[row.id];
    a.href=toolURL(row.id,param?{[param]:row.id==='Werkbank'&&row.item.kind!=='note'?row.item.path:row.item.id}:{zoek:row.title});if(row.id==='Werkbank'){const target=new URL(a.href);target.searchParams.set('zoekpassage',input.value.trim());a.href=target.href;}a.textContent=row.title;I18n.assign(meta,(row.id==='Uren'?I18n.ui("Factureren · Uren",'Factureren · Uren'):(row.id==='Offerte'?I18n.ui("Factureren · Offertes",'Factureren · Offertes'):catalog[row.id][0])),"textContent");const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 32 34');icon.setAttribute('fill','none');icon.setAttribute('stroke','currentColor');icon.setAttribute('stroke-width','2.4');icon.setAttribute('stroke-linecap','square');icon.setAttribute('stroke-linejoin','miter');icon.setAttribute('aria-hidden','true');icon.innerHTML=icons[row.id]||'';meta.prepend(icon,document.createTextNode(' '));if(row.id==='Werkbank'&&row.item.kind!=='note'&&row.item.path){const parts=row.item.path.split('/');parts.pop();if(parts.length)meta.append(document.createTextNode(' · '+parts.join(' / ')));}if(row.id==='Projectbord'&&row.item.state){const labels={inbox:'Inbox',todo:'Te doen',doing:'Bezig',done:'Klaar',archive:'Archief'};meta.append(document.createTextNode(' · '+(labels[row.item.state]||row.item.state)));}if(relatedSet.has(row))meta.append(document.createTextNode(' · '+(I18n.language==='en'?'Related term':'Verwant begrip')));li.append(a,meta);appendSearchExcerpt(li,row.item,q,relatedSet.has(row));list.append(li);
   }
  }
  input.oninput=()=>{limit=100;render();};
  const ids=Object.keys(catalog).filter(id=>!['Zoeken','Databases'].includes(id)&&(business()||!businessTools.includes(id)));if(business())ids.push('Offerte','Uren');
  Promise.allSettled(ids.map(async id=>{const session=await BewaarAlles.readTool(id);return searchRows(id,session,id==='Werkbank'?await BewaarAlles.readShared():{});})).then(results=>{if(!d.open)return;results.forEach((result,i)=>{if(result.status==='fulfilled')rows.push(...result.value);else errors.push(ids[i]==='Uren'?'Uren':ids[i]==='Offerte'?'Offertes':catalog[ids[i]][0]);});loading=false;fillFilters();for(const control of [toolFilter,kindFilter,projectFilter,clear])control.disabled=false;toolFilter.value=previousSearch.tool;kindFilter.value=previousSearch.kind;projectFilter.value=previousSearch.project;render();});
  document.addEventListener('gereedschappen-gewijzigd',render);document.addEventListener('taal-gewijzigd',render);d.addEventListener('close',()=>{previousSearch={query:input.value,tool:toolFilter.value,kind:kindFilter.value,project:projectFilter.value};document.removeEventListener('gereedschappen-gewijzigd',render);document.removeEventListener('taal-gewijzigd',render);},{once:true});
 }
 function mountSearch(){
  const host=document.querySelector('.workspace-strip')||document.querySelector('.suite-navigation')||document.querySelector('.shell > header');if(!host)return;
  let control=document.getElementById('workspace-search');if(!control){control=button('Zoeken',search);control.id='workspace-search';control.className='my-tools-trigger';control.setAttribute('aria-haspopup','dialog');control.setAttribute('aria-controls','all-search-dialog');control.setAttribute('aria-keyshortcuts','Meta+K Control+K');host.append(control);}
  const label=()=>{const active=document.getElementById('suite-search-toggle')?.dataset.active==='true';I18n.assign(control,I18n.ui(active?'Zoeken · filters actief':'Zoeken',active?'Zoeken · filters actief':'Zoeken'),'textContent');};label();document.addEventListener('taal-gewijzigd',label);document.addEventListener('zoekfilters-gewijzigd',label);
  const local=document.getElementById('suite-search-toggle');if(local)local.hidden=true;
  window.addEventListener('keydown',event=>{if(event.isComposing||event.altKey||event.shiftKey||!(event.metaKey||event.ctrlKey)||event.key.toLowerCase()!=='k')return;const open=document.querySelector('dialog[open]');event.preventDefault();event.stopImmediatePropagation();if(open&&open.id!=='all-search-dialog')return;if(!event.repeat){if(open)open.close();else search();}},true);
 }
 async function mount(){
  await ready;if(mounted)return;mounted=true;
  const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('mijn-gereedschappen.css?v=20261010-personalisatie-6',base).href;document.head.insertBefore(style,document.querySelector('link[href*="blom-os-tokens.css"]'));
  const tool=document.querySelector('script[data-tool]')?.dataset.tool;
  if(!tool)document.addEventListener('keydown',async event=>{
   if(event.isComposing||!event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!/^Digit[0-9]$/.test(event.code))return;
   if(document.querySelector('dialog[open]')||event.composedPath().some(el=>el?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName)))return;
   if(event.code==='Digit0'){event.preventDefault();return;}
   const entry=shortcut(Number(event.code.slice(-1)));if(!entry)return;
   event.preventDefault();if(event.repeat)return;
   if(entry[0]==='Zoeken'){search();return;}
   try{await BewaarAlles.flush();location.assign(toolURL(entry[0]));}catch(error){const message=document.getElementById('wm-message');if(message)I18n.assign(message,I18n.ui("Niet overgestapt: {0}",'Niet overgestapt: '+error.message),"textContent");}
  });

  const parent=document.querySelector('.suite-navigation')||document.querySelector('.shell > header');mountSettings(parent);
  mountSearch();
  function welcome(){const box=document.getElementById('business-onboarding');if(box)box.hidden=typeof preferences.business==='boolean'||Array.isArray(preferences.order);}
  document.getElementById('choose-business')?.addEventListener('click',settings);welcome();document.addEventListener('gereedschappen-gewijzigd',welcome);
  document.addEventListener('werkmap-gekozen',()=>reload().catch(console.error));document.addEventListener('werkruimte-klaar',()=>reload().catch(console.error));window.addEventListener('focus',()=>reload().catch(console.error));
  document.querySelector('[data-open-search]')?.addEventListener('click',search);
  document.querySelector('[data-enable-business]')?.addEventListener('click',settings);
  if(businessTools.includes(tool)){
   const p=document.createElement('p');p.className='business-disabled-note';p.append(I18n.node('Administratie staat uit in je overzicht. Je bestaande werk blijft beschikbaar. '),I18n.mark(button('Mijn gereedschappen',settings),"Mijn gereedschappen"));document.querySelector('main').prepend(p);
  }
  if(!tool&&!new URL(location.href).searchParams.has('home')&&startTool()){
   try{await BewaarAlles.flush();window.WerkplaatsOvergangen?.leave();window.GereedschapskistNavigating=true;location.replace(toolURL(startTool()));}
   catch(error){window.WerkplaatsOvergangen?.reset();const message=document.getElementById('wm-message');if(message)I18n.assign(message,I18n.ui("Starttool niet geopend: {0}",'Starttool niet geopend: '+error.message),"textContent");}
  }
  const taskView=new URL(location.href).searchParams.get('taak-bekijken');if(tool==='Projectbord'&&taskView&&typeof viewTask==='function')viewTask(taskView);
  const q=new URL(location.href).searchParams.get('zoek');if(q){const field=document.getElementById('suite-search')||document.getElementById('search');if(field){field.value=q;field.dispatchEvent(new Event('input',{bubbles:true}));}}
 }
 return {ready,mount,entries,catalog,startTool,setPreferences,setAppearance,setLanguage,shortcut,shortcutText,business,setBusiness,search,settings,toolURL,searchRows,reload,choices:key=>window.WerkplaatsPersonalisatie?.choices(key)||[],get configured(){return typeof preferences.business==='boolean';}};
})();
