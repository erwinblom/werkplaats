'use strict';
// Test-only native UI automation for disposable Windows/Linux CI machines. No OPFS fallback or mocked picker.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {spawn,spawnSync}=require('node:child_process');
const root=path.resolve(process.env.APP_ROOT||path.join(__dirname,'../app'));
const out=path.resolve('platform-evidence');fs.mkdirSync(out,{recursive:true});
function linuxAllowFromScreenshot(before,after,log){
 // Read actual native dialog pixels. Never assume focus or button coordinates.
 const png=fs.readFileSync(before);assert.equal(png.subarray(1,4).toString(),'PNG');const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 const ocr=spawnSync('tesseract',[before,'stdout','--psm','11','tsv'],{encoding:'utf8',timeout:10000});if(ocr.status!==0)throw Error('Native Allow OCR failed: '+ocr.stderr);
 fs.writeFileSync(before+'.tsv',ocr.stdout);
 const words=ocr.stdout.split(/\r?\n/).slice(1).map(line=>{const v=line.split('\t');return {left:+v[6],top:+v[7],width:+v[8],height:+v[9],confidence:+v[10],text:(v.slice(11).join('\t')||'').trim()};}).filter(w=>w.text&&w.confidence>=20);
 const all=words.map(w=>w.text).join(' ');if(!/Allow this site to edit files\?/i.test(all)){log('No edit-files popup visible in captured desktop; no click issued. Mandatory browser native-granted and OS-disk checks still decide success.');return;}
 const title=words.find(w=>w.text==='Allow'&&w.top<height*.3&&w.confidence>=80);if(!title)throw Error('Native permission heading location is ambiguous.');
 const candidates=words.filter(w=>w.text==='Allow'&&w.confidence>=80&&w.left>width*.5&&w.top>title.top+40&&w.top<title.top+180);
 if(candidates.length!==1)throw Error('Expected exactly one visible Allow button below the native permission title; found '+candidates.length);
 const target=candidates[0],x=Math.round(target.left+target.width/2),y=Math.round(target.top+target.height/2);log('OCR native permission dimensions='+width+'x'+height+'; click observed Allow at '+x+','+y);
 const click=spawnSync('xdotool',['mousemove','--sync',String(x),String(y),'click','1'],{encoding:'utf8',timeout:5000});if(click.status!==0)throw Error('Native Allow click failed: '+click.stderr);
 const shot=spawnSync('bash',['-c','sleep 0.8; scrot "$1"','after-allow',after],{encoding:'utf8',timeout:5000});if(shot.status!==0)throw Error('Native after-Allow screenshot failed: '+shot.stderr);
}
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
  const script=permissionOnly ? 'sleep 1.2; scrot "$3"' : `
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
sleep 1.2
scrot "$3"
printf 'Permission dialog captured; named Allow will be located from screenshot OCR\\n'
`;

  cmd='bash';args=['-c',script,'picker',folder,path.join(out,tag+'-native-picker.png'),path.join(out,tag+'-native-after-allow.png'),path.join(out,tag+'-native-before.png')];
 }
 const proc=spawn(cmd,args,{stdio:['ignore','pipe','pipe']});let logs='';proc.stdout.on('data',x=>logs+=x);proc.stderr.on('data',x=>logs+=x);
 return new Promise(resolve=>{
  let done=false;
  const finish=code=>{if(done)return;done=true;clearTimeout(timer);if(code===0&&process.platform==='linux'){try{linuxAllowFromScreenshot(path.join(out,tag+'-native-after-allow.png'),path.join(out,tag+'-native-after-allow-click.png'),line=>logs+='\n'+line+'\n');}catch(error){logs+='\n'+String(error)+'\n';code=8;}}fs.writeFileSync(path.join(out,tag+'-picker.log'),logs);resolve(code);};
  const timer=setTimeout(()=>{logs+='\nNative input helper exceeded 30 seconds; terminating only this owned helper process.\n';proc.kill();finish(124);},30000);
  proc.on('error',error=>{logs+='\n'+String(error);finish(125);});
  proc.on('close',finish);
 });
}
const permissionInput=tag=>nativeInput('',tag,true);
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const result={os:os.platform(),release:os.release(),arch:os.arch(),node:process.version,playwright:require('playwright/package.json').version,route:'file://',allPassed:false,checks:{},pageErrors:[],consoleErrors:[],requestFailures:[],limitations:['Automated real Chrome tests on disposable Windows Server 2022 and Ubuntu 24.04 runners; not a physical-PC beginner study.','No PDF/print/extension or arbitrary Linux distribution coverage.']};
const save=()=>fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));
const pass=name=>{result.checks[name]=true;console.log(new Date().toISOString(),'PASS',name);save();};
const required=['releaseFiles','realChrome','nativeNewWorkspace','databaseHomeTile','databaseCreate','tableCreate','rowSave','rowEdit','csvImport','sqliteDiskReadback','sqliteDownloadExact','databaseReload','noteSaveReload','completeBrowserClose','completeBrowserRestart','restartWorkspacePermission','restartSQLiteExact','restartUI','restartNote','browserErrors'];
const options={channel:'chrome',headless:false,acceptDownloads:true,viewport:{width:1440,height:1000},args:['--disable-features=Translate']};
const uri=rel=>pathToFileURL(path.join(root,...rel.split('/'))).href;
const databaseName='CH535-'+process.platform+'-'+Date.now();
const expectedTitle='Café – gewijzigd 🧑‍💻';
const csv='Naam;Notitie\r\nNoor;"Eerste regel\nTweede ""regel"""\r\nSam;"Café, thee"\r\n';
const noteTitle='CH535 '+process.platform+' notitie',noteBody='Fictieve platformproef: café, € 12,50.\n\n**Vet** en een tweede alinea.';
function sqliteCheck(file){
 const py=`import sqlite3,json,sys\nc=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True)\nassert c.execute('pragma integrity_check').fetchone()[0]=='ok'\nassert c.execute('select Titel,Aantal from Voorbeelden').fetchall()==[(sys.argv[2],7)]\nassert c.execute('select Naam,Notitie from Import').fetchall()==[('Noor','Eerste regel\\nTweede "regel"'),('Sam','Café, thee')]\nprint(json.dumps({'integrity':'ok','tables':[r[0] for r in c.execute("select name from sqlite_master where type='table'")],'example':c.execute('select Titel,Aantal from Voorbeelden').fetchall(),'csv':c.execute('select Naam,Notitie from Import').fetchall()},ensure_ascii=True))`;
 const run=spawnSync(process.platform==='win32'?'python':'python3',['-c',py,file,expectedTitle],{encoding:'utf8'});assert.equal(run.status,0,run.stdout+'\n'+run.stderr);return JSON.parse(run.stdout);
}
function browserProcesses(profile){
 if(process.platform==='win32'){
  const quoted=profile.replace(/'/g,"''"),script=`$p=@(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains('${quoted}') } | Select-Object ProcessId,ExecutablePath,CommandLine); ConvertTo-Json -InputObject $p -Compress`;
  const run=spawnSync('powershell',['-NoProfile','-Command',script],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);const parsed=JSON.parse(run.stdout||'[]');return (Array.isArray(parsed)?parsed:[parsed]).map(v=>({pid:v.ProcessId,executable:v.ExecutablePath,command:v.CommandLine}));
 }
 const run=spawnSync('ps',['-eo','pid=,args='],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);return run.stdout.split('\n').filter(line=>line.includes('--user-data-dir='+profile)).map(line=>{const match=line.trim().match(/^(\d+)\s+(.*)$/);assert(match);return {pid:Number(match[1]),executable:fs.readlinkSync('/proc/'+match[1]+'/exe'),command:match[2]};});
}
function track(p){p.on('dialog',d=>{result.jsDialogs??=[];const expected=d.type()==='confirm'&&['Open de bewaarde Werkplaats in Mijn Werkplaats? Dit vervangt je huidige browserwerk. Bewaar dat eerst als je het wilt houden.','De bewaarde werkruimte openen? Je huidige browserwerk wordt vervangen. Bewaar eerst als je dat wilt houden.'].includes(d.message());result.jsDialogs.push({type:d.type(),message:d.message(),expected});(expected?d.accept():d.dismiss()).catch(error=>result.pageErrors.push('Dialog handler: '+error.message));});p.on('pageerror',e=>result.pageErrors.push(e.message));p.on('console',m=>{if(m.type()==='error')result.consoleErrors.push({text:m.text(),location:m.location()});});p.on('requestfailed',r=>result.requestFailures.push({url:r.url(),error:r.failure()?.errorText||''}));}
async function savedDialog(p){const d=p.locator('#database-dialog');await d.waitFor({state:'hidden'});assert.match(await p.locator('#database-status').innerText(),/bewaard|Bewaard/);}
async function databasePage(p){await p.goto(uri('Apps/Databases/Start Databases.html')+'?werkruimte=eigen');await p.locator('#new').waitFor();await p.waitForFunction(()=>!document.querySelector('#new').disabled,null,{timeout:30000});}
async function openDatabase(p){await p.locator('#database-list button').filter({hasText:databaseName}).click();await p.locator('#database-title').getByText(databaseName,{exact:true}).waitFor();}
async function databaseUIReadback(p){await p.locator('#database-table').selectOption('Voorbeelden');await p.locator('#database-grid td').getByText(expectedTitle,{exact:true}).waitFor();assert.equal(await p.locator('#database-grid tbody tr').count(),1);await p.locator('#database-table').selectOption('Import');await p.locator('#database-grid td').getByText('Noor',{exact:true}).waitFor();assert.equal(await p.locator('#database-grid tbody tr').count(),2);assert.equal(await p.evaluate(()=>window.__ch535Injected),undefined);}
(async()=>{
 let ctx,p;
 try{
  assert(['win32','linux'].includes(process.platform),'runner supports only requested Windows and Linux');
  const dbPage=path.join(root,'Apps','Databases','Start Databases.html');assert(fs.existsSync(dbPage));result.candidate=JSON.parse(fs.readFileSync(path.join(out,'candidate.json'),'utf8'));assert.equal(result.candidate.sha256,'4de97d730e130dee2d64fc777d6eaeb5e45b467c195a4fe646928097869dc883');assert.equal(result.candidate.appFiles,259);assert.equal(result.candidate.zipCRC,'pass');assert.equal(sha(fs.readFileSync(path.resolve('fixtures/Werkplaats-CH535.zip'))),result.candidate.sha256);assert(fs.existsSync(path.join(root,'vendor','sqljs','sql-wasm-inline.js')));result.releaseDatabasePageSha256=sha(fs.readFileSync(dbPage));
  if(process.env.RELEASE_ZIP){const bytes=fs.readFileSync(process.env.RELEASE_ZIP);result.releaseZipSha256=sha(bytes);if(process.env.EXPECTED_ZIP_SHA256)assert.equal(result.releaseZipSha256,process.env.EXPECTED_ZIP_SHA256);}
  result.appFileCount=(()=>{function count(dir){return fs.readdirSync(dir,{withFileTypes:true}).reduce((n,e)=>n+(e.isDirectory()?count(path.join(dir,e.name)):1),0);}return count(root);})();assert.equal(result.appFileCount,259,'exact expected clean app file count');pass('releaseFiles');
  const parent=process.platform==='win32'?path.join(os.homedir(),'Documents','Werkplaats CH535'):os.tmpdir();fs.mkdirSync(parent,{recursive:true});
  const pickerParent=fs.mkdtempSync(path.join(parent,'werkplaats-ch535-')),folder=path.join(pickerParent,'Mijn Werkplaats'),profile=fs.mkdtempSync(path.join(os.tmpdir(),'ch535-profile-'));
  fs.mkdirSync(path.join(profile,'Default'),{recursive:true});fs.writeFileSync(path.join(profile,'Default','Preferences'),JSON.stringify({translate:{enabled:false}}));result.testFolder=folder;result.profile=profile;result.storage='native user-selected OS directory';
  ctx=await chromium.launchPersistentContext(profile,options);p=ctx.pages()[0]||await ctx.newPage();track(p);result.browserUserAgent=await p.evaluate(()=>navigator.userAgent);assert.match(result.browserUserAgent,/Chrome\//);result.browserVersion=ctx.browser()?.version();result.browserProcesses=browserProcesses(profile);assert(result.browserProcesses.length>0,'Chrome OS process with exact disposable profile found');assert(result.browserProcesses.every(v=>/^chrome(?:\.exe)?$/i.test(path.basename(v.executable))),'actual Chrome executable path');pass('realChrome');
  // Full normal first-run path: no fixture button, no injected FileSystem handles.
  await p.goto(uri('Begin hier.html'));await p.getByRole('button',{name:'Nieuw beginnen',exact:true}).waitFor();await p.getByRole('button',{name:'Nieuw beginnen',exact:true}).click();
  await p.getByRole('button',{name:'Kies opslagplek',exact:true}).click();result.initialPickerExit=await nativeInput(pickerParent,'new');assert.equal(result.initialPickerExit,0);
  await p.waitForFunction(()=>window.Werkmap?.active,null,{timeout:30000});await p.waitForURL(/Apps\/Werkbank\//,{timeout:30000});
  assert(fs.existsSync(path.join(folder,'gereedschapskist-werkmap.json')));result.workspaceMetadata=JSON.parse(fs.readFileSync(path.join(folder,'gereedschapskist-werkmap.json'),'utf8'));
  assert.equal(await p.evaluate(async()=>{const {root}=await Werkmap.allAccess(false);return root.queryPermission({mode:'readwrite'});}), 'granted');pass('nativeNewWorkspace');
  await p.goto(uri('Begin hier.html')+'?home=1');const tile=p.locator('a[href*="Apps/Databases/"]');await tile.waitFor();await tile.click();await p.waitForURL(/Apps\/Databases\//);await p.waitForFunction(()=>!document.querySelector('#new')?.disabled,null,{timeout:30000});pass('databaseHomeTile');
  await p.locator('#new').click();let d=p.locator('#database-dialog[open]');await d.getByLabel('Naam',{exact:true}).fill(databaseName);await d.getByRole('button',{name:'Bewaar',exact:true}).click();await savedDialog(p);await p.locator('#database-title').getByText(databaseName,{exact:true}).waitFor();pass('databaseCreate');
  await p.locator('#table-new').click();d=p.locator('#database-dialog[open]');await d.getByLabel('Tabelnaam',{exact:true}).fill('Voorbeelden');await d.locator('.database-column').nth(0).getByLabel('Kolomnaam',{exact:true}).fill('Titel');await d.getByRole('button',{name:'Kolom toevoegen',exact:true}).click();await d.locator('.database-column').nth(1).getByLabel('Kolomnaam',{exact:true}).fill('Aantal');await d.locator('.database-column').nth(1).locator('select').selectOption('INTEGER');await d.getByRole('button',{name:'Bewaar',exact:true}).click();await savedDialog(p);pass('tableCreate');
  await p.locator('#row-new').click();d=p.locator('#database-dialog[open]');await d.getByLabel('Titel',{exact:true}).fill('Café <script>window.__ch535Injected=1</script>');await d.getByLabel('Aantal',{exact:true}).fill('3');await d.getByRole('button',{name:'Bewaar',exact:true}).click();await savedDialog(p);assert.equal(await p.evaluate(()=>window.__ch535Injected),undefined);await p.locator('#database-grid td').getByText('Café <script>window.__ch535Injected=1</script>',{exact:true}).waitFor();pass('rowSave');
  await p.getByRole('button',{name:'Bewerk rij 1',exact:true}).click();d=p.locator('#database-dialog[open]');await d.getByLabel('Titel',{exact:true}).fill(expectedTitle);await d.getByLabel('Aantal',{exact:true}).fill('7');await d.getByRole('button',{name:'Bewaar',exact:true}).click();await savedDialog(p);await p.locator('#database-grid td').getByText(expectedTitle,{exact:true}).waitFor();pass('rowEdit');
  const csvFile=path.join(out,'Import.csv');fs.writeFileSync(csvFile,csv);await p.locator('#database-csv').setInputFiles(csvFile);d=p.locator('#database-dialog[open]');await d.getByLabel('Tabelnaam',{exact:true}).fill('Import');await d.getByRole('button',{name:'Bewaar',exact:true}).click();await savedDialog(p);await databaseUIReadback(p);pass('csvImport');
  const dbFile=path.join(folder,'Databases',databaseName+'.sqlite'),disk=fs.readFileSync(dbFile);assert.equal(disk.subarray(0,16).toString('binary'),'SQLite format 3\0');result.databaseDiskSha256=sha(disk);result.sqliteValidation=sqliteCheck(dbFile);assert(fs.existsSync(path.join(folder,'Databases','Vorige versies',databaseName+'.sqlite')));fs.writeFileSync(path.join(out,'sqlite-validation.json'),JSON.stringify(result.sqliteValidation,null,2));pass('sqliteDiskReadback');
  const waiting=p.waitForEvent('download');await p.locator('#database-download').click();const download=await waiting;assert.equal(await download.failure(),null);assert.equal(download.suggestedFilename(),databaseName+'.sqlite');const downloaded=path.join(out,'database-download.sqlite');await download.saveAs(downloaded);assert.deepEqual(fs.readFileSync(downloaded),disk);result.downloadSha256=sha(fs.readFileSync(downloaded));pass('sqliteDownloadExact');
  await p.reload();await p.waitForFunction(()=>!document.querySelector('#new')?.disabled,null,{timeout:30000});await openDatabase(p);await databaseUIReadback(p);assert.deepEqual(fs.readFileSync(dbFile),disk);pass('databaseReload');await p.screenshot({path:path.join(out,'database-reloaded.png'),fullPage:true});
  // Existing writing route must still work beside Databases.
  await p.goto(uri('Apps/Werkbank/▶ Begin hier.html')+'?werkruimte=eigen');await p.waitForFunction(()=>window.Werkmap?.active&&window.SchrijfNotities);await p.evaluate(()=>SchrijfNotities.view('notes'));
  if(await p.locator('#note-new').isVisible())await p.locator('#note-new').click();else await p.getByRole('button',{name:'Maak een notitie',exact:true}).click();
  const nd=p.locator('dialog.note-dialog[open]');await nd.getByLabel('Titel',{exact:true}).fill(noteTitle);await nd.getByLabel('Notitie',{exact:true}).fill(noteBody);await nd.getByRole('button',{name:'Bewaar',exact:true}).click();await p.waitForFunction(()=>[...document.querySelectorAll('dialog.note-dialog [role="status"]')].some(e=>e.textContent.includes('Bewaard in je werkmap')));
  const note=await p.evaluate(async title=>{const {root}=await Werkmap.allAccess();const round=await BewaarAlles.readRound(root);return round.shared.writingNotes.find(n=>n.title===title);},noteTitle);assert.equal(note.body,noteBody);result.noteId=note.id;await p.reload();await p.waitForFunction(()=>window.SchrijfNotities);assert.equal(await p.evaluate(async id=>(await BewaarAlles.readShared()).writingNotes.find(n=>n.id===id).body,note.id),noteBody);pass('noteSaveReload');
  const old=ctx.browser();await ctx.close();ctx=null;assert(!old||!old.isConnected());for(let attempt=0;attempt<50&&browserProcesses(profile).length;attempt++)await new Promise(resolve=>setTimeout(resolve,100));result.processesAfterClose=browserProcesses(profile);assert.deepEqual(result.processesAfterClose,[],'complete Chrome OS process terminated before relaunch');pass('completeBrowserClose');
  ctx=await chromium.launchPersistentContext(profile,options);p=ctx.pages()[0]||await ctx.newPage();track(p);result.restartUserAgent=await p.evaluate(()=>navigator.userAgent);assert.equal(result.restartUserAgent,result.browserUserAgent);result.restartBrowserProcesses=browserProcesses(profile);assert(result.restartBrowserProcesses.length>0,'fresh Chrome process exists');assert(result.restartBrowserProcesses.every(v=>!result.browserProcesses.some(old=>old.pid===v.pid)),'new OS PID after complete restart');pass('completeBrowserRestart');
  await p.goto(uri('Begin hier.html'));await p.waitForFunction(()=>window.Werkmap);await p.evaluate(()=>Werkmap.recall());const permission=await p.evaluate(async()=>{const access=await Werkmap.allAccess(false);return access.root.queryPermission({mode:'readwrite'});});result.restartPermissionAtStart=permission;
  await p.getByRole('button',{name:'Verder werken',exact:true}).click();if(permission!=='granted'){result.restartPermissionHelperExit=await permissionInput('restart');assert.equal(result.restartPermissionHelperExit,0);}
  await p.waitForFunction(()=>window.Werkmap?.active,null,{timeout:30000});await p.waitForFunction(()=>/Werkmap geopend/.test(document.querySelector('#wm-message')?.textContent||''),null,{timeout:30000});assert.equal(await p.evaluate(async()=>{const {root}=await Werkmap.allAccess(false);return root.queryPermission({mode:'readwrite'});}), 'granted');pass('restartWorkspacePermission');
  assert.deepEqual(fs.readFileSync(dbFile),disk);result.restartSQLiteValidation=sqliteCheck(dbFile);pass('restartSQLiteExact');await databasePage(p);await openDatabase(p);await databaseUIReadback(p);pass('restartUI');await p.screenshot({path:path.join(out,'database-browser-restarted.png'),fullPage:true});
  await p.goto(uri('Apps/Werkbank/▶ Begin hier.html')+'?werkruimte=eigen');await p.waitForFunction(()=>window.SchrijfNotities&&window.BewaarAlles);await p.evaluate(async()=>{await Werkmap.suiteReady;await BewaarAlles.ready;});assert.equal(await p.evaluate(async id=>(await BewaarAlles.readShared()).writingNotes.find(n=>n.id===id).body,result.noteId),noteBody);pass('restartNote');
  assert.deepEqual(result.pageErrors,[],'JavaScript page errors');assert.deepEqual((result.jsDialogs||[]).filter(v=>!v.expected),[],'unexpected JS dialogs');
  const manifestUrl=pathToFileURL(path.join(root,'App-iconen','app.webmanifest')).href,isManifest=url=>{try{return new URL(url).href===manifestUrl;}catch{return false;}};
  const manifestFailures=result.requestFailures.filter(r=>isManifest(r.url)&&r.error==='net::ERR_FAILED');result.expectedManifestErrors=[];
  result.unexpectedRequests=result.requestFailures.filter(r=>!isManifest(r.url)||r.error!=='net::ERR_FAILED');
  result.unexpectedConsole=result.consoleErrors.filter(entry=>{const expected=manifestFailures.length&&(entry.text.includes(`Access to manifest at '${manifestUrl}'`)&&entry.text.includes('blocked by CORS policy')||entry.text==='Failed to load resource: net::ERR_FAILED'&&isManifest(entry.location.url));if(expected)result.expectedManifestErrors.push(entry);return !expected;});
  assert.deepEqual(result.unexpectedRequests,[],'unexpected failed requests');assert.deepEqual(result.unexpectedConsole,[],'unexpected console errors');pass('browserErrors');
  assert(required.every(key=>result.checks[key]===true));result.allPassed=true;save();console.log(JSON.stringify(result,null,2));
 }catch(error){result.allPassed=false;result.failure=String(error.stack||error);console.error(result.failure);if(p)try{await p.screenshot({path:path.join(out,'failure.png'),fullPage:true,timeout:3000});fs.writeFileSync(path.join(out,'failure.html'),await p.content());}catch{}process.exitCode=1;}
 finally{save();if(ctx)await ctx.close();}
})().catch(error=>{result.allPassed=false;result.failure=String(error.stack||error);save();console.error(error);process.exitCode=1;});
