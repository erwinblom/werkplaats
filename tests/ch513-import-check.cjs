'use strict';
// Disposable CI only. No app code, storage API, browser permissions or picker is replaced.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');const {spawn}=require('node:child_process');
const out=path.resolve('import-evidence');fs.mkdirSync(out,{recursive:true});
function nativeInput(folder,tag,permissionOnly=false){
 // This helper operates only the disposable runner's folder dialog. Never the author's desktop.
 let cmd,args;
 if(process.platform==='win32'){
  const escape=s=>s.replace(/'/g,"''");
  const sendKeysLiteral=s=>s.replace(/[+^%~(){}]/g,c=>'{'+c+'}');
  const shot=name=>escape(path.join(out,tag+'-native-'+name+'.png'));
  const script=`Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; Add-Type -AssemblyName UIAutomationClient; Add-Type -AssemblyName UIAutomationTypes; $keys=New-Object -ComObject WScript.Shell;
function Shot([string]$name) { $bounds=[System.Windows.Forms.SystemInformation]::VirtualScreen; $bmp=New-Object System.Drawing.Bitmap $bounds.Width,$bounds.Height; $g=[System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($bounds.Location,[System.Drawing.Point]::Empty,$bounds.Size); $bmp.Save($name,[System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bmp.Dispose() }
function AssertPermissionClosed() {
 $condition=[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::NameProperty,'Allow this site to edit files?')
 for($i=0;$i -lt 20;$i++) {
  $all=[System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Descendants,$condition)
  $visible=@($all | Where-Object { -not $_.Current.IsOffscreen })
  if($visible.Count -eq 0) { Write-Host 'Permission dialog no longer visible'; return $true }
  Start-Sleep -Milliseconds 250
 }
 Write-Host 'Permission dialog remains visible'; return $false
}
function InvokeNamed([string]$name,[int]$attempts=20) {
 for($i=0;$i -lt $attempts;$i++) {
  $cond=[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::NameProperty,$name)
  $matches=[System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Descendants,$cond)
  foreach($element in $matches) {
   Write-Host ('UIA match: '+$element.Current.Name+' type='+$element.Current.ControlType.ProgrammaticName+' visible='+(-not $element.Current.IsOffscreen)+' enabled='+$element.Current.IsEnabled)
   if($element.Current.IsOffscreen -or -not $element.Current.IsEnabled){continue}
   try { $invoke=$element.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern); $invoke.Invoke(); Write-Host ('Invoked: '+$name); return $true } catch { Write-Host ('Invoke error: '+$_.Exception.Message) }
  }
  Start-Sleep -Milliseconds 250
 }
 Write-Host ('No invokable visible button: '+$name)
 $buttons=[System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ControlTypeProperty,[System.Windows.Automation.ControlType]::Button))
 $buttons | Select-Object -First 35 | ForEach-Object { Write-Host ('Visible candidate: '+$_.Current.Name+' visible='+(-not $_.Current.IsOffscreen)) }
 return $false
}
${permissionOnly ? `Start-Sleep -Milliseconds 700; Shot '${shot('before')}'; $allowed=InvokeNamed 'Allow'; Write-Host ('Permission invoked: '+$allowed); if(!$allowed){exit 6}; $closed=AssertPermissionClosed; Shot '${shot('after-allow')}'; if(!$closed){exit 7};` : `Start-Sleep -Milliseconds 1400; Shot '${shot('before')}';
$keys.SendKeys('%d'); Start-Sleep -Milliseconds 300; $keys.SendKeys('${escape(sendKeysLiteral(folder))}'); $keys.SendKeys('{ENTER}'); Start-Sleep -Milliseconds 800; Shot '${shot('path')}';
$selected=InvokeNamed 'Select Folder'; Shot '${shot('after-select')}'; if(!$selected){exit 5}
Start-Sleep -Milliseconds 500; $allowed=InvokeNamed 'Allow'; Write-Host ('Permission invoked: '+$allowed); if(!$allowed){exit 6};
$closed=AssertPermissionClosed; Start-Sleep -Milliseconds 500; Shot '${shot('after-allow')}'; if(!$closed){exit 7};`}
`;


  cmd='powershell';args=['-NoProfile','-Command',script];
 }else{
  const script=permissionOnly ? 'sleep 1.2; scrot "$2"; xdotool key --clearmodifiers Tab; xdotool key Return; sleep 0.8; scrot "$3"' : `
ready=0
for attempt in $(seq 1 40); do
 title=$(xdotool getwindowfocus getwindowname 2>/dev/null || true)
 case "$title" in "Select where this site can save changes") ready=1; break;; esac
 picker_id=$(xdotool search --onlyvisible --name '^Select where this site can save changes$' 2>/dev/null | tail -n 1 || true)
 if [ -n "$picker_id" ]; then
  printf 'Found visible disposable runner picker: %s\\n' "$picker_id"
  xdotool windowfocus --sync "$picker_id" || true
  title=$(xdotool getwindowfocus getwindowname 2>/dev/null || true)
  if [ "$title" = 'Select where this site can save changes' ]; then ready=1; break; fi
 fi
 sleep 0.25
done
printf 'Picker focus: %s\\n' "$title"
scrot "$4"
if [ "$ready" != 1 ]; then printf 'Native picker did not receive focus within 10 seconds\\n'; exit 3; fi
xdotool key --clearmodifiers ctrl+l
xdotool type --clearmodifiers -- "$1"
xdotool key Return
sleep 0.8
scrot "$2"
xdotool key Tab
xdotool key Return
sleep 1.2
scrot "$3"
printf 'Permission dialog: advance from default Dont Allow to Allow\\n'
xdotool key --clearmodifiers Tab
xdotool key Return
sleep 0.8
scrot "$3.after.png"
`;

  cmd='bash';args=['-c',script,'picker',folder,path.join(out,tag+'-native-picker.png'),path.join(out,tag+'-native-after-allow.png'),path.join(out,tag+'-native-before.png')];
 }
 const proc=spawn(cmd,args,{stdio:['ignore','pipe','pipe']});let logs='';proc.stdout.on('data',x=>logs+=x);proc.stderr.on('data',x=>logs+=x);
 return new Promise(resolve=>{
  let done=false;
  const finish=code=>{if(done)return;done=true;clearTimeout(timer);fs.writeFileSync(path.join(out,tag+'-picker.log'),logs);resolve(code);};
  const timer=setTimeout(()=>{logs+='\nNative input helper exceeded 30 seconds; terminating only this owned helper process.\n';proc.kill();finish(124);},30000);
  proc.on('error',error=>{logs+='\n'+String(error);finish(125);});
  proc.on('close',finish);
 });
}
const SHA='98489dd9705b28ae2124ffcf7ade99b44fd264f3d3df548528cbe4c53eb43cc8';
const app=path.resolve('fixture-release/unpacked/Werkplaats/Bestanden'),launcher=path.resolve('fixture-release/unpacked/Werkplaats/Begin hier.html');
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aZkAAAAASUVORK5CYII=';
const sourceFixture=(id,title,summary,notes,projectId='')=>({...projectId?{projectId}:{},id,title,source:'Proefbron',url:`https://example.test/${id}`,category:'Technologie',uses:[],tags:id==='ch513-a'?['mobiliteit']:[],summary,notes,quote:'',checked:'',favorite:false});
const projectFixture={id:'ch513-project',kind:'project',title:'CH513 platformproject',channel:'',state:'active',date:'',endDate:'',text:'Fictieve projecttekst',notes:'Projectnotitie blijft',url:'',duration:'ongoing',projectId:'',documentId:'',sourceIds:[]};
const markdown=`# CH513 document\n\nContext: self-driving voertuigen in fictieve proef.\n\n![Omslag](data:image/png;base64,${png})\n\n![Herhaling](data:image/png;base64,${png})\n`;
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const result={os:os.platform(),release:os.release(),node:process.version,playwright:require('playwright/package.json').version,releaseSha256:null,masterImportAllPassed:false,cases:[],diagnosticOnly:true};
const save=()=>fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));save();
const permissionInput=tag=>nativeInput('',tag,true);
const options={channel:'chrome',headless:false,acceptDownloads:true,viewport:{width:1440,height:1000},args:['--disable-features=Translate']};
function filePicker(file,tag){
 let cmd,args;
 if(process.platform==='win32'){
  const lit=s=>s.replace(/[+^%~(){}]/g,c=>'{'+c+'}').replace(/'/g,"''");
  const shot=s=>path.join(out,tag+'-'+s+'.png').replace(/'/g,"''");
  const script=`Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $keys=New-Object -ComObject WScript.Shell;
function Shot([string]$name){$b=[System.Windows.Forms.SystemInformation]::VirtualScreen;$bmp=New-Object System.Drawing.Bitmap $b.Width,$b.Height;$g=[System.Drawing.Graphics]::FromImage($bmp);$g.CopyFromScreen($b.Location,[System.Drawing.Point]::Empty,$b.Size);$bmp.Save($name,[System.Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$bmp.Dispose()}
Start-Sleep -Milliseconds 1400;Shot '${shot('file-before')}';$keys.SendKeys('%n');Start-Sleep -Milliseconds 300;$keys.SendKeys('${lit(file)}');Start-Sleep -Milliseconds 300;Shot '${shot('file-path')}';$keys.SendKeys('{ENTER}');Start-Sleep -Milliseconds 1200;Shot '${shot('file-after')}';`;
  cmd='powershell';args=['-NoProfile','-Command',script];
 }else{
  cmd='bash';args=['-c','sleep 1.5; scrot "$2"; xdotool key --clearmodifiers ctrl+l; xdotool type --clearmodifiers -- "$1"; sleep 0.4; scrot "$3"; xdotool key Return; sleep 1; scrot "$4"','file',file,path.join(out,tag+'-file-before.png'),path.join(out,tag+'-file-path.png'),path.join(out,tag+'-file-after.png')];
 }
 const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
 return new Promise(resolve=>{let done=false;const finish=c=>{if(done)return;done=true;clearTimeout(timer);fs.writeFileSync(path.join(out,tag+'-filepicker.log'),log);resolve(c);};const timer=setTimeout(()=>{child.kill();finish(124)},20000);child.on('error',e=>{log+=String(e);finish(125)});child.on('close',finish)});
}
async function probe(kind,iteration,trace=false){
 const tag=`${kind}-${iteration}${trace?'-trace':''}`,entry={tag,kind,iteration,instrumented:trace,passed:false,events:[],errors:[]};result.cases.push(entry);save();let ctx,p;
 const parent=process.platform==='win32'?path.join(os.homedir(),'Documents','Werkplaats CH513 import'):os.tmpdir();fs.mkdirSync(parent,{recursive:true});
 const folder=fs.mkdtempSync(path.join(parent,'wp-import-map-')),profile=fs.mkdtempSync(path.join(os.tmpdir(),'wp-import-profile-')),inputDir=fs.mkdtempSync(path.join(parent,'wp-import-source-'));
 try{
  fs.mkdirSync(path.join(folder,'Schrijven'),{recursive:true});fs.writeFileSync(path.join(folder,'Schrijven','CH513 document.md'),markdown);
  // Complete legacy schema makes this an existing workspace, without any personal data.
  fs.mkdirSync(path.join(folder,'Verzamelen'),{recursive:true});fs.writeFileSync(path.join(folder,'Verzamelen','gereedschapskist-verzamelen.json'),JSON.stringify({format:'bronnenkast',version:1,name:'CH513 proefcollectie',items:[sourceFixture('ch513-a','Zelfrijdende auto voorbeeld','Autonomous driving met lokale zoekproef','Bewaar deze eigen notitie','ch513-project'),sourceFixture('ch513-b','Tweede bookmark','Tweede bron voor project','Behouden')]}));
  fs.mkdirSync(path.join(folder,'Plannen'),{recursive:true});fs.writeFileSync(path.join(folder,'Plannen','gereedschapskist-plannen.json'),JSON.stringify({format:'publicatieplanner',version:2,items:[projectFixture]}));
  const inputName=kind==='ready-buffer-unique'?'CH513 unieke import.md':'CH513 document.md',source=path.join(inputDir,inputName);fs.writeFileSync(source,markdown);
  const bytes=fs.readFileSync(source);entry.source={file:source,size:bytes.length,sha256:sha(bytes),utf8Exact:bytes.toString('utf8')===markdown};assert(entry.source.utf8Exact);assert.equal(sha(bytes),sha(Buffer.from(markdown)));
  fs.mkdirSync(path.join(profile,'Default'),{recursive:true});fs.writeFileSync(path.join(profile,'Default','Preferences'),JSON.stringify({translate:{enabled:false}}));
  ctx=await chromium.launchPersistentContext(profile,options);
  const installTrace=async context=>{if(trace)await context.addInitScript(()=>{
   // Diagnostic observer only: capture before target handler resets input; this extra read and polling can affect timing.
   window.__importTrace=[];
   // Instrumented case only: transparent wrappers record ordering, and may perturb timing.
   const traceLog=row=>window.__importTrace.push({time:performance.now(),...row});
   for(const method of ['get','set','clear']){const original=Map.prototype[method];Map.prototype[method]=function(...args){let target=false;try{target=typeof converterFiles!=='undefined'&&this===converterFiles}catch{};if(target)traceLog({event:'converter-map-'+method,key:args[0],valueLength:typeof args[1]?.content==='string'?args[1].content.length:null,sizeBefore:this.size});const output=Reflect.apply(original,this,args);if(target)traceLog({event:'converter-map-'+method+'-done',key:args[0],resultPresent:method==='get'?output!==undefined:null,sizeAfter:this.size});return output;};}
   const originalText=File.prototype.text;File.prototype.text=function(...args){const f=this;traceLog({event:'file-text-start',name:f.name,size:f.size});return Reflect.apply(originalText,f,args).then(text=>{traceLog({event:'file-text-done',name:f.name,size:f.size,textLength:text.length,text});return text;});};
   let readyObserved=false;const observeReady=setInterval(()=>{if(readyObserved||!window.BewaarAlles?.ready)return;readyObserved=true;clearInterval(observeReady);traceLog({event:'bewaar-alles-ready-observed'});window.BewaarAlles.ready.then(()=>traceLog({event:'bewaar-alles-ready-resolved'}),e=>traceLog({event:'bewaar-alles-ready-rejected',message:String(e)}));},20);
   document.addEventListener('DOMContentLoaded',()=>{const target=document.getElementById('content');if(target)new MutationObserver(()=>{const node=target.querySelector('.markdown-content');traceLog({event:'render-change',heading:node?.querySelector('h1')?.textContent||null,textLength:node?.textContent.length||0});}).observe(target,{childList:true,subtree:true});});
   document.addEventListener('change',e=>{if(e.target?.id!=='loose-input')return;const file=e.target.files[0];const row={event:'capture-before-handler',time:performance.now(),size:file?.size,name:file?.name,inputCount:e.target.files.length};window.__importTrace.push(row);if(file)file.text().then(t=>{row.text=t;row.afterRead=performance.now();row.inputCountAfterReset=e.target.files.length;});},true);
   const tick=()=>{if(!document.getElementById('loose-input'))return;try{window.__importTrace.push({event:'poll',time:performance.now(),map:typeof converterFiles==='undefined'?null:[...converterFiles.entries()].map(([k,v])=>({name:k,content:v.content})),active:typeof activeFile==='undefined'?null:activeFile?.relativePath||null,raw:typeof currentRawContent==='undefined'?null:currentRawContent,files:typeof fileContents==='undefined'?null:[...fileContents.entries()]});}catch(e){window.__importTrace.push({event:'poll-error',message:String(e)});}};setInterval(tick,100);
  });};await installTrace(ctx);
  p=ctx.pages()[0]||await ctx.newPage();p.on('dialog',d=>d.accept());p.on('pageerror',e=>entry.errors.push(e.message));entry.browserUserAgent=await p.evaluate(()=>navigator.userAgent);
  await p.goto(pathToFileURL(launcher).href);await p.getByRole('button',{name:'Verder werken',exact:true}).click();entry.nativePickerExit=await nativeInput(folder,tag);assert.equal(entry.nativePickerExit,0);await p.waitForFunction(()=>window.Werkmap?.active&&Werkmap.name,null,{timeout:30000});assert.equal(await p.evaluate(()=>Werkmap.name),path.basename(folder));assert.equal(await p.evaluate(async()=>{const {root}=await Werkmap.allAccess(false);return root.queryPermission({mode:'readwrite'});}), 'granted');await p.waitForFunction(()=>/Werkmap geopend/.test(document.querySelector('#wm-message')?.textContent||''),null,{timeout:30000});entry.nativeFolder=true;
  if(kind==='saved-restart-startup'){
   await p.goto(pathToFileURL(path.join(app,'Apps','Bronnenkast','Start Bronnenkast.html')).href+'?werkruimte=eigen');await p.waitForFunction(()=>window.BewaarAlles&&window.Werkmap);await p.evaluate(async()=>{await Werkmap.suiteReady;await BewaarAlles.ready});
   await p.getByRole('button',{name:'Bewaar alles',exact:true}).first().click();await p.waitForFunction(()=>/Alles bewaard\./.test(document.querySelector('#wm-message')?.textContent||''),null,{timeout:30000});
   const rounds=path.join(folder,'Bewaard werk'),pointer=JSON.parse(fs.readFileSync(path.join(rounds,'actueel.json'))),roundDir=path.join(rounds,pointer.current),manifest=JSON.parse(fs.readFileSync(path.join(roundDir,'bewaar-alles.json')));const sessions=manifest.sessions.map(v=>JSON.parse(fs.readFileSync(path.join(roundDir,v.folder,'werksessie.json'))));
   assert(sessions.find(v=>v.tool==='Bronnenkast')?.data.items.length===2);assert(sessions.find(v=>v.tool==='Publicatieplanner')?.data.items.some(x=>x.id==='ch513-project'));assert(sessions.find(v=>v.tool==='Werkbank')?.documents.some(d=>d.content===markdown));entry.savedRound={pointer,manifest,sessionTools:sessions.map(v=>v.tool)};entry.events.push('real save-all committed and read from OS');
   const previous=ctx.browser();await ctx.close();assert(!previous||!previous.isConnected());ctx=await chromium.launchPersistentContext(profile,options);await installTrace(ctx);p=ctx.pages()[0]||await ctx.newPage();p.on('dialog',d=>d.accept());p.on('pageerror',e=>entry.errors.push(e.message));
   await p.goto(pathToFileURL(launcher).href);await p.waitForFunction(()=>window.Werkmap);await p.evaluate(()=>Werkmap.recall());const access=await p.evaluate(async()=>{const {root}=await Werkmap.allAccess(false);return root.queryPermission({mode:'readwrite'});});entry.restartPermission=access;
   await p.getByRole('button',{name:'Verder werken',exact:true}).click();if(access!=='granted'){entry.restartPermissionHelperExit=await permissionInput(tag+'-restart');assert.equal(entry.restartPermissionHelperExit,0);}await p.waitForFunction(()=>/Werkmap geopend/.test(document.querySelector('#wm-message')?.textContent||''),null,{timeout:30000});
   assert.equal(await p.evaluate(async()=>{const {root}=await Werkmap.allAccess(false);return root.queryPermission({mode:'readwrite'});}), 'granted');entry.events.push('full browser restart and real workmap restored');
   await p.goto(pathToFileURL(path.join(app,'Apps','Publicatieplanner','Start Publicatieplanner.html')).href+'?werkruimte=eigen');const card=p.locator('article.publication').filter({hasText:'CH513 platformproject'});await card.waitFor();await card.locator('.pub-title').click();await p.locator('dialog[open]').getByRole('link',{name:'Zelfrijdende auto voorbeeld',exact:true}).waitFor();entry.events.push('project and linked bookmark displayed after restart');
  }
  await p.goto(pathToFileURL(path.join(app,'Apps','Werkbank','▶ Begin hier.html')).href+'?werkruimte=eigen');await p.waitForFunction(()=>window.SchrijfNotities);entry.events.push('SchrijfNotities available');
  if(kind==='startup-buffer'||kind==='saved-restart-startup')await p.evaluate(()=>SchrijfNotities.view('documents'));
  else{
   await p.waitForFunction(()=>window.BewaarAlles&&window.Werkmap);await p.evaluate(async()=>{await Werkmap.suiteReady;await BewaarAlles.ready});entry.events.push('BewaarAlles.ready resolved');
   await p.locator('.writing-views').getByRole('button',{name:'Documenten',exact:true}).click();
   const folderNode=p.locator('.tree-folder-header[data-folder-path="Schrijven"]');await folderNode.waitFor({timeout:30000});if(await folderNode.getAttribute('aria-expanded')!=='true')await folderNode.click();
   await p.locator('.tree-folder-contents[data-path="Schrijven"] .tree-file').filter({hasText:'CH513 document'}).waitFor();await p.waitForFunction(()=>!document.querySelector('#loader')?.classList.contains('visible'));entry.events.push('workspace folder tree visible and loader not visible');
  }
  const picker=p.locator('#loose-input');await picker.waitFor({state:'attached'});entry.inputBefore=await picker.evaluate(e=>({count:e.files.length}));
  if(kind==='native-file'){
   const button=p.locator('#loose-open');if(!await button.isVisible()){const menu=p.locator('#folderMenu');if(await menu.count())await menu.locator('summary').click();}await button.click();entry.filePickerExit=await filePicker(source,tag);assert.equal(entry.filePickerExit,0);
  }else if(kind==='ready-path-same')await picker.setInputFiles(source);
  else await picker.setInputFiles({name:inputName,mimeType:'text/markdown',buffer:bytes});
  entry.events.push('file supplied');
  // The product clears the input synchronously. Uninstrumented baselines do not observe pre-reset File internals.
  await p.waitForFunction(()=>document.querySelector('#loose-input')?.files.length===0,null,{timeout:20000});entry.inputAfter=await picker.evaluate(e=>({count:e.files.length,value:e.value}));
  try{await p.getByText('Document geopend. Gebruik Bewaar om een eigen bestand te bewaren.',{exact:true}).waitFor({timeout:15000});entry.events.push('product import completion message');}catch(e){entry.errors.push('import completion not observed: '+e.message);}
  await p.waitForTimeout(1800);
  entry.observed=await p.evaluate(async()=>{
   const active=typeof activeFile==='undefined'||!activeFile?null:{name:activeFile.name,path:activeFile.relativePath,isVirtual:!!activeFile.isVirtual};
   const map=typeof converterFiles==='undefined'?[]:[...converterFiles.entries()].map(([name,value])=>({name,content:value.content}));
   const contents=typeof fileContents==='undefined'?[]:[...fileContents.entries()].map(([name,content])=>({name,content}));
   const content=typeof currentRawContent==='undefined'?null:currentRawContent;
   const heading=document.querySelector('#content .markdown-content h1')?.textContent||null;
   const images=[...document.querySelectorAll('#content .markdown-content img')].map(i=>({loaded:i.complete&&i.naturalWidth>0,src:i.currentSrc||i.src}));
   return {active,map,contents,currentRawContent:content,heading,images,inputCount:document.querySelector('#loose-input')?.files.length,trace:window.__importTrace||null};
  });
  const o=entry.observed,match=o.map.find(m=>m.name===o.active?.name),cached=o.contents.find(x=>x.name===o.active?.path);
  entry.assertions={inputReset:entry.inputAfter.count===0,virtualActive:!!o.active?.isVirtual&&[inputName,inputName.replace(/(\.[^.]+)?$/,(_,ext)=>' (2)'+(ext||''))].includes(o.active.name),rawExact:o.currentRawContent===markdown,mapExact:match?.content===markdown,cacheExact:cached?.content===markdown,heading:o.heading==='CH513 document',images:o.images.length===2&&o.images.every(i=>i.loaded),sourceStillExact:fs.readFileSync(source,'utf8')===markdown,workspaceStillExact:fs.readFileSync(path.join(folder,'Schrijven','CH513 document.md'),'utf8')===markdown};
  entry.passed=Object.values(entry.assertions).every(Boolean)&&entry.errors.length===0;
  await p.screenshot({path:path.join(out,tag+'.png'),fullPage:true});
 }catch(e){entry.failure=String(e.stack||e);entry.passed=false;if(p)try{await p.screenshot({path:path.join(out,tag+'-failure.png'),fullPage:true,timeout:3000});fs.writeFileSync(path.join(out,tag+'-failure.html'),await p.content());}catch{}}
 finally{save();if(ctx)await ctx.close();}
 console.log(tag,entry.passed?'PASS':'FAIL',entry.failure||JSON.stringify(entry.assertions));
}
(async()=>{
 try{
  result.releaseSha256=sha(fs.readFileSync(path.resolve('fixture-release/Werkplaats.zip')));assert.equal(result.releaseSha256,SHA);result.version=fs.readFileSync(path.join(app,'feedback.js'),'utf8').match(/version='([^']+)'/)?.[1];assert.equal(result.version,'0.36.14');save();
  const caseSet=process.env.CASESET||'all';assert(['all','restart'].includes(caseSet),'unknown CASESET');result.caseSet=caseSet;
  const kinds=caseSet==='restart'?['saved-restart-startup']:['startup-buffer','ready-path-same','ready-buffer-same','ready-buffer-unique','native-file','saved-restart-startup'];
  for(const kind of kinds)for(let n=1;n<=3;n++)await probe(kind,n);
  await probe(caseSet==='restart'?'saved-restart-startup':'startup-buffer',1,true);
  const baseline=result.cases.filter(c=>!c.instrumented),expected=3*kinds.length;
  result.allCasesAttempted=baseline.length===expected&&result.cases.filter(c=>c.instrumented).length===1;
  result.attemptedKinds=kinds;result.allAttemptedBaselinesPassed=baseline.length===expected&&baseline.every(c=>c.passed);
  const startup=baseline.filter(c=>c.kind==='startup-buffer'),restart=baseline.filter(c=>c.kind==='saved-restart-startup');
  result.startupPassedCount=startup.filter(c=>c.passed).length;result.savedRestartStartupPassedCount=restart.filter(c=>c.passed).length;
  result.savedRestartStartupAllPassed=restart.length===3&&restart.every(c=>c.passed);result.startupAllPassed=startup.length===3&&startup.every(c=>c.passed);
  result.readyCasesAllPassed=caseSet==='all'&&baseline.filter(c=>!['startup-buffer','saved-restart-startup'].includes(c.kind)).length===12&&baseline.filter(c=>!['startup-buffer','saved-restart-startup'].includes(c.kind)).every(c=>c.passed);
  result.allBaselinePassed=caseSet==='all'&&result.allCasesAttempted&&result.allAttemptedBaselinesPassed;
  result.masterImportAllPassed=result.allBaselinePassed;
  result.interpretation='Uninstrumented baseline cases are separate from the extra instrumented timeline with wrapped logging; the wrappers can perturb timing. An empty result does not by itself prove the cause.';save();
  if(!result.allCasesAttempted)process.exitCode=1;
 }catch(e){result.fatal=String(e.stack||e);save();console.error(result.fatal);process.exitCode=1;}
})();
