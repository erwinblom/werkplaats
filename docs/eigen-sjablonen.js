'use strict';
window.EigenSjablonen=(()=>{
 const cleanName=value=>String(value||'').trim().replace(/[\\/:*?"<>|\x00-\x1f]/g,'-').slice(0,120);
 const currentText=()=>Kladblok.strip(isEditMode?getWysiwygMarkdown():currentRawContent||'');
 async function list(){const shared=await BewaarAlles.readShared();return Array.isArray(shared.writingTemplates)?shared.writingTemplates:[];}
 function askName(initial=''){
  return new Promise(resolve=>{const dialog=document.createElement('dialog');dialog.className='file-dialog';dialog.innerHTML='<form><h2><span data-i18n=\"Bewaar als sjabloon\">Bewaar als sjabloon</span></h2><label><span data-i18n=\"Naam\">Naam</span><input name="name" maxlength="120" required></label><p role="alert"></p><div class="wp-actions"><button type="button">Annuleer</button><button type="submit" class="primary action-primary">Bewaar sjabloon</button></div></form>';const input=dialog.querySelector('input'),error=dialog.querySelector('[role="alert"]');input.value=initial;const finish=value=>{dialog.close();resolve(value)};dialog.querySelector('[type="button"]').onclick=()=>finish(null);dialog.oncancel=event=>{event.preventDefault();finish(null)};dialog.onclose=()=>dialog.remove();dialog.querySelector('form').onsubmit=event=>{event.preventDefault();const name=cleanName(input.value);if(!name){error.textContent=I18n.t('Vul een naam in.');return;}finish(name)};document.body.append(dialog);dialog.showModal();input.focus();input.select();});
 }
 async function saveCurrent(){
  if(!activeFile)throw Error(I18n.t('Open eerst een document.'));
  const content=currentText();if(!content.trim())throw Error(I18n.t('Een leeg document kan geen sjabloon worden.'));
  const suggested=(activeFile.name||'Nieuw sjabloon').replace(/\.(md|markdown|txt)$/i,'');const name=await askName(suggested);if(!name)return;
  await BewaarAlles.updateShared(shared=>{shared.writingTemplates=shared.writingTemplates||[];const existing=shared.writingTemplates.find(item=>item.name.toLocaleLowerCase('nl')===name.toLocaleLowerCase('nl'));const now=new Date().toISOString();if(existing)Object.assign(existing,{content,updatedAt:now});else shared.writingTemplates.push({id:crypto.randomUUID(),name,content,createdAt:now,updatedAt:now});});
  Werkstatus.changed();await render();showNotification(I18n.value(I18n.ui('Sjabloon bewaard. Gebruik Bewaar alles voor je werkmap.','Sjabloon bewaard. Gebruik Bewaar alles voor je werkmap.')),'success');
 }
 async function create(template){
  const folderPath=document.getElementById('newItemTarget')?.value||'';await createNewFile({folderPath,suggestedName:cleanName(template.name)+'.md',initialContent:async()=>template.content});
 }
 async function remove(id){
  if(!(await Prullenbak.confirm(I18n.value(I18n.ui('Dit sjabloon naar de prullenbak verplaatsen?','Dit sjabloon naar de prullenbak verplaatsen?')))))return;
  await BewaarAlles.updateShared(shared=>{const items=shared.writingTemplates||[],item=items.find(value=>value.id===id);if(!item)return;Prullenbak.add(shared,'Sjablonen',item);shared.writingTemplates=items.filter(value=>value.id!==id);});Werkstatus.changed();await render();
 }
 let box,listNode;
 async function render(){
  if(!listNode)return;const items=await list();listNode.replaceChildren();
  if(!items.length){const empty=document.createElement('p');empty.className='hint';I18n.assign(empty,I18n.ui('Nog geen eigen sjablonen.','Nog geen eigen sjablonen.'));listNode.append(empty);return;}
  for(const template of [...items].sort((a,b)=>a.name.localeCompare(b.name,'nl'))){const row=document.createElement('div');row.className='writing-template-row';const open=document.createElement('button');open.type='button';open.className='new-file-btn';open.textContent=template.name;open.onclick=()=>create(template).catch(error=>showNotification(error.message,'error'));const del=document.createElement('button');del.type='button';del.className='writing-template-delete';I18n.assign(del,I18n.ui('Verwijder','Verwijder'));I18n.attribute(del,'aria-label',I18n.ui('Verwijder sjabloon {0}','Verwijder sjabloon '+template.name));del.onclick=()=>remove(template.id).catch(error=>showNotification(error.message,'error'));row.append(open,del);listNode.append(row);}
 }
 function mount(){
  const panel=document.querySelector('#newMenu .sidebar-menu-panel');if(!panel)return;
  box=document.createElement('details');box.className='writing-templates';const summary=document.createElement('summary');I18n.assign(summary,I18n.ui('Mijn sjablonen','Mijn sjablonen'));listNode=document.createElement('div');listNode.className='writing-template-list';box.append(summary,listNode);panel.insertBefore(box,document.getElementById('newFolderBtn'));box.addEventListener('toggle',()=>{if(box.open)render().catch(error=>showNotification(error.message,'error'));});
  const style=document.createElement('style');style.textContent='.writing-templates{border-top:1px solid #ddd;padding-top:8px}.writing-templates>summary{font-weight:700;cursor:pointer;padding:8px 0}.writing-template-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:center}.writing-template-row .new-file-btn{text-align:left}.writing-template-delete{padding:8px;border:1px solid #bbb;background:#fff;color:#a32620;cursor:pointer}';document.head.append(style);
  const addSaveAction=()=>{const menu=document.querySelector('#content .file-more-panel');if(!menu||menu.querySelector('[data-save-template]'))return;const button=document.createElement('button');button.type='button';button.className='edit-btn';button.dataset.saveTemplate='';I18n.assign(button,I18n.ui('Bewaar als sjabloon','Bewaar als sjabloon'));button.onclick=()=>saveCurrent().catch(error=>showNotification(error.message,'error'));const exportButton=[...menu.querySelectorAll('button')].find(item=>item.textContent.trim()===I18n.t('Exporteren…'));menu.insertBefore(button,exportButton||menu.firstChild);};
  new MutationObserver(addSaveAction).observe(document.getElementById('content'),{childList:true,subtree:true});addSaveAction();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 return {list,saveCurrent,render};
})();
