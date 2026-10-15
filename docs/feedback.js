/* Lokale feedback voor gebruikers; bereikbaar onder Hulp. */
(function () {
  'use strict';
  const email='erwblo@gmail.com',version='0.36.10';
  const kindNames={Bug:'Meld een fout',Request:'Stel een verbetering voor',Extension:'Deel een uitbreiding'};
  function shareText(kind,text,context){return '# Help Werkplaats verbeteren\n\n'+(kindNames[kind]||kind)+'\nWerkplaats '+version+' · '+context.tool+(context.view?' · '+context.view:'')+'\n\n'+text.trim();}
  function shareLinks(kind,text,context){const body=shareText(kind,text,context),title='Werkplaats: '+(kindNames[kind]||kind)+' ('+context.tool+')';return {body,mail:'mailto:'+email+'?subject='+encodeURIComponent(title)+'&body='+encodeURIComponent(encodeURIComponent(body).length<=1600?body:'Plak hieronder de volledige tekst uit Werkplaats (gebruik Kopieer tekst).'),github:'https://github.com/erwinblom/werkplaats/issues/new?template='+({Bug:'bug.md',Request:'verbetering.md',Extension:'uitbreiding.md'}[kind]||'verbetering.md')+'&title='+encodeURIComponent(title)+'&body='+encodeURIComponent(encodeURIComponent(body).length<=6000?body:'Plak hieronder de volledige tekst uit Werkplaats (gebruik Kopieer tekst).')};}
  const tools = {Werkbank:'Schrijven',Ping:'Factureren',Projectbord:'Doen',Bronnenkast:'Verzamelen',Uren:'Uren schrijven',Contacten:'Contacten',Publicatieplanner:'Projecten',Offerte:'Offreren',Kasboek:'Boekhouden',Abonnementen:'Abonnementen'};
  function toolFor(path) {
    const decoded = decodeURIComponent(path);
    for (const [folder, name] of Object.entries(tools)) if (decoded.includes('/Apps/' + folder + '/')) return name;
    return ({'Begin hier.html':'Startpagina','Over.html':'Over','Uitleg.html':'Uitleg','Link-bewaren.html':'Link bewaren'})[decoded.split('/').pop()] || 'Algemeen';
  }
  function contextFor(path, detail={}) {
    const tool=detail.dialogId==='all-search-dialog'?'Zoeken':detail.dialogId==='suite-settings'?'Instellingen':detail.dialogId==='my-tools-dialog'?'Mijn gereedschappen':toolFor(path);
    const layer=['Verzamelen','Schrijven','Zoeken'].includes(tool)?'Informatie':['Projecten','Doen','Contacten'].includes(tool)?'Organisatie':['Offreren','Factureren','Boekhouden','Abonnementen','Uren schrijven'].includes(tool)?'Administratie':'Werkplaats';
    return {tool,layer,view:detail.title||''};
  }
  const currentName=name=>({'Contact houden':'Contacten',Plannen:'Projecten'})[name]||name;
  function markdown(round, entries) {
    entries=entries.map(e=>({...e,tool:currentName(e.tool)}));
    const lines = ['# Bugs en Requests', '', 'Ronde gestart: ' + round.created, ''];
    for (const tool of [...new Set(entries.map(e => e.tool))].sort((a,b)=>a.localeCompare(b,'nl'))) {
      lines.push('## ' + tool, '');
      for (const e of entries.filter(e=>e.tool===tool).sort((a,b)=>a.created.localeCompare(b.created))) {
        lines.push('### ' + e.kind + ' · ' + e.created, '');
        if(e.layer||e.view)lines.push('Context: '+[e.layer,e.view].filter(Boolean).join(' · '), '');
        lines.push(e.text, '');
      }
    }
    if (!entries.length) lines.push('Nog geen opmerkingen.', '');
    return lines.join('\n');
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = {toolFor, contextFor, markdown, shareText, shareLinks}; return; }
  let context = contextFor(location.pathname);
  let database, channel;
  function openDB() {
    if (database) return Promise.resolve(database);
    return new Promise((resolve,reject)=>{
      const req = indexedDB.open('gk-publieke-feedback',1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('meta');
        req.result.createObjectStore('rounds',{keyPath:'id'});
        req.result.createObjectStore('entries',{keyPath:'id'});
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(Error(I18n.value(I18n.ui("Sluit oude Werkplaats-vensters en probeer opnieuw.",'Sluit oude Werkplaats-vensters en probeer opnieuw.'))));
      req.onsuccess = () => { database=req.result; database.onversionchange=()=>{database.close();database=null;}; resolve(database); };
    });
  }
  async function transact(action, entry) {
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(['meta','rounds','entries'],'readwrite');
      const meta=tx.objectStore('meta'), rounds=tx.objectStore('rounds'), entries=tx.objectStore('entries');
      let result;
      tx.oncomplete=()=>resolve(result);
      tx.onerror=()=>reject(tx.error || Error(I18n.value(I18n.ui("Bewaar is niet gelukt.",'Bewaar is niet gelukt.'))));
      tx.onabort=()=>reject(tx.error || Error(I18n.value(I18n.ui("Bewaar is afgebroken.",'Bewaar is afgebroken.'))));
      const request=meta.get('active');
      request.onsuccess=()=>{
        let id=request.result;
        if (!id || action==='new') {
          id=crypto.randomUUID(); rounds.add({id,created:new Date().toISOString()}); meta.put(id,'active');
        }
        if (action==='add') entries.add({...entry,id:crypto.randomUUID(),round:id,created:new Date().toISOString()});
        const r=rounds.getAll(), e=entries.getAll();
        let rs,es;
        const finish=()=>{if(rs && es) result={active:id,rounds:rs,entries:es};};
        r.onsuccess=()=>{rs=r.result;finish();}; e.onsuccess=()=>{es=e.result;finish();};
      };
    });
  }
  function init() {
    const css=document.createElement('style');
    I18n.assign(css,I18n.ui("\n#contribution-open{position:fixed;right:18px;bottom:18px;z-index:9000;background:#fff;color:#111;border:2px solid #111;border-radius:6px;padding:10px 14px;font:600 14px Arial,sans-serif;box-shadow:0 2px 8px #0002;cursor:pointer}\n\n.context-contribution-button{display:block!important;position:static!important;margin:16px 0 0 auto!important;padding:9px 12px!important;width:auto!important;background:#fff!important;color:#111!important;border:1px solid #111!important;font:600 14px Arial,sans-serif!important;cursor:pointer}#contribution-dialog *{box-sizing:border-box}#contribution-dialog h3{font:700 16px Arial,sans-serif;margin:0 0 4px}#contribution-dialog p{margin:8px 0}#contribution-dialog label{display:block;font-weight:bold;margin:12px 0 5px}#contribution-dialog textarea,#contribution-dialog select{display:block;width:100%;background:#fff;color:#111;border:1px solid #777;padding:9px;font:15px/1.5 Arial,sans-serif;border-radius:3px}#contribution-dialog textarea{min-height:120px;resize:vertical}#contribution-dialog .contribution-item{border-top:1px solid #ddd;padding:12px 0}#contribution-dialog .contribution-text{white-space:pre-wrap;overflow-wrap:anywhere}#contribution-dialog .contribution-muted{font-size:13px;color:#555}#contribution-dialog [hidden]{display:none!important}#contribution-dialog :focus-visible,#contribution-open:focus-visible{outline:3px solid #e32720;outline-offset:3px}@media print{#contribution-open,#contribution-dialog,.context-contribution-button{display:none!important}}",`
#contribution-open{position:fixed;right:18px;bottom:18px;z-index:9000;background:#fff;color:#111;border:2px solid #111;border-radius:6px;padding:10px 14px;font:600 14px Arial,sans-serif;box-shadow:0 2px 8px #0002;cursor:pointer}

.context-contribution-button{display:block!important;position:static!important;margin:16px 0 0 auto!important;padding:9px 12px!important;width:auto!important;background:#fff!important;color:#111!important;border:1px solid #111!important;font:600 14px Arial,sans-serif!important;cursor:pointer}#contribution-dialog *{box-sizing:border-box}#contribution-dialog h3{font:700 16px Arial,sans-serif;margin:0 0 4px}#contribution-dialog p{margin:8px 0}#contribution-dialog label{display:block;font-weight:bold;margin:12px 0 5px}#contribution-dialog textarea,#contribution-dialog select{display:block;width:100%;background:#fff;color:#111;border:1px solid #777;padding:9px;font:15px/1.5 Arial,sans-serif;border-radius:3px}#contribution-dialog textarea{min-height:120px;resize:vertical}#contribution-dialog .contribution-item{border-top:1px solid #ddd;padding:12px 0}#contribution-dialog .contribution-text{white-space:pre-wrap;overflow-wrap:anywhere}#contribution-dialog .contribution-muted{font-size:13px;color:#555}#contribution-dialog [hidden]{display:none!important}#contribution-dialog :focus-visible,#contribution-open:focus-visible{outline:3px solid #e32720;outline-offset:3px}@media print{#contribution-open,#contribution-dialog,.context-contribution-button{display:none!important}}`),"textContent");
    css.textContent+='\n.contribute-invite{margin-block:var(--space-l);padding:var(--space-l);background:var(--cte-surface);box-shadow:var(--border-shadow-s)}#contribution-dialog{width:min(760px,calc(100vw - 32px));max-height:90vh;overflow:auto}#contribution-dialog .contribution-actions{display:flex;flex-wrap:wrap;gap:var(--space-s)}#contribution-dialog [aria-disabled=true]{opacity:.5;cursor:default}#contribution-dialog .contribution-actions a{display:inline-block;padding:var(--space-s);color:inherit;text-decoration:underline}';
    document.head.append(css);
    const launch=document.createElement('button');launch.id='contribution-open';launch.type='button';I18n.assign(launch,I18n.ui("Help Werkplaats verbeteren",'Help Werkplaats verbeteren'),"textContent");launch.hidden=true;document.body.append(launch);const place=()=>{const help=document.getElementById('workspace-help')||document.querySelector('.home-help-dialog .home-more');if(help&&launch.parentElement!==help){help.append(launch);launch.hidden=false;launch.style.position='static';}};place();new MutationObserver(place).observe(document.body,{childList:true,subtree:true});
    const dialog=document.createElement('dialog');dialog.id='contribution-dialog';dialog.setAttribute('aria-labelledby','contribution-title');
    dialog.innerHTML="<h2 id=\"contribution-title\"><span data-i18n=\"Help Werkplaats verbeteren\">Help Werkplaats verbeteren</span></h2><p id=\"contribution-tool\"></p><p data-i18n=\"Werkplaats groeit door mensen die het gebruiken. Loop je ergens tegenaan, mis je iets of heb je zelf een uitbreiding gebouwd? Laat het weten.\">Werkplaats groeit door mensen die het gebruiken. Loop je ergens tegenaan, mis je iets of heb je zelf een uitbreiding gebouwd? Laat het weten.</p><form id=\"contribution-form\"><label for=\"contribution-kind\"><span data-i18n=\"Soort\">Soort</span></label><select id=\"contribution-kind\"><option value=\"Bug\" data-i18n=\"Meld een fout\">Meld een fout</option><option value=\"Request\" data-i18n=\"Stel een verbetering voor\">Stel een verbetering voor</option><option value=\"Extension\" data-i18n=\"Deel een uitbreiding\">Deel een uitbreiding</option></select><label for=\"contribution-text\"><span data-i18n=\"Je opmerking\">Je opmerking</span></label><textarea id=\"contribution-text\" required maxlength=\"20000\" placeholder=\"Wat gaat er mis, of wat zou je willen?\" data-i18n-placeholder=\"Wat gaat er mis, of wat zou je willen?\"></textarea><div class=\"contribution-actions wp-actions\"><button type=\"submit\" id=\"contribution-save\"><span data-i18n=\"Bewaar opmerking\">Bewaar opmerking</span></button><button type=\"button\" id=\"contribution-close\"><span data-i18n=\"Sluit\">Sluit</span></button></div></form><section aria-label=\"Delen\"><h3 data-i18n=\"Deel je bijdrage\">Deel je bijdrage</h3><p data-i18n=\"Controleer hieronder wat je deelt. Alleen jouw tekst en dit onderdeel gaan mee. Je verstuurt zelf de e-mail of plaatst zelf de GitHub-melding.\">Controleer hieronder wat je deelt. Alleen jouw tekst en dit onderdeel gaan mee. Je verstuurt zelf de e-mail of plaatst zelf de GitHub-melding.</p><textarea id=\"contribution-preview\" readonly aria-label=\"Wat je deelt\" data-i18n-aria-label=\"Wat je deelt\"></textarea><div class=\"contribution-actions wp-actions\"><a id=\"contribution-email\" data-i18n=\"Deel per e-mail\">Deel per e-mail</a><button type=\"button\" id=\"contribution-share-copy\" data-i18n=\"Kopieer tekst\">Kopieer tekst</button><a id=\"contribution-github\" target=\"_blank\" rel=\"noopener noreferrer\" data-i18n=\"Deel op GitHub\">Deel op GitHub</a></div><p class=\"contribution-muted\" data-i18n=\"E-mail opent je mailprogramma met erwblo@gmail.com als ontvanger. GitHub is openbaar en vraagt een account. Voeg screenshots of een ZIP zelf toe.\">E-mail opent je mailprogramma met erwblo@gmail.com als ontvanger. GitHub is openbaar en vraagt een account. Voeg screenshots of een ZIP zelf toe.</p><p id=\"contribution-share-hint\" class=\"contribution-muted\"></p></section><p id=\"contribution-status\" role=\"status\" aria-live=\"polite\"></p><hr><details><summary data-i18n=\"Lokaal bewaarde opmerkingen\">Lokaal bewaarde opmerkingen</summary><label for=\"contribution-round\"><span data-i18n=\"Opmerkingen bekijken\">Opmerkingen bekijken</span></label><select id=\"contribution-round\"></select><div class=\"contribution-actions wp-actions\"><button type=\"button\" id=\"contribution-copy\"><span data-i18n=\"Kopieer\">Kopieer</span></button><button type=\"button\" id=\"contribution-download\"><span data-i18n=\"Download document\">Download document</span></button><button type=\"button\" id=\"contribution-new\"><span data-i18n=\"Nieuwe ronde\">Nieuwe ronde</span></button></div><p class=\"contribution-muted\"><span data-i18n=\"Lokaal in deze browser bewaard, apart van je werkmap. Download het document om te delen of als eigen back-up. Een nieuwe ronde bewaart je eerdere opmerkingen.\">Lokaal in deze browser bewaard, apart van je werkmap. Download het document om te delen of als eigen back-up. Een nieuwe ronde bewaart je eerdere opmerkingen.</span></p><div id=\"contribution-list\"></div></details>";
    // Prevent the private feedback module from adding its own controls here.
    const marker=document.createElement('span');marker.hidden=true;marker.dataset.contextFeedback='';dialog.append(marker);
    document.body.append(dialog);
    const $=id=>dialog.querySelector('#contribution-'+id);
    I18n.assign($('tool'),I18n.ui("Opmerking bij: {0}",'Opmerking bij: '+context.tool),"textContent");
    const extensionTemplate='Wat heb ik gebouwd?\n…\n\nVoor wie en welk probleem lost het op?\n…\n\nMijn naam en link naar code of ZIP:\n…';
    const templates={Bug:'Ik deed:\n…\n\nIk verwachtte:\n…\n\nEr gebeurde:\n…',Request:'',Extension:extensionTemplate};
    const bugTemplate='Ik deed:\n…\n\nIk verwachtte:\n…\n\nEr gebeurde:\n…';
    const draftContexts=new Map();
    let drafts={...templates};
    draftContexts.set(JSON.stringify(context),drafts);
    let draftKind=$('kind').value;
    function showDraft(){
      $('text').value=drafts[draftKind];
      $('text').rows=draftKind==='Request'?5:9;
      I18n.assign($('text'),(draftKind==='Extension'?I18n.ui('Beschrijf je uitbreiding, noem de maker en voeg een link toe.','Beschrijf je uitbreiding, noem de maker en voeg een link toe.'):draftKind==='Bug'?I18n.ui("Beschrijf wat je deed en wat er gebeurde.",'Beschrijf wat je deed en wat er gebeurde.'):I18n.ui("Wat zou je willen, en waarom?",'Wat zou je willen, en waarom?')),"placeholder");updateShare();
    }
    function updateShare(){
      const text=$('text').value.trim(),valid=!!text&&text!==(templates[draftKind]||'').trim();
      const links=shareLinks(draftKind,text,context);$('preview').value=valid?links.body:'';
      $('share-copy').disabled=!valid;
      for(const [id,url]of [['email',links.mail],['github',links.github]]){const link=$(id);if(valid)link.href=url;else link.removeAttribute('href');link.setAttribute('aria-disabled',String(!valid));}
      I18n.assign($('share-hint'),I18n.ui((links.mail.includes('Plak%20hieronder')||links.github.includes('Plak%20hieronder'))?'Lange tekst? Klik eerst Kopieer tekst en plak die in je e-mail of GitHub-melding.':'Er is nog niets verstuurd.',(links.mail.includes('Plak%20hieronder')||links.github.includes('Plak%20hieronder'))?'Lange tekst? Klik eerst Kopieer tekst en plak die in je e-mail of GitHub-melding.':'Er is nog niets verstuurd.'));
    }
    $('text').addEventListener('input',()=>{drafts[draftKind]=$('text').value;updateShare();});
    async function copyText(text){
      try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}}catch{}
      const field=document.createElement('textarea');field.value=text;field.style.position='fixed';field.style.opacity='0';dialog.append(field);try{field.select();if(!document.execCommand('copy'))throw Error('Kopieer de tekst handmatig uit het voorbeeld.');}finally{field.remove();}
    }
    $('share-copy').onclick=()=>run(async()=>{await copyText($('preview').value);status(I18n.t('Tekst gekopieerd. Plak deze in je e-mail of GitHub-melding.'))});
    $('email').onclick=()=>{if(!$('email').hasAttribute('href'))return false;status(I18n.t('Je mailprogramma wordt geopend. Verstuur het bericht daar zelf. Geen mailprogramma? Kopieer de tekst en mail die naar erwblo@gmail.com.'))};
    $('github').onclick=()=>{if(!$('github').hasAttribute('href'))return false;status(I18n.t('GitHub wordt geopend. Controleer je tekst en plaats de melding daar zelf.'))};

    $('kind').addEventListener('change',()=>{
      drafts[draftKind]=$('text').value;
      draftKind=$('kind').value;
      showDraft();
    });
    showDraft();

    let state, busy=false, selection='';
    const status=text=>$('status').textContent=text;
    const error=e=>status('Niet gelukt: '+(e.message||'browseropslag niet beschikbaar')+'. Je tekst blijft staan.');
    function render() {
      const sorted=[...state.rounds].sort((a,b)=>b.created.localeCompare(a.created));
      if(!sorted.some(r=>r.id===selection)) selection=state.active;
      $('round').replaceChildren();
      for(const r of sorted){const o=document.createElement('option');o.value=r.id;o.textContent=(r.id===state.active?'Huidige ronde':'Eerdere ronde')+' · '+new Date(r.created).toLocaleString(I18n.locale());$('round').append(o);}
      $('round').value=selection;
      const rows=state.entries.filter(e=>e.round===selection);
      $('list').replaceChildren();
      if(!rows.length){const p=document.createElement('p');I18n.assign(p,I18n.ui("Nog geen opmerkingen in deze ronde.",'Nog geen opmerkingen in deze ronde.'),"textContent");$('list').append(p);}
      for(const row of rows.sort((a,b)=>a.created.localeCompare(b.created))){
        const item=document.createElement('section');item.className='contribution-item';
        const title=document.createElement('h3');title.textContent=currentName(row.tool)+' · '+I18n.t(kindNames[row.kind]||row.kind);
        const text=document.createElement('p');text.className='contribution-text';text.textContent=row.text;
        const share=document.createElement('button');share.type='button';I18n.assign(share,I18n.ui('Deel deze opmerking','Deel deze opmerking'));share.onclick=()=>{if(busy)return;drafts[draftKind]=$('text').value;context={tool:currentName(row.tool),layer:row.layer||'',view:row.view||''};const key=JSON.stringify(context);if(!draftContexts.has(key))draftContexts.set(key,{...templates});drafts=draftContexts.get(key);draftKind=Object.hasOwn(templates,row.kind)?row.kind:'Request';$('kind').value=draftKind;drafts[draftKind]=row.text;showDraft();I18n.assign($('tool'),I18n.ui('Opmerking bij: {0}','Opmerking bij: '+context.tool));$('preview').focus();};item.append(title,share);if(row.layer||row.view){const detail=document.createElement('p');detail.className='contribution-muted';detail.textContent=[row.layer,row.view].filter(Boolean).join(' · ');item.append(detail);}item.append(text);$('list').append(item);
      }
      $('download').disabled=!rows.length;$('copy').disabled=!rows.length;
      $('new').disabled=!state.entries.some(e=>e.round===state.active);
    }
    async function refresh(){state=await transact('read');render();}
    async function run(fn){if(busy)return;busy=true;for(const id of ['save','kind','text'])$(id).disabled=true;try{await fn();}catch(e){error(e);}finally{busy=false;for(const id of ['save','kind','text'])$(id).disabled=false;}}
    function openFeedback(origin){
      if(busy)return;
      drafts[draftKind]=$('text').value;
      context=contextFor(location.pathname,{dialogId:origin?.id,title:origin?.querySelector('h1,h2,h3')?.textContent.trim()||''});
      const key=JSON.stringify(context);if(!draftContexts.has(key))draftContexts.set(key,{...templates});drafts=draftContexts.get(key);showDraft();
      I18n.assign($('tool'),I18n.ui("Opmerking bij: {0}",'Opmerking bij: '+[context.layer,context.tool,context.view].filter(Boolean).join(' · ')),"textContent");
      status('');dialog.showModal();$('text').focus();run(refresh);
    }
    launch.onclick=()=>openFeedback(null);
    if(!document.querySelector('script[data-tool]')){
      const home=document.querySelector('.shell main');if(home){const invite=document.createElement('section');invite.className='contribute-invite';const title=document.createElement('h2');I18n.assign(title,I18n.ui('Help Werkplaats verbeteren','Help Werkplaats verbeteren'));const text=document.createElement('p');I18n.assign(text,I18n.ui('Meld een fout, stel een verbetering voor of deel een eigen uitbreiding. Erik van Elten maakte bijvoorbeeld Agenda-export. Ook jouw bijdrage is welkom.','Meld een fout, stel een verbetering voor of deel een eigen uitbreiding. Erik van Elten maakte bijvoorbeeld Agenda-export. Ook jouw bijdrage is welkom.'));const button=document.createElement('button');button.type='button';I18n.assign(button,I18n.ui('Help Werkplaats verbeteren','Help Werkplaats verbeteren'));button.onclick=()=>openFeedback(null);invite.append(title,text,button);home.append(invite);}
    }
    document.addEventListener('taal-gewijzigd',()=>{if(dialog.open){showDraft();if(state)render();}});

    function attachContextButtons(){
      for(const host of document.querySelectorAll('dialog')){
        if(host===dialog||host.querySelector('[data-context-feedback]'))continue;
        const button=document.createElement('button');button.type='button';button.dataset.contextFeedback='';button.className='context-contribution-button';I18n.assign(button,I18n.ui("Help Werkplaats verbeteren",'Help Werkplaats verbeteren'),"textContent");button.onclick=()=>openFeedback(host);host.append(button);
      }
    }

    $('close').onclick=()=>dialog.close(); // Keep draft text when closing.
    $('round').onchange=()=>{selection=$('round').value;render();};
    $('form').onsubmit=e=>{e.preventDefault();const text=$('text').value.trim();if(!text||text===(templates[draftKind]||'').trim()){status('Vul eerst je opmerking in.');$('text').focus();return;}
      run(async()=>{state=await transact('add',{...context,kind:$('kind').value,text});selection=state.active;drafts[draftKind]=text;showDraft();render();status(I18n.t('Alleen lokaal bewaard. Gebruik Deel per e-mail of Deel op GitHub om je bijdrage te delen.'));channel?.postMessage('changed');});};
    $('copy').onclick=()=>run(async()=>{
      await refresh();const round=state.rounds.find(r=>r.id===selection),rows=state.entries.filter(e=>e.round===selection);if(!rows.length)return;
      const text=markdown(round,rows);let copied=false;
      if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);copied=true;}catch{}}
      if(!copied){const field=document.createElement('textarea'),focus=document.activeElement;field.value=text;field.style.position='fixed';field.style.opacity='0';dialog.append(field);try{field.select();if(!document.execCommand('copy'))throw Error('Kopiëren is niet beschikbaar in deze browser');}finally{field.remove();focus?.focus();}}
      status(I18n.value(I18n.ui('Ronde gekopieerd. Je kunt alle opmerkingen nu plakken.','Ronde gekopieerd. Je kunt alle opmerkingen nu plakken.')));
    });
    $('download').onclick=()=>run(async()=>{
      await refresh();const round=state.rounds.find(r=>r.id===selection),rows=state.entries.filter(e=>e.round===selection);
      const blob=new Blob([markdown(round,rows)],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='Bugs en Requests-'+round.created.replace(/[:.]/g,'-')+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
      status('Download gestart. Controleer je Downloads voordat je het document deelt.');
    });
    $('new').onclick=()=>{if(!confirm(I18n.value(I18n.ui("Begin een nieuwe, lege ronde? De vorige ronde blijft hier beschikbaar om opnieuw te downloaden.",'Begin een nieuwe, lege ronde? De vorige ronde blijft hier beschikbaar om opnieuw te downloaden.'))))return;
      run(async()=>{state=await transact('new');selection=state.active;render();status('Nieuwe ronde gestart. Vorige opmerkingen vind je onder Eerdere ronde.');channel?.postMessage('changed');});};
    if(window.BroadcastChannel){channel=new BroadcastChannel('gk-publieke-feedback-updates');channel.onmessage=()=>{if(dialog.open&&!busy)run(refresh);};}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
