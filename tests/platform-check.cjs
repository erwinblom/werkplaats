'use strict';
// No personal work or account is accessed. Native-folder proof and OPFS fallback are reported separately.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {spawn,spawnSync}=require('node:child_process');
const http=require('node:http');
const root=path.resolve(__dirname,'../app'),out=path.resolve('platform-evidence');fs.mkdirSync(out,{recursive:true});
const result={os:os.platform(),release:os.release(),arch:os.arch(),node:process.version,playwright:require('playwright/package.json').version,tests:[]};
const progress=(tag,phase)=>console.log(new Date().toISOString(),tag,phase);
const browserOptions={headless:false,acceptDownloads:true,viewport:{width:1440,height:1000},...(process.env.RUN_CHROME==='1'?{channel:'chrome'}:{})};
const save=()=>fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));
function nativeInput(folder,tag,permissionOnly=false){
 // This helper operates only the disposable runner's folder dialog. Never the author's desktop.
 let cmd,args;
 if(process.platform==='win32'){
  const escape=s=>s.replace(/'/g,"''");
  const sendKeysLiteral=s=>s.replace(/[+^%~(){}]/g,c=>'{'+c+'}');
  const shot=name=>escape(path.join(out,tag+'-native-'+name+'.png'));
  const script=`Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; Add-Type -AssemblyName UIAutomationClient; Add-Type -AssemblyName UIAutomationTypes; $keys=New-Object -ComObject WScript.Shell;
function Shot([string]$name) { $bounds=[System.Windows.Forms.SystemInformation]::VirtualScreen; $bmp=New-Object System.Drawing.Bitmap $bounds.Width,$bounds.Height; $g=[System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($bounds.Location,[System.Drawing.Point]::Empty,$bounds.Size); $bmp.Save($name,[System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bmp.Dispose() }
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
${permissionOnly ? `Start-Sleep -Milliseconds 700; Shot '${shot('before')}'; $allowed=InvokeNamed 'Allow'; Write-Host ('Permission invoked: '+$allowed); Shot '${shot('after-allow')}';` : `Start-Sleep -Milliseconds 1400; Shot '${shot('before')}';
$keys.SendKeys('%d'); Start-Sleep -Milliseconds 300; $keys.SendKeys('${escape(sendKeysLiteral(folder))}'); $keys.SendKeys('{ENTER}'); Start-Sleep -Milliseconds 800; Shot '${shot('path')}';
$selected=InvokeNamed 'Select Folder'; Shot '${shot('after-select')}';
if($selected) { Start-Sleep -Milliseconds 500; $allowed=InvokeNamed 'Allow'; Write-Host ('Permission invoked: '+$allowed) }
Start-Sleep -Milliseconds 500; Shot '${shot('after-allow')}';`}
`;


  cmd='powershell';args=['-NoProfile','-Command',script];
 }else{
  const script=permissionOnly ? 'sleep 0.7; scrot "$2"; xdotool key Tab; xdotool key Return; sleep 0.5; scrot "$3"' : `
ready=0
for attempt in $(seq 1 40); do
 title=$(xdotool getwindowfocus getwindowname 2>/dev/null || true)
 case "$title" in "Select where this site can save changes") ready=1; break;; esac
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
sleep 0.6
scrot "$3"
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
const permissionInput=tag=>nativeInput('',tag,true);
function listFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?listFiles(path.join(dir,e.name)):[path.join(dir,e.name)]);}
async function exercise(base,kind){
 const parent=process.platform==='win32'?path.join(os.homedir(),'Documents','Werkplaats CH510'):os.tmpdir();fs.mkdirSync(parent,{recursive:true});
 const folder=fs.mkdtempSync(path.join(parent,'werkplaats-ch510-'));
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'werkplaats-profile-ch510-'));
 const pdfDir=fs.mkdtempSync(path.join(parent,'werkplaats-pdf-ch510-'));
 fs.mkdirSync(path.join(profile,'Default'),{recursive:true});
 fs.writeFileSync(path.join(profile,'Default','Preferences'),JSON.stringify({printing:{print_preview_sticky_settings:{appState:JSON.stringify({recentDestinations:[{id:'Save as PDF',origin:'local',account:''}],selectedDestinationId:'Save as PDF',version:2,isHeaderFooterEnabled:false,isCssBackgroundEnabled:true})}},savefile:{default_directory:pdfDir},download:{default_directory:pdfDir}}));
 const launchOptions={...browserOptions,args:[...(browserOptions.args||[]),'--kiosk-printing']};
 let ctx=await chromium.launchPersistentContext(profile,launchOptions);
 const entry={route:kind,nativePicker:false,folderPersistence:false,noteSaveReload:false,pageErrors:[],browser:ctx.browser()?.version()||'persistent Chromium',channel:process.env.RUN_CHROME==='1'?'chrome':'playwright-chromium',testFolder:folder};result.tests.push(entry);save();
 let p=ctx.pages()[0]||await ctx.newPage();p.on('pageerror',e=>entry.pageErrors.push(e.message));
 const uri=rel=>base+rel.split('/').map(encodeURIComponent).join('/');
 const init=async()=>{await p.goto(uri('Begin hier.html')+'?werkruimte=eigen');await p.waitForFunction(()=>window.Werkmap&&window.BewaarAlles);await p.evaluate(()=>{const b=document.createElement('button');b.id='platform-native-choose';b.textContent='Choose fixture folder';b.onclick=()=>{window.__pickerFinished=false;Werkmap.choose().finally(()=>window.__pickerFinished=true);};document.body.prepend(b);});};
 try{
  progress(kind,'open app');await init();progress(kind,'check storage API');assert.equal(await p.evaluate(()=>Werkmap.supported),true,'real browser exposes required folder APIs');
  progress(kind,'invoke native picker');await p.locator('#platform-native-choose').click();
  progress(kind,'operate native picker');entry.nativeHelperExit=await nativeInput(folder,kind);progress(kind,'native input helper exit '+entry.nativeHelperExit);
  try{
   await p.waitForFunction(()=>window.__pickerFinished&&Werkmap.active,null,{timeout:20000});
   entry.selectedFolder=await p.evaluate(()=>Werkmap.name);assert.equal(entry.selectedFolder,path.basename(folder),'native picker must select the exact intended fixture');
   assert(fs.existsSync(path.join(folder,'gereedschapskist-werkmap.json')),'native fixture metadata exists on OS disk');entry.nativePicker=true;progress(kind,'native picker + OS metadata confirmed');entry.storage='user-selected OS directory';
  }catch(e){
   entry.nativePickerError=String(e);entry.nativePicker=false;progress(kind,'native picker not proven: '+e.message);
   try{entry.nativePageStatus=await Promise.race([p.evaluate(()=>({message:document.getElementById('wm-message')?.textContent,finished:window.__pickerFinished,active:window.Werkmap?.active})),new Promise((_,reject)=>setTimeout(()=>reject(Error('native status read timed out')),2000))]);}catch(statusError){entry.nativeStatusError=String(statusError);}
   try{await p.screenshot({path:path.join(out,kind+'-native-timeout-page.png'),timeout:2000});}catch{}
   save();
   if(process.env.PRIMARY_ROUTE_ONLY==='1')throw e;
   // Close any unresolved native dialog and replace the whole context. No false native success.
   if(process.platform==='win32')await new Promise(r=>spawn('powershell',['-NoProfile','-Command',"$keys=New-Object -ComObject WScript.Shell; $keys.SendKeys('{ESC}')"]).on('close',r));
   else await new Promise(r=>spawn('xdotool',['key','Escape']).on('close',r));
   await ctx.close();progress(kind,'start distinct OPFS fallback');
   ctx=await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(),'werkplaats-opfs-ch510-')),browserOptions);
   await ctx.addInitScript(()=>{window.showDirectoryPicker=async()=>{const root=await navigator.storage.getDirectory();return root.getDirectoryHandle('CH510 testmap',{create:true});};});
   p=ctx.pages()[0]||await ctx.newPage();p.on('pageerror',e=>entry.pageErrors.push(e.message));await init();
   await p.locator('#platform-native-choose').click();await p.waitForFunction(()=>Werkmap.active);
   entry.storage='OPFS browser sandbox; native folder selection NOT proven';
  }
  progress(kind,'reload folder handle');await p.reload();await p.waitForFunction(()=>window.Werkmap?.active);entry.folderPersistence=true;progress(kind,'folder handle retained');
  progress(kind,'open writing tool');await p.goto(uri('Apps/Werkbank/▶ Begin hier.html')+'?werkruimte=eigen');
  await p.waitForFunction(()=>window.Werkmap?.active&&window.SchrijfNotities);
  await p.evaluate(()=>SchrijfNotities.view('notes'));
  progress(kind,'create note');if(await p.locator('#note-new').isVisible())await p.locator('#note-new').click();else await p.getByRole('button',{name:'Maak een notitie',exact:true}).click();
  const title=`CH510 ${kind} ${process.platform}`,body='Fictieve platformproef: één notitie, café, € 12,50.\n\n**Vet** en een tweede alinea.';
  const dialog=p.locator('dialog.note-dialog[open]');
  await dialog.getByLabel('Titel',{exact:true}).fill(title);
  await dialog.getByLabel('Notitie',{exact:true}).fill(body);
  progress(kind,'save note');await dialog.getByRole('button',{name:'Bewaar',exact:true}).click();
  await p.waitForFunction(()=>[...document.querySelectorAll('dialog.note-dialog [role="status"]')].some(e=>e.textContent.includes('Bewaard in je werkmap')));
  progress(kind,'read saved note');const diskNote=await p.evaluate(async title=>{const {root}=await Werkmap.allAccess();const round=await BewaarAlles.readRound(root);return round.shared.writingNotes.find(n=>n.title===title);},title);
  assert.equal(diskNote.body,body);entry.noteId=diskNote.id;
  if(entry.nativePicker){
   const disk=listFiles(folder).filter(f=>f.endsWith('.json')).map(f=>({name:path.relative(folder,f),text:fs.readFileSync(f,'utf8')}));
   assert(disk.some(f=>f.text.includes(diskNote.id)&&f.text.includes('Fictieve platformproef')),'note present in real OS filesystem');
   entry.diskFiles=disk.map(f=>f.name);entry.osDiskReadback=true;
  }
  progress(kind,'reload saved note');await p.reload();await p.waitForFunction(()=>window.SchrijfNotities);await p.evaluate(()=>SchrijfNotities.view('notes'));
  await p.getByRole('button').filter({has:p.getByRole('heading',{name:title,exact:true})}).waitFor();
  const restored=await p.evaluate(async id=>(await BewaarAlles.readShared()).writingNotes.find(n=>n.id===id),diskNote.id);
  assert.equal(restored.title,title);assert.equal(restored.body,body);entry.noteSaveReload=true;entry.statusAfterReload=await p.locator('#file-status').innerText();progress(kind,'note saved + reloaded exact');
  await p.screenshot({path:path.join(out,kind+'-saved-reloaded.png'),fullPage:true});
  entry.browser=ctx.browser()?.version()||'persistent Chromium';
  // Full owned browser process shutdown, then a fresh process with the same disk profile.
  progress(kind,'close full browser for restart');
  const oldBrowser=ctx.browser();await ctx.close();
  entry.browserRestart={oldBrowserDisconnected:oldBrowser?!oldBrowser.isConnected():true,permissionReconfirmed:false};
  assert.equal(entry.browserRestart.oldBrowserDisconnected,true);
  ctx=await chromium.launchPersistentContext(profile,launchOptions);p=ctx.pages()[0]||await ctx.newPage();
  p.on('pageerror',e=>entry.pageErrors.push(e.message));
  await p.goto(uri('Apps/Werkbank/▶ Begin hier.html')+'?werkruimte=eigen');
  await p.waitForFunction(()=>window.Werkmap?.active&&window.SchrijfNotities);
  const permission=await p.evaluate(async()=>{const {root}=await Werkmap.allAccess(false);return root.queryPermission({mode:'readwrite'});});
  entry.browserRestart.permissionAtStart=permission;
  if(permission!=='granted'){
   await p.evaluate(()=>{const b=document.createElement('button');b.id='restart-map-permission';b.textContent='Give test folder permission';b.onclick=()=>{window.__restartPermission=false;Werkmap.allAccess().then(()=>window.__restartPermission=true).catch(e=>window.__restartPermissionError=e.message);};document.body.prepend(b);});
   await p.locator('#restart-map-permission').click();
   await permissionInput(kind+'-restart');
   await p.waitForFunction(()=>window.__restartPermission===true,null,{timeout:15000});entry.browserRestart.permissionReconfirmed=true;
  }
  const restarted=await p.evaluate(async id=>{const {root}=await Werkmap.allAccess(false);return (await BewaarAlles.readRound(root)).shared.writingNotes.find(n=>n.id===id);},diskNote.id);
  assert.equal(restarted.title,title);assert.equal(restarted.body,body);
  const freshDisk=listFiles(folder).filter(f=>f.endsWith('bewaar-alles.json')).map(f=>JSON.parse(fs.readFileSync(f,'utf8')));
  assert(freshDisk.some(r=>r.shared?.writingNotes?.some(n=>n.id===diskNote.id&&n.body===body)));
  await p.evaluate(()=>SchrijfNotities.view('notes'));
  await p.getByRole('button').filter({has:p.getByRole('heading',{name:title,exact:true})}).waitFor();
  entry.browserRestart.status=await p.locator('#file-status').innerText();
  entry.browserRestart.statusCorrect=!/nog niet in werkmap/i.test(entry.browserRestart.status);
  if(process.env.CHECK_SAVED_STATUS==='1'&&!entry.browserRestart.statusCorrect)(entry.validationErrors??=[]).push('saved note shows false unsaved status after browser restart');
  entry.browserRestart.exactNoteOnDisk=true;entry.browserRestart.uiNotePresent=true;entry.browserRestart.passed=true;
  await p.screenshot({path:path.join(out,kind+'-browser-restarted.png'),fullPage:true});save();
  // Real application print route in headed Chrome; kiosk only automates Save as PDF in this disposable profile.
  progress(kind,'open fictitious document for app PDF route');
  await p.evaluate(()=>SchrijfNotities.view('documents'));
  const markdown='# CH510 PDF FIRST PAGE\n\nFictieve brief: café en een bedrag van € 12,50.\n\n::: pagina-einde :::\n\n# CH510 PDF SECOND PAGE\n\nTweede pagina voor de platformproef.\n';
  await p.locator('#loose-input').setInputFiles({name:'CH510-platform-pdf.md',mimeType:'text/markdown',buffer:Buffer.from(markdown)});
  await p.waitForFunction(()=>typeof activeFile!=='undefined'&&activeFile?.name==='CH510-platform-pdf.md');
  // This calls the same existing export entry point as the document's PDF menu, without replacing print().
  await p.evaluate(()=>printDocumentExport(currentRawContent,'CH510-platform-pdf'));
  const printDialog=p.locator('dialog.document-print-dialog[open]');
  await printDialog.getByRole('button',{name:'Afdrukken / PDF bewaren',exact:true}).waitFor({state:'visible'});
  await p.waitForFunction(()=>!document.querySelector('.document-print-dialog button.action-primary')?.disabled);
  await p.screenshot({path:path.join(out,kind+'-pdf-preview.png'),fullPage:true});
  await printDialog.getByRole('button',{name:'Afdrukken / PDF bewaren',exact:true}).click();
  const deadline=Date.now()+30000;let pdfFile;
  while(Date.now()<deadline){pdfFile=listFiles(pdfDir).find(f=>f.toLowerCase().endsWith('.pdf'));if(pdfFile&&fs.statSync(pdfFile).size>100)break;await new Promise(r=>setTimeout(r,250));}
  assert(pdfFile&&fs.readFileSync(pdfFile).subarray(0,5).toString()==='%PDF-','headed Chrome app print produces actual PDF');
  const parse=spawnSync(process.platform==='win32'?'python':'python3',[path.join(__dirname,'validate-platform-pdf.py'),pdfFile],{encoding:'utf8'});
  fs.writeFileSync(path.join(out,kind+'-pdf-validation.log'),parse.stdout+'\n'+parse.stderr);
  assert.equal(parse.status,0,'PDF text/A4/page-number check: '+parse.stderr);
  entry.pdf={...JSON.parse(parse.stdout),method:'headed Chrome window.print through app DocumentPrint; disposable kiosk Save as PDF, not headless page.pdf',passed:true};
  fs.copyFileSync(pdfFile,path.join(out,kind+'-export.pdf'));save();progress(kind,'browser restart and two-page PDF verified');
  assert.equal((entry.validationErrors||[]).length,0,(entry.validationErrors||[]).join('; '));

 }catch(e){entry.failure=String(e.stack||e);progress(kind,'FAILED: '+e.message);try{await p.screenshot({path:path.join(out,kind+'-failed.png'),fullPage:true});fs.writeFileSync(path.join(out,kind+'-failed.html'),await p.content());}catch{}throw e;}
 finally{save();await ctx.close();}
}
(async()=>{
 const server=http.createServer((req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.join(root,rel);const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.woff2':'font/woff2'})[ext]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  for(const [base,kind] of (process.env.PRIMARY_ROUTE_ONLY==='1'?[[pathToFileURL(root+path.sep).href,'file']]:[[pathToFileURL(root+path.sep).href,'file'],[`http://127.0.0.1:${server.address().port}/`,'localhost']])){
   try{await exercise(base,kind);}catch(e){console.error(kind,e);if(!result.tests.some(t=>t.route===kind))result.tests.push({route:kind,nativePicker:false,failure:String(e.stack||e)});save();}
  }
 }
 finally{server.close();save();}
 result.nativeComplete=result.tests.length===(process.env.PRIMARY_ROUTE_ONLY==='1'?1:2)&&result.tests.every(t=>t.nativePicker&&t.osDiskReadback&&t.noteSaveReload&&t.browserRestart?.passed&&t.pdf?.passed);save();
 console.log(JSON.stringify(result,null,2));
 if(!result.nativeComplete){console.log('PARTIAL: real browser storage passes do not prove native folder selection. See result.json.');process.exitCode=1;}
 if(result.tests.some(t=>t.failure))process.exitCode=1;
})().catch(e=>{console.error(e);save();process.exitCode=1;});
