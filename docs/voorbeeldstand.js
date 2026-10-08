 'use strict';
// Retain the storage interface used by the tools; only personal work is available.
window.GereedschapskistMode={example:false,key:k=>k,storage:{
 getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v),removeItem:k=>localStorage.removeItem(k)
},redirecting:false,ready:Promise.resolve(),forExport:data=>data,go:()=>GereedschapskistKeuze.choose('eigen')};
const legacyStyle=document.createElement('style');I18n.assign(legacyStyle,I18n.ui("[data-legacy-example]{display:none!important}",'[data-legacy-example]{display:none!important}'),"textContent");document.head.append(legacyStyle);
