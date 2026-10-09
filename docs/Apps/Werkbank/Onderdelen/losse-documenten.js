function downloadLooseMarkdown(name,content){const u=URL.createObjectURL(new Blob([content],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download=name;a.click();Werkstatus.downloaded(name);setTimeout(()=>URL.revokeObjectURL(u),1000);}
function downloadActiveDocument(){if(activeFile)downloadLooseMarkdown(activeFile.name,isEditMode?getWysiwygMarkdown():currentRawContent);}
// Consolidate the legacy copies explicitly requested by the user, after verified recovery writes.
async function archiveMijnTeamCopy(dir,name,content){
 const canonical=await(await(await dir.getFileHandle('mijn-team.md')).getFile()).text();
 if(content===canonical)return;
 const recovery=await dir.getDirectoryHandle('Herstelkopieen',{create:true});
 const filename='mijn-team-'+crypto.randomUUID()+'.md';
 const handle=await recovery.getFileHandle(filename,{create:true});const stream=await handle.createWritable();
 try{await stream.write(content);await stream.close();}catch(error){try{await stream.abort()}catch{}throw error;}
 if(await(await handle.getFile()).text()!==content)throw Error(I18n.value(I18n.ui("Herstelkopie kon niet worden gecontroleerd.",'Herstelkopie kon niet worden gecontroleerd.')));
}
window.consolidateMijnTeam=async()=>{
 if(!window.Werkmap?.active||isEditMode&&wysiwygDirty)return;
 const copies=[...converterFiles].filter(([name])=>/^mijn-team\.md(?: \(\d+\))?$/.test(name));
 if(!copies.length)return;
 let dir;
 try{const access=await Werkmap.allAccess(false);dir=await access.root.getDirectoryHandle('Schrijven');if(await dir.queryPermission({mode:'readwrite'})!=='granted')return;await dir.getFileHandle('mijn-team.md');}
 catch{return;}
 for(const [name,item] of copies)await archiveMijnTeamCopy(dir,name,item.content);
 for(const [name] of copies)converterFiles.delete(name);
 saveConverterFiles();
 if(!directoryHandles.some(handle=>handle.name==='Schrijven'))directoryHandles.push(dir);
 if(activeFile?.isVirtual&&copies.some(([name])=>name===activeFile.name)){activeFile=null;isEditMode=false;}
 await saveDirectoryHandles(directoryHandles);
};
// Open documents without requiring access to an entire folder.
(()=>{
 const bar=document.createElement('div');bar.className='loose-documents';
 bar.innerHTML="<button id=\"loose-open\"><span data-i18n=\"Document openen\">Document openen</span></button><button id=\"loose-save\" disabled><span data-i18n=\"Bewaar\">Bewaar</span></button><span><span data-i18n=\"Bewaar werkt het document bij op zijn opslagplek. Zonder gekoppelde map maakt Bewaar een download.\">Bewaar werkt het document bij op zijn opslagplek. Zonder gekoppelde map maakt Bewaar een download.</span></span><input type=\"file\" id=\"loose-input\" accept=\".md,.markdown,.txt,text/markdown,text/plain\" hidden>";
 bar.hidden=true;bar.style.display='none';document.body.append(bar);
 const openButton=bar.querySelector('#loose-open');openButton.className='new-file-btn';
 const openRow=document.createElement('div');openRow.className='sidebar-open-document';openRow.append(openButton);document.querySelector('.sidebar-tools').after(openRow);
 const style=document.createElement('style');I18n.assign(style,I18n.ui(".loose-documents{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:14px 32px;border-bottom:1px solid #ccc}.loose-documents button{padding:10px 12px;border:1px solid #111;background:#fff;font:14px Arial;cursor:pointer}.loose-documents button:disabled{opacity:.5;cursor:default}.loose-documents span{font:13px/1.5 Arial;color:#555;max-width:460px}.loose-documents button:focus-visible{outline:3px solid var(--wp-accent,#e32720);outline-offset:2px}@media(max-width:600px){.loose-documents{padding:12px 16px}}@media print{.loose-documents{display:none}}",'.loose-documents{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:14px 32px;border-bottom:1px solid #ccc}.loose-documents button{padding:10px 12px;border:1px solid #111;background:#fff;font:14px Arial;cursor:pointer}.loose-documents button:disabled{opacity:.5;cursor:default}.loose-documents span{font:13px/1.5 Arial;color:#555;max-width:460px}.loose-documents button:focus-visible{outline:3px solid var(--wp-accent,#e32720);outline-offset:2px}@media(max-width:600px){.loose-documents{padding:12px 16px}}@media print{.loose-documents{display:none}}'),"textContent");document.head.append(style);
 const picker=document.getElementById('loose-input');let busy=false;const workmapNames=new Map();
 const canSwitch=()=>!wysiwygDirty||confirm(I18n.value(I18n.ui("Je hebt onbewaarde wijzigingen. Eerst je document bewaren? Kies Annuleer om terug te gaan. Doorgaan zonder bewaren?",'Je hebt onbewaarde wijzigingen. Eerst je document bewaren? Kies Annuleer om terug te gaan. Doorgaan zonder bewaren?')));
 function requestLooseName(suggestedName='Nieuw document.md'){
  return new Promise(resolve=>{
   const dialog=document.createElement('dialog');dialog.className='file-dialog';
   dialog.innerHTML="<form><h2><span data-i18n=\"Nieuw document\">Nieuw document</span></h2><label><span data-i18n=\"Bestandsnaam\">Bestandsnaam</span><br><input name=\"filename\" required autocomplete=\"off\" style=\"width:100%;padding:10px;font:inherit\"></label><p><span data-i18n=\"Je kunt het document daarna met Bewaar in je werkmap opslaan.\">Je kunt het document daarna met Bewaar in je werkmap opslaan.</span></p><p role=\"alert\"></p><div class=\"wp-actions\"><button type=\"button\"><span data-i18n=\"Annuleer\">Annuleer</span></button> <button class=\"action-primary\" type=\"submit\"><span data-i18n=\"Aanmaken\">Aanmaken</span></button></div></form>";
   const input=dialog.querySelector('input'),alert=dialog.querySelector('[role="alert"]');
   input.value=newDocumentFilename(suggestedName);
   const finish=name=>{dialog.close();resolve(name)};
   dialog.querySelector('[type="button"]').onclick=()=>finish(null);
   dialog.oncancel=event=>{event.preventDefault();finish(null)};
   dialog.onclose=()=>dialog.remove();
   dialog.querySelector('form').onsubmit=event=>{
    event.preventDefault();let name=input.value.trim();
    if(!name.replace(/\.md$/i,'').replace(/^\d{4}-\d{2}-\d{2}-/,'').trim()||name==='.'||name==='..'||/[\\/:*?"<>|\x00-\x1f]/.test(name)){I18n.assign(alert,I18n.ui("Vul een bestandsnaam in zonder schuine strepen of bijzondere tekens.",'Vul een bestandsnaam in zonder schuine strepen of bijzondere tekens.'),"textContent");return;}
    if(!/\.md$/i.test(name))name+='.md';
    name=newDocumentFilename(name);
    if(name.length>160){I18n.assign(alert,I18n.ui("De bestandsnaam is te lang.",'De bestandsnaam is te lang.'),"textContent");return;}
    if([...converterFiles.keys()].some(existing=>existing.toLocaleLowerCase('nl')===name.toLocaleLowerCase('nl'))){I18n.assign(alert,I18n.ui("Deze naam bestaat al. Kies een andere naam.",'Deze naam bestaat al. Kies een andere naam.'),"textContent");return;}
    finish(name);
   };
   document.body.append(dialog);dialog.showModal();input.focus();input.setSelectionRange(newDocumentFilename('').length,input.value.replace(/\.md$/i,'').length);
  });
 }
 async function addLoose(name,content){
  let chosen=name,n=2;while(converterFiles.has(chosen)){chosen=name.replace(/(\.[^.]+)?$/,(_,ext)=>' ('+(n++)+')'+(ext||''));}
  converterFiles.set(chosen,{name:chosen,content,relativePath:'converter/'+chosen,explicit:true});saveConverterFiles();selectedProject='all';wysiwygDirty=false;isEditMode=false;
  await loadFiles();expandedFolders.add('converter');renderFileList();await selectFile(files.findIndex(f=>f.isVirtual&&f.name===chosen));
  showNotification(I18n.value(I18n.ui("Document geopend. Gebruik Bewaar om een eigen bestand te bewaren.",'Document geopend. Gebruik Bewaar om een eigen bestand te bewaren.')),'success');
  return {name:activeFile.name,relativePath:activeFile.relativePath};
 }
 async function connectSavedDocument(name,{dir,handle},saved){
  const wasEditing=isEditMode,previous=activeFile;
  const text=await(await handle.getFile()).text();
  let linked=false;
  for(const folder of directoryHandles)if(await folder.isSameEntry(dir)){linked=true;break;}
  if(!linked){
   if(directoryHandles.some(folder=>folder.name===dir.name))throw Error(I18n.value(I18n.ui("Bestand is opgeslagen, maar er is al een andere map met de naam {0} gekoppeld. Verwijder die map eerst uit de lijst en kies Open uit werkmap.",'Bestand is opgeslagen, maar er is al een andere map met de naam '+dir.name+' gekoppeld. Verwijder die map eerst uit de lijst en kies Open uit werkmap.')));
   directoryHandles.push(dir);await saveDirectoryHandles(directoryHandles);
  }
  const removeLoose=previous?.isVirtual && (saved || (previous.name===name && currentRawContent===text));
  selectedProject='all';wysiwygDirty=false;isEditMode=false;
  await loadFiles();
  const index=files.findIndex(file=>!file.isVirtual&&file.relativePath===dir.name+'/'+name);
  if(index<0)throw Error(I18n.value(I18n.ui("Bestand is opgeslagen. Open de map opnieuw om het te bekijken.",'Bestand is opgeslagen. Open de map opnieuw om het te bekijken.')));
  await selectFile(index);
  if(removeLoose){await window.ProjectMaterials?.relocate(previous.relativePath,activeFile.relativePath,activeFile.name);converterFiles.delete(previous.name);saveConverterFiles();files=files.filter(f=>!(f.isVirtual&&f.name===previous.name));activeFileIndex=files.indexOf(activeFile);}
  expandedFolders.add(dir.name);renderFileList();
  if(saved&&wasEditing)await toggleEditMode();
 }
 document.getElementById('loose-open').onclick=()=>{if(canSwitch())picker.click();};
 picker.onchange=async()=>{const file=picker.files[0];picker.value='';if(!file||busy)return;busy=true;try{if(file.size>2000000)throw Error(I18n.value(I18n.ui("Kies een tekstbestand van maximaal 2 MB.",'Kies een tekstbestand van maximaal 2 MB.')));if(!/\.(md|markdown|txt)$/i.test(file.name))throw Error(I18n.value(I18n.ui("Kies een Markdown- of tekstbestand.",'Kies een Markdown- of tekstbestand.')));const text=await file.text();if(text.includes('\u0000'))throw Error(I18n.value(I18n.ui("Dit lijkt geen tekstbestand.",'Dit lijkt geen tekstbestand.')));await addLoose(file.name,text);}catch(e){showNotification(e.message,'error');}finally{busy=false;}};
 window.createLooseDocument=async(options={})=>{if(busy||!canSwitch())return;busy=true;try{const name=await requestLooseName(options.suggestedName);if(!name)return;const title=name.replace(/\.md$/i,'').replace(/^\d{4}-\d{2}-\d{2}-/,'');const content=options.initialContent?await options.initialContent(title):`# ${title}\n\n`;const created=await addLoose(name,content);await toggleEditMode();document.getElementById('wysiwygEditor')?.focus();return created;}catch(e){showNotification(e.message,'error');}finally{busy=false;}};
 for(const button of document.querySelectorAll('[data-template]'))button.onclick=async()=>{
  if(GereedschapskistMode.example){GereedschapskistMode.go('own');return;}
  const soort=button.dataset.template,folderPath=document.getElementById('newItemTarget')?.value||'';
  const suggestedName={brief:'Brief.md',artikel:'Artikel.md',nieuwsbrief:'Nieuwsbrief.md',gespreksverslag:'Gespreksverslag.md'}[soort];
  await createNewFile({folderPath,suggestedName,initialContent:title=>Schrijfsjablonen.maak(soort,title)});
 };
 let savingDocument=false;
 document.getElementById('loose-save').onclick=async()=>{
  if(savingDocument)return;
  if(!activeFile){showNotification(I18n.value(I18n.ui("Open eerst het document dat je wilt bewaren.",'Open eerst het document dat je wilt bewaren.')),'error');return;}
  const button=document.getElementById('loose-save'),status=document.getElementById('wm-message');
  savingDocument=true;button.disabled=true;I18n.assign(button,I18n.ui("Bezig met bewaren…",'Bezig met bewaren…'),"textContent");
  if(status)I18n.assign(status,I18n.ui("Bezig met bewaren…",'Bezig met bewaren…'),"textContent");
  try{
   await Werkmap.recall();
   if(!activeFile.isVirtual||isEditMode||window.Werkmap?.active){
    const saved=await saveFile();
    if(!saved){
     const message=status?.textContent&&status.textContent!=='Bezig met bewaren…'?status.textContent:'Niet opgeslagen. Je tekst blijft open. Probeer opnieuw en controleer de maptoegang.';
     if(status)status.textContent=message;showNotification(message,'error');
    }
   }else{
    downloadActiveDocument();
    const message='Download gestart. Controleer of je bestand is opgeslagen.';
    if(status)status.textContent=message;showNotification(message,'success');
   }
  }catch(error){
   const message='Niet opgeslagen: '+error.message;
   if(status)status.textContent=message;showNotification(message,'error');
  }finally{savingDocument=false;button.disabled=!activeFile;I18n.assign(button,I18n.ui("Bewaar",'Bewaar'),"textContent");}
 };
 const saveButton=document.getElementById('loose-save');
 const updateSaveButton=()=>{
  saveButton.disabled=savingDocument||!activeFile;saveButton.classList.add('edit-btn');
  I18n.assign(saveButton,(!activeFile?I18n.ui("Open eerst een document",'Open eerst een document'):(!activeFile.isVirtual?I18n.ui("Bijwerken in {0}",'Bijwerken in '+activeFile.relativePath):(window.Werkmap?.active?I18n.ui("Bewaar als Markdown-bestand in je werkmap",'Bewaar als Markdown-bestand in je werkmap'):I18n.ui("Download dit document als Markdown-bestand",'Download dit document als Markdown-bestand')))),"title");
  const actions=document.querySelector('#content .file-actions:not(.editor-actions)');
  const target=actions||bar;
  if(saveButton.parentElement!==target){if(actions)actions.insertBefore(saveButton,actions.querySelector('.document-edit-primary')?.nextSibling||actions.firstChild);else bar.append(saveButton);}
 };
 updateSaveButton();new MutationObserver(updateSaveButton).observe(document.getElementById('content'),{childList:true,subtree:true});
// Update one connected Markdown file with a verified recovery copy and a content guard.
async function updateConnectedDocument(parent,handle,expected,next){
 const operation=async()=>{
  const old=await(await handle.getFile()).text();if(old===next)return;
  if(old!==expected)throw Error('Dit document is buiten Werkplaats gewijzigd. Open het opnieuw en Sync nogmaals.');
  const backups=await parent.getDirectoryHandle('Herstelkopieen',{create:true});
  const backup=await backups.getFileHandle(new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID()+'-'+handle.name,{create:true});
  let stream=await backup.createWritable();try{await stream.write(old);await stream.close();}catch(e){try{await stream.abort();}catch{}throw e;}
  if(await(await backup.getFile()).text()!==old)throw Error('De herstelkopie is niet bevestigd. Het document blijft behouden.');
  stream=await handle.createWritable({mode:'exclusive'});
  try{if(await(await handle.getFile()).text()!==old)throw Error('Het document is intussen gewijzigd. Sync opnieuw.');await stream.write(next);await stream.close();}catch(e){try{await stream.abort();}catch{}throw e;}
  if(await(await handle.getFile()).text()!==next)throw Error('De documentwijziging kon niet worden bevestigd. Controleer de herstelkopie.');
 };
 if(navigator.locks)await navigator.locks.request('werkplaats-document:'+handle.name,operation);else await operation();
}

  Werkmap.register({async restore(s){
   // Guard explicit updates before replacing the visible session.
   if((s.documents||[]).some(d=>typeof d.expectedContent==='string')&&wysiwygDirty)throw Error('Bewaar eerst het open document en Sync daarna opnieuw.');
   // Resolve saved documents before replacing the visible session.
   if(Werkmap.active){
    const access=await Werkmap.allAccess(false);
    try{const dir=await access.root.getDirectoryHandle('Schrijven');await dir.values().next();}catch(error){const saved=await getSavedDirectoryHandles();const writing=saved.find(handle=>handle.name==='Schrijven');if(writing){try{await writing.values().next();directoryHandles=[writing];selectedProject='Schrijven';await loadFiles({skipRestore:true});for(const path of folderHandlesByPath.keys())expandedFolders.add(path);renderFileList();return;}catch{}}showWritingAccessRequired();return;}
   }
   const restored=new Map(),seen=new Map(),differentVersions=[];let diskFolder=null;
   const savedFolders=typeof getSavedDirectoryHandles==='function'?await getSavedDirectoryHandles():[];
   const retainedFolders=[...directoryHandles];
   for(const handle of savedFolders)if(!retainedFolders.some(h=>h.name===handle.name))retainedFolders.push(handle);
   const readableFolders=[];
   for(const handle of retainedFolders)try{if(await handle.queryPermission({mode:'read'})==='granted')readableFolders.push(handle);}catch{}
   const previousProject=typeof selectedProject==='string'?selectedProject:'all';
   const previousPath=activeFile?.relativePath;
   try{const access=await Werkmap.allAccess(false);const dir=await access.root.getDirectoryHandle('Schrijven');
    await dir.values().next();diskFolder=dir;
   }catch{}
   const diskDocuments=[],diskTexts=new Map();
   if(diskFolder){
    async function collect(dir,path='Schrijven'){
     for await(const entry of dir.values()){
      if(entry.name.startsWith('.')||entry.name==='node_modules'||entry.name==='Herstelkopieen')continue;
      if(entry.kind==='directory')await collect(entry,path+'/'+entry.name);
      else if(/\.(md|markdown|txt)$/i.test(entry.name))diskDocuments.push({name:entry.name,path:path+'/'+entry.name,handle:entry});
     }
    }
    await collect(diskFolder);
   }
   let selectedPath=null;
   for(const d of s.documents||[]){
    if(typeof d.content!=='string'||typeof d.name!=='string')throw Error(I18n.value(I18n.ui("Ongeldig document.",'Ongeldig document.')));
    if(diskFolder&&/^converter\//.test(d.path||'')&&/^mijn-team\.md(?: \(\d+\))?$/.test(d.name)){
     let exists=false;try{await diskFolder.getFileHandle('mijn-team.md');exists=true;}catch{}
     if(exists&&await diskFolder.queryPermission({mode:'readwrite'})==='granted'){
      await archiveMijnTeamCopy(diskFolder,d.name,d.content);
      if(d.path===s.activeDocument)selectedPath='Schrijven/mijn-team.md';continue;
     }
    }
    const identity=JSON.stringify([d.path||d.name,d.content]);
    if(seen.has(identity)){if(d.path===s.activeDocument)selectedPath=seen.get(identity);continue;}
    let connected=false,connectedHandle=null,connectedParent=null;
    let matchingPath=null;
    if(diskFolder&&d.path?.startsWith('Schrijven/')){
     try{const parts=d.path.slice('Schrijven/'.length).split('/');
      if(parts.some(part=>!part||part==='.'||part==='..'||part.includes('\\'))||parts.at(-1)!==d.name)throw Error(I18n.value(I18n.ui("Ongeldig documentpad.",'Ongeldig documentpad.')));
      let parent=diskFolder;for(const part of parts.slice(0,-1))parent=await parent.getDirectoryHandle(part);
      const handle=await parent.getFileHandle(parts.at(-1));
      // A changed file is still the same document. The workmap version wins.
      connected=true;connectedHandle=handle;connectedParent=parent;
      if(s.restoreSavedVersions&&await(await handle.getFile()).text()!==d.content)differentVersions.push(d);
     }catch{}
    }
    if(!connected&&d.path&&!d.path.startsWith('converter/')){
     const parts=d.path.split('/'),root=readableFolders.find(h=>h.name===parts[0]);
     if(root&&parts.every(part=>part&&part!=='.'&&part!=='..'&&!part.includes('\\'))&&parts.at(-1)===d.name){
      try{let parent=root;for(const part of parts.slice(1,-1))parent=await parent.getDirectoryHandle(part);const handle=await parent.getFileHandle(d.name);connected=true;connectedHandle=handle;connectedParent=parent;if(s.restoreSavedVersions&&await(await handle.getFile()).text()!==d.content)differentVersions.push(d);}catch{}
     }
    }
    if(typeof d.expectedContent==='string'){
     if(!connected)throw Error('Het document is verplaatst of de schrijfmap is niet beschikbaar. Open het opnieuw.');
     await updateConnectedDocument(connectedParent,connectedHandle,d.expectedContent,d.content);
    }
    if(diskFolder&&d.path?.startsWith('converter/')&&!d.explicit){
     const originalName=d.name.replace(/ \(\d+\)(?=\.(?:md|markdown|txt)$|$)/i,'');
     let sameNameOnDisk=null;
     for(const candidate of diskDocuments){
      if(candidate.name.toLocaleLowerCase('nl')!==originalName.toLocaleLowerCase('nl'))continue;
      sameNameOnDisk??=candidate.path;
      if(!diskTexts.has(candidate.path))diskTexts.set(candidate.path,await(await candidate.handle.getFile()).text());
      if(diskTexts.get(candidate.path)===d.content){matchingPath=candidate.path;break;}
     }
     if(sameNameOnDisk&&!matchingPath){matchingPath=sameNameOnDisk;if(s.restoreSavedVersions)differentVersions.push(d);}
    }
    let path;
    if(connected){path=d.path;}
    else if(matchingPath){path=matchingPath;}
    else{let name=d.name,n=2;while(restored.has(name))name=d.name+' ('+(n++)+')';
     path='converter/'+name;restored.set(name,{name,content:d.content,relativePath:path,explicit:!!d.explicit});
    }
    seen.set(identity,path);if(d.path===s.activeDocument)selectedPath=path;
   }
   if(differentVersions.length){
    const added=new Set();
    for(const d of differentVersions){
     const identity=JSON.stringify([d.name,d.content]);if(added.has(identity))continue;added.add(identity);
     let name=d.name,n=2;while(restored.has(name)||diskDocuments.some(item=>item.name.toLocaleLowerCase('nl')===name.toLocaleLowerCase('nl')))name=d.name.replace(/(\.[^.]+)?$/,(_,ext)=>` (${n++})${ext||''}`);
     const path='converter/'+name;restored.set(name,{name,content:d.content,relativePath:path,explicit:true});
     if(d.path===s.activeDocument)selectedPath=path;
    }
   }
   wysiwygDirty=false;isEditMode=false;activeFile=null;
   if(diskFolder&&!readableFolders.some(h=>h.name===diskFolder.name))readableFolders.push(diskFolder);
   directoryHandles=diskFolder?[diskFolder]:readableFolders;folderHandlesByPath.clear();
   const storedFolders=[...retainedFolders];
   if(diskFolder&&!storedFolders.some(h=>h.name===diskFolder.name))storedFolders.push(diskFolder);
   await saveDirectoryHandles(storedFolders);fileContents.clear();converterFiles.clear();
   for(const [name,item]of restored)converterFiles.set(name,item);
   saveConverterFiles();selectedProject=diskFolder?'Schrijven':previousProject;await loadFiles();
   if(diskFolder){for(const path of folderHandlesByPath.keys())if(path==='Schrijven'||path.startsWith('Schrijven/'))expandedFolders.add(path);renderFileList();}
   if(!selectedPath&&previousPath)selectedPath=previousPath;
   const index=files.findIndex(f=>f.relativePath===selectedPath);
   if(selectedProject!=='Schrijven'){if(index>=0)await selectFile(index);else if(files.length)await selectFile(0);}
   Werkstatus.opened('Werkmap / Schrijven');
  },saveId:'loose-save',
  read:()=>activeFile?{name:activeFile.name,content:isEditMode?getWysiwygMarkdown():currentRawContent}:null,
  prepare:()=>{if(busy)throw Error(I18n.value(I18n.ui("Wacht tot het document is geopend.",'Wacht tot het document is geopend.')));return !!activeFile},
  name:()=>workmapNames.get(activeFile?.relativePath)||activeFile?.name,bound:name=>workmapNames.set(activeFile.relativePath,name),
  ownsSave:()=>!!activeFile&&!activeFile.isVirtual,
  saveOwn:()=>saveFile(),
  // Bewaar updates the same named document; write() first preserves its old text.
  acceptExisting:async(name)=>!!activeFile?.isVirtual&&activeFile.name===name,

  saved:async(name,location)=>{await connectSavedDocument(name,location,true);},
  download:()=>{if(activeFile){downloadLooseMarkdown(activeFile.name,isEditMode?getWysiwygMarkdown():currentRawContent);showNotification(I18n.value(I18n.ui("Download gestart. Controleer of je bestand is opgeslagen.",'Download gestart. Controleer of je bestand is opgeslagen.')),'success');}},
  async load(file,location){if(busy||!canSwitch())return false;if(file.size>2000000)throw Error(I18n.value(I18n.ui("Kies een document van maximaal 2 MB.",'Kies een document van maximaal 2 MB.')));const text=await file.text();if(text.includes('\u0000'))throw Error(I18n.value(I18n.ui("Dit lijkt geen tekstbestand.",'Dit lijkt geen tekstbestand.')));await connectSavedDocument(file.name,location,false);return true;}
 });
})();

Werkstatus.register(()=>({name:activeFile?.relativePath||'',content:activeFile?(isEditMode?getWysiwygMarkdown():currentRawContent):''}),()=>wysiwygDirty);

// Make first-run setup available when Schrijven is opened directly.
(async()=>{
 await Werkmap.ready;
 if(Werkmap.active || directoryHandles.length)return;
 const host=document.createElement('section');host.id='writing-first-start';
 host.style.cssText='padding:16px 24px;border-bottom:1px solid #bbb;background:#fff;font:14px/1.5 Arial,sans-serif;display:flex;align-items:center;gap:12px;flex-wrap:wrap';
 const text=document.createElement('span');I18n.assign(text,I18n.ui("Begin met een werkmap voor Inbox, In bewerking en Klaar.",'Begin met een werkmap voor Inbox, In bewerking en Klaar.'),"textContent");
 const start=document.createElement('button');start.type='button';I18n.assign(start,I18n.ui("Nieuw beginnen",'Nieuw beginnen'),"textContent");
 start.style.cssText='padding:9px 14px;background:#111;color:#fff;border:1px solid #111;font:600 14px Arial,sans-serif';
 const status=document.createElement('span');status.setAttribute('role','status');
 host.append(text,start,status);document.querySelector('.projectbar').before(host);
 const refresh=()=>{if(Werkmap.active){host.remove();updateProjectControls();}};
 document.addEventListener('werkmap-gekozen',refresh);
 start.onclick=async()=>{start.disabled=true;try{
  if(await Werkmap.startNew())refresh();
  else I18n.assign(status,(document.getElementById('wm-message')?.textContent||I18n.ui("Nog geen werkmap aangemaakt. Kies een opslagplek om te beginnen.",'Nog geen werkmap aangemaakt. Kies een opslagplek om te beginnen.')),"textContent");
 }catch(e){I18n.assign(status,I18n.ui("Niet gestart: {0}",'Niet gestart: '+e.message),"textContent");}finally{start.disabled=false;}};
})().catch(error=>console.error('Schrijfstart:',error));
