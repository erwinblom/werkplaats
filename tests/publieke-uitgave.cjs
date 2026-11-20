'use strict';
const {chromium}=require('playwright'), assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),{execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const root=path.resolve(process.env.WERKPLAATS_REPO || process.argv[2] || path.resolve(__dirname,'..'));const web=path.join(root,'docs'); const zip=path.join(root,'dist/Werkplaats.zip');const releaseVersion=fs.readFileSync(path.join(root,'release/VERSION'),'ascii').trim();const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ch753-release-check-'));const profile=path.join(temp,'profile');const dialogs=[],errors=[];
const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/blank'){res.end('<title>empty</title>');return;}const f=path.resolve(web,'.'+pathname);if(!f.startsWith(web+path.sep))throw Error('invalid path');let ext=path.extname(f);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.wasm':'application/wasm','.json':'application/json'})[ext]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
let ctx;
async function context(){const opts={headless:true,viewport:{width:1280,height:900},...(process.env.GK_BROWSER?{executablePath:process.env.GK_BROWSER}:{channel:'chrome'})};const c=await chromium.launchPersistentContext(profile,opts);await c.addInitScript(()=>{window.showDirectoryPicker=async()=>{const p=await(await navigator.storage.getDirectory()).getDirectoryHandle('CH753-test-parent',{create:true});try{return await p.getDirectoryHandle('Mijn Werkplaats')}catch{return p}}});c.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('dialog',async d=>{dialogs.push({type:d.type(),message:d.message()});await d.accept()})});return c;}
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;ctx=await context();let home=await ctx.newPage();await home.goto(base+'/index.html');await home.getByRole('button',{name:'Nieuw beginnen',exact:true}).waitFor();assert.equal(await home.getByText('Versie '+releaseVersion,{exact:true}).count(),1);const tiles=await home.locator('.grid li.card.active a[href]').evaluateAll(a=>a.map(x=>x.getAttribute('href')));assert.equal(tiles.length,10);const expected=['Bronnenkast','Werkbank','Omvormen','Databases','Publicatieplanner','Projectbord','Contacten','Ping','Abonnementen','Kasboek'];for(const t of expected)assert(tiles.some(x=>x.includes('/'+t+'/')),'ontbrekende tegel '+t);for(const href of tiles){const p=await ctx.newPage();await p.goto(new URL(href,base+'/').href,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.Werkmap&&!!document.querySelector('#tool-switcher'),null,{timeout:15000});if(!/\/Omvormen\/|\/Databases\//.test(href))await p.evaluate(async()=>{if(window.Werkmap.adapterReady)await window.Werkmap.adapterReady});console.log('Tegel geopend:',href);await p.close()}
 await home.getByRole('button',{name:'Nieuw beginnen',exact:true}).click();await home.getByRole('button',{name:'Kies opslagplek',exact:true}).click();await home.waitForFunction(()=>!!Werkmap.active,null,{timeout:20000});console.log('Start: gesimuleerde OPFS-map actief; dialogen:',JSON.stringify(dialogs));assert.equal(dialogs.length,1,'Eerste start moet precies de bekende bevestiging tonen');assert.equal(dialogs[0].type,'confirm');assert(dialogs[0].message.includes('Dit vervangt je huidige browserwerk'));
 const p=await ctx.newPage();await p.goto(base+'/Apps/Werkbank/'+encodeURIComponent('▶ Begin hier.html')+'?werkruimte=eigen');await p.waitForFunction(()=>!!window.Werkmap&&!!window.BewaarAlles,null,{timeout:15000});await p.getByRole('button',{name:'Notities',exact:true}).click();console.log('NOTITIES UI:',(await p.locator('body').innerText()).slice(0,1800));await p.getByRole('button',{name:'Maak een notitie',exact:true}).click({timeout:5000});await p.getByRole('dialog',{name:'Nieuwe notitie',exact:true}).waitFor();await p.getByLabel('Titel',{exact:true}).fill('CH753 proefnotitie');await p.getByLabel('Notitie',{exact:true}).fill('Fictieve tekst na browserherstart.');let b=p.getByRole('button',{name:'Bewaar in mijn werkmap',exact:true});if(!await b.count())b=p.getByRole('button',{name:'Bewaar',exact:true});await b.click();const dlg=p.getByRole('dialog',{name:'Nieuwe notitie',exact:true});await dlg.getByText(/Bewaard in je werkmap/).waitFor({timeout:15000});await dlg.getByRole('button',{name:'Sluit',exact:true}).last().click();await dlg.waitFor({state:'hidden',timeout:6000});await p.getByText('CH753 proefnotitie',{exact:true}).waitFor();const saved=await p.evaluate(async()=>{const {root}=await Werkmap.allAccess();return (await BewaarAlles.readRound(root)).shared.writingNotes});assert(saved.some(x=>x.title==='CH753 proefnotitie'&&x.body.includes('Fictieve tekst na browserherstart.')));console.log('Fictieve notitie uit bewaarronde teruggelezen.');await ctx.close();ctx=await context();const again=await ctx.newPage();await again.goto(base+'/Apps/Werkbank/'+encodeURIComponent('▶ Begin hier.html')+'?werkruimte=eigen');await again.getByRole('button',{name:'Notities',exact:true}).click();await again.getByText('CH753 proefnotitie',{exact:true}).waitFor({timeout:15000});await again.getByText('CH753 proefnotitie',{exact:true}).click();assert((await again.locator('dialog[open]').innerText()).includes('Fictieve tekst na browserherstart.'));const reread=await again.evaluate(async()=>{const {root}=await Werkmap.allAccess();return (await BewaarAlles.readRound(root)).shared.writingNotes});assert(reread.some(x=>x.title==='CH753 proefnotitie'&&x.body.includes('Fictieve tekst na browserherstart.')));console.log('Notitie na volledig browserproces heropend en bewaarronde opnieuw uit gesimuleerde map teruggelezen in hetzelfde testprofiel.');

 execFileSync('unzip', ['-q', zip, '-d', path.join(temp, 'unzip')]);
 const prefix = path.join(temp, 'unzip/Werkplaats');
 const launcher = path.join(prefix, 'Begin hier.html');
 const offline = await chromium.launch({
   headless: true,
   ...(process.env.GK_BROWSER ? {executablePath: process.env.GK_BROWSER} : {channel: 'chrome'}),
 });
 try {
   const context = await offline.newContext({offline: true});
   const page = await context.newPage();
   page.on('pageerror', error => errors.push(error.message));
   const launcherURL = pathToFileURL(launcher).href;
   const homeURL = pathToFileURL(path.join(prefix, 'Bestanden', 'Begin hier.html')).href;
   const suffix = '?home=1#controle';
   await page.goto(launcherURL + suffix);
   await page.waitForURL(homeURL + suffix);
   await page.getByRole('button', {name: 'Nieuw beginnen', exact: true}).waitFor();
   assert.equal(await page.getByText('Versie ' + releaseVersion, {exact: true}).count(), 1);
   console.log('De uitgepakte ZIP start offline en behoudt zoekparameters en anker.');

   for (const file of [
     'Apps/Werkbank/▶ Begin hier.html',
     'Apps/Databases/Start Databases.html',
     'Apps/Omvormen/Start Omvormen.html',
   ]) {
     await page.goto(pathToFileURL(path.join(prefix, 'Bestanden', file)).href);
     await page.waitForFunction(() => !!window.Werkmap, null, {timeout: 15000});
     console.log('Offline ZIP-scherm geopend:', file);
   }

   const looseFolder = path.join(temp, 'los-startbestand');
   fs.mkdirSync(looseFolder);
   const looseLauncher = path.join(looseFolder, 'Begin hier.html');
   fs.copyFileSync(launcher, looseLauncher);
   const looseURL = pathToFileURL(looseLauncher).href;
   await page.goto(looseURL);
   await page.getByRole('heading', {name: 'Pak Werkplaats eerst volledig uit'}).waitFor();
   assert(await page.getByText('Alles uitpakken', {exact: true}).isVisible());
   assert.equal(page.url(), looseURL, 'Los startbestand mag niet naar een ontbrekend bestand springen');
   console.log('Een los startbestand toont de uitpakstappen en blijft geopend.');

   const noScript = await offline.newContext({offline: true, javaScriptEnabled: false});
   const manualPage = await noScript.newPage();
   await manualPage.goto(launcherURL);
   await manualPage.getByRole('link', {name: 'Open Werkplaats', exact: true}).click();
   await manualPage.waitForURL(homeURL);
   await noScript.close();
   console.log('De handmatige link opent het uitgepakte bestand zonder JavaScript.');
   await context.close();
 } finally {
   await offline.close();
 }
 assert.deepEqual(errors, []);
 console.log('OK. Grenzen: de opslagproef simuleert mapkeuze via localhost. De systeempicker is niet getest.');

})().catch(e=>{console.error('MISLUKT:',e.stack);process.exitCode=1}).finally(async()=>{if(ctx)await ctx.close();server.close();fs.rmSync(temp,{recursive:true,force:true})});
