'use strict';
const $=id=>document.getElementById(id);
const sidepanel=document.body.classList.contains('sidepanel');
const CONTEXT_KEY='link-bewaren-context-v1';
let verzamelenUrl=null,dirty=false,captureId='',pendingCapture=null;

async function request(type,extra={}){const r=await chrome.runtime.sendMessage({type,...extra});if(!r?.ok)throw Error(r?.error||'Geen antwoord. Probeer opnieuw.');return r}
async function status(){
 const r=await request('status');
 $('count').textContent=`${r.pending} klaar voor Verzamelen · ${r.total} lokaal bewaard`;
 verzamelenUrl=r.home?.startsWith('file:')?r.home:null;
 $('open').disabled=!verzamelenUrl;
 $('location-label').textContent=verzamelenUrl?'Wijzig lokaal adres':'Koppel lokaal Verzamelen';
 $('location').open=!verzamelenUrl;
 if(verzamelenUrl)$('local-url').value=verzamelenUrl;
 const allowed=await chrome.extension.isAllowedFileSchemeAccess();
 $('access').textContent=allowed?'Toegang tot lokale bestanden staat aan.':'Zet bij deze extensie in Chrome ook ‘Toegang tot bestands-URL’s toestaan’ aan, zodat Verzamelen links kan ontvangen.';
}
function error(e){$('message').textContent=e.message}
async function activePage(){
 const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
 if(!/^https?:\/\//.test(tab?.url||'')){$('message').textContent='Open een webpagina of plak hieronder zelf een link. Een selectie kun je ook via rechtsklik naar dit paneel sturen.';return}
 const title=(tab.title||'').slice(0,180),url=tab.url;
 let quote='';
 try{const result=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>window.getSelection()?.toString()||''});quote=(result[0]?.result||'').slice(0,10000)}
 catch{$('message').textContent='Geselecteerde tekst kon niet worden gelezen. Je kunt zelf een citaat plakken of de rechtsklikactie gebruiken.'}
 if(captureId||dirty)return;
 $('title').value=title;$('url').value=url;$('quote').value=quote;
}
async function acceptCapture(capture){
 if(!capture?.id||capture.id===captureId||!/^https?:\/\//.test(capture.url||''))return false;
 if(dirty){pendingCapture=capture;$('incoming').hidden=false;return true}
 captureId=capture.id;pendingCapture=null;$('incoming').hidden=true;
 $('title').value=capture.title||capture.url;$('url').value=capture.url;$('quote').value=capture.quote||'';$('notes').value='';
 $('save').disabled=false;$('message').textContent=(capture.quote?'Citaat':'Pagina')+' klaar. Voeg eventueel een notitie toe en kies Bewaar link lokaal.';
 await chrome.storage.session.remove(CONTEXT_KEY);
 return true;
}
async function storedCapture(){const value=(await chrome.storage.session.get(CONTEXT_KEY))[CONTEXT_KEY];return acceptCapture(value)}

(async()=>{
 await status();
 if(sidepanel){
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='session'&&changes[CONTEXT_KEY]?.newValue)acceptCapture(changes[CONTEXT_KEY].newValue).catch(error)});
  if(!await storedCapture())await activePage();
  await storedCapture();
 }else await activePage();
})().catch(error);

$('capture').onsubmit=async event=>{
 event.preventDefault();$('save').disabled=true;
 try{
  await request('add',{item:{title:$('title').value,url:$('url').value,quote:$('quote').value,notes:$('notes').value}});
  dirty=false;$('message').textContent='Lokaal bewaard. Je link wacht op ontvangst in Verzamelen.';
  await status();
  if(pendingCapture)await acceptCapture(pendingCapture);
 }catch(e){error(e);$('save').disabled=false}
};
$('capture').addEventListener('input',()=>{dirty=true;$('save').disabled=false});
if(sidepanel)$('use-incoming').onclick=()=>{dirty=false;acceptCapture(pendingCapture).catch(error)};
$('open').onclick=()=>{if(verzamelenUrl)chrome.tabs.create({url:verzamelenUrl})};
$('location-form').onsubmit=async event=>{event.preventDefault();try{const r=await request('setHome',{url:$('local-url').value.trim()});verzamelenUrl=r.home;await status();$('location').open=false;$('message').textContent='Lokaal Verzamelen gekoppeld. Klik op Open lokaal Verzamelen.'}catch(e){error(e)}};
$('export').onclick=async()=>{try{const r=await request('export'),u=URL.createObjectURL(new Blob([JSON.stringify(r.data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='gereedschapskist-verzamelen-link-bewaren-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),30000);$('message').textContent='Download gestart. Controleer of je herstelbestand is opgeslagen.'}catch(e){error(e)}};
$('retry').onclick=async()=>{if(!confirm('Alle lokaal bewaarde links opnieuw aanbieden? Bestaande broncodes worden niet dubbel toegevoegd. Verwijderde links kunnen terugkomen.'))return;try{await request('retry');await status();$('message').textContent='Open Verzamelen om de links opnieuw te ontvangen.'}catch(e){error(e)}};
