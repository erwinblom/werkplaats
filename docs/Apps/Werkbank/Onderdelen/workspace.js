let outlineCollapsed = true;
let outlineHeadings = [];
let documentFocused = false;
function documentFocusButton() {
 return "<button class=\"edit-btn document-focus\" aria-pressed=\""+(documentFocused)+"\" onclick=\"toggleDocumentFocus()\">"+(documentFocused ? I18n.t('Sluit focus') : I18n.t('Focus'))+"</button>";
}
function toggleDocumentFocus() {
 documentFocused = !documentFocused;
 document.body.classList.toggle('writing-focus',documentFocused);
 syncWritingFocus();
 if(documentFocused)window.scrollTo({top:0,behavior:'instant'});
 document.getElementById('app').classList.toggle('document-focused', documentFocused);
 document.querySelectorAll('.document-focus').forEach(button => {
  I18n.assign(button,(documentFocused?I18n.ui("Sluit focus",'Sluit focus'):I18n.ui("Focus",'Focus')),"textContent");
  button.setAttribute('aria-pressed', String(documentFocused));
 });
 setOutlineVisibility(!!document.querySelector('#content .markdown-content, #content .wysiwyg-editor'));
}

function syncWritingFocus(){
 let bar=document.getElementById('writing-focus-bar');
 if(!bar){
  bar=document.createElement('nav');bar.id='writing-focus-bar';I18n.attribute(bar,'aria-label',I18n.ui("Schrijfstand",'Schrijfstand'));
  bar.innerHTML="<span class=\"focus-name\"></span><span class=\"focus-status\" role=\"status\"></span><button type=\"button\" data-focus-edit><span data-i18n=\"Bewerk\">Bewerk</span></button><button type=\"button\" class=\"action-primary\" data-focus-save><span data-i18n=\"Bewaar\">Bewaar</span></button><button type=\"button\" class=\"edit-btn document-material-toggle\" aria-controls=\"document-material-panel\" aria-expanded=\"false\" onclick=\"DocumentMaterials.togglePanel().catch(error=&gt;showNotification(error.message,&#x27;error&#x27;))\"><span data-i18n=\"Koppel\">Koppel</span></button><button type=\"button\" data-focus-notes><span data-i18n=\"Kladblok\">Kladblok</span></button><button type=\"button\" data-focus-close><span data-i18n=\"Sluit focus\">Sluit focus</span></button>";
  bar.querySelector('[data-focus-edit]').onclick=()=>toggleEditMode();
  bar.querySelector('[data-focus-save]').onclick=()=>{const button=document.getElementById(isEditMode?'editorSaveButton':'loose-save');button?.click();};
  bar.querySelector('[data-focus-notes]').onclick=()=>Kladblok.toggle();
  bar.querySelector('[data-focus-close]').onclick=()=>toggleDocumentFocus();
  document.body.append(bar);
 }
 bar.hidden=!documentFocused;
 if(!documentFocused)return;
 bar.querySelector('.focus-name').textContent=activeFile?.name||'';
 bar.querySelector('[data-focus-edit]').hidden=isEditMode||!activeFile;
 const save=bar.querySelector('[data-focus-save]'),original=document.getElementById(isEditMode?'editorSaveButton':'loose-save');
 save.disabled=!activeFile||!!original?.disabled;
 I18n.assign(save,(I18n.ui("Bewaar",'Bewaar')),"textContent");
 I18n.assign(bar.querySelector('.focus-status'),(isEditMode?(wysiwygDirty?I18n.ui("Niet opgeslagen",'Niet opgeslagen'):I18n.ui("Geen onbewaarde wijzigingen",'Geen onbewaarde wijzigingen')):I18n.ui("Leesweergave",'Leesweergave')),"textContent");
 document.dispatchEvent(new Event('writing-focus-updated'));
}

