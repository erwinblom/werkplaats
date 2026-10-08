'use strict';
window.Belastingtarieven=(()=>{
 const defaults=[{id:'high',name:'Hoog',rate:21},{id:'low',name:'Laag',rate:9},{id:'zero',name:'Nultarief',rate:0},{id:'exempt',name:'Vrijgesteld',rate:null},{id:'shifted',name:'Verlegd',rate:null}];
 let current=structuredClone(defaults);
 function normalize(value){
  const source=Array.isArray(value)?value:defaults;
  return defaults.map((fallback,index)=>{const item=source.find(v=>v?.id===fallback.id)||source[index]||fallback,name=typeof item.name==='string'&&item.name.trim()?item.name.trim().slice(0,60):fallback.name;if(fallback.rate===null)return {id:fallback.id,name,rate:null};const rate=Number(item.rate);return {id:fallback.id,name,rate:Number.isFinite(rate)&&rate>=0&&rate<=100?Math.round(rate*100)/100:fallback.rate};});
 }
 const list=()=>structuredClone(current),numeric=()=>list().filter(item=>item.rate!==null),find=id=>list().find(item=>item.id===id);
 const optionHTML=(selected,include=[])=>([...numeric(),...include.filter(rate=>!numeric().some(item=>item.rate===rate)).map(rate=>({id:'legacy',name:'Eerder gebruikt',rate}))]).map(item=>`<option value="${item.rate}" ${Number(selected)===item.rate?'selected':''}>${item.name} — ${String(item.rate).replace('.',',')}%</option>`).join('');
 const ready=(async()=>{await window.BewaarAllesReady;await window.BewaarAlles?.ready;try{current=normalize((await window.BewaarAlles.readShared()).taxRates);}catch{}document.dispatchEvent(new CustomEvent('belastingtarieven-gewijzigd'));return list();})();
 async function save(value){current=normalize(value);await window.BewaarAlles.updateShared(shared=>{shared.taxRates=list();});document.dispatchEvent(new CustomEvent('belastingtarieven-gewijzigd'));return list();}
 return {defaults:()=>structuredClone(defaults),normalize,list,numeric,find,optionHTML,save,ready};
})();
