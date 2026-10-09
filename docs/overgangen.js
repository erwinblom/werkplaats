"use strict";
window.WerkplaatsOvergangen=(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const nativeNavigation=location.protocol!=='file:'&&'onpageswap' in window&&CSS.supports('view-transition-name','none');
 document.documentElement.dataset.werkplaatsMotion=nativeNavigation?'native':'local';
 let departure;
 function reset(){departure?.cancel();departure=null;}
 async function leave(){
  reset();
 }
 addEventListener('pageshow',reset);
 reduced.addEventListener('change',()=>{if(reduced.matches)reset();});
 return {leave,reset};
})();
