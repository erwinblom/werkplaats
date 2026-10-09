/* Lokale feedback voor gebruikers; bereikbaar onder Hulp. */
(function () {
  'use strict';
  const tools = {Werkbank:'Schrijven',Ping:'Factureren',Projectbord:'Doen',Bronnenkast:'Verzamelen',Uren:'Uren schrijven',Contacten:'Contacten',Publicatieplanner:'Projecten',Offerte:'Offreren',Kasboek:'Boekhouden'};
  function toolFor(path) {
    const decoded = decodeURIComponent(path);
    for (const [folder, name] of Object.entries(tools)) if (decoded.includes('/Apps/' + folder + '/')) return name;
    return ({'Begin hier.html':'Startpagina','Over.html':'Over','Uitleg.html':'Uitleg','Link-bewaren.html':'Link bewaren'})[decoded.split('/').pop()] || 'Algemeen';
  }
  function contextFor(path, detail={}) {
    const tool=detail.dialogId==='all-search-dialog'?'Zoeken':detail.dialogId==='suite-settings'?'Instellingen':detail.dialogId==='my-tools-dialog'?'Mijn gereedschappen':toolFor(path);
    const layer=['Verzamelen','Schrijven','Zoeken'].includes(tool)?'Informatie':['Projecten','Doen','Contacten'].includes(tool)?'Organisatie':['Offreren','Factureren','Boekhouden'].includes(tool)?'Administratie':'Werkplaats';
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
  if (typeof module !== 'undefined' && module.exports) { module.exports = {toolFor, contextFor, markdown}; return; }
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
    I18n.assign(css,I18n.ui("\n#feedback-open{position:fixed;right:18px;bottom:18px;z-index:9000;background:#fff;color:#111;border:2px solid #111;border-radius:6px;padding:10px 14px;font:600 14px Arial,sans-serif;box-shadow:0 2px 8px #0002;cursor:pointer}\n\n.context-feedback-button{display:block!important;position:static!important;margin:16px 0 0 auto!important;padding:9px 12px!important;width:auto!important;background:#fff!important;color:#111!important;border:1px solid #111!important;font:600 14px Arial,sans-serif!important;cursor:pointer}#feedback-dialog *{box-sizing:border-box}#feedback-dialog h3{font:700 16px Arial,sans-serif;margin:0 0 4px}#feedback-dialog p{margin:8px 0}#feedback-dialog label{display:block;font-weight:bold;margin:12px 0 5px}#feedback-dialog textarea,#feedback-dialog select{display:block;width:100%;background:#fff;color:#111;border:1px solid #777;padding:9px;font:15px/1.5 Arial,sans-serif;border-radius:3px}#feedback-dialog textarea{min-height:120px;resize:vertical}#feedback-dialog .feedback-item{border-top:1px solid #ddd;padding:12px 0}#feedback-dialog .feedback-text{white-space:pre-wrap;overflow-wrap:anywhere}#feedback-dialog .feedback-muted{font-size:13px;color:#555}#feedback-dialog [hidden]{display:none!important}#feedback-dialog :focus-visible,#feedback-open:focus-visible{outline:3px solid #e32720;outline-offset:3px}@media print{#feedback-open,#feedback-dialog,.context-feedback-button{display:none!important}}",`
#feedback-open{position:fixed;right:18px;bottom:18px;z-index:9000;background:#fff;color:#111;border:2px solid #111;border-radius:6px;padding:10px 14px;font:600 14px Arial,sans-serif;box-shadow:0 2px 8px #0002;cursor:pointer}

.context-feedback-button{display:block!important;position:static!important;margin:16px 0 0 auto!important;padding:9px 12px!important;width:auto!important;background:#fff!important;color:#111!important;border:1px solid #111!important;font:600 14px Arial,sans-serif!important;cursor:pointer}#feedback-dialog *{box-sizing:border-box}#feedback-dialog h3{font:700 16px Arial,sans-serif;margin:0 0 4px}#feedback-dialog p{margin:8px 0}#feedback-dialog label{display:block;font-weight:bold;margin:12px 0 5px}#feedback-dialog textarea,#feedback-dialog select{display:block;width:100%;background:#fff;color:#111;border:1px solid #777;padding:9px;font:15px/1.5 Arial,sans-serif;border-radius:3px}#feedback-dialog textarea{min-height:120px;resize:vertical}#feedback-dialog .feedback-item{border-top:1px solid #ddd;padding:12px 0}#feedback-dialog .feedback-text{white-space:pre-wrap;overflow-wrap:anywhere}#feedback-dialog .feedback-muted{font-size:13px;color:#555}#feedback-dialog [hidden]{display:none!important}#feedback-dialog :focus-visible,#feedback-open:focus-visible{outline:3px solid #e32720;outline-offset:3px}@media print{#feedback-open,#feedback-dialog,.context-feedback-button{display:none!important}}`),"textContent");
    document.head.append(css);
    const launch=document.createElement('button');launch.id='feedback-open';launch.type='button';I18n.assign(launch,I18n.ui("Bugs en Requests",'Bugs en Requests'),"textContent");launch.hidden=true;document.body.append(launch);const place=()=>{const help=document.getElementById('workspace-help')||document.querySelector('.home-help-dialog .home-more');if(help&&launch.parentElement!==help){help.append(launch);launch.hidden=false;launch.style.position='static';}};place();new MutationObserver(place).observe(document.body,{childList:true,subtree:true});
    const dialog=document.createElement('dialog');dialog.id='feedback-dialog';dialog.setAttribute('aria-labelledby','feedback-title');
    dialog.innerHTML="<h2 id=\"feedback-title\"><span data-i18n=\"Bugs en Requests\">Bugs en Requests</span></h2><p id=\"feedback-tool\"></p><form id=\"feedback-form\"><label for=\"feedback-kind\"><span data-i18n=\"Soort\">Soort</span></label><select id=\"feedback-kind\"><option value=\"Bug\" data-i18n=\"Bug\">Bug</option><option value=\"Request\" data-i18n=\"Request\">Request</option></select><label for=\"feedback-text\"><span data-i18n=\"Je opmerking\">Je opmerking</span></label><textarea id=\"feedback-text\" required maxlength=\"20000\" placeholder=\"Wat gaat er mis, of wat zou je willen?\" data-i18n-placeholder=\"Wat gaat er mis, of wat zou je willen?\"></textarea><div class=\"feedback-actions wp-actions\"><button type=\"submit\" id=\"feedback-save\"><span data-i18n=\"Bewaar opmerking\">Bewaar opmerking</span></button><button type=\"button\" id=\"feedback-close\"><span data-i18n=\"Sluit\">Sluit</span></button></div></form><p id=\"feedback-status\" role=\"status\" aria-live=\"polite\"></p><hr><label for=\"feedback-round\"><span data-i18n=\"Opmerkingen bekijken\">Opmerkingen bekijken</span></label><select id=\"feedback-round\"></select><div class=\"feedback-actions wp-actions\"><button type=\"button\" id=\"feedback-copy\"><span data-i18n=\"Kopieer\">Kopieer</span></button><button type=\"button\" id=\"feedback-download\"><span data-i18n=\"Download document\">Download document</span></button><button type=\"button\" id=\"feedback-new\"><span data-i18n=\"Nieuwe ronde\">Nieuwe ronde</span></button></div><p class=\"feedback-muted\"><span data-i18n=\"Lokaal in deze browser bewaard, apart van je werkmap. Download het document om te delen of als eigen back-up. Een nieuwe ronde bewaart je eerdere opmerkingen.\">Lokaal in deze browser bewaard, apart van je werkmap. Download het document om te delen of als eigen back-up. Een nieuwe ronde bewaart je eerdere opmerkingen.</span></p><div id=\"feedback-list\"></div>";
    document.body.append(dialog);
    const $=id=>dialog.querySelector('#feedback-'+id);
    I18n.assign($('tool'),I18n.ui("Opmerking bij: {0}",'Opmerking bij: '+context.tool),"textContent");
    const bugTemplate='Ik deed:\n…\n\nIk verwachtte:\n…\n\nEr gebeurde:\n…';
    const draftContexts=new Map();
    let drafts={Bug:bugTemplate,Request:''};
    draftContexts.set(JSON.stringify(context),drafts);
    let draftKind=$('kind').value;
    function showDraft(){
      $('text').value=drafts[draftKind];
      $('text').rows=draftKind==='Bug'?9:5;
      I18n.assign($('text'),(draftKind==='Bug'?I18n.ui("Beschrijf wat je deed en wat er gebeurde.",'Beschrijf wat je deed en wat er gebeurde.'):I18n.ui("Wat zou je willen, en waarom?",'Wat zou je willen, en waarom?')),"placeholder");
    }
    $('text').addEventListener('input',()=>{drafts[draftKind]=$('text').value;});
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
        const item=document.createElement('section');item.className='feedback-item';
        const title=document.createElement('h3');title.textContent=currentName(row.tool)+' · '+row.kind;
        const text=document.createElement('p');text.className='feedback-text';text.textContent=row.text;
        item.append(title);if(row.layer||row.view){const detail=document.createElement('p');detail.className='feedback-muted';detail.textContent=[row.layer,row.view].filter(Boolean).join(' · ');item.append(detail);}item.append(text);$('list').append(item);
      }
      $('download').disabled=!rows.length;$('copy').disabled=!rows.length;
      $('new').disabled=!state.entries.some(e=>e.round===state.active);
    }
    async function refresh(){state=await transact('read');render();}
    async function run(fn){if(busy)return;busy=true;$('save').disabled=true;try{await fn();}catch(e){error(e);}finally{busy=false;$('save').disabled=false;}}
    function openFeedback(origin){
      drafts[draftKind]=$('text').value;
      context=contextFor(location.pathname,{dialogId:origin?.id,title:origin?.querySelector('h1,h2,h3')?.textContent.trim()||''});
      const key=JSON.stringify(context);if(!draftContexts.has(key))draftContexts.set(key,{Bug:bugTemplate,Request:''});drafts=draftContexts.get(key);showDraft();
      I18n.assign($('tool'),I18n.ui("Opmerking bij: {0}",'Opmerking bij: '+[context.layer,context.tool,context.view].filter(Boolean).join(' · ')),"textContent");
      status('');dialog.showModal();$('text').focus();run(refresh);
    }
    launch.onclick=()=>openFeedback(null);
    function attachContextButtons(){
      for(const host of document.querySelectorAll('dialog')){
        if(host===dialog||host.querySelector('[data-context-feedback]'))continue;
        const button=document.createElement('button');button.type='button';button.dataset.contextFeedback='';button.className='context-feedback-button';I18n.assign(button,I18n.ui("Bugs en Requests",'Bugs en Requests'),"textContent");button.onclick=()=>openFeedback(host);host.append(button);
      }
    }

    $('close').onclick=()=>dialog.close(); // Keep draft text when closing.
    $('round').onchange=()=>{selection=$('round').value;render();};
    $('form').onsubmit=e=>{e.preventDefault();const text=$('text').value.trim();if(!text||text===bugTemplate){status('Vul eerst je opmerking in.');$('text').focus();return;}
      run(async()=>{state=await transact('add',{...context,kind:$('kind').value,text});selection=state.active;drafts[draftKind]=draftKind==='Bug'?bugTemplate:'';showDraft();render();status('Bewaard bij '+context.tool+'.');channel?.postMessage('changed');});};
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
