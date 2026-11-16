/* Keep the common heading compact; conversion controls remain owned by the module. */
'use strict';
document.addEventListener('DOMContentLoaded',()=>{
 const module=document.getElementById('omvormen-app'),privacy=document.getElementById('omvormen-privacy'),jump=document.getElementById('omvormen-results-jump');
 privacy.onclick=()=>module.querySelector('button[data-act="settings"]')?.click();
 jump.onclick=()=>{const results=module.querySelector('#results');if(!results||results.hidden)return;results.scrollIntoView({block:'start'});const heading=results.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}};
 function update(){const results=module.querySelector('#results'),heading=results?.querySelector('h2');jump.hidden=!results||results.hidden;const count=heading?.textContent.match(/\d+/)?.[0];jump.textContent='Resultaten'+(count?' ('+count+')':'');}
 Promise.resolve(window.Omvormen?.ready).then(()=>{privacy.disabled=false;return window.WerkplaatsOmvormen?.ready;}).then(update).catch(()=>{});
 document.addEventListener('omvormen-gewijzigd',update);
 function nativeStatus(){const strip=document.querySelector('.workspace-strip'),status=document.getElementById('desktop-save-status');if(strip&&status&&!strip.contains(status))strip.prepend(status);}
 Promise.resolve(window.WerkplaatsDesktop?.started).then(nativeStatus).catch(()=>{});
 document.addEventListener('werkruimte-klaar',nativeStatus);
});