function setOutlineVisibility(hasDocument) {
 const panel = document.getElementById('focusPanel');
 const button = document.getElementById('focusToggle');
 panel.hidden = !hasDocument || outlineCollapsed;
 if(button){
  button.hidden = !hasDocument;
  button.setAttribute('aria-expanded', String(!panel.hidden));
  I18n.assign(button,(panel.hidden?I18n.ui("Inhoudsopgave tonen",'Inhoudsopgave tonen'):I18n.ui("Inhoudsopgave verbergen",'Inhoudsopgave verbergen')),"title");
 }
 document.getElementById('app').classList.toggle('focus-hidden', panel.hidden);
}
function toggleFocus() {
 outlineCollapsed = !outlineCollapsed;
 setOutlineVisibility(!!document.querySelector('#content .markdown-content, #content .wysiwyg-editor'));
}
function updateDocumentOutline() {
 const body = document.querySelector('#content .markdown-content, #content .wysiwyg-editor');
 const nav = document.getElementById('documentOutline');
 outlineHeadings = body ? Array.from(body.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(heading => !heading.closest('.frontmatter, .backlinks-section')) : [];
 setOutlineVisibility(!!body);
 nav.replaceChildren();
 if (!body) return;
 if (!outlineHeadings.length) {
  const message = document.createElement('p');
  I18n.assign(message,I18n.ui("Dit document heeft nog geen koppen.",'Dit document heeft nog geen koppen.'),"textContent");
  nav.append(message); return;
 }
 const minimum = Math.min(...outlineHeadings.map(heading => Number(heading.tagName.slice(1))));
 for (const heading of outlineHeadings) {
  const button = document.createElement('button');
  button.type = 'button';
  I18n.assign(button,(heading.textContent.trim()||I18n.ui("Kop zonder tekst",'Kop zonder tekst')),"textContent");
  button.style.paddingLeft = (Number(heading.tagName.slice(1)) - minimum) * 12 + 8 + 'px';
  button.addEventListener('click', () => {
   if (window.innerWidth <= 900) { outlineCollapsed = true; setOutlineVisibility(true); }
   heading.scrollIntoView({behavior:'auto', block:'start'});
   for (const item of nav.querySelectorAll('button')) item.removeAttribute('aria-current');
   button.setAttribute('aria-current', 'location');
  });
  nav.append(button);
 }
}
let outlineTimer;
const outlineObserver = new MutationObserver(() => {
 if(documentFocused)syncWritingFocus();
 clearTimeout(outlineTimer);
 outlineTimer = setTimeout(updateDocumentOutline, 100);
});
outlineObserver.observe(document.getElementById('content'), {childList:true, subtree:true, characterData:true});
updateDocumentOutline();

async function createNewFolder(){
 const target=document.getElementById('newItemTarget').value;
 let parent=folderHandlesByPath.get(target)||directoryHandles[0];
 let workmapFallback=false;
 try{
  if(!parent&&window.Werkmap?.active){
   const access=await Werkmap.allAccess();
   parent=await access.root.getDirectoryHandle('Schrijven',{create:true});
   workmapFallback=true;
  }
  if(!parent)return showNotification(I18n.value(I18n.ui("Open eerst een werkmap of schrijfmap.",'Open eerst een werkmap of schrijfmap.')),'error');
  if(!(await verifyPermission(parent,'readwrite')))return showNotification(I18n.value(I18n.ui("Open de map opnieuw en geef toestemming om wijzigingen te bewaren.",'Open de map opnieuw en geef toestemming om wijzigingen te bewaren.')),'error');
  const answer=prompt(I18n.value(I18n.ui("Hoe heet de nieuwe map in {0}?",'Hoe heet de nieuwe map in '+(workmapFallback?Werkmap.name+'/Schrijven':target||parent.name)+'?')));if(answer===null)return;
  const name=answer.trim();
  if(!name||name==='.'||name==='..'||/[\/\\\0]/.test(name))return showNotification(I18n.value(I18n.ui("Vul een mapnaam in zonder schuine strepen.",'Vul een mapnaam in zonder schuine strepen.')),'error');
  for await(const entry of parent.values()){if(entry.name.toLowerCase()===name.toLowerCase())return showNotification(I18n.value(I18n.ui("Er bestaat al een bestand of map met deze naam.",'Er bestaat al een bestand of map met deze naam.')),'error');}
  await parent.getDirectoryHandle(name,{create:true});
  if(workmapFallback){directoryHandles.push(parent);folderHandlesByPath.set(parent.name,parent);}
  await loadFiles();
  showNotification(I18n.value(I18n.ui("Map aangemaakt: {0}/{1}",'Map aangemaakt: '+(workmapFallback?Werkmap.name+'/Schrijven':target||parent.name)+'/'+name)));
 }catch(error){showNotification(I18n.value(I18n.ui("Map aanmaken mislukt: {0}",'Map aanmaken mislukt: '+error.message)),'error');}
}
document.getElementById('fileList').addEventListener('keydown',event=>{
 if((event.key==='Enter'||event.key===' ')&&event.target.matches('[role="button"]')){
  event.preventDefault();event.target.click();
 }
});
document.addEventListener('keydown',event=>{
 if(documentFocused||!['ArrowLeft','ArrowRight'].includes(event.key))return;
 if(event.defaultPrevented||event.repeat||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.isComposing)return;
 const target=event.target;
 if(isEditMode||target.isContentEditable||target.closest('input,textarea,select,[contenteditable="true"],dialog,[role="slider"],video,audio')||document.querySelector('dialog[open],.search-palette-overlay.visible'))return;
 const button=document.getElementById(event.key==='ArrowLeft'?'previousProject':'nextProject');
 if(!button||button.disabled)return;
 event.preventDefault();
 stepProject(event.key==='ArrowLeft'?-1:1);
});
window.addEventListener('beforeunload',event=>{if(wysiwygDirty){event.preventDefault();event.returnValue='';}});
if(!('showDirectoryPicker' in window)){for(const button of document.querySelectorAll('.start-folder')){button.disabled=true;I18n.assign(button,I18n.ui("Open Schrijven in Chrome of Edge",'Open Schrijven in Chrome of Edge'),"textContent");}}

updateProjectControls();

function syncTaskCheckboxes(editor) {
 for (const checkbox of editor.querySelectorAll('input[type="checkbox"]')) checkbox.toggleAttribute('checked', checkbox.checked);
}
function placeTaskCaret(editor, force = false) {
 const selection=window.getSelection();
 if(!selection?.rangeCount || !selection.isCollapsed)return;
 const range=selection.getRangeAt(0), node=range.startContainer;
 const element=node.nodeType===1?node:node.parentElement;
 const item=element?.closest('li');
 if(!item || !editor.contains(item))return;
 const box=item.querySelector(':scope > input[type="checkbox"], :scope > p > input[type="checkbox"]');
 if(!box)return;
 let space=box.nextSibling;
 if(space?.nodeType!==3){space=I18n.node(' ');box.after(space);}
 else if(!space.data.startsWith(' '))space.insertData(0,' ');
 const after=document.createRange();after.setStart(space,1);after.collapse(true);
 if(force || range.compareBoundaryPoints(Range.START_TO_START,after)<0){selection.removeAllRanges();selection.addRange(after);}
}
function prepareTaskLists(editor) {
 for (const checkbox of editor.querySelectorAll('li input[type="checkbox"]')) {
  checkbox.disabled = false;
  I18n.attribute(checkbox,'aria-label',I18n.ui("Taak afvinken",'Taak afvinken'));
  const list = checkbox.closest('li')?.parentElement;
  if (list?.matches('ul,ol')) list.dataset.taskList = 'true';
 }
 for (const list of editor.querySelectorAll('[data-task-list]')) {
  for (const item of list.children) {
   if (item.tagName !== 'LI' || item.querySelector(':scope > input[type="checkbox"], :scope > p > input[type="checkbox"]')) continue;
   const box = document.createElement('input'); box.type='checkbox'; I18n.attribute(box,'aria-label',I18n.ui("Taak afvinken",'Taak afvinken'));
   item.prepend(box, I18n.node(' '));
  }
 }
 placeTaskCaret(editor);
}
function insertTaskList() {
 const editor=document.getElementById('wysiwygEditor'); if(!editor)return;
 editor.focus();
 const selectedList=()=>{
  const node=window.getSelection()?.anchorNode;
  const element=node?.nodeType===1?node:node?.parentElement;
  return element&&editor.contains(element)?element.closest('ul,ol'):null;
 };
 let list=selectedList();
 if(!list){document.execCommand('insertUnorderedList',false);list=selectedList();}
 if(list){list.dataset.taskList='true';prepareTaskLists(editor);}
 else {document.execCommand('insertHTML',false,"<ul data-task-list=\"true\"><li><input type=\"checkbox\" aria-label=\"Taak afvinken\" data-i18n-aria-label=\"Taak afvinken\"> <span data-i18n=\"Nieuwe taak\">Nieuwe taak</span></li></ul>");}
 placeTaskCaret(editor,true);
 wysiwygDirty=true;updateWysiwygModifiedState();
}

// Keep creation and folder management compact, including keyboard dismissal.
document.querySelectorAll('.sidebar-menu').forEach(menu => {
 menu.addEventListener('toggle', () => {
  if(menu.open) document.querySelectorAll('.sidebar-menu').forEach(other => {if(other !== menu) other.open = false;});
 });
 menu.addEventListener('click', event => {if(event.target.closest('button')) menu.open = false;});
});
document.addEventListener('click', event => {
 if(!event.target.closest('.sidebar-menu')) document.querySelectorAll('.sidebar-menu').forEach(menu => {menu.open=false;});
});
document.addEventListener('keydown', event => {
 if(event.key === 'Escape') document.querySelectorAll('.sidebar-menu[open]').forEach(menu => {menu.open=false;menu.querySelector('summary').focus();});
});
