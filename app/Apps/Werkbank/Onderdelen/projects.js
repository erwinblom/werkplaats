// Keep the starter phases in workflow order; other folders remain alphabetical.
function compareWritingFolders(a,b){
 const ranks={'inbox':0,'in bewerking':1,'klaar':2};
 const left=a.split('/'),right=b.split('/');
 for(let i=0;i<Math.min(left.length,right.length);i++){
  if(left[i]===right[i])continue;
  const x=left[i].toLocaleLowerCase('nl'),y=right[i].toLocaleLowerCase('nl');
  return (ranks[x]??3)-(ranks[y]??3)||left[i].localeCompare(right[i],'nl');
 }
 return left.length-right.length;
}
let selectedProject='all';
try { selectedProject=GereedschapskistMode.storage.getItem('mw-project')||'all'; } catch {}
function projectRoot(path,name=selectedProject){if(name==='all')return '';return path===name||path.startsWith(name+'/')?name:null;}
function projectIncludes(path){return selectedProject==='all'||projectRoot(path)!==null;}
function projectFiles(){return files.filter(f=>projectIncludes(f.relativePath)&&(!writingFolderOverview()||f.relativePath.slice('Schrijven/'.length).includes('/')));}
function projectTreePath(path){return path;}
function rememberProject(){try{GereedschapskistMode.storage.setItem('mw-folders-'+selectedProject,JSON.stringify([...expandedFolders]));if(activeFile&&projectIncludes(activeFile.relativePath))GereedschapskistMode.storage.setItem('mw-document-'+selectedProject,activeFile.relativePath);}catch{}}
function projectChoices(){const roots=directoryHandles.map(h=>h.name);return [...new Set([...roots,...[...folderHandlesByPath.keys()].filter(p=>roots.some(r=>p.startsWith(r+'/')&&!p.slice(r.length+1).includes('/')))])].sort(compareWritingFolders);}
function writingFoldersWithDocuments(){return projectChoices().filter(folder=>files.some(file=>file.relativePath.startsWith(folder+'/')));}
function adjacentWritingFolder(direction){
 const all=projectChoices(),filled=writingFoldersWithDocuments();
 if(!filled.length)return null;
 const current=all.indexOf(selectedProject);
 return direction<0?[...filled].reverse().find(folder=>all.indexOf(folder)<current)||null:filled.find(folder=>all.indexOf(folder)>current)||null;
}
function projectStartPath(paths, project, saved){
 if(project==='all')return '';
 return saved&&(saved===project||saved.startsWith(project+'/'))&&paths.includes(saved)?saved:project+'/Inbox';
}
function defaultStartPath(){let saved;try{saved=GereedschapskistMode.storage.getItem('mw-start-'+selectedProject);}catch{}return projectStartPath([...folderHandlesByPath.keys()],selectedProject,saved);}
function updateProjectControls(){
 document.body.classList.toggle('has-folders',directoryHandles.length>0);
 const select=document.getElementById('projectSelect');if(!select)return;
 const choices=projectChoices();if(choices.length&&!choices.includes(selectedProject))selectedProject='all';
 select.replaceChildren(I18n.mark(new Option('Alle bestanden','all'),"Alle bestanden"),...choices.map(p=>{const name=p.split('/').pop();const duplicate=choices.filter(other=>other.split('/').pop()===name).length>1;const label=directoryHandles.some(h=>h.name===p)?name+' — alles':duplicate?name+' ('+p.split('/')[0]+')':name;return new Option(label,p)}));select.value=selectedProject;
 I18n.assign(document.getElementById('sidebarProjectName'),(selectedProject==='all'?I18n.ui("Alle bestanden",'Alle bestanden'):selectedProject.split('/').pop()),"textContent");
 for(const [id,direction] of [['previousProject',-1],['nextProject',1]]){
  const button=document.getElementById(id),next=adjacentWritingFolder(direction);
  button.disabled=!next;
  I18n.assign(button,(next?(direction<0?'Vorige map: ':'Volgende map: ')+next.split('/').pop():(direction<0?I18n.ui("Geen vorige map met documenten",'Geen vorige map met documenten'):I18n.ui("Geen volgende map met documenten",'Geen volgende map met documenten'))),"title");
 }
 const target=document.getElementById('newItemTarget'),previous=target.value;
 const start=defaultStartPath();
 const paths=[...new Set([...(start?[start]:[]),...[...folderHandlesByPath.keys()].filter(projectIncludes)])].sort(compareWritingFolders);
 target.replaceChildren(...paths.map(p=>new Option(selectedProject==='all'?p:(p===selectedProject?'Hoofdmap':p.slice(selectedProject.length+1)),p)));if(start)target.value=start;else if(paths.includes(previous))target.value=previous;
 document.getElementById('rememberDestinationLabel').hidden=selectedProject==='all';
 try{document.getElementById('saveStartFolder').checked=GereedschapskistMode.storage.getItem('mw-start-'+selectedProject)===target.value;}catch{}
 document.getElementById('newItemTargetLabel').hidden=!paths.length;
 document.getElementById('newFileBtn').disabled=false;
 for(const button of document.querySelectorAll('[data-template]'))button.disabled=false;
 document.getElementById('newFolderBtn').disabled=!paths.length&&!window.Werkmap?.active;
}
async function switchProject(name){
 if(name===selectedProject)return;
 if(wysiwygDirty&&!confirm(I18n.value(I18n.ui("Je hebt niet-opgeslagen wijzigingen. Weggooien en van map wisselen?",'Je hebt niet-opgeslagen wijzigingen. Weggooien en van map wisselen?')))){updateProjectControls();return;}
 rememberProject();selectedProject=name;try{GereedschapskistMode.storage.setItem('mw-project',name);}catch{}
 activeFile=null;activeFileIndex=null;isEditMode=false;wysiwygDirty=false;currentRawContent='';originalRawContent='';expandedFolders.clear();
 try{for(const p of JSON.parse(GereedschapskistMode.storage.getItem('mw-folders-'+name)||'[]'))expandedFolders.add(p);}catch{}
 if(name!=='all')expandedFolders.add(name);
 document.getElementById('content').classList.remove('editing');
 document.getElementById('content').innerHTML="<div class=\"welcome\"><h2><span data-i18n=\"Kies je document.\">Kies je document.</span></h2><p><span data-i18n=\"Open links een bestand om verder te werken.\">Open links een bestand om verder te werken.</span></p></div>";
 closeSearchPalette();renderFileList();restoreLastOpenFile();
}
function stepProject(direction){const next=adjacentWritingFolder(direction);if(next)return switchProject(next);}
function moveProjectRoot(path){if(selectedProject!=='all'&&projectIncludes(path))return selectedProject;return directoryHandles.find(h=>path.startsWith(h.name+'/'))?.name||path.split('/')[0];}
function moveDestinationPaths(paths,source,root,outside=false,query=''){const term=query.trim().toLocaleLowerCase('nl');return paths.filter(p=>p!==source&&(outside||p===root||p.startsWith(root+'/'))&&(!term||p.toLocaleLowerCase('nl').includes(term))).sort(compareWritingFolders);}
function newFileProjectCode(){return '';}
window.addEventListener('pagehide',rememberProject);

window.addEventListener('DOMContentLoaded',()=>{
document.getElementById('newMenu').ontoggle=event=>{if(event.target.open)updateProjectControls();};
document.getElementById('newItemTarget').onchange=()=>{const target=document.getElementById('newItemTarget');try{document.getElementById('saveStartFolder').checked=GereedschapskistMode.storage.getItem('mw-start-'+selectedProject)===target.value;}catch{document.getElementById('saveStartFolder').checked=false;}};
document.getElementById('saveStartFolder').onchange=event=>{const path=document.getElementById('newItemTarget').value;if(selectedProject==='all'||!path)return;try{if(event.target.checked)GereedschapskistMode.storage.setItem('mw-start-'+selectedProject,path);else GereedschapskistMode.storage.removeItem('mw-start-'+selectedProject);}catch{event.target.checked=false;showNotification(I18n.value(I18n.ui("De bestemming kon niet worden onthouden in deze browser.",'De bestemming kon niet worden onthouden in deze browser.')),'error');}};

});

function writingFolderOverview(){return selectedProject==='Schrijven'&&directoryHandles.some(h=>h.name==='Schrijven');}