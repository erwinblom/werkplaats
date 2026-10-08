'use strict';
// Reuse existing controls and event handlers; only their placement changes.
document.addEventListener('DOMContentLoaded',()=>{
 const header=document.querySelector('.brandbar,body>header'),status=document.getElementById('file-status');
 if(!header||!status)return;
 document.body.classList.add('compact-tools');
 const strip=document.createElement('div');strip.className='workspace-strip';header.after(strip);strip.append(status);
 const toggle=document.createElement('button');toggle.id='workspace-help-toggle';toggle.type='button';I18n.assign(toggle,I18n.ui("Hulp",'Hulp'),"textContent");toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','workspace-help');strip.append(toggle);
 const panel=document.createElement('section');panel.id='workspace-help';panel.hidden=true;I18n.attribute(panel,'aria-label',I18n.ui("Hulp bij deze tool",'Hulp bij deze tool'));strip.after(panel);
 toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));};
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}});
 const banner=document.querySelector('.example-mode'),switcher=document.getElementById('workspace-switch');
 if(banner){if(GereedschapskistMode.example&&switcher)strip.insertBefore(switcher,toggle);panel.append(banner);}
 const help=document.querySelector('.save-help');if(help)panel.append(help);
 const badge=document.querySelector('.suite-badge');if(badge)panel.append(badge);
 const links=document.createElement('p');links.innerHTML="<a href=\"../../Uitleg.html\"><span data-i18n=\"Uitleg en gebruik\">Uitleg en gebruik</span></a> · <a href=\"../../Over.html\"><span data-i18n=\"Over de Werkplaats\">Over de Werkplaats</span></a>";panel.append(links);
 function placeWorkmap(){const map=document.getElementById('werkmap');if(!map)return false;if(!map.closest('.workspace-management')&&!panel.contains(map)){panel.prepend(map);map.open=true;}
 const saveAll=document.getElementById('wm-backup');
 if(GereedschapskistMode.example&&!document.getElementById('save-all-preview')){const preview=document.createElement('button');preview.id='save-all-preview';preview.type='button';I18n.assign(preview,I18n.ui("Bewaar alles",'Bewaar alles'),"textContent");preview.disabled=true;I18n.assign(preview,I18n.ui("Kies Naar mijn eigen werk om je eigen werk te bewaren.",'Kies Naar mijn eigen werk om je eigen werk te bewaren.'),"title");strip.insertBefore(preview,toggle);}
 else if(saveAll&&!GereedschapskistMode.example){if(saveAll.parentElement!==strip)strip.insertBefore(saveAll,toggle);saveAll.hidden=false;I18n.assign(saveAll,I18n.ui("Bewaar je werk uit alle tools, inclusief onvoltooide invoer.",'Bewaar je werk uit alle tools, inclusief onvoltooide invoer.'),"title");}
 const message=document.getElementById('wm-message');if(message&&message.parentElement!==panel.parentElement)panel.after(message);return true;}
 if(!placeWorkmap()){const observer=new MutationObserver(()=>{if(placeWorkmap())observer.disconnect()});observer.observe(document.body,{childList:true,subtree:true});}
 const offerFilter=document.querySelector('body[data-tool=Offerte] #filter');if(offerFilter){const wrap=document.createElement('div');wrap.className='filter-strip';const label=document.querySelector('label[for=filter]');offerFilter.before(wrap);if(label)wrap.append(label);wrap.append(offerFilter);}
 const main=document.querySelector('main'),heading=main?.querySelector(':scope>.heading,:scope>.intro');
 if(heading){
  heading.classList.add('work-actions');
  if(!heading.querySelector('#board-name,#collection-name')){const brand=header.querySelector('.brand');if(brand){brand.setAttribute('role','heading');brand.setAttribute('aria-level','1');}}
  const intro=heading.firstElementChild;
  if(intro&&!intro.querySelector('#board-name,#collection-name')){intro.classList.add('compact-intro');panel.append(intro);}
  else if(intro){for(const p of intro.querySelectorAll('.eyebrow,p.intro'))panel.append(p);}
  const actions=document.getElementById('link-actions');if(actions){const group=heading.querySelector('.actions');if(group){while(actions.firstChild)group.prepend(actions.lastChild);actions.remove();}else heading.append(actions);}
 }
 const note=main?.querySelector(':scope>.banner');if(note)panel.append(note);
 for(const detail of main?.querySelectorAll(':scope>details')||[]){
  const title=detail.querySelector(':scope>summary')?.textContent||'';
  if(detail.classList.contains('help')||/^Bewaar|^Hoe werkt bewaren/.test(title))panel.append(detail);
 }
 const preview=document.querySelector('body[data-tool=Ping] .preview');if(preview){const actions=document.createElement('div');actions.className='link-actions';for(const id of ['invoice-bookkeeping','invoice-received','invoice-hours-receipt']){const b=document.getElementById(id);if(b)actions.append(b);}preview.append(actions);}
 const style=document.createElement('link');style.rel='stylesheet';style.href='../../compact.css?v=20261006-personal-title-1';document.head.insertBefore(style,document.querySelector('link[href*="blom-os-tokens.css"]'));
});
