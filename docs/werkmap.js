'use strict';
// One directory handle per installation/origin; files remain ordinary user files.
window.Werkmap=(()=>{
 const catalog={Werkbank:['Schrijven',null],Ping:['Factureren','factureren'],Projectbord:['Doen','doen'],Bronnenkast:['Verzamelen','verzamelen'],Uren:['Uren schrijven','uren-schrijven'],Contacten:['Contact houden','contact-houden'],Publicatieplanner:['Plannen','plannen'],Offerte:['Offreren','offreren'],Kasboek:['Boekhouden','boekhouden'],Abonnementen:['Abonnementen','abonnementen']};
 const tool=document.querySelector('script[data-tool]')?.dataset.tool,example=window.GereedschapskistMode?.example;
 const supported='showDirectoryPicker' in window&&!!window.indexedDB,dbName='gereedschapskist-werkmap-v1';
 let root=null,revision=null,db=null,adapter=null,box=null,busy=false,starting=false;const known=new Map();let adapterResolve;const adapterReady=new Promise(resolve=>adapterResolve=resolve);
 const $=id=>document.getElementById('wm-'+id);
 function message(text){if($('message'))$('message').textContent=text;}
 function pickerStopped(){return 'De browser heeft geen map doorgegeven. Het kiezen kan zijn afgebroken of de maptoegang kan zijn geweigerd. Heb je wel een map bevestigd? Gebruik Chrome of Edge op je computer en kies dezelfde map. Je huidige werk blijft behouden.';}
 function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open(dbName,1);r.onupgradeneeded=()=>r.result.createObjectStore('settings');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 function setting(action,value){return new Promise((resolve,reject)=>{const tx=db.transaction('settings',action==='get'?'readonly':'readwrite'),s=tx.objectStore('settings'),r=action==='get'?s.get('root'):action==='delete'?s.delete('root'):s.put(value,'root');tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error(I18n.value(I18n.ui("Mapkeuze niet bewaard.",'Mapkeuze niet bewaard.'))));});}
 const ready=(async()=>{if(!supported||example)return;try{db=await database();const saved=await setting('get');root=saved?.handle||null;revision=saved?.revision||null;}catch{message(I18n.value(I18n.ui("De mapkeuze kon niet worden onthouden. Kies de map opnieuw.",'De mapkeuze kon niet worden onthouden. Kies de map opnieuw.')));}})();
 async function recall(){
  await ready;
  if(root||!db||example)return !!root;
  const saved=await setting('get');
  if(saved?.handle){root=saved.handle;revision=saved.revision||null;render();document.dispatchEvent(new CustomEvent('werkmap-herinnerd'));}
  return !!root;
 }
 async function permission(handle){if(await handle.queryPermission({mode:'readwrite'})!=='granted'&&await handle.requestPermission({mode:'readwrite'})!=='granted')throw Error(I18n.value(I18n.ui("Geen toegang tot je werkmap. Geef toestemming of gebruik Download kopie.",'Geen toegang tot je werkmap. Geef toestemming of gebruik Download kopie.')));}
 async function checkRoot(){await recall();if(!root)throw Error(I18n.value(I18n.ui("Kies eerst een werkmap.",'Kies eerst een werkmap.')));if(db){const saved=await setting('get');if(saved?.revision!==revision)throw Error(I18n.value(I18n.ui("De werkmap is in een ander venster veranderd. Herlaad deze tool voordat je verdergaat.",'De werkmap is in een ander venster veranderd. Herlaad deze tool voordat je verdergaat.')));}}
 async function folder(){await checkRoot();await permission(root);return root.getDirectoryHandle(catalog[tool][0],{create:true});}
 async function existing(dir,name){try{return await dir.getFileHandle(name);}catch(e){if(e.name==='NotFoundError')return null;throw e;}}
 function filename(){return 'gereedschapskist-'+catalog[tool][1]+'.json';}
 function safeName(name){if(typeof name!=='string'||!name.trim()||name.length>160||/[\\/:*?"<>|\u0000-\u001f]/.test(name)||name==='.'||name==='..')throw Error(I18n.value(I18n.ui("Gebruik een korte bestandsnaam zonder schuine strepen of bijzondere tekens.",'Gebruik een korte bestandsnaam zonder schuine strepen of bijzondere tekens.')));return name.trim();}
 async function choose(selectedHandle=null,{requireExisting=false}={}){
  if(!selectedHandle&&!requireExisting&&await recall()){await permission(root);return true;}
  if(busy)return;busy=true;const button=$('choose');if(button)button.disabled=true;if(box)box.open=true;
  message(I18n.value(I18n.ui("Kies een map in het mapvenster en geef toegang. Verschijnt er geen venster? Probeer deze pagina in Chrome of Edge.",'Kies een map in het mapvenster en geef toegang. Verschijnt er geen venster? Probeer deze pagina in Chrome of Edge.')));
  let stage='picker';
  try{
   const handle=selectedHandle?.kind==='directory'?selectedHandle:await showDirectoryPicker({id:'gereedschapskist',mode:'readwrite'});
   stage='permission';message(I18n.value(I18n.ui("Toegang controleren voor {0}…",'Toegang controleren voor '+handle.name+'…')));await permission(handle);
   const same=!!root&&await root.isSameEntry(handle);
   if(root&&!same&&window.BewaarAlles&&!(await BewaarAlles.canChoose()))throw Error(I18n.value(I18n.ui("Sluit andere toolvensters voordat je een andere werkmap opent.",'Sluit andere toolvensters voordat je een andere werkmap opent.')));
   stage='folders';message(I18n.value(I18n.ui("Werkmap controleren: {0}…",'Werkmap controleren: '+handle.name+'…')));
   stage='remember';message(I18n.value(I18n.ui("Werkmap onthouden…",'Werkmap onthouden…')));
   let rev=same?revision:null;
   try{const info=JSON.parse(await(await(await handle.getFileHandle('gereedschapskist-werkmap.json')).getFile()).text());if(info.format!=='gereedschapskist-werkmap'||typeof info.id!=='string')throw Error(I18n.value(I18n.ui("Ongeldige werkmapgegevens.",'Ongeldige werkmapgegevens.')));rev=info.id;}
   catch(e){if(e.name!=='NotFoundError')throw e;}
   const round=await window.BewaarAlles?.readRound(handle);
   if(requireExisting&&!rev&&!round)throw Error(I18n.value(I18n.ui("Dit is geen Werkplaats-werkmap. Kies de hoofdmap waarin je eerder je werk hebt bewaard.",'Dit is geen Werkplaats-werkmap. Kies de hoofdmap waarin je eerder je werk hebt bewaard.')));
   if(!rev)rev=crypto.randomUUID();
   if(!await existing(handle,'gereedschapskist-werkmap.json')){const h=await handle.getFileHandle('gereedschapskist-werkmap.json',{create:true}),w=await h.createWritable();await w.write(JSON.stringify({format:'gereedschapskist-werkmap',version:1,id:rev},null,2));await w.close();}
   if(!same&&round&&!confirm(I18n.value(I18n.ui("Open de bewaarde Werkplaats in {0}? Dit vervangt je huidige browserwerk. Bewaar dat eerst als je het wilt houden.",'Open de bewaarde Werkplaats in '+handle.name+'? Dit vervangt je huidige browserwerk. Bewaar dat eerst als je het wilt houden.'))))return;
   if(db)await setting('put',{handle,revision:rev});
   root=handle;revision=rev;known.clear();render();
   localStorage.setItem('gereedschapskist-suite-mode','eigen');
   const opened=!same&&round?await BewaarAlles.openChosen(handle,rev):false;
   message(I18n.value((opened?I18n.ui("Werkmap {0} geopend. Alle bewaarde tools staan klaar.",'Werkmap '+handle.name+' geopend. Alle bewaarde tools staan klaar.'):I18n.ui("Werkmap: {0}. Bewaar alles bewaart je werk en concepten uit alle tools hier.",'Werkmap: '+handle.name+'. Bewaar alles bewaart je werk en concepten uit alle tools hier.'))));
   document.dispatchEvent(new CustomEvent('werkmap-gekozen'));
   return true;

  }catch(e){
   if(e.name==='AbortError'&&stage==='picker')message(pickerStopped());
   else message(I18n.value(I18n.ui("Werkmap niet gekoppeld ({0}): {1}{2} Bestand openen en downloaden blijven beschikbaar.",'Werkmap niet gekoppeld ('+({picker:'mapvenster',permission:'toegang',folders:'toolmappen aanmaken',remember:'mapkeuze onthouden'}[stage])+'): '+e.message+(root?' Je vorige werkmap blijft gekoppeld.':'')+' Bestand openen en downloaden blijven beschikbaar.')));
  }finally{busy=false;if(button)button.disabled=false;}
 }

 function chooseNewLocation(){return new Promise((resolve,reject)=>{
  const dialog=document.createElement('dialog');dialog.className='wm-dialog';dialog.setAttribute('aria-labelledby','new-location-title');
  const title=document.createElement('h2');title.id='new-location-title';I18n.assign(title,I18n.ui("Waar mag je Werkplaats komen?",'Waar mag je Werkplaats komen?'),"textContent");
  const text=document.createElement('p');I18n.assign(text,I18n.ui("Kies een opslagplek. Wij maken daarin Mijn Werkplaats met negen submappen. Sommige plekken, zoals de hele map Documenten, kunnen door je browser worden geweigerd.",'Kies een opslagplek. Wij maken daarin Mijn Werkplaats met negen submappen. Sommige plekken, zoals de hele map Documenten, kunnen door je browser worden geweigerd.'),"textContent");
  const hint=document.createElement('p');I18n.assign(hint,I18n.ui("Gebruik Chrome of Edge op je computer. Wordt alleen de gekozen opslagplek geweigerd? Gebruik dan de handmatige optie voor een lege hoofdmap.",'Gebruik Chrome of Edge op je computer. Wordt alleen de gekozen opslagplek geweigerd? Gebruik dan de handmatige optie voor een lege hoofdmap.'),"textContent");
  const cancel=document.createElement('button');I18n.assign(cancel,I18n.ui("Annuleer",'Annuleer'),"textContent");cancel.onclick=()=>dialog.close();
  const pick=document.createElement('button');I18n.assign(pick,I18n.ui("Kies opslagplek",'Kies opslagplek'),"textContent");pick.className='primary action-primary';
  const manual=document.createElement('button');I18n.assign(manual,I18n.ui("Zelf een lege hoofdmap kiezen",'Zelf een lege hoofdmap kiezen'),"textContent");let picked=false;
  const select=async(direct)=>{pick.disabled=manual.disabled=true;try{const handle=await showDirectoryPicker({id:'gereedschapskist-plek',mode:'readwrite'});picked=true;dialog.close();resolve({handle,direct});}catch(e){picked=true;dialog.close();reject(e);}};
  pick.onclick=()=>select(false);
  manual.onclick=()=>{I18n.assign(text,I18n.ui("Maak in het mapvenster een nieuwe map, bijvoorbeeld Mijn Werkplaats. Selecteer die lege map en bevestig met Selecteer of Open. Er komt geen extra hoofdmap in.",'Maak in het mapvenster een nieuwe map, bijvoorbeeld Mijn Werkplaats. Selecteer die lege map en bevestig met Selecteer of Open. Er komt geen extra hoofdmap in.'),"textContent");pick.hidden=true;I18n.assign(manual,I18n.ui("Selecteer de lege hoofdmap",'Selecteer de lege hoofdmap'),"textContent");manual.onclick=()=>select(true);};
  dialog.onclose=()=>{dialog.remove();if(!picked)reject(Object.assign(new Error(I18n.value(I18n.ui("Geannuleerd",'Geannuleerd'))),{name:'UserCancelledError'}));};dialog.append(title,text,hint,cancel,pick,manual);document.body.append(dialog);dialog.showModal();
 });}
 async function startNew(){
  if(busy||starting)return false;starting=true;let stage='map kiezen';
  message(I18n.value(I18n.ui("Kies een opslagplek. Wij maken de hoofdmap en negen submappen.",'Kies een opslagplek. Wij maken de hoofdmap en negen submappen.')));
  try{
   const selection=await chooseNewLocation();let handle=selection.handle;
   stage='toegang controleren';await ready;await permission(handle);await allReady;await BewaarAlles.ready;
   if(!(await BewaarAlles.canChoose()))throw Error(I18n.value(I18n.ui("Sluit de andere toolvensters voordat je nieuw begint. Hun werk blijft behouden.",'Sluit de andere toolvensters voordat je nieuw begint. Hun werk blijft behouden.')));
   if(!selection.direct){
    let name='Mijn Werkplaats';
    while(true){
     let exists=false;try{await handle.getDirectoryHandle(name);exists=true;}catch(e){if(e.name==='TypeMismatchError')exists=true;else if(e.name!=='NotFoundError')throw e;}
     if(!exists)break;
     const answer=prompt(I18n.value(I18n.ui("{0} bestaat al. Kies een andere naam voor nieuw werk, of annuleer en kies Verder werken.",name+' bestaat al. Kies een andere naam voor nieuw werk, of annuleer en kies Verder werken.')),'Mijn Werkplaats 2');
     if(answer===null)return false;name=safeName(answer);
    }
    handle=await handle.getDirectoryHandle(name,{create:true});
   }
   for await(const entry of handle.values())throw Error(I18n.value(I18n.ui("Deze map is niet leeg. Maak en selecteer een nieuwe, lege map. Wil je bestaand werk openen? Kies Verder werken. Er is niets in deze map gewijzigd.",'Deze map is niet leeg. Maak en selecteer een nieuwe, lege map. Wil je bestaand werk openen? Kies Verder werken. Er is niets in deze map gewijzigd.')));
   // Preserve the current workspace before moving to an empty one.
   const hadRoot=!!root;if(hadRoot)await BewaarAlles.save();
   stage='submappen aanmaken';
   for(const [label]of Object.values(catalog))await handle.getDirectoryHandle(label,{create:true});
   stage='startdocumenten aanmaken';await Startwerkmap.create(handle);
   if(!await choose(handle))return false;
   stage='eerste bewaarkopie maken';await BewaarAlles.save();
   message(I18n.value(I18n.ui("Klaar: {0}. Open Schrijven: Inbox, In bewerking en Klaar staan klaar met elk een startdocument.",'Klaar: '+handle.name+'. Open Schrijven: Inbox, In bewerking en Klaar staan klaar met elk een startdocument.')));
   return true;
  }catch(e){message(I18n.value((e.name==='UserCancelledError'?I18n.ui("Geen werkmap gekoppeld. Je huidige werk blijft behouden.",'Geen werkmap gekoppeld. Je huidige werk blijft behouden.'):(e.name==='AbortError'&&stage==='map kiezen'?pickerStopped():I18n.ui("Niet gestart bij {0}: {1}",'Niet gestart bij '+stage+': '+e.message)))));return false;}finally{starting=false;}
 }
 async function continueWork(){
  await recall();await allReady;
  if(!root)return choose(null,{requireExisting:true});
  try{await permission(root);await checkRoot();const round=await BewaarAlles.readRound(root);if(round&&!await BewaarAlles.restore())return false;message(I18n.value(I18n.ui("Werkmap {0} geopend. Kies hieronder de tool waarmee je verder wilt.",'Werkmap '+root.name+' geopend. Kies hieronder de tool waarmee je verder wilt.')));return true;}
  catch(e){message(I18n.value(I18n.ui("Niet geopend: {0} Kies zo nodig een andere werkmap via Meer & uitleg.",'Niet geopend: '+e.message+' Kies zo nodig een andere werkmap via Meer & uitleg.')));return false;}
 }

 async function load(){if(busy)return;busy=true;try{await ready;const dir=await folder();let name=filename();if(tool==='Werkbank'){
  const names=[];for await(const h of dir.values())if(h.kind==='file'&&/\.(md|markdown|txt)$/i.test(h.name))names.push(h.name);
  names.sort((a,b)=>a.localeCompare(b,'nl'));if(!names.length)throw Error(I18n.value(I18n.ui("De map Schrijven is nog leeg. Maak een nieuw document en bewaar het.",'De map Schrijven is nog leeg. Maak een nieuw document en bewaar het.')));
  const dialog=document.createElement('dialog');dialog.className='wm-dialog';const title=document.createElement('h2');I18n.assign(title,I18n.ui("Document uit je werkmap",'Document uit je werkmap'),"textContent");const select=document.createElement('select');I18n.attribute(select,'aria-label',I18n.ui("Document",'Document'));for(const n of names)select.add(new Option(n,n));const cancel=document.createElement('button');I18n.assign(cancel,I18n.ui("Annuleer",'Annuleer'),"textContent");const open=document.createElement('button');I18n.assign(open,I18n.ui("Document openen",'Document openen'),"textContent");dialog.append(title,select,cancel,open);document.body.append(dialog);
  name=await new Promise(resolve=>{cancel.onclick=()=>dialog.close();dialog.oncancel=e=>{e.preventDefault();dialog.close()};dialog.onclose=()=>resolve(null);open.onclick=()=>{resolve(select.value);dialog.close()};dialog.showModal()});dialog.remove();if(!name)return;
 }
 const handle=await existing(dir,name);if(!handle)throw Error(I18n.value(I18n.ui("Nog geen bestand in deze toolmap. Open een bestaand bestand of begin nieuw en kies Bewaar.",'Nog geen bestand in deze toolmap. Open een bestaand bestand of begin nieuw en kies Bewaar.')));
 const file=await handle.getFile();if(file.size>20000000)throw Error(I18n.value(I18n.ui("Het bestand is groter dan 20 MB.",'Het bestand is groter dan 20 MB.')));const raw=await file.text();
 if(await adapter.load(file,{dir,handle,path:root.name+'/'+catalog[tool][0]+'/'+name})){known.set(name,raw);adapter.bound?.(name);Werkstatus.opened(root.name+'/'+catalog[tool][0]+'/'+name);message(I18n.value(I18n.ui("Geopend uit je werkmap. Bewaar schrijft voortaan hier terug.",'Geopend uit je werkmap. Bewaar schrijft voortaan hier terug.')));}
 }catch(e){if(e.name!=='AbortError')message(I18n.value(I18n.ui("Niet geopend: {0}",'Niet geopend: '+e.message)));}finally{busy=false;}}
 async function write(dir,name,text){
  const operation=async()=>{
   await checkRoot();adapter.check?.();let handle=await existing(dir,name),old=null;
   if(handle){const file=await handle.getFile();if(file.size>20000000)throw Error(I18n.value(I18n.ui("Het bestaande bestand is te groot.",'Het bestaande bestand is te groot.')));old=await file.text();if(!known.has(name)){
    if(tool==='Werkbank'&&adapter?.acceptExisting&&await adapter.acceptExisting(name,old,text))known.set(name,old);
    else throw Error(I18n.value(I18n.ui("Het bestaande bestand is niet vervangen. Je bewerking blijft open.",'Het bestaande bestand is niet vervangen. Je bewerking blijft open.')));
   }if(known.get(name)!==old)throw Error(I18n.value(I18n.ui("Dit bestand is buiten dit venster gewijzigd. Er is niets overschreven. Download eerst je wijzigingen als kopie en open daarna het actuele werkmapbestand.",'Dit bestand is buiten dit venster gewijzigd. Er is niets overschreven. Download eerst je wijzigingen als kopie en open daarna het actuele werkmapbestand.')));}
   else if(known.has(name))throw Error(I18n.value(I18n.ui("Het eerder geopende bestand is verplaatst of verwijderd. Kies de werkmap opnieuw voordat je verdergaat.",'Het eerder geopende bestand is verplaatst of verwijderd. Kies de werkmap opnieuw voordat je verdergaat.')));
   if(old===text)return;
   if(handle){const backups=await dir.getDirectoryHandle('Herstelkopieen',{create:true}),stamp=new Date().toISOString().replace(/[:.]/g,'-'),backup=await backups.getFileHandle(stamp+'-'+crypto.randomUUID()+'-'+name,{create:true});const stream=await backup.createWritable();try{await stream.write(old);await stream.close()}catch(e){try{await stream.abort()}catch{}throw e;}if(await (await backup.getFile()).text()!==old)throw Error(I18n.value(I18n.ui("Herstelkopie niet bevestigd. Het origineel blijft behouden.",'Herstelkopie niet bevestigd. Het origineel blijft behouden.')));if(await (await handle.getFile()).text()!==old)throw Error(I18n.value(I18n.ui("Het bestand is ondertussen gewijzigd. Het origineel blijft behouden.",'Het bestand is ondertussen gewijzigd. Het origineel blijft behouden.')));}
   // Exclusive writers prevent another supported writer from overwriting concurrently.
   if(!handle){handle=await dir.getFileHandle(name,{create:true});if((await handle.getFile()).size!==0)throw Error(I18n.value(I18n.ui("Er is ondertussen een bestand met deze naam gemaakt. Open het eerst.",'Er is ondertussen een bestand met deze naam gemaakt. Open het eerst.')));known.set(name,'');}const stream=await handle.createWritable({mode:'exclusive'});
   try{adapter.check?.();if(old!==null&&await(await handle.getFile()).text()!==old)throw Error(I18n.value(I18n.ui("Bestand intussen gewijzigd.",'Bestand intussen gewijzigd.')));await stream.write(text);await stream.close()}catch(e){try{await stream.abort()}catch{}throw e;}
   if(await(await handle.getFile()).text()!==text)throw Error(I18n.value(I18n.ui("Bewaar kon niet worden bevestigd. Controleer het bestand en de herstelkopie.",'Bewaar kon niet worden bevestigd. Controleer het bestand en de herstelkopie.')));
  };
  if(navigator.locks)await navigator.locks.request('gereedschapskist-werkmap:'+catalog[tool][0]+':'+name,operation);else await operation();
  known.set(name,text);
 }
 async function save(){await recall();if(tool==='Werkbank'&&adapter?.ownsSave?.())return await adapter.saveOwn();if(!root||example){message(I18n.value(I18n.ui("Niet opgeslagen: open eerst je eigen werkmap.",'Niet opgeslagen: open eerst je eigen werkmap.')));return false;}if(busy){message(I18n.value(I18n.ui("Er loopt nog een bestandsactie. Wacht tot die klaar is en probeer opnieuw.",'Er loopt nog een bestandsactie. Wacht tot die klaar is en probeer opnieuw.')));return false;}busy=true;if(box)box.open=true;message(I18n.value(I18n.ui("Bezig met bewaren…",'Bezig met bewaren…')));
 try{const dir=await folder();if(!adapter.prepare())return false;let name=filename(),text,signature;
  if(tool==='Werkbank'){const doc=adapter.read();if(!doc)throw Error(I18n.value(I18n.ui("Open of maak eerst een document.",'Open of maak eerst een document.')));name=adapter.name();if(!name){const choice=prompt(I18n.value(I18n.ui("Naam voor dit document in Schrijven:",'Naam voor dit document in Schrijven:')),doc.name||'Nieuw document.md');if(choice===null)return false;name=safeName(choice);if(!/\.(md|markdown|txt)$/i.test(name))name+='.md';}text=doc.content;signature=JSON.stringify(doc);}
  else{text=JSON.stringify(adapter.read(),null,2)+'\n';signature=JSON.stringify(adapter.read());}
  if(new Blob([text]).size>20000000)throw Error(I18n.value(I18n.ui("Bestand groter dan 20 MB.",'Bestand groter dan 20 MB.')));
  await write(dir,name,text);adapter.bound?.(name);
  // Never mark edits made during a slow disk write as saved.
  if(JSON.stringify(adapter.read())===signature){await adapter.saved?.(name,{dir,handle:await existing(dir,name),path:root.name+'/'+catalog[tool][0]+'/'+name});Werkstatus.opened(root.name+'/'+catalog[tool][0]+'/'+name);Werkstatus.written();message(I18n.value(I18n.ui("Opgeslagen in {0}/{1}/{2}.",'Opgeslagen in '+root.name+'/'+catalog[tool][0]+'/'+name+'.')));}
  else message(I18n.value(I18n.ui("De eerdere versie is opgeslagen. Er zijn ondertussen nieuwe wijzigingen; bewaar opnieuw.",'De eerdere versie is opgeslagen. Er zijn ondertussen nieuwe wijzigingen; bewaar opnieuw.')));
  return true;
 }catch(e){message(I18n.value(I18n.ui("Niet opgeslagen: {0}",'Niet opgeslagen: '+e.message)));return false;}finally{busy=false;if($('message')?.textContent==='Bezig met bewaren…')message(I18n.value(I18n.ui("Niet opgeslagen. Je invoer blijft behouden.",'Niet opgeslagen. Je invoer blijft behouden.')));}}

 async function readContacts(){
  await ready;if(!root||example)return null;
  await checkRoot();await permission(root);
  try{const dir=await root.getDirectoryHandle('Contact houden');return await(await dir.getFileHandle('gereedschapskist-contact-houden.json')).getFile();}
  catch(e){if(e.name==='NotFoundError')return null;throw e;}
 }

 async function exportFile(blob,name){
  await ready;if(!root||example)return false;if(busy){message(I18n.value(I18n.ui("Er loopt nog een bestandsactie. Probeer deze export daarna opnieuw.",'Er loopt nog een bestandsactie. Probeer deze export daarna opnieuw.')));return false;}busy=true;if(box)box.open=true;
  try{const dir=await(await folder()).getDirectoryHandle('Exports',{create:true});name=safeName(name);if(await existing(dir,name))name=new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8)+'-'+name;
   const file=await dir.getFileHandle(name,{create:true});if((await file.getFile()).size!==0)throw Error(I18n.value(I18n.ui("Er bestaat ondertussen al een export met deze naam. Probeer opnieuw.",'Er bestaat ondertussen al een export met deze naam. Probeer opnieuw.')));let stream;try{stream=await file.createWritable({mode:'exclusive'});await stream.write(blob);await stream.close()}catch(e){try{await stream?.abort()}catch{}try{if((await file.getFile()).size===0)await dir.removeEntry(name)}catch{}throw e;}
   if((await file.getFile()).size!==blob.size)throw Error(I18n.value(I18n.ui("Bestandsgrootte niet bevestigd.",'Bestandsgrootte niet bevestigd.')));
   message(I18n.value(I18n.ui("Export opgeslagen in {0}/{1}/Exports/{2}.",'Export opgeslagen in '+root.name+'/'+catalog[tool][0]+'/Exports/'+name+'.')));return true;
  }catch(e){message(I18n.value(I18n.ui("Export niet opgeslagen: {0}",'Export niet opgeslagen: '+e.message)));return false;}finally{busy=false;}
 }


 async function backup(){
  const button=$('backup');if(button.disabled)return;button.disabled=true;
  try{await allReady;await BewaarAlles.save();}catch(e){message(I18n.value(I18n.ui("Niet alles bewaard: {0}",'Niet alles bewaard: '+e.message)));}finally{button.disabled=false;}
 }
 const werkmapScriptURL=document.currentScript.src;
 const allReady=new Promise((resolve,reject)=>{const s=document.createElement('script');const saveScriptURL=new URL('bewaar-alles.js',werkmapScriptURL);saveScriptURL.searchParams.set('v','20261008-remember-workmap-1');s.src=saveScriptURL.href;s.onload=resolve;s.onerror=()=>reject(Error(I18n.value(I18n.ui("Bewaar alles kon niet laden. Ververs de pagina.",'Bewaar alles kon niet laden. Ververs de pagina.'))));document.head.append(s);});
 allReady.catch(()=>{});window.BewaarAllesReady=allReady;
 const taxScript=document.createElement('script');taxScript.src=new URL('belastingtarieven.js?v=20261006-tax-rates-1',werkmapScriptURL).href;document.head.append(taxScript);
 window.MijnGereedschappenReady=new Promise((resolve,reject)=>{const load=()=>{const s=document.createElement('script');s.src=new URL('mijn-gereedschappen.js?v=20261006-blom-os-1',werkmapScriptURL).href;s.onload=()=>resolve(window.MijnGereedschappen);s.onerror=()=>reject(Error(I18n.value(I18n.ui("Mijn gereedschappen kon niet laden.",'Mijn gereedschappen kon niet laden.'))));document.head.append(s);};taxScript.onload=load;taxScript.onerror=()=>reject(Error(I18n.t('Btw-tarieven konden niet laden.')));});
 MijnGereedschappenReady.catch(()=>{});
 const ui=document.createElement('script');ui.src=new URL('werkruimte-ui.js?v=20261008-startroute-1',werkmapScriptURL).href;document.head.append(ui);
 function requestReadAccess(){
  if(!root)return Promise.reject(Error(I18n.t('Kies eerst een werkmap.')));
  return root.requestPermission({mode:'read'}).then(state=>{if(state!=='granted')throw Error(I18n.t('Geen toegang tot je werkmap.'));});
 }
 async function allAccess(ask=true){await ready;await checkRoot();if(example)throw Error(I18n.value(I18n.ui("Open eerst je eigen werk.",'Open eerst je eigen werk.')));if(ask)await permission(root);return {root,revision};}
 function render(){if(!box)return;if(!tool){for(const link of document.querySelectorAll('.grid a')){if(!link.dataset.originalHref)link.dataset.originalHref=link.getAttribute('href');const url=new URL(link.dataset.originalHref,location.href);if(root)url.searchParams.set('werkruimte','eigen');link.href=root?url.href:link.dataset.originalHref;}}I18n.assign($('name'),(example?I18n.ui("Voorbeelden blijven buiten je eigen werkmap",'Voorbeelden blijven buiten je eigen werkmap'):(root?I18n.ui("Werkmap: {0}{1}",'Werkmap: '+root.name+(tool?' / '+(tool==='Publicatieplanner'?'Projecten':catalog[tool][0]):'')):I18n.ui("Mijn werkmap",'Mijn werkmap'))),"textContent");$('choose').hidden=!supported||example;I18n.assign($('choose'),(tool?I18n.ui("Andere werkmap openen",'Andere werkmap openen'):(root?I18n.ui("Andere werkmap kiezen",'Andere werkmap kiezen'):I18n.ui("Kies werkmap",'Kies werkmap'))),"textContent");$('backup').hidden=!!example;$('all-open').hidden=!!example;$('forget').hidden=!root;$('open').hidden=true;$('copy').hidden=!adapter||tool==='Werkbank';I18n.assign($('copy'),(({Werkbank:'Download documentkopie (.md)',Bronnenkast:'Exporteer alle bronnen (JSON)',Projectbord:'Exporteer alle taken (JSON)',Contacten:'Exporteer alle contacten (JSON)',Publicatieplanner:'Exporteer alle projecten (JSON)',Offerte:'Exporteer alle offertegegevens (JSON)',Uren:'Exporteer alle urenregistraties (JSON)',Ping:'Exporteer alle factuurgegevens (JSON)',Kasboek:'Exporteer alle boekingen en bonnen (JSON)'})[tool]||I18n.ui("Exporteer gegevens",'Exporteer gegevens')),"textContent");I18n.assign($('hint'),(example?I18n.ui("Je kunt voorbeelden downloaden om te oefenen.",'Je kunt voorbeelden downloaden om te oefenen.'):(!supported?I18n.ui("Deze browser biedt geen maptoegang. Bestand openen en downloaden blijven beschikbaar.",'Deze browser biedt geen maptoegang. Bestand openen en downloaden blijven beschikbaar.'):(root?I18n.ui("Bewaar alles bewaart de hele werkruimte in deze map, inclusief conceptinvoer. Open werkmap brengt alle tools terug. PDF’s kies je zelf in het afdrukvenster.",'Bewaar alles bewaart de hele werkruimte in deze map, inclusief conceptinvoer. Open werkmap brengt alle tools terug. PDF’s kies je zelf in het afdrukvenster.'):I18n.ui("Kies eenmaal een map. Daarna bewaar je al je werk met Bewaar alles en open je de hele werkmap om verder te gaan.",'Kies eenmaal een map. Daarna bewaar je al je werk met Bewaar alles en open je de hele werkmap om verder te gaan.')))),"textContent");const loose=document.querySelector('.loose-documents > span');if(loose)I18n.assign(loose,(root?I18n.ui("Nieuwe documenten: Schrijven. Gekoppelde documenten: hun eigen map.",'Nieuwe documenten: Schrijven. Gekoppelde documenten: hun eigen map.'):I18n.ui("Bewaar werkt het document bij op zijn opslagplek. Zonder gekoppelde map maakt Bewaar een download.",'Bewaar werkt het document bij op zijn opslagplek. Zonder gekoppelde map maakt Bewaar een download.')),"textContent");}
 function register(config){adapter=config;adapterResolve();render();}
 async function mount(){await ready;const style=document.createElement('style');I18n.assign(style,I18n.ui(".werkmap{margin:14px 32px;padding:14px 16px;border:1px solid #bbb;border-left:4px solid var(--wp-accent,#e32720);font:14px/1.5 Arial,sans-serif;background:#fff;color:#111}.shell .werkmap{margin:0 0 20px}.werkmap summary{font-weight:700;cursor:pointer}.werkmap p{margin:8px 0;max-width:850px}.werkmap .wm-actions{display:flex;flex-wrap:wrap;gap:8px}.werkmap button,.wm-dialog button,.wm-dialog select{font:14px Arial;padding:10px;border:1px solid #111;background:#fff;color:#111;cursor:pointer;min-height:42px}.werkmap button:focus-visible,.wm-dialog :focus-visible{outline:3px solid var(--wp-accent,#e32720);outline-offset:3px}.werkmap [hidden]{display:none!important}.wm-dialog select{display:block;width:100%;margin:15px 0}#wm-message{overflow-wrap:anywhere}@media(max-width:600px){.werkmap{margin:12px 16px}}@media print{.werkmap{display:none}}",'.werkmap{margin:14px 32px;padding:14px 16px;border:1px solid #bbb;border-left:4px solid var(--wp-accent,#e32720);font:14px/1.5 Arial,sans-serif;background:#fff;color:#111}.shell .werkmap{margin:0 0 20px}.werkmap summary{font-weight:700;cursor:pointer}.werkmap p{margin:8px 0;max-width:850px}.werkmap .wm-actions{display:flex;flex-wrap:wrap;gap:8px}.werkmap button,.wm-dialog button,.wm-dialog select{font:14px Arial;padding:10px;border:1px solid #111;background:#fff;color:#111;cursor:pointer;min-height:42px}.werkmap button:focus-visible,.wm-dialog :focus-visible{outline:3px solid var(--wp-accent,#e32720);outline-offset:3px}.werkmap [hidden]{display:none!important}.wm-dialog select{display:block;width:100%;margin:15px 0}#wm-message{overflow-wrap:anywhere}@media(max-width:600px){.werkmap{margin:12px 16px}}@media print{.werkmap{display:none}}'),"textContent");document.head.append(style);
 box=document.createElement('details');box.className='werkmap';box.id='werkmap';box.open=!tool||!!root;box.innerHTML="<summary id=\"wm-name\"><span data-i18n=\"Mijn werkmap\">Mijn werkmap</span></summary><p id=\"wm-hint\"></p><div class=\"wm-actions\"><button type=\"button\" id=\"wm-choose\"><span data-i18n=\"Kies werkmap\">Kies werkmap</span></button><button type=\"button\" id=\"wm-open\" hidden><span data-i18n=\"Open uit werkmap\">Open uit werkmap</span></button><button type=\"button\" id=\"wm-copy\" hidden><span data-i18n=\"Exporteer gegevens\">Exporteer gegevens</span></button><button type=\"button\" id=\"wm-backup\"><span data-i18n=\"Bewaar alles\">Bewaar alles</span></button><button type=\"button\" id=\"wm-all-open\"><span data-i18n=\"Open werkmap\">Open werkmap</span></button><button type=\"button\" id=\"wm-zip\"><span data-i18n=\"Download back-up\">Download back-up</span></button><button type=\"button\" id=\"wm-previous\"><span data-i18n=\"Herstel vorige versie\">Herstel vorige versie</span></button><button type=\"button\" id=\"wm-forget\" hidden><span data-i18n=\"Werkmap loskoppelen\">Werkmap loskoppelen</span></button></div><p><span data-i18n=\"Je werk blijft in je eigen map. Bewaar alles neemt ook conceptinvoer en eerder bewaarde, gesloten tools mee. Er blijft één vorige kopie voor herstel. Download back-up is een optionele kopie van de map.\">Je werk blijft in je eigen map. Bewaar alles neemt ook conceptinvoer en eerder bewaarde, gesloten tools mee. Er blijft één vorige kopie voor herstel. Download back-up is een optionele kopie van de map.</span></p><p id=\"wm-message\" role=\"status\"></p>";
 const home=document.querySelector('.titlebar');if(!tool&&home)home.after(box);else(document.getElementById('file-status')||document.querySelector('.brandbar,header')).after(box);
 $('zip').onclick=async()=>{try{await allReady;await BewaarAlles.downloadBackup()}catch(e){message(e.message)}};$('previous').onclick=async()=>{try{await allReady;await BewaarAlles.restore(true)}catch(e){message(e.message)}};$('backup').onclick=backup;$('all-open').onclick=async()=>{try{await allReady;await BewaarAlles.restore();}catch(e){message(I18n.value(I18n.ui("Niet geopend: {0}",'Niet geopend: '+e.message)));}};$('choose').onclick=()=>choose(null,{requireExisting:true});$('open').onclick=load;$('copy').onclick=()=>adapter?.download();$('forget').onclick=async()=>{if(busy)return;if(!confirm(I18n.value(I18n.ui("Werkmap loskoppelen? Je bestanden blijven staan. Bewaar wordt weer een download.",'Werkmap loskoppelen? Je bestanden blijven staan. Bewaar wordt weer een download.'))))return;try{if(db)await setting('delete');root=null;revision=null;known.clear();render();message(I18n.value(I18n.ui("Losgekoppeld. Je bestanden zijn niet verwijderd.",'Losgekoppeld. Je bestanden zijn niet verwijderd.')));}catch(e){message(e.message)}};
 if(tool&&!example){const info=document.querySelector('.save-help-body');if(info){const note=document.createElement('p');note.innerHTML="<strong><span data-i18n=\"Met Mijn werkmap\">Met Mijn werkmap</span></strong> <span data-i18n=\"bewaart Bewaar alles de hele Werkplaats. Exporteren maakt een losse kopie; Open werkmap herstelt je complete werkruimte.\">bewaart Bewaar alles de hele Werkplaats. Exporteren maakt een losse kopie; Open werkmap herstelt je complete werkruimte.</span>";info.prepend(note);}}
 render();
 }
 window.addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue='';}});
 document.addEventListener('DOMContentLoaded',mount,{once:true});
 // Schrijven keeps its own per-document save; the other tools use the shared workspace save.
 document.addEventListener('click',e=>{const id=e.target.closest('button')?.id;if(!adapter||example||tool==='Werkbank'||id!==adapter.saveId)return;e.preventDefault();e.stopImmediatePropagation();backup();},true);
 return {recall,suiteReady:allReady,choose,startNew,continueWork,adapterReady,allCheck:()=>adapter?.check?.(),allRestore:s=>adapter.restore(s),allReset:()=>{},allAccess,requestReadAccess,allInfo:async()=>{await ready;return {revision,name:root?.name};},allRead:()=>adapter?.read()??null,allLoad:file=>adapter.load(file),ready,register,save,exportFile,readContacts,get name(){return root?.name||''},get active(){return !!root&&!example},get busy(){return busy},load};
})();
