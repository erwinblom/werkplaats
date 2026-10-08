'use strict';
window.I18n=(()=>{
 const base=new URL('.',document.currentScript.src),cacheKey='werkplaats-taal:'+base.href;
 const dictionary=window.WerkplaatsVertalingen||{},records=new Set(),markerRecords=new WeakMap();let language='nl',rendering=false;
 const locale=()=>language==='en'?'en-GB':'nl-NL';
 function t(source){const text=String(source??''),key=text.trim();return language==='en'&&Object.hasOwn(dictionary,key)?text.slice(0,text.indexOf(key))+dictionary[key]+text.slice(text.indexOf(key)+key.length):text;}
 const ui=(key,raw)=>({__werkplaatsUI:true,key,raw:String(raw??'')});
 function format(key,raw){if(language!=='en'||!Object.hasOwn(dictionary,key.trim()))return raw;const translated=dictionary[key.trim()];if(!/\{\d+\}/.test(key))return t(raw);const parts=key.split(/(\{\d+\})/),indexes=[];const regex=parts.map(part=>{if(/^\{\d+\}$/.test(part)){indexes.push(Number(part.slice(1,-1)));return '([\\s\\S]*?)';}return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('');const match=raw.match(new RegExp('^'+regex+'$'));if(!match)return raw;const args={};indexes.forEach((id,i)=>args[id]=match[i+1]);return translated.replace(/\{(\d+)\}/g,(m,id)=>args[id]??m);}
 const labels=source=>new Proxy(source,{get:(target,key)=>typeof target[key]==='string'?t(target[key]):target[key]});
 const attribute=(element,name,input)=>assign(element,input,({'aria-label':'ariaLabel','aria-description':'ariaDescription'})[name]||name);
 const value=input=>input?.__werkplaatsUI?format(input.key,input.raw):input;
 function writeProperty(element,property,next){
  if(property==='textContent'&&element.childNodes){const textNodes=[...element.childNodes].filter(node=>node.nodeType===3);if(textNodes.length===1&&textNodes[0].textContent===element.textContent){textNodes[0].textContent=next;return;}}
  element[property]=next;
 }
 function assign(element,input,property='textContent'){
  for(const record of records)if((record.owner===element||record.element===element)&&record.property===property)records.delete(record);
  if(!input?.__werkplaatsUI){element[property]=input;return input;}
  const record={element,property,key:input.key,raw:input.raw,last:format(input.key,input.raw)};if(element[property]!==record.last)writeProperty(element,property,record.last);if(property==='textContent'&&element.firstChild?.nodeType===3&&element.firstChild.textContent===record.last){record.owner=element;record.element=element.firstChild;}records.add(record);return record.last;
 }
 function mark(element,key){if(!element||typeof element!=='object'||!('textContent' in element))return element;if(element.tagName==='OPTION'&&!element.hasAttribute('value'))element.value=element.textContent;assign(element,ui(key,element.textContent));return element;}
 function node(source){return mark(document.createTextNode(source),String(source));}
 function renderMarkers(){
  if(rendering||!document.body)return;rendering=true;
  try{for(const element of document.querySelectorAll('[data-i18n],[data-i18n-title],[data-i18n-placeholder],[data-i18n-aria-label],[data-i18n-aria-description],[data-i18n-alt]')){
   let stored=markerRecords.get(element);if(!stored){stored={};markerRecords.set(element,stored);}
   for(const attr of ['textContent','title','placeholder','aria-label','aria-description','alt']){
    const key=element.getAttribute(attr==='textContent'?'data-i18n':'data-i18n-'+attr);if(key===null)continue;
    const current=attr==='textContent'?element.textContent:element.getAttribute(attr)||'';
    let record=stored[attr];if(!record||current!==record.last||record.key!==key){record={key,raw:current};stored[attr]=record;}
    record.last=format(key,record.raw);if(current!==record.last){if(attr==='textContent')element.textContent=record.last;else element.setAttribute(attr,record.last);}
   }
  }}finally{rendering=false;}
 }
 function refresh(){renderMarkers();for(const record of records){const {element,property}=record;if(!element.isConnected){records.delete(record);continue;}if(element[property]!==record.last){records.delete(record);continue;}record.last=format(record.key,record.raw);if(element[property]!==record.last)writeProperty(element,property,record.last);}}
 function set(next,notify=true){if(!['nl','en'].includes(next))throw Error('Unsupported interface language.');language=next;document.documentElement.lang=next;try{localStorage.setItem(cacheKey,next);}catch{}refresh();if(notify)document.dispatchEvent(new CustomEvent('taal-gewijzigd',{detail:next}));}
 try{const saved=localStorage.getItem(cacheKey);if(saved==='en')language='en';}catch{}document.documentElement.lang=language;
 document.addEventListener('DOMContentLoaded',()=>{refresh();const observer=new MutationObserver(renderMarkers);observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-i18n','title','placeholder','aria-label','aria-description','alt']});});
 return {t,ui,value,assign,attribute,labels,mark,node,set,locale,refresh,get language(){return language;}};
})();
