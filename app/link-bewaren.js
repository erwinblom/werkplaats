'use strict';
(()=>{
 const receive=document.getElementById('receive-local-links'),base=new URL('.',document.currentScript.src).href;
 if(!receive)return;
 const help=document.createElement('a');help.href='../../Link-bewaren.html';I18n.assign(help,I18n.ui("Link Bewaren — lokaal",'Link Bewaren — lokaal'),"textContent");help.style.alignSelf='center';
 const message=document.createElement('p');message.id='link-local-message';message.setAttribute('role','status');
 document.querySelector('.heading').after(message);
 const helpSection=document.querySelector('.help');if(helpSection){const note=document.createElement('p');note.append(help);helpSection.append(note)}
 function request(type,extra={}){return new Promise((resolve,reject)=>{
  const file=location.protocol==='file:',target=file?'*':location.origin;
  const id=crypto.randomUUID(),timer=setTimeout(()=>{window.removeEventListener('message',onMessage);reject(Error(I18n.value((file?I18n.ui("Geen verbinding met Link Bewaren — lokaal. Laad de bijgewerkte extensie, zet in Chrome toegang tot bestands-URL’s aan en ververs Verzamelen.",'Geen verbinding met Link Bewaren — lokaal. Laad de bijgewerkte extensie, zet in Chrome toegang tot bestands-URL’s aan en ververs Verzamelen.'):I18n.ui("Geen verbinding met Link Bewaren — lokaal. Laad de bijgewerkte extensie en ververs Verzamelen.",'Geen verbinding met Link Bewaren — lokaal. Laad de bijgewerkte extensie en ververs Verzamelen.')))))},5000);
  function onMessage(e){if(e.source!==window||!(file?e.origin==='null'||e.origin===location.origin:e.origin===location.origin)||e.data?.channel!=='gk-link-local-response'||e.data.id!==id)return;clearTimeout(timer);window.removeEventListener('message',onMessage);if(!e.data.ok)reject(Error(I18n.value((e.data.error||I18n.ui("Ontvangst niet bevestigd.",'Ontvangst niet bevestigd.')))));else resolve(e.data)}
  window.addEventListener('message',onMessage);window.postMessage({channel:'gk-link-local-request',id,type,...extra},target);
 })}
 let receiving=false;
 const ready=(async()=>{await Werkmap.suiteReady;await BewaarAlles.ready;})();
 ready.catch(()=>{});
 function occupied(){return Werkstatus.hasPending()||Werkmap.busy||document.body.getAttribute('aria-busy')==='true'||!!document.querySelector('dialog[open]');}
 I18n.assign(receive,I18n.ui("Opnieuw proberen",'Opnieuw proberen'),"textContent");I18n.assign(receive,I18n.ui("Links komen automatisch in Inbox. Hiermee controleer je direct op nieuwe links.",'Links komen automatisch in Inbox. Hiermee controleer je direct op nieuwe links.'),"title");
 async function collect(manual=false){
  if(receiving||window.GereedschapskistMode?.example||(!manual&&document.hidden))return;
  receiving=true;receive.disabled=true;
  try{
   await ready;
   if(occupied()){if(manual)I18n.assign(message,I18n.ui("Links wachten veilig in de extensie. Rond eerst je invoer of bewaaractie af.",'Links wachten veilig in de extensie. Rond eerst je invoer of bewaaractie af.'),"textContent");return;}
   await navigator.locks.request('gk-link-ontvangst:'+base,{ifAvailable:true},async lock=>{
    if(!lock)return;
    let count=0;
    for(let batch=0;batch<10;batch++){
     if(occupied())break;
     const result=await request('pending');
     if(!Array.isArray(result.items)||result.items.length>100)throw Error(I18n.value(I18n.ui("Ongeldig antwoord van de extensie.",'Ongeldig antwoord van de extensie.')));
     const incoming=validate({format:'bronnenkast',version:1,items:result.items}).items;
     if(!incoming.length)break;
     if(occupied())break;
     const known=new Set(data.items.map(i=>i.id)),fresh=incoming.filter(i=>!known.has(i.id)).map(i=>({...i,category:'Inbox'}));
     if(fresh.length&&!change(d=>d.items.unshift(...fresh)))throw Error(I18n.value(I18n.ui("Niet toegevoegd. Controleer de melding in Verzamelen.",'Niet toegevoegd. Controleer de melding in Verzamelen.')));
     // Acknowledge only after both durable browser storage and the suite snapshot succeed.
     if(!cache||GereedschapskistMode.storage.getItem(KEY)!==JSON.stringify(data))throw Error(I18n.value(I18n.ui("Browseropslag niet bevestigd.",'Browseropslag niet bevestigd.')));
     await BewaarAlles.flush();
     await request('ack',{ids:incoming.map(i=>i.id)});
     count+=fresh.length;Werkstatus.update();
     if(count)I18n.assign(message,I18n.ui("{0} nieuwe links ontvangen in Inbox. Kies Inbox verwerken. Gebruik Bewaar alles voor je werkmap.",count+' nieuwe links ontvangen in Inbox. Kies Inbox verwerken. Gebruik Bewaar alles voor je werkmap.'),"textContent");
     if(incoming.length<100)break;
    }
    if(manual&&!count&&!occupied())I18n.assign(message,I18n.ui("Geen nieuwe links. Nieuwe links verschijnen automatisch in Inbox.",'Geen nieuwe links. Nieuwe links verschijnen automatisch in Inbox.'),"textContent");
   });
  }catch(e){I18n.assign(message,I18n.ui("Links nog niet ontvangen: {0} Ze blijven veilig in de extensie. Kies Meer → Opnieuw proberen.",'Links nog niet ontvangen: '+e.message+' Ze blijven veilig in de extensie. Kies Meer → Opnieuw proberen.'),"textContent");}
  finally{receiving=false;receive.disabled=false;}
 }
 receive.onclick=()=>collect(true);
 setTimeout(()=>collect(),700);
 window.addEventListener('focus',()=>collect());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)collect();});
 document.addEventListener('close',()=>setTimeout(()=>collect(),0),true);
 setInterval(()=>collect(),15000);
})();
