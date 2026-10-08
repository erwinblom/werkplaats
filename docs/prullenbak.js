"use strict";
window.Prullenbak=(()=>{
 const fields={Bronnenkast:'items',Abonnementen:'items',Publicatieplanner:'items',Projectbord:'tasks',Contacten:'contacts',Uren:'entries',Kasboek:'entries',Offerte:'quotes',Ping:'invoices'};
 const names={Notities:'Notitie',Werkbank:'Document',Bronnenkast:'Bron',Abonnementen:'Abonnement',Publicatieplanner:'Project of activiteit',Projectbord:'Taak',Contacten:'Contact',Uren:'Urenregistratie',Kasboek:'Boeking',Offerte:'Offerte',Ping:'Conceptfactuur',Gesprek:'Gespreksnotitie'};
 const label=item=>item.title||item.name||item.party||item.description||item.client||item.text?.slice(0,100)||'Zonder titel';
 function add(shared,tool,item,extra={}){
  if(!item)throw Error(I18n.value(I18n.ui("Het item is niet meer beschikbaar.",'Het item is niet meer beschikbaar.')));
  const entry={id:crypto.randomUUID(),tool,label:label(item),deletedAt:new Date().toISOString(),item:structuredClone(item),...extra};
  shared.trash=shared.trash||[];shared.trash.push(entry);return entry;
 }
 async function archive(tool,item,extra){let entry;await BewaarAlles.updateShared(shared=>{entry=add(shared,tool,item,extra);});return entry;}
 async function discard(id){await BewaarAlles.updateShared(shared=>{shared.trash=(shared.trash||[]).filter(entry=>entry.id!==id);});}
 async function remove(tool,item,action,extra){
  if(window.GereedschapskistMode?.example)return action();
  return navigator.locks.request('werkplaats-prullenbak-mutatie',async()=>{
   const entry=await archive(tool,item,extra);
   try{const result=await action();if(result===false||result?.ok===false){await discard(entry.id);return result??true;}document.dispatchEvent(new Event('prullenbak-gewijzigd'));return result??true;}
   catch(error){throw error;}
  });
 }
 async function restore(id){
  return navigator.locks.request('werkplaats-prullenbak-mutatie',async()=>{
   const shared=await BewaarAlles.readShared(),entry=(shared.trash||[]).find(item=>item.id===id);if(!entry)throw Error(I18n.value(I18n.ui("Dit item staat niet meer in de prullenbak.",'Dit item staat niet meer in de prullenbak.')));
   if(entry.tool==='Notities'){
    await BewaarAlles.updateShared(value=>{const current=(value.trash||[]).find(item=>item.id===id);if(!current)throw Error(I18n.value(I18n.ui("Dit item is al teruggezet.",'Dit item is al teruggezet.')));value.writingNotes=value.writingNotes||[];if(value.writingNotes.some(item=>item.id===entry.item.id))throw Error(I18n.value(I18n.ui("Deze notitie bestaat al. Er wordt niets overschreven.",'Deze notitie bestaat al. Er wordt niets overschreven.')));value.writingNotes.push({...entry.item,updatedAt:new Date().toISOString()});value.trash=value.trash.filter(item=>item.id!==id);});
   }else{
    if(entry.tool==='Werkbank'&&entry.external){
     if(!window.PrullenbakDocumenten)throw Error(I18n.value(I18n.ui("Open Schrijven en kies daar Instellingen → Prullenbak om het bestand in zijn oorspronkelijke map terug te zetten.",'Open Schrijven en kies daar Instellingen → Prullenbak om het bestand in zijn oorspronkelijke map terug te zetten.')));
     await PrullenbakDocumenten.restore(entry.item);
    }else{
     const tool=entry.tool==='Gesprek'?'Contacten':entry.tool;
     if(!fields[tool]&&tool!=='Werkbank')throw Error(I18n.value(I18n.ui("Dit soort item kan nog niet worden hersteld.",'Dit soort item kan nog niet worden hersteld.')));
     await BewaarAlles.updateTool(tool,(data,session)=>{
      if(tool==='Werkbank'){session.documents=session.documents||[];if(session.documents.some(item=>item.path===entry.item.path||item.name.toLocaleLowerCase('nl')===entry.item.name.toLocaleLowerCase('nl')))throw Error(I18n.value(I18n.ui("Dit document bestaat al. Er wordt niets overschreven.",'Dit document bestaat al. Er wordt niets overschreven.')));session.documents.push(structuredClone(entry.item));}
      else if(entry.tool==='Gesprek'){const contact=data.contacts.find(item=>item.id===entry.parentId);if(!contact)throw Error(I18n.value(I18n.ui("Zet eerst het bijbehorende contact terug.",'Zet eerst het bijbehorende contact terug.')));if(contact.conversations.some(item=>item.id===entry.item.id))throw Error(I18n.value(I18n.ui("Deze gespreksnotitie bestaat al.",'Deze gespreksnotitie bestaat al.')));contact.conversations.push(structuredClone(entry.item));}
      else{const list=data[fields[tool]];if(!Array.isArray(list))throw Error(I18n.value(I18n.ui("De gegevens van deze tool zijn niet beschikbaar.",'De gegevens van deze tool zijn niet beschikbaar.')));if(list.some(item=>item.id===entry.item.id))throw Error(I18n.value(I18n.ui("Dit item bestaat al. Er wordt niets overschreven.",'Dit item bestaat al. Er wordt niets overschreven.')));list.push(structuredClone(entry.item));}
     });
    }
    await discard(id);
   }
   window.Werkstatus?.changed();document.dispatchEvent(new Event('prullenbak-gewijzigd'));
  });
 }
 function confirmMove(message){
  return new Promise(resolve=>{
   const dialog=document.createElement('dialog');dialog.className='my-tools-dialog';I18n.attribute(dialog,'aria-label',I18n.ui("Naar prullenbak",'Naar prullenbak'));
   const heading=document.createElement('h2');I18n.assign(heading,I18n.ui("Naar prullenbak",'Naar prullenbak'),"textContent");const copy=document.createElement('p');copy.textContent=message;
   const cancel=document.createElement('button');I18n.assign(cancel,I18n.ui("Annuleer",'Annuleer'),"textContent");cancel.type='button';const yes=document.createElement('button');I18n.assign(yes,I18n.ui("Naar prullenbak",'Naar prullenbak'),"textContent");yes.type='button';let accepted=false;
   cancel.onclick=()=>dialog.close();yes.onclick=()=>{accepted=true;dialog.close();};dialog.addEventListener('close',()=>{dialog.remove();resolve(accepted);},{once:true});dialog.append(heading,copy,cancel,yes);document.body.append(dialog);dialog.showModal();cancel.focus();
  });
 }
 async function open(parent){
  const shared=await BewaarAlles.readShared();const dialog=document.createElement('dialog');dialog.className='my-tools-dialog';dialog.setAttribute('aria-labelledby','trash-title');
  const heading=document.createElement('h2');heading.id='trash-title';I18n.assign(heading,I18n.ui("Prullenbak",'Prullenbak'),"textContent");const hint=document.createElement('p');I18n.assign(hint,I18n.ui("Zet verwijderde items terug met hun gegevens en koppelingen. Gebruik Bewaar alles om ook de prullenbak in je werkmap te bewaren.",'Zet verwijderde items terug met hun gegevens en koppelingen. Gebruik Bewaar alles om ook de prullenbak in je werkmap te bewaren.'),"textContent");
  const list=document.createElement('div');list.className='trash-list';const status=document.createElement('p');status.setAttribute('role','status');const close=document.createElement('button');close.type='button';I18n.assign(close,(parent?I18n.ui("Terug naar instellingen",'Terug naar instellingen'):I18n.ui("Sluit",'Sluit')),"textContent");close.onclick=()=>dialog.close();
  function draw(entries){list.replaceChildren();if(!entries.length){const empty=document.createElement('p');I18n.assign(empty,I18n.ui("De prullenbak is leeg.",'De prullenbak is leeg.'),"textContent");list.append(empty);}
   for(const entry of [...entries].sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt))){const row=document.createElement('div');row.className='trash-row';const copy=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('small');name.textContent=entry.label;meta.textContent=(names[entry.tool]||entry.tool)+' · '+new Date(entry.deletedAt).toLocaleString(I18n.locale())+(entry.external?' · '+entry.item.path:'');copy.append(name,meta);const button=document.createElement('button');button.type='button';I18n.assign(button,I18n.ui("Zet terug",'Zet terug'),"textContent");I18n.attribute(button,'aria-label',I18n.ui("Zet terug: {0}",'Zet terug: '+entry.label));button.onclick=async()=>{button.disabled=true;try{await restore(entry.id);I18n.assign(status,I18n.ui("Teruggezet. Gebruik Bewaar alles voor je werkmap.",'Teruggezet. Gebruik Bewaar alles voor je werkmap.'),"textContent");draw((await BewaarAlles.readShared()).trash||[]);}catch(error){status.textContent=error.message;button.disabled=false;}};row.append(copy,button);list.append(row);}
  }
  draw(shared.trash||[]);dialog.append(heading,hint,list,status,close);document.body.append(dialog);dialog.addEventListener('close',()=>{dialog.remove();if(parent?.isConnected)parent.showModal();},{once:true});if(parent?.open)parent.close();dialog.showModal();close.focus();
 }
 return {add,archive,remove,restore,open,confirm:confirmMove};
})();
