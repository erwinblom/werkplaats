'use strict';
// Native OS folder picker is driven only in a disposable CI runner; no storage API is mocked.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {spawn,spawnSync}=require('node:child_process');
const out=path.resolve('platform-evidence');fs.mkdirSync(out,{recursive:true});
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
  const script=permissionOnly ? 'sleep 1.2; scrot "$2"; xdotool key --clearmodifiers Tab; xdotool key Return; sleep 0.8; scrot "$3"' : `
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
const permissionInput=tag=>nativeInput('',tag,true);
function listFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?listFiles(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const SHA='98489dd9705b28ae2124ffcf7ade99b44fd264f3d3df548528cbe4c53eb43cc8';
const zip=path.resolve('fixture-release/Werkplaats.zip'),root=path.resolve('fixture-release/unpacked/Werkplaats');
const app=path.join(root,'Bestanden'), launcher=path.join(root,'Begin hier.html');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aZkAAAAASUVORK5CYII=','base64');
const dataUrl='data:image/png;base64,'+png.toString('base64');
const markdown=`# CH513 document\n\nContext: self-driving voertuigen in fictieve proef.\n\n![Omslag](${dataUrl})\n\n![Herhaling](${dataUrl})\n`;
const source=(id,title,summary,notes)=>({id,title,source:'Fictieve proefbron',url:`https://example.test/${id}`,category:'Technologie',uses:[],tags:['mobiliteit'],summary,notes,quote:'',checked:'',favorite:false});
const fixtures={format:'bronnenkast',version:1,name:'CH513 proefcollectie',items:[source('ch513-a','Zelfrijdende auto voorbeeld','Autonomous driving met lokale zoekproef','Bewaar deze eigen notitie'),source('ch513-b','Tweede bookmark','Tweede bron voor project','Behouden')]};
const project={id:'ch513-project',kind:'project',title:'CH513 platformproject',channel:'',state:'active',date:'',endDate:'',text:'Fictieve projecttekst',notes:'Projectnotitie blijft',url:'',duration:'ongoing',projectId:'',documentId:'',sourceIds:[]};
const result={os:os.platform(),release:os.release(),arch:os.arch(),node:process.version,playwright:require('playwright/package.json').version,allPassed:false,checks:{},pageErrors:[],consoleErrors:[],requestFailures:[],expectedManifestErrors:[]};
const save=()=>fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));
const pass=(name)=>{result.checks[name]=true;console.log('PASS',name);save();};
const required=['releaseHash','releaseVersion','nativeFolder','searchExact','searchAnd','searchRelated','searchTypo','searchSourcesContext','searchClick','projectSearchMulti','projectLinkCounter','projectUnlinkCounter','sourceLinkRoundtrip','diskSave','reload','browserRestart','restartDiskExact','savedDocumentOpen','png','zipCrcBytesDedup','browserErrors'];
save();
const options={channel:'chrome',headless:false,acceptDownloads:true,viewport:{width:1440,height:1000}};
function writeFixture(folder){
 fs.mkdirSync(path.join(folder,'Verzamelen'),{recursive:true});fs.mkdirSync(path.join(folder,'Plannen'),{recursive:true});fs.mkdirSync(path.join(folder,'Schrijven'),{recursive:true});
 fs.writeFileSync(path.join(folder,'Verzamelen','gereedschapskist-verzamelen.json'),JSON.stringify(fixtures,null,2));
 fs.writeFileSync(path.join(folder,'Plannen','gereedschapskist-plannen.json'),JSON.stringify({format:'publicatieplanner',version:2,items:[project]},null,2));
 fs.writeFileSync(path.join(folder,'Schrijven','CH513 document.md'),markdown);
}
function readSaved(folder){
 const rounds=path.join(folder,'Bewaard werk');const pointer=JSON.parse(fs.readFileSync(path.join(rounds,'actueel.json')));const dir=path.join(rounds,pointer.current);const manifest=JSON.parse(fs.readFileSync(path.join(dir,'bewaar-alles.json')));const values=manifest.sessions.map(s=>JSON.parse(fs.readFileSync(path.join(dir,s.folder,'werksessie.json'))));
 return {pointer,manifest,values};
}
function validateSaved(folder){
 const saved=readSaved(folder),s=saved.values.find(v=>v.tool==='Bronnenkast'),p=saved.values.find(v=>v.tool==='Publicatieplanner'),w=saved.values.find(v=>v.tool==='Werkbank');
 assert(s&&p&&w,'all three sessions exist in physical committed round');
 const normalized={...s.data,items:s.data.items.map(item=>({...item,projectId:item.projectId??''}))};
 assert.deepEqual(normalized,{...fixtures,items:[{...fixtures.items[0],projectId:'ch513-project'},{...fixtures.items[1],projectId:''}]},'all bookmark fields retained; absent and empty project relation are equivalent');
 assert.deepEqual(p.data.items.find(x=>x.id===project.id),project,'complete project unchanged');
 assert(w.documents.some(d=>d.content===markdown),'writing document exact on disk');
 fs.writeFileSync(path.join(out,'disk-readback.json'),JSON.stringify(saved,null,2));return saved;
}
(async()=>{
 let ctx,p;
 try{
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex'),SHA);result.zipSha256=SHA;pass('releaseHash');
  const version=fs.readFileSync(path.join(app,'feedback.js'),'utf8').match(/version='([^']+)'/)?.[1];assert.equal(version,'0.36.14');result.version=version;fs.writeFileSync(path.join(out,'manifest-version.json'),JSON.stringify({version,zipSha256:SHA,launcher:path.relative(process.cwd(),launcher)},null,2));pass('releaseVersion');
  const parent=process.platform==='win32'?path.join(os.homedir(),'Documents','Werkplaats CH513'):os.tmpdir();fs.mkdirSync(parent,{recursive:true});
  const folder=fs.mkdtempSync(path.join(parent,'werkplaats-ch513-')),profile=fs.mkdtempSync(path.join(os.tmpdir(),'ch513-profile-'));writeFixture(folder);result.testFolder=folder;
  ctx=await chromium.launchPersistentContext(profile,options);p=ctx.pages()[0]||await ctx.newPage();
  const track=page=>{page.on('dialog',d=>d.accept());page.on('pageerror',e=>result.pageErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.consoleErrors.push({text:m.text(),location:m.location()});});page.on('requestfailed',r=>result.requestFailures.push({url:r.url(),error:r.failure()?.errorText||''}));};track(p);result.browserUserAgent=await p.evaluate(()=>navigator.userAgent);assert.match(result.browserUserAgent,/Chrome\//);save();
  await p.goto(pathToFileURL(launcher).href);await p.getByRole('button',{name:'Verder werken',exact:true}).waitFor();
  await p.getByRole('button',{name:'Verder werken',exact:true}).click();result.pickerExit=await nativeInput(folder,'open');assert.equal(result.pickerExit,0,'native helper exit');
  await p.waitForFunction(()=>window.Werkmap?.active&&Werkmap.name,{timeout:30000});assert.equal(await p.evaluate(()=>Werkmap.name),path.basename(folder));await p.waitForFunction(()=>/Werkmap geopend/.test(document.querySelector('#wm-message')?.textContent||''),null,{timeout:30000});pass('nativeFolder');
  // Search via the product keyboard shortcut, with a real legacy disk fixture.
  await p.locator('[data-open-search]').click();const dialog=p.locator('#all-search-dialog');await dialog.waitFor();await dialog.locator('ul').waitFor({state:'attached'});await p.waitForFunction(()=>document.querySelector('#all-search-dialog ul')?.getAttribute('aria-busy')==='false');
  const input=dialog.locator('#all-search-input'),items=dialog.locator('li');
  await input.fill('Zelfrijdende auto voorbeeld');await items.getByRole('link',{name:'Zelfrijdende auto voorbeeld',exact:true}).waitFor();pass('searchExact');
  await input.fill('Zelfrijdende ontbrekendwoord');assert.equal(await items.count(),0);pass('searchAnd');
  await input.fill('selfdriving');await items.getByRole('link',{name:'Zelfrijdende auto voorbeeld',exact:true}).waitFor();assert.match(await items.first().innerText(),/Verwant begrip|self.?driving|Autonomous/i);pass('searchRelated');
  await input.fill('zelfrijdnde');await items.getByRole('link',{name:'Zelfrijdende auto voorbeeld',exact:true}).waitFor();pass('searchTypo');
  await input.fill('selfdriving');await dialog.getByRole('button',{name:/Verzamelen \([1-9]/}).click();assert.match(await dialog.locator('.all-search-sources').innerText(),/Alles \(\d+\)/);assert.match(await items.first().innerText(),/Autonomous|zelfrijdend|self.?driving/i);await p.screenshot({path:path.join(out,'search.png'),fullPage:true});pass('searchSourcesContext');
  await items.getByRole('link',{name:'Zelfrijdende auto voorbeeld',exact:true}).click();await p.waitForURL(/Bronnenkast/);await p.getByText('Zelfrijdende auto voorbeeld',{exact:true}).first().waitFor();pass('searchClick');
  await p.goto(pathToFileURL(path.join(app,'Apps','Publicatieplanner','Start Publicatieplanner.html')).href+'?werkruimte=eigen');
  const card=p.locator('article.publication').filter({hasText:project.title});await card.waitFor();await card.locator('.pub-title').click();
  const detail=p.locator('dialog[open]').filter({hasText:project.title});await detail.waitFor();const more=detail.locator('.plan-detail-more');if(await more.count())await more.locator('summary').click();
  await detail.getByRole('button',{name:'+ Bookmark koppelen',exact:true}).click();let chooser=p.locator('dialog[open]').filter({hasText:'Bookmarks koppelen'});await chooser.waitFor();
  await chooser.getByLabel('Zoek bookmark').fill('Tweede');assert.equal(await chooser.locator('label:visible').count(),1);await chooser.getByLabel('Zoek bookmark').fill('');
  await chooser.locator('input[value="ch513-a"]').check();await chooser.locator('input[value="ch513-b"]').check();await chooser.getByRole('button',{name:'Bewaar koppelingen'}).click();await chooser.waitFor({state:'detached'});await detail.getByText('Bronnen · 2').waitFor();pass('projectSearchMulti');
  await p.screenshot({path:path.join(out,'linked.png'),fullPage:true});await detail.getByRole('button',{name:'Sluit',exact:true}).click();await detail.waitFor({state:'hidden'});await p.waitForFunction(()=>[...document.querySelectorAll('.project-source-summary')].some(e=>/2/.test(e.textContent)));pass('projectLinkCounter');
  await card.locator('.pub-title').click();await detail.getByRole('button',{name:'Tweede bookmark ontkoppelen van dit project'}).click();await detail.getByText('Bronnen · 1').waitFor();await detail.getByRole('button',{name:'Sluit',exact:true}).click();await detail.waitFor({state:'hidden'});await p.waitForFunction(()=>[...document.querySelectorAll('.project-source-summary')].some(e=>/1/.test(e.textContent)));pass('projectUnlinkCounter');
  // Follow the linked bookmark through the real project dossier, then unlink and relink from Verzamelen itself.
  await card.locator('.pub-title').click();await detail.getByRole('link',{name:'Zelfrijdende auto voorbeeld',exact:true}).click();await p.waitForURL(/Bronnenkast/);
  const sourceDetail=p.locator('#source-detail[open]');await sourceDetail.getByText('Project: CH513 platformproject →',{exact:true}).waitFor();
  for(const [value,linked] of [['',false],['ch513-project',true]]){
   await sourceDetail.getByRole('button',{name:'Koppelingen',exact:true}).click();const links=p.locator('dialog.link-dialog[open]');await links.locator('select[name=project]').selectOption(value);await links.getByRole('button',{name:'Bewaar koppelingen',exact:true}).click();await links.waitFor({state:'detached'});
   if(linked)await sourceDetail.getByText('Project: CH513 platformproject →',{exact:true}).waitFor();else await sourceDetail.getByText('Project: CH513 platformproject →',{exact:true}).waitFor({state:'detached'});
  }
  await p.screenshot({path:path.join(out,'source-project-roundtrip.png'),fullPage:true});await sourceDetail.getByRole('button',{name:'Sluit',exact:true}).click();await sourceDetail.waitFor({state:'hidden'});pass('sourceLinkRoundtrip');
  await p.getByRole('button',{name:'Bewaar alles',exact:true}).first().click();await p.waitForFunction(()=>/Alles bewaard\./.test(document.querySelector('#wm-message')?.textContent||''),null,{timeout:30000});validateSaved(folder);pass('diskSave');
  await p.reload();await p.goto(pathToFileURL(path.join(app,'Apps','Publicatieplanner','Start Publicatieplanner.html')).href+'?werkruimte=eigen');await card.waitFor();await p.waitForFunction(()=>[...document.querySelectorAll('.project-source-summary')].some(e=>/1/.test(e.textContent)));pass('reload');
  const old=ctx.browser();await ctx.close();assert(!old||!old.isConnected());ctx=await chromium.launchPersistentContext(profile,options);p=ctx.pages()[0]||await ctx.newPage();track(p);result.restartBrowserUserAgent=await p.evaluate(()=>navigator.userAgent);assert.equal(result.restartBrowserUserAgent,result.browserUserAgent);save();
  await p.goto(pathToFileURL(launcher).href);await p.waitForFunction(()=>window.Werkmap);await p.evaluate(()=>Werkmap.recall());const permission=await p.evaluate(async()=>{const access=await Werkmap.allAccess(false);return access.root.queryPermission({mode:'readwrite'});});result.restartPermissionAtStart=permission;await p.getByRole('button',{name:'Verder werken',exact:true}).click();if(permission!=='granted'){result.restartPermissionHelperExit=await permissionInput('restart');assert.equal(result.restartPermissionHelperExit,0);}await p.waitForFunction(()=>window.Werkmap?.active,{timeout:30000});await p.waitForFunction(()=>/Werkmap geopend/.test(document.querySelector('#wm-message')?.textContent||''),null,{timeout:30000});await p.goto(pathToFileURL(path.join(app,'Apps','Publicatieplanner','Start Publicatieplanner.html')).href+'?werkruimte=eigen');const restartCard=p.locator('article.publication').filter({hasText:project.title});await restartCard.waitFor();await p.waitForFunction(()=>[...document.querySelectorAll('.project-source-summary')].some(e=>/1/.test(e.textContent)));await restartCard.locator('.pub-title').click();const restartDetail=p.locator('dialog[open]').filter({hasText:project.title});await restartDetail.getByText('Zelfrijdende auto voorbeeld',{exact:true}).waitFor();assert.equal(await restartDetail.getByText('Tweede bookmark',{exact:true}).count(),0);await p.screenshot({path:path.join(out,'restart-project.png'),fullPage:true});pass('browserRestart');validateSaved(folder);pass('restartDiskExact');
  // Open the actual existing OS document through the product's Documents tab and file tree.
  assert.equal(fs.readFileSync(path.join(folder,'Schrijven','CH513 document.md'),'utf8'),markdown,'physical source document remains exact');
  await p.goto(pathToFileURL(path.join(app,'Apps','Werkbank','▶ Begin hier.html')).href+'?werkruimte=eigen');
  await p.waitForFunction(()=>window.SchrijfNotities&&window.Werkmap&&window.BewaarAlles);await p.evaluate(async()=>{await Werkmap.suiteReady;await BewaarAlles.ready;});
  await p.locator('.writing-views').getByRole('button',{name:'Documenten',exact:true}).click();
  const folderHeader=p.locator('.tree-folder-header[data-folder-path="Schrijven"]');await folderHeader.waitFor();if(await folderHeader.getAttribute('aria-expanded')!=='true')await folderHeader.click();
  const documentRow=p.locator('.tree-folder-contents[data-path="Schrijven"] .tree-file').filter({hasText:'CH513 document'});await documentRow.waitFor();await documentRow.click();
  await p.waitForFunction(expected=>typeof activeFile!=='undefined'&&activeFile?.relativePath==='Schrijven/CH513 document.md'&&!activeFile.isVirtual&&currentRawContent===expected,markdown,{timeout:30000});
  const doc=p.locator('#content .markdown-content');await doc.getByRole('heading',{name:'CH513 document',exact:true}).waitFor();
  await p.waitForFunction(()=>{const images=[...document.querySelectorAll('#content .markdown-content img')];return images.length===2&&images.every(img=>img.complete&&img.naturalWidth>0);},null,{timeout:30000});
  await p.screenshot({path:path.join(out,'saved-document.png'),fullPage:true});pass('savedDocumentOpen');
  const moreFile=p.locator('.file-actions .file-more-panel');if(!await moreFile.isVisible())await p.locator('.file-actions summary').first().click();await p.getByRole('button',{name:'Download afbeeldingen',exact:true}).click();const imageDialog=p.locator('dialog.wp-image-downloads[open]');await imageDialog.waitFor();assert.equal(await imageDialog.locator('.wp-image-download-row').count(),1,'duplicate data URL shown once');
  let downloadPromise=p.waitForEvent('download');await imageDialog.getByRole('button',{name:'Download afbeelding 1',exact:true}).click();let dl=await downloadPromise;let pngFile=path.join(out,'image.png');await dl.saveAs(pngFile);assert.deepEqual(fs.readFileSync(pngFile),png);pass('png');
  downloadPromise=p.waitForEvent('download');await imageDialog.getByRole('button',{name:'Download alle afbeeldingen (ZIP)',exact:true}).click();dl=await downloadPromise;const exported=path.join(out,'images.zip');await dl.saveAs(exported);
  const py="import sys,zipfile,base64; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; n=z.namelist(); assert len(n)==1,n; assert z.read(n[0])==base64.b64decode(sys.argv[2]); print('CRC and exact original bytes; single deduplicated image:',n[0])";
  const check=spawnSync(process.platform==='win32'?'python':'python3',['-c',py,exported,png.toString('base64')],{encoding:'utf8'});fs.writeFileSync(path.join(out,'zip-validation.log'),check.stdout+'\n'+check.stderr);assert.equal(check.status,0,check.stderr);pass('zipCrcBytesDedup');await p.screenshot({path:path.join(out,'images.png'),fullPage:true});
  assert.deepEqual(result.pageErrors,[]);
  // Chromium blocks this specific file:// web manifest. Other failed requests or console errors remain failures.
  const manifestUrl=pathToFileURL(path.join(app,'App-iconen','app.webmanifest')).href;
  const isManifest=url=>{try{return new URL(url).href===manifestUrl;}catch{return false;}};
  const manifestRequest=result.requestFailures.filter(r=>isManifest(r.url)&&r.error==='net::ERR_FAILED');
  const unexpectedRequests=result.requestFailures.filter(r=>!isManifest(r.url)||r.error!=='net::ERR_FAILED');
  const unexpectedConsole=[];
  for(const entry of result.consoleErrors){
   const cors=entry.text.includes(`Access to manifest at '${manifestUrl}'`)&&entry.text.includes('blocked by CORS policy')&&manifestRequest.length>0;
   const resource=entry.text==='Failed to load resource: net::ERR_FAILED'&&isManifest(entry.location.url)&&manifestRequest.length>0;
   (cors||resource?result.expectedManifestErrors:unexpectedConsole).push(entry);
  }
  result.browserErrorClassification={manifestUrl,manifestRequestFailures:manifestRequest,unexpectedRequests,unexpectedConsole};save();
  assert.deepEqual(unexpectedRequests,[],'unexpected failed browser requests');assert.deepEqual(unexpectedConsole,[],'unexpected browser console errors');pass('browserErrors');
  assert(required.every(key=>result.checks[key]===true),'all named proof checks required');result.allPassed=true;save();
 }catch(e){result.failure=String(e.stack||e);console.error(result.failure);if(p)try{await p.screenshot({path:path.join(out,'failure.png'),fullPage:true,timeout:3000});fs.writeFileSync(path.join(out,'failure.html'),await p.content());}catch{}process.exitCode=1;}
 finally{save();if(ctx)await ctx.close();}
})().catch(e=>{result.failure=String(e.stack||e);save();console.error(e);process.exitCode=1});
