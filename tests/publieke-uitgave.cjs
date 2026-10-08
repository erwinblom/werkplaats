// NODE_PATH must point to an existing Playwright installation.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const repo=path.resolve(__dirname,'..'),root=path.join(repo,'docs');
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname==='/blank'){res.end('<!doctype html><title>Test</title>');return;}
 try{const f=path.join(root,pathname);res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.svg')?'image/svg+xml':'text/html; charset=utf-8');res.end(fs.readFileSync(f));}
 catch{res.statusCode=404;res.end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const base='http://127.0.0.1:'+server.address().port,errors=[];
 const extracted=fs.mkdtempSync(path.join(os.tmpdir(),'werkplaats-uitgave-'));
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());});
  const home=await context.newPage();await home.goto(base+'/index.html');
  await home.getByRole('button',{name:'Nieuw beginnen',exact:true}).waitFor();
  assert.equal(await home.locator('.grid li.card').count(),9);
  assert.equal(await home.getByRole('button',{name:'Bekijk voorbeelden',exact:true}).count(),0);
  assert.equal(await home.getByText('Begin in drie stappen',{exact:true}).count(),1);
  assert(!/Proeftuin/.test(await home.locator('body').innerText()));
  assert.equal(await home.evaluate(()=>GereedschapskistKeuze.mode),'eigen');
  await home.screenshot({path:'/private/tmp/werkplaats-home-actueel.png',fullPage:true});
  const routes=[['Bronnenkast','Start Bronnenkast.html'],['Werkbank','▶ Begin hier.html'],['Publicatieplanner','Start Publicatieplanner.html'],['Projectbord','Start Projectbord.html'],['Contacten','Start Contacten.html'],['Ping','Start Ping.html'],['Abonnementen','Start Abonnementen.html'],['Kasboek','Start Kasboek.html'],['Offerte','Start Offerte.html'],['Uren','Start Uren.html']];
  for(const [tool,file] of routes){
   const p=await context.newPage();await p.goto(base+'/Apps/'+tool+'/'+encodeURIComponent(file));
   await p.waitForFunction(()=>!!window.Werkmap&&!!document.getElementById('tool-switcher'));
   await p.evaluate(()=>Werkmap.adapterReady);
   assert.equal(await p.evaluate(()=>GereedschapskistMode.example),false,tool);
   assert.equal(await p.locator('.example-mode').count(),0,tool);
   assert.equal(await p.getByRole('button',{name:'Bekijk voorbeelden',exact:true}).count(),0,tool);
   assert(!/Proeftuin|Bugs en Requests/.test(await p.locator('body').innerText()),tool);
   const state=await p.evaluate(()=>Werkmap.allRead());
   if(state?.data)for(const key of ['invoices','contacts','items','tasks','entries','quotes'])if(Array.isArray(state.data[key]))assert.equal(state.data[key].length,0,tool+' '+key);
   if(tool==='Werkbank')assert.equal(await p.locator('.note-card').count(),0);
   await p.setViewportSize({width:390,height:844});
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),tool+' mobiel');
   await p.close();
  }
  console.log('OK: huidige home, tien schermen zonder fictieve gegevens of privéfuncties, mobiele breedte.');
  await context.addInitScript(()=>{window.showDirectoryPicker=async()=> (await navigator.storage.getDirectory()).getDirectoryHandle('Uitgave Test',{create:true});});
  await home.bringToFront();await home.reload();await home.getByRole('button',{name:'Nieuw beginnen',exact:true}).click();
  await home.getByRole('button',{name:'Kies opslagplek',exact:true}).click();
  try{await home.waitForFunction(()=>Werkmap.active,{},{timeout:10000});}catch(e){console.error('Werkmapmelding:',await home.locator('#wm-message').innerText());throw e;}
  await home.waitForURL(/werkruimte=eigen/);await home.waitForFunction(()=>Werkmap.active);
  const firstNote=home.getByRole('button',{name:'Maak mijn eerste notitie',exact:true});
  await home.bringToFront();
  if(!await firstNote.isVisible())await home.getByText('Begin in drie stappen',{exact:true}).click();
  await firstNote.click();
  await home.getByRole('dialog',{name:'Nieuwe notitie',exact:true}).waitFor();
  await home.getByLabel('Titel',{exact:true}).fill('Uitgavecontrole');
  await home.getByLabel('Notitie',{exact:true}).fill('Deze eigen notitie moet op schijf en na heropenen gelijk blijven.');
  await home.getByRole('button',{name:'Bewaar in mijn werkmap',exact:true}).click();
  await home.getByRole('dialog',{name:'Nieuwe notitie',exact:true}).waitFor({state:'hidden'});
  const saved=await home.evaluate(async()=>{const {root}=await Werkmap.allAccess();return (await BewaarAlles.readRound(root)).shared.writingNotes;});
  assert.equal(saved.length,1);assert.equal(saved[0].title,'Uitgavecontrole');
  await home.reload();await home.getByText('Uitgavecontrole',{exact:true}).waitFor();
  await home.getByText('Uitgavecontrole',{exact:true}).click();
  assert(await home.locator('dialog[open]').innerText().then(t=>t.includes(saved[0].body)));
  await home.getByRole('button',{name:'Sluit',exact:true}).click();
  // Close application connections, wipe only the test browser caches and reopen
  // from the independently saved OPFS workmap, not the browser session copy.
  const blank=await context.newPage();await blank.goto(base+'/blank');await home.close();
  await blank.evaluate(async()=>{
   localStorage.clear();sessionStorage.clear();
   const databases=await indexedDB.databases();
   for(const db of databases)if(db.name.includes('bewaar-alles'))await new Promise((resolve,reject)=>{const q=indexedDB.deleteDatabase(db.name);q.onsuccess=resolve;q.onerror=()=>reject(q.error);q.onblocked=()=>reject(Error('Testdatabase nog open'));});
  });
  await blank.goto(base+'/index.html');await blank.getByRole('button',{name:'Verder werken',exact:true}).click();
  await blank.waitForFunction(()=>Werkmap.active);
  await blank.goto(base+'/Apps/Werkbank/'+encodeURIComponent('▶ Begin hier.html'));
  await blank.getByText('Uitgavecontrole',{exact:true}).waitFor();await blank.getByText('Uitgavecontrole',{exact:true}).click();
  assert((await blank.locator('dialog[open]').innerText()).includes(saved[0].body));
  console.log('OK: startroute bewaart notitie met readback; herladen en heropenen na gewiste testcaches behoudt titel en tekst.');
  await context.close();
  execFileSync('unzip',['-q',path.join(repo,'dist/Werkplaats.zip'),'-d',extracted]);
  const offline=await browser.newContext({offline:true});offline.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  const p=await offline.newPage();
  await p.goto(pathToFileURL(path.join(extracted,'Werkplaats/Begin hier.html')).href+'?home=1#controle');
  await p.getByRole('button',{name:'Nieuw beginnen',exact:true}).waitFor();
  assert(p.url().includes('/Bestanden/Begin%20hier.html?home=1#controle'));
  assert.equal(await p.getByRole('button',{name:'Bekijk voorbeelden',exact:true}).count(),0);
  await p.goto(pathToFileURL(path.join(extracted,'Werkplaats/Bestanden/Apps/Werkbank/▶ Begin hier.html')).href);
  await p.getByRole('button',{name:'+ Nieuwe notitie',exact:true}).waitFor();
  assert.equal(await p.evaluate(()=>GereedschapskistMode.example),false);
  assert.equal(await p.locator('.note-card').count(),0);
  await p.goto(pathToFileURL(path.join(extracted,'Werkplaats/Bestanden/Uitleg.html')).href);
  assert(!/Proeftuin|Bekijk voorbeelden/.test(await p.locator('body').innerText()));
  await offline.close();assert.deepEqual(errors,[]);
  console.log('OK: echte ZIP opent offline via buitenste startbestand, behoudt parameters/anker en bevat Notities en actuele hulp; geen browserfouten.');
 }finally{await browser.close();server.close();fs.rmSync(extracted,{recursive:true,force:true});}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
