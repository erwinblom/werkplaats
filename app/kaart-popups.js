'use strict';
(()=>{
 const tool=document.body.dataset.tool;
 if(tool==='Uren'){
  document.getElementById('rows').addEventListener('click',event=>{
   if(event.target.closest('button,a,input,label,select'))return;
   event.target.closest('article.entry')?.querySelector('button[data-view]')?.click();
  });
  return;
 }
 if(!['Contacten','Kasboek'].includes(tool))return;
 const contacts=tool==='Contacten',container=document.getElementById(contacts?'cards':'rows');
 let active=null;
 function dismiss(){
  if(!active)return;
  const {parent,nextSibling,details,dialog}=active;active=null;
  if(details){details.open=false;details.hidden=true;parent.insertBefore(details,nextSibling?.parentNode===parent?nextSibling:null);}
  if(dialog.open)dialog.close();dialog.remove();
 }
 function prepare(){
  for(const row of container.querySelectorAll(contacts?'article.card':'article.entry')){
   const details=contacts?row.querySelector('.contact-details'):null;
   const title=row.querySelector(contacts?'h2':'.entry-main>strong');
   if(!title||contacts&&!details||!contacts&&!row.dataset.bookingId)continue;
   row.classList.add('record-popup-ready');
   if(details){details.open=false;details.hidden=true;}
   if(title.querySelector('.record-open'))continue;
   const button=document.createElement('button');button.type='button';button.className='record-open';button.dataset.recordOpen=contacts?details.dataset.contactDetails:row.dataset.bookingId;
   button.textContent=title.textContent;button.setAttribute('aria-label',(contacts?'Open contact: ':'Open inkomst of uitgave: ')+title.textContent);
   title.replaceChildren(button);
  }
 }
 function open(id){
  dismiss();
  const row=[...container.querySelectorAll(contacts?'article.card':'article.entry')].find(row=>contacts?row.querySelector('.contact-details')?.dataset.contactDetails===id:row.dataset.bookingId===id);
  if(!row)return;
  const details=contacts?row.querySelector('.contact-details'):null;
  const item=contacts?data.contacts.find(entry=>entry.id===id):data.entries.find(entry=>entry.id===id);
  if(!item)return;
  const dialog=document.createElement('dialog');dialog.className='record-detail-dialog';dialog.setAttribute('aria-labelledby','record-detail-title');
  const heading=document.createElement('div');heading.className='record-detail-heading';
  const title=document.createElement('h2');title.id='record-detail-title';title.textContent=contacts?item.name:item.party;
  const close=document.createElement('button');close.type='button';close.className='record-detail-close';I18n.assign(close,I18n.ui("×",'×'),"textContent");I18n.attribute(close,'aria-label',I18n.ui("Sluit",'Sluit'));close.onclick=dismiss;
  heading.append(title,close);dialog.append(heading);
  const meta=document.createElement('p');meta.className='record-detail-meta';
  meta.textContent=contacts?[item.organization,item.role,item.email,item.phone].filter(Boolean).join(' · '):[pretty(item.date),item.type==='income'?'Inkomst':'Uitgave',item.category,(item.type==='income'?'+ ':'− ')+euro(item.cents)].join(' · ');
  dialog.append(meta);
  if(contacts&&item.address){const address=document.createElement('p');address.className='record-detail-address';address.textContent=item.address;dialog.append(address);}
  let parent=null,nextSibling=null;
  if(contacts){parent=details.parentElement;nextSibling=details.nextSibling;details.hidden=false;details.open=true;dialog.append(details);}
  else{
   const body=document.createElement('div');body.className='booking-details';
   const description=document.createElement('p');description.textContent=item.description;body.append(description);
   const vat=document.createElement('p');I18n.assign(vat,(item.sourceInvoiceId?I18n.ui("Btw staat bij de gekoppelde factuur",'Btw staat bij de gekoppelde factuur'):(item.vatCents===null||item.vatCents===undefined?I18n.ui("Btw nog niet gecontroleerd",'Btw nog niet gecontroleerd'):I18n.ui("Btw {0}{1} · factuurdatum {2}",'Btw '+euro(item.vatCents)+(item.vatRate!==null&&item.vatRate!==undefined?' · '+item.vatRate+'%':'')+' · factuurdatum '+pretty(item.vatDate||item.date)))),"textContent");body.append(vat);
   if(item.receipt){const receipt=document.createElement('button');receipt.type='button';receipt.className='receipt-button';receipt.dataset.receipt=item.id;I18n.assign(receipt,I18n.ui("↓ Bon: {0}",'↓ Bon: '+item.receipt.name),"textContent");body.append(receipt);}
   else{const receipt=document.createElement('p');receipt.className='no-receipt';I18n.assign(receipt,I18n.ui("Geen bon toegevoegd",'Geen bon toegevoegd'),"textContent");body.append(receipt);}
   dialog.append(body);
  }
  const actions=document.createElement('div');actions.className='record-detail-actions wp-actions';
  if(contacts){const note=document.createElement('button');note.type='button';I18n.assign(note,I18n.ui("+ Notitie",'+ Notitie'),"textContent");note.onclick=()=>{dismiss();row.querySelector('[data-conversation]')?.click();};actions.append(note);}
  const editButton=document.createElement('button');editButton.type='button';I18n.assign(editButton,I18n.ui("Bewerk",'Bewerk'),"textContent");editButton.onclick=()=>{dismiss();edit(id);};
  const done=document.createElement('button');done.type='button';I18n.assign(done,I18n.ui("Sluit",'Sluit'),"textContent");done.onclick=dismiss;
  actions.append(done,editButton);dialog.append(actions);row.append(dialog);
  active={row,parent,nextSibling,details,dialog};dialog.addEventListener('close',()=>{if(active?.dialog===dialog)dismiss();});dialog.showModal();close.focus();
 }
 const oldRender=render;
 render=function(...args){dismiss();oldRender(...args);prepare();};
 prepare();
 container.addEventListener('click',event=>{
  const button=event.target.closest('.record-open');if(button){open(button.dataset.recordOpen);return;}
  if(event.target.closest('dialog,button,a,input,label,summary'))return;
  const row=event.target.closest(contacts?'article.card':'article.entry');
  const id=contacts?row?.querySelector('.contact-details')?.dataset.contactDetails:row?.dataset.bookingId;
  if(id)open(id);
 });
})();
