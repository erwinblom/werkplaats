'use strict';
const path=decodeURIComponent(location.pathname);
if(window===window.top&&(location.origin==='https://erwinblom.github.io'&&['/gereedschapskist/Apps/Bronnenkast/Start Bronnenkast.html','/werkplaats/Apps/Bronnenkast/Start Bronnenkast.html'].includes(path)||location.protocol==='file:'&&['/Gereedschapskist/Apps/Bronnenkast/Start Bronnenkast.html','/Werkplaats/App/Apps/Bronnenkast/Start Bronnenkast.html','/Werkplaats/Bestanden/Apps/Bronnenkast/Start Bronnenkast.html'].some(suffix=>path.endsWith(suffix)))){
 chrome.runtime.sendMessage({type:'register'}).catch(()=>{});
 window.addEventListener('message',async event=>{
  const m=event.data;
  const file=location.protocol==='file:',target=file?'*':location.origin;
  if(event.source!==window||!(file?event.origin==='null'||event.origin===location.origin:event.origin===location.origin)||m?.channel!=='gk-link-local-request'||typeof m.id!=='string'||m.id.length>80||!['status','pending','ack'].includes(m.type))return;
  try{const result=await chrome.runtime.sendMessage({type:m.type,ids:m.ids});window.postMessage({channel:'gk-link-local-response',id:m.id,...result},target)}
  catch{window.postMessage({channel:'gk-link-local-response',id:m.id,ok:false,error:'De lokale extensie is opnieuw geladen. Ververs Verzamelen.'},target)}
 });
}
