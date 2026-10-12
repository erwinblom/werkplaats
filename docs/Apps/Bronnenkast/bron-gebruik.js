'use strict';
window.BronGebruik=(()=>{
 const choices=[['lezen','Lezen'],['luisteren','Luisteren'],['kijken','Kijken'],['proberen','Proberen'],['inspireren','Inspireren']];
 const ids=choices.map(([id])=>id);
 function normalize(value){
  if(value===undefined)return [];
  if(!Array.isArray(value)||value.length>5||value.some(id=>!ids.includes(id)))throw Error(I18n.t('Ongeldige gebruikskeuze bij een bron.'));
  return [...new Set(value)];
 }
 function matches(item,selected){return !selected||normalize(item.uses).includes(selected);}
 function label(id){return I18n.t(choices.find(([key])=>key===id)?.[1]||id);}
 function isOpenSource(tag){return /^open[ -]source$/i.test(tag.trim());}
 function neighbor(items,id,direction){const index=items.findIndex(item=>item.id===id);if(index<0||![-1,1].includes(direction))return null;return items[index+direction]||null;}
 function canBrowse(event){return ['ArrowLeft','ArrowRight'].includes(event.key)&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.target?.closest?.('input,textarea,select,[contenteditable],iframe,video,audio');}
 return {choices,normalize,matches,label,isOpenSource,neighbor,canBrowse};
})();
