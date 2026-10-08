"use strict";
window.WerkplaatsOvergangen=(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const nativeNavigation=location.protocol!=='file:'&&'onpageswap' in window&&CSS.supports('view-transition-name','none');
 document.documentElement.dataset.werkplaatsMotion=nativeNavigation?'native':'local';
 let departure;
 function reset(){departure?.cancel();departure=null;}
 async function leave(){
  if(reduced.matches||nativeNavigation||!document.body?.animate)return;
  reset();departure=document.body.animate([{opacity:1},{opacity:.55}],{duration:110,easing:'ease-out',fill:'forwards'});
  try{await departure.finished;}catch{}
 }
 function soften(element){
  if(reduced.matches||!element?.isConnected||!element.animate)return;
  element.animate([{opacity:.7},{opacity:1}],{duration:150,easing:'ease-out'});
 }
 addEventListener('pageshow',reset);
 reduced.addEventListener('change',()=>{if(reduced.matches)reset();});
 document.addEventListener('DOMContentLoaded',()=>{
  const pending=new Set();let frame;
  new MutationObserver(records=>{
   for(const record of records){
    const target=record.target;
    if(record.type==='childList'&&target instanceof Element&&target.matches('dialog[open],#content'))pending.add(target);
   }
   if(!pending.size||frame)return;
   frame=requestAnimationFrame(()=>{frame=null;for(const element of pending)soften(element);pending.clear();});
  }).observe(document.body,{childList:true,subtree:true});
 });
 return {leave,reset};
})();
