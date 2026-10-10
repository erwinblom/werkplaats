"use strict";
window.WerkplaatsUiterlijk=(()=>{
 const base=new URL('.',document.currentScript.src),key='werkplaats-uiterlijk:'+base.href;
 const colors={red:['Rood','#c51d17'],blue:['Blauw','#175b94'],green:['Groen','#247047'],purple:['Paars','#743b91']};
 const desktops={
  erwin:['Erwin Grafisch','Zwart, grafische vormen en jouw accentkleur.'],
  calm:['Rustig','Een warm, stil vlak zonder versiering.'],
  paper:['Papier','Licht papier met een analoge structuur.'],
  grid:['Raster','Een helder technisch raster.'],
  night:['Nacht','Donker met licht en een accentlijn.'],
  outside:['Buiten','Een grafisch landschap met horizon.'],
  custom:['Eigen afbeelding','Je eigen foto of illustratie.']
 };
 const validImage=value=>typeof value==='string'&&/^data:image\/(?:jpeg|png|webp);base64,/i.test(value)&&value.length<=1400000;
 let current={name:'',color:'red',desktop:'erwin',customImage:'',desktopFit:'cover'},originalTitle;
 function normalize(value={}){return {name:typeof value.name==='string'?value.name.trim().slice(0,60):'',color:colors[value.color]?value.color:'red',desktop:desktops[value.desktop]?value.desktop:'erwin',customImage:validImage(value.customImage)?value.customImage:'',desktopFit:value.desktopFit==='contain'?'contain':'cover'};}
 function name(){return current.name||'Werkplaats';}
 function text(element,value){
  const nodes=[...element.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE);
  if(nodes.map(node=>node.textContent).join('').trim()===value)return;
  for(const node of nodes)node.remove();element.append(document.createTextNode(value));
 }
 function render(){
  for(const el of document.querySelectorAll('.suite-back'))text(el,name());
  const personal=document.querySelector('.wordmark-personal');if(personal){personal.hidden=!current.name;if(current.name)text(personal,current.name);}
  if(originalTitle===undefined&&document.readyState!=='loading')originalTitle=document.title;
  if(originalTitle!==undefined){const translated=window.I18n?.t(originalTitle)||originalTitle;const title=current.name?(originalTitle.startsWith('Werkplaats')?name():translated+' · '+name()):translated;if(document.title!==title)document.title=title;}
 }
 function apply(value){
  current=normalize(value);if(current.desktop==='custom'&&!current.customImage)current.desktop='erwin';const root=document.documentElement;root.style.setProperty('--wp-accent',colors[current.color][1]);root.style.setProperty('--red',colors[current.color][1]);root.style.setProperty('--accent',colors[current.color][1]);root.style.setProperty('--link',colors[current.color][1]);root.dataset.accent=current.color;root.dataset.desktop=current.desktop;
  if(current.desktop==='custom'){root.style.setProperty('--wp-desktop-image',`url("${current.customImage}")`);root.style.setProperty('--wp-desktop-size',current.desktopFit);}else{root.style.removeProperty('--wp-desktop-image');root.style.removeProperty('--wp-desktop-size');}
  try{localStorage.setItem(key,JSON.stringify(current));}catch{}
  render();
 }
 try{const cached=JSON.parse(localStorage.getItem(key)||'null');apply(cached||{});}catch{}
 document.addEventListener('taal-gewijzigd',render);
 document.addEventListener('DOMContentLoaded',()=>{render();const observer=new MutationObserver(render);observer.observe(document.body,{childList:true,subtree:true});});
 return {apply,normalize,colors,desktops,validImage,name,get value(){return {...current};}};
})();
