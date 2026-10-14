'use strict';
window.WerkplaatsUitbreidingen=(()=>{
 const apiVersion=1,tools=['Werkbank','Projectbord','Bronnenkast','Contacten','Publicatieplanner','Ping','Offerte','Uren','Kasboek','Abonnementen'];
 const currentTool=document.querySelector('script[data-tool]')?.dataset.tool||'Home';
 const t=(nl,en)=>I18n.language==='en'?en:nl;
 let panel,status,list,prepare,refreshButton,busy=false,generation=0,items=[],loaded=new Map(),channel,lastRevision=null,scanQueue=Promise.resolve(),switching=false;
 const missing=error=>error.name==='NotFoundError';
 function validateManifest(value,folder){
  if(!value||value.apiVersion!==apiVersion)throw Error(t('Deze uitbreiding vraagt een andere Werkplaats-aansluiting.','This extension needs a different Werkplaats API.'));
  if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(value.id)||value.id!==folder)throw Error(t('De mapnaam moet gelijk zijn aan het id van de uitbreiding.','The folder name must match the extension id.'));
  if(typeof value.name!=='string'||!value.name.trim()||value.name.length>100||typeof value.version!=='string'||!value.version||value.version.length>40)throw Error(t('Naam of versienummer ontbreekt of is te lang.','Name or version is missing or too long.'));
  if(!Array.isArray(value.tools)||!value.tools.length||value.tools.some(tool=>!tools.includes(tool)&&tool!=='Home'))throw Error(t('Kies geldige gereedschappen voor deze uitbreiding.','Choose valid tools for this extension.'));
  return {id:value.id,name:value.name.trim(),version:value.version,apiVersion,tools:[...new Set(value.tools)]};
 }
 async function textFile(dir,name,max){const file=await(await dir.getFileHandle(name)).getFile();if(file.size>max)throw Error(t('Uitbreidingsbestand is te groot.','Extension file is too large.'));return file.text();}
 async function hash(text){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');}
 async function access(ask=false,create=false){
  if(!Werkmap.active)throw Error(t('Kies eerst bij Opslag een werkmap.','Choose a workspace folder under Storage first.'));
  const {root,revision}=await Werkmap.allAccess(ask);
  if(!ask&&await root.queryPermission({mode:'read'})!=='granted')throw Error(t('Klik op Ververs en geef toegang tot je werkmap.','Click Refresh and grant access to your workspace folder.'));
  return {dir:await root.getDirectoryHandle('Uitbreidingen',{create}),revision};
 }
 async function config(dir){
  let raw;try{raw=JSON.parse(await textFile(dir,'instellingen.json',100000));}catch(error){if(missing(error))return {format:'werkplaats-uitbreidingen',version:1,enabled:{}};throw error;}
  if(raw.format!=='werkplaats-uitbreidingen'||raw.version!==1||!raw.enabled||typeof raw.enabled!=='object'||Array.isArray(raw.enabled)||Object.entries(raw.enabled).some(([id,digest])=>!/^([a-z0-9][a-z0-9-]{0,63})$/.test(id)||!(/^[a-f0-9]{64}$/).test(digest)))throw Error(t('Uitbreidingsinstellingen zijn beschadigd. De uitbreidingen zijn niet geladen.','Extension settings are damaged. Extensions were not loaded.'));
  if(raw.choices!==undefined&&(!raw.choices||typeof raw.choices!=='object'||Array.isArray(raw.choices)||Object.entries(raw.choices).some(([id,values])=>!validKey(id)||!values||typeof values!=='object'||Array.isArray(values)||Object.keys(values).length>100||Object.entries(values).some(([key,value])=>!validKey(key)||typeof value!=='boolean'))))throw Error(t('Uitbreidingskeuzes zijn beschadigd.','Extension choices are damaged.'));
  return raw;
 }
 async function write(dir,name,text){const file=await dir.getFileHandle(name,{create:true}),writer=await file.createWritable();try{await writer.write(text);await writer.close();}catch(error){await writer.abort().catch(()=>{});throw error;}if(await textFile(dir,name,1000000)!==text)throw Error(t('Bewaren niet bevestigd.','Save was not confirmed.'));}
 async function readItem(dir,folder){
  const entry=await dir.getDirectoryHandle(folder),manifestText=await textFile(entry,'uitbreiding.json',10000),manifest=validateManifest(JSON.parse(manifestText),folder),source=await textFile(entry,'uitbreiding.js',100000);
  return {...manifest,source,hash:await hash(manifestText+'\n'+source)};
 }
 function validKey(key){return typeof key==='string'&&/^[a-z0-9][a-z0-9-]{0,63}$/.test(key);}
 function actionOptions(options=[]){
  if(!Array.isArray(options)||options.length>10||options.some(option=>!option||!validKey(option.key)||typeof option.label!=='string'||!option.label.trim()||option.label.length>120||typeof option.default!=='boolean')||new Set(options.map(option=>option.key)).size!==options.length)throw Error('Invalid extension options');
  return options.map(({key,label,default:value})=>({key,label,default:value}));
 }
 async function saveChoice(item,key,value){
  const {dir,revision}=await access(true);if(revision!==lastRevision)throw Error(t('De werkmap is veranderd.','Workspace changed.'));
  await navigator.locks.request('werkplaats-uitbreidingen:'+revision,async()=>{
   const fresh=await readItem(dir,item.id);if(fresh.hash!==item.hash)throw Error(t('De uitbreiding is intussen gewijzigd. Klik eerst op Ververs.','Extension changed. Click Refresh first.'));
   const settings=await config(dir);settings.choices??={};if(!Object.hasOwn(settings.choices,item.id))settings.choices[item.id]={};settings.choices[item.id][key]=value;
   await write(dir,'instellingen.json',JSON.stringify(settings,null,2)+'\n');
  });
  channel?.postMessage('changed');await scan();say(t('Keuze bewaard.','Choice saved.'));
 }
 function stop(id){const active=loaded.get(id);if(!active)return;active.alive=false;loaded.delete(id);active.reject?.(Error(t('Uitbreiding gestopt.','Extension stopped.')));active.frame.remove();for(const pending of active.pending.values()){clearTimeout(pending.timer);pending.reject(Error(t('Uitbreiding gestopt.','Extension stopped.')));}active.pending.clear();}
 function stopAll(){for(const id of loaded.keys())stop(id);}
 function say(message){if(status)status.textContent=message;}
 function guard(active){if(!active.alive||loaded.get(active.id)!==active)throw Error(t('Deze uitbreiding is niet meer actief.','This extension is no longer active.'));}
 function download(name,content,type='text/plain;charset=utf-8'){
  if(typeof name!=='string'||!name.trim()||name.length>150||/[\\/\u0000-\u001f]/.test(name)||typeof content!=='string'||new Blob([content]).size>5000000||typeof type!=='string'||type.length>100)throw Error(t('Ongeldige of te grote download (maximaal 5 MB).','Invalid or oversized download (maximum 5 MB).'));
  const url=URL.createObjectURL(new Blob([content],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function workerRuntime(token,context){
  const pending=new Map(),actions=[];let next=0,registered=false;
  const send=(kind,data={})=>postMessage({kind,token,...data});
  const request=(kind,data)=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});send(kind,{id,...data});});
  const api=Object.freeze({...context,
   readTool:tool=>request('read',{tool}),
   download:(name,content,type='text/plain;charset=utf-8')=>request('download',{name,content,type}),
   addAction:({label,run,options=[]})=>{if(typeof label!=='string'||!label.trim()||label.length>80||typeof run!=='function'||actions.length>=10)throw Error('Invalid extension action');const choices=actionOptions(options);const action=actions.push(run)-1;send('action',{action,label,options:choices});}
  });
  addEventListener('message',async event=>{
   if(event.data?.token!==token)return;
   const data=event.data;
   if(data.kind==='response'){const item=pending.get(data.id);if(!item)return;pending.delete(data.id);data.error?item.reject(Error(data.error)):item.resolve(data.value);}
   if(data.kind==='run'){try{if(typeof actions[data.action]!=='function')throw Error('Unknown extension action');await actions[data.action](data.values||{});send('done',{id:data.id});}catch(error){send('done',{id:data.id,error:error.message});}}
  });
  addEventListener('error',event=>send('failure',{error:event.message||'Extension error'}));
  addEventListener('unhandledrejection',event=>send('failure',{error:String(event.reason?.message||event.reason)}));
  self.WerkplaatsUitbreiding=Object.freeze({start:fn=>{if(registered||typeof fn!=='function')throw Error('Invalid extension start');registered=true;Promise.resolve().then(()=>fn(api)).then(()=>send('ready')).catch(error=>send('failure',{error:error.message}));}});

 }
 function frameRuntime(token,encodedCode){
  const source=new TextDecoder().decode(Uint8Array.from(atob(encodedCode),c=>c.charCodeAt(0))),url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
  let worker;try{worker=new Worker(url);}catch(error){parent.postMessage({token,kind:'failure',error:error.message},'*');return;}
  worker.onmessage=event=>{if(event.data?.token===token)parent.postMessage(event.data,'*');};
  worker.onerror=event=>parent.postMessage({token,kind:'failure',error:event.message||'Extension worker error'},'*');
  addEventListener('message',event=>{if(event.source===parent&&event.data?.token===token)worker.postMessage(event.data);});
  addEventListener('pagehide',()=>{worker.terminate();URL.revokeObjectURL(url);},{once:true});
 }
 function send(active,kind,data={}){guard(active);active.frame.contentWindow.postMessage({token:active.token,kind,...data},'*');}
 function requestAction(active,action,values={}){
  guard(active);const id=crypto.randomUUID();
  return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{active.pending.delete(id);reject(Error(t('De actie reageert niet.','The action did not respond.')));},30000);active.pending.set(id,{resolve,reject,timer});send(active,'run',{id,action,values});});
 }
 async function receive(event){
  const data=event.data;if(!data||typeof data!=='object')return;
  const active=[...loaded.values()].find(item=>item.alive&&item.frame.contentWindow===event.source&&item.token===data.token);if(!active)return;
  if(data.kind==='ready'){active.resolve();return;}
  if(data.kind==='failure'){active.reject(Error(String(data.error).slice(0,300)));if(active.started){stop(active.id);const item=items.find(item=>item.id===active.id);if(item)item.error=String(data.error).slice(0,300);render();}return;}
  if(data.kind==='action'){if(!Number.isInteger(data.action)||data.action<0||data.action>=10||typeof data.label!=='string'||!data.label.trim()||data.label.length>80)return;let options;try{options=actionOptions(data.options);}catch{return;}if(options.some(option=>active.actions.some(action=>action.options.some(existing=>existing.key===option.key))))return;if(!active.actions.some(item=>item.id===data.action))active.actions.push({id:data.action,label:data.label,options});return;}
  if(data.kind==='done'){const pending=active.pending.get(data.id);if(!pending)return;clearTimeout(pending.timer);active.pending.delete(data.id);data.error?pending.reject(Error(String(data.error).slice(0,300))):pending.resolve();return;}
  if(!['read','download'].includes(data.kind)||!Number.isInteger(data.id))return;
  try{
   if((await Werkmap.allInfo()).revision!==active.revision)throw Error(t('De werkmap is veranderd. Herlaad het gereedschap.','Workspace changed. Reload the tool.'));
   let value;
   if(data.kind==='read'){if(!active.tools.includes(data.tool)||!tools.includes(data.tool))throw Error(t('Dit gereedschap is niet aangemeld voor de uitbreiding.','This tool is not declared by the extension.'));value=structuredClone(await BewaarAlles.readTool(data.tool));}
   else {download(data.name,data.content,data.type);active.downloads=(active.downloads||0)+1;}
   guard(active);if((await Werkmap.allInfo()).revision!==active.revision)throw Error(t('De werkmap is veranderd.','Workspace changed.'));send(active,'response',{id:data.id,value});
  }catch(error){if(active.alive)send(active,'response',{id:data.id,error:error.message});}
 }
 addEventListener('message',receive);
 async function start(item,token){
  if(token!==generation)return;
  const frame=document.createElement('iframe');frame.hidden=true;frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('aria-hidden','true');frame.title='Werkplaats extension';
  const active={id:item.id,revision:lastRevision,hash:item.hash,tools:item.tools,language:I18n.language,token:crypto.randomUUID(),alive:true,actions:[],frame,pending:new Map()};loaded.set(item.id,active);
  let timer;const started=new Promise((resolve,reject)=>{active.resolve=resolve;active.reject=reject;timer=setTimeout(()=>reject(Error(t('De uitbreiding reageert niet.','Extension did not respond.'))),5000);});
  const workerCode=validKey.toString()+'\n'+actionOptions.toString()+'\n('+workerRuntime.toString()+')('+JSON.stringify(active.token)+','+JSON.stringify({version:apiVersion,tool:currentTool,language:I18n.language})+');\n'+item.source;
  const bytes=new TextEncoder().encode(workerCode),encoded=btoa(Array.from(bytes,byte=>String.fromCharCode(byte)).join(''));
  frame.srcdoc='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; worker-src blob:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'"><body><script>('+frameRuntime.toString()+')('+JSON.stringify(active.token)+','+JSON.stringify(encoded)+');<'+ '/script>';
  document.body.append(frame);
  try{await started;active.started=true;if(token!==generation&&loaded.get(item.id)===active)stop(item.id);}
  catch(error){if(loaded.get(item.id)===active)stop(item.id);item.error=error.message;}
  finally{clearTimeout(timer);}
 }
 function scan(ask=false){const task=scanQueue.then(()=>scanNow(ask));scanQueue=task.catch(()=>{});return task;}
 async function scanNow(ask=false){
  const token=++generation;items=[];
  try{
   await Werkmap.ready;await BewaarAlles.ready;
   if(switching){stopAll();say(t('Werkmap wordt geopend…','Opening workspace…'));return;}
   if(!Werkmap.active){stopAll();lastRevision=null;say(t('Kies eerst bij Opslag een werkmap.','Choose a workspace folder under Storage first.'));return;}
   let dir;try{const location=await access(ask);dir=location.dir;if(token!==generation)return;if(lastRevision!==location.revision){stopAll();lastRevision=location.revision;}}catch(error){if(missing(error)){stopAll();say(t('Er zijn nog geen uitbreidingen. Klik op Map voorbereiden.','There are no extensions yet. Click Prepare folder.'));return;}throw error;}
   const settings=await config(dir),found=[];
   for await(const entry of dir.values()){if(entry.kind==='directory'){if(found.length>=50)throw Error(t('Maximaal 50 uitbreidingen per werkmap.','Maximum 50 extensions per workspace folder.'));found.push(entry.name);}}
   const next=[];
   for(const folder of found.sort()){
    try{const item=await readItem(dir,folder);item.enabled=settings.enabled[item.id]===item.hash;item.changed=!!settings.enabled[item.id]&&!item.enabled;item.choices=settings.choices?.[item.id]||{};next.push(item);}
    catch(error){next.push({id:folder,name:folder,error:error.message});}
   }
   if(token!==generation)return;
   items=next;
   for(const [id,active]of loaded){const item=items.find(item=>item.id===id);if(!item?.enabled||item.hash!==active.hash||!item.tools.includes(currentTool)||active.language!==I18n.language)stop(id);}
   for(const item of items){if(item.enabled&&!item.error&&item.tools.includes(currentTool)&&!loaded.has(item.id))await start(item,token);if(token!==generation)return;}
   say(items.length?'':t('Nog geen uitbreidingen geïnstalleerd. De map staat klaar.','No extensions installed yet. The folder is ready.'));
  }catch(error){if(token!==generation)return;stopAll();say(error.message);}
  finally{if(token===generation)render();}
 }
 async function toggle(item,enabled){
  const {dir,revision}=await access(true);
  await navigator.locks.request('werkplaats-uitbreidingen:'+revision,async()=>{
   const settings=await config(dir);
   if(enabled){const fresh=await readItem(dir,item.id);if(fresh.hash!==item.hash)throw Error(t('De uitbreiding is intussen gewijzigd. Klik eerst op Ververs.','Extension changed. Click Refresh first.'));settings.enabled[item.id]=fresh.hash;}
   else delete settings.enabled[item.id];
   await write(dir,'instellingen.json',JSON.stringify(settings,null,2)+'\n');
  });
  channel?.postMessage('changed');await scan();
  say(enabled?t('Aangezet en bewaard.','Enabled and saved.'):t('Uitgezet en bewaard.','Disabled and saved.'));
 }
 async function perform(fn){if(busy)return;busy=true;render();try{await fn();}catch(error){say(error.message);}finally{busy=false;render();}}
 function button(nl,en,fn){const element=document.createElement('button');element.type='button';element.textContent=t(nl,en);element.disabled=busy;element.onclick=()=>perform(fn);return element;}
 function render(){
  if(!panel)return;
  panel.querySelector('summary').textContent=t('Uitbreidingen','Extensions');panel.querySelector('[data-intro]').textContent=t('Voeg extra functies toe. Een aangezette uitbreiding kan de gegevens lezen van de aangemelde gereedschappen.','Add extra features. An enabled extension can read data from its declared tools.');
  panel.querySelector('[data-help]').textContent=t('De map Uitbreidingen staat bij je werk, buiten de appbestanden. Kies na een nieuwe download dezelfde werkmap.','The Extensions folder stays with your work, outside the app files. Choose the same workspace folder after a new download.');
  prepare.textContent=t('Map voorbereiden','Prepare folder');prepare.disabled=busy||!Werkmap.active;
  refreshButton.textContent=t('Ververs','Refresh');refreshButton.disabled=busy||!Werkmap.active;
  list.replaceChildren();
  for(const item of items){
   const row=document.createElement('section'),heading=document.createElement('h4');heading.textContent=item.name+(item.version?' · '+item.version:'');row.append(heading);
   const state=document.createElement('p');state.textContent=item.error?t('Niet geladen: ','Not loaded: ')+item.error:item.changed?t('Gewijzigd. Controleer de nieuwe code en zet opnieuw aan.','Changed. Review the new code and enable again.'):item.enabled?t('Aan','Enabled'):t('Uit','Disabled');row.append(state);
   const actions=document.createElement('div');actions.className='settings-actions wp-actions';
   if(!item.error||item.enabled){actions.append(button(item.enabled?'Zet uit':'Zet aan',item.enabled?'Disable':'Enable',()=>toggle(item,!item.enabled)));}
   if(item.enabled&&item.tools&&!item.tools.includes(currentTool)){const note=document.createElement('p');note.textContent=t('Open het gereedschap waarvoor deze uitbreiding bedoeld is.','Open a tool supported by this extension.');row.append(note);}
   const active=loaded.get(item.id);if(active)for(const action of active.actions){
    if(action.options.length){const fields=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=action.label;fields.append(legend);
     for(const option of action.options){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=Object.hasOwn(item.choices,option.key)?item.choices[option.key]:option.default;input.disabled=busy;input.dataset.extensionOption=option.key;input.onchange=()=>perform(()=>saveChoice(item,option.key,input.checked));label.className='business-choice';label.append(input,document.createTextNode(' '+option.label));fields.append(label);}row.append(fields);}
    const b=button(action.label,action.label,async()=>{await scan();guard(active);const fresh=items.find(entry=>entry.id===item.id);const values=Object.fromEntries(action.options.map(option=>[option.key,Object.hasOwn(fresh.choices,option.key)?fresh.choices[option.key]:option.default]));const before=active.downloads||0;await requestAction(active,action.id,values);say(active.downloads>before?t('Download aangeboden. Controleer het gedownloade bestand.','Download offered. Check the downloaded file.'):t('Actie uitgevoerd.','Action completed.'));});actions.append(b);
   }
   row.append(actions);list.append(row);
  }
 }
 const folderHelp='# Uitbreidingen voor Werkplaats\n\nBewaar elke uitbreiding in een eigen map. Deze map staat bij je werk en wordt niet vervangen door een nieuwe Werkplaats-download. Kies na een update dezelfde werkmap.\n\nElke uitbreiding bevat uitbreiding.json en uitbreiding.js. Zet haar daarna zelf aan via Instellingen → Uitbreidingen. Gewijzigde code vraagt opnieuw activering.\n\nDe technische handleiding en het voorbeeld staan in de appbestanden onder Uitbreidingen.\n\nDeze map valt buiten de bewaarrondes van Bewaar alles. Bewaar zelf een extra kopie van je uitbreidingen en instellingen.json. Alleen aanzetten als je de maker en code vertrouwt.\n';
 async function prepareFolder(){const {dir}=await access(true,true);try{await dir.getFileHandle('LEESMIJ.md');}catch(error){if(!missing(error))throw error;await write(dir,'LEESMIJ.md',folderHelp);}await scan();}
 function mount(){
  const dialog=document.getElementById('suite-settings');if(!dialog||panel)return;
  panel=document.createElement('details');panel.id='settings-extensions';panel.className='settings-section';const summary=document.createElement('summary'),intro=document.createElement('p'),help=document.createElement('p'),actions=document.createElement('div');intro.dataset.intro='';help.dataset.help='';actions.className='settings-actions wp-actions';
  prepare=button('Map voorbereiden','Prepare folder',prepareFolder);refreshButton=button('Ververs','Refresh',()=>scan(true));actions.append(prepare,refreshButton);list=document.createElement('div');status=document.createElement('p');status.id='extensions-status';status.setAttribute('role','status');panel.append(summary,intro,help,actions,list,status);dialog.querySelector('.my-tools-actions').before(panel);dialog.addEventListener('settings-open',()=>scan());render();
 }
 try{channel=new BroadcastChannel('werkplaats-uitbreidingen');channel.onmessage=()=>scan();}catch{}
 for(const event of ['werkmap-herinnerd','werkmap-losgekoppeld','taal-gewijzigd'])document.addEventListener(event,()=>scan());
 document.addEventListener('werkmap-wisselt',()=>{switching=true;generation++;stopAll();});
 document.addEventListener('werkmap-gekozen',()=>{switching=false;scan();});
 const ready=(async()=>{await window.MijnGereedschappenReady;if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));mount();if(!panel){const observer=new MutationObserver(()=>{mount();if(panel)observer.disconnect();});observer.observe(document.body,{childList:true});}await scan();})();ready.catch(error=>say(error.message));
 return {version:apiVersion,ready,refresh:scan,validateManifest};
})();
