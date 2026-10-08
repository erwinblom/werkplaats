'use strict';
(()=>{
 function inboxQueue(items){const ids=items.filter(i=>i.category==='Inbox').map(i=>i.id);let index=0;return {get total(){return ids.length},get position(){return index+1},next(items){while(index<ids.length){const item=items.find(i=>i.id===ids[index]&&i.category==='Inbox');if(item)return item;index++;}return null;},advance(){index++;}};}
 if(typeof module!=='undefined'&&module.exports){module.exports={inboxQueue};return;}
 async function init(){
  await Werkmap.suiteReady;await BewaarAlles.ready;
  const form=$('form'),dialog=$('dialog'),submit=form.querySelector('.form-actions button.primary');
  let queue=null,baseline='',saving=false;
  const bar=document.createElement('div');bar.className='inbox-review-bar';bar.hidden=true;
  const progress=document.createElement('p');progress.setAttribute('role','status');
  const link=document.createElement('a');link.target='_blank';link.rel='noopener noreferrer';I18n.assign(link,I18n.ui("Open oorspronkelijke bron ↗",'Open oorspronkelijke bron ↗'),"textContent");bar.append(progress,link);$('form-title').after(bar);
  const connections=document.createElement('button');connections.type='button';I18n.assign(connections,I18n.ui("Koppelingen wijzigen",'Koppelingen wijzigen'),"textContent");bar.append(connections);
  connections.onclick=async()=>{try{await ProjectMaterials.chooseSourceLinks(editing);}catch(error){notify(error.message);}};

  const skip=document.createElement('button');skip.type='button';I18n.assign(skip,I18n.ui("Volgende (laat in Inbox)",'Volgende (laat in Inbox)'),"textContent");skip.hidden=true;submit.after(skip);
  const launch=document.createElement('button');launch.type='button';launch.id='inbox-process';I18n.assign(launch,I18n.ui("Inbox verwerken",'Inbox verwerken'),"textContent");$('categories').after(launch);
  const fields=()=>JSON.stringify([...form.querySelectorAll('input,textarea,select')].map(el=>[el.id,el.value,el.checked]));
  function count(){const n=data.items.filter(i=>i.category==='Inbox').length;I18n.assign(launch,I18n.ui("Inbox verwerken · {0}",'Inbox verwerken · '+n),"textContent");launch.disabled=!n;}
  const oldRender=render;render=function(...args){oldRender(...args);count();};count();
  let state='idle';
  function stop(){queue=null;state='idle';delete form.dataset.inboxProcessing;bar.hidden=true;skip.hidden=true;$('category').setCustomValidity('');I18n.assign(submit,(editing?I18n.ui("Bewaar",'Bewaar'):I18n.ui("Toevoegen",'Toevoegen')),"textContent");}
  function showEditor(item){
   state='edit';form.dataset.inboxProcessing='true';bar.hidden=false;skip.hidden=false;
   I18n.assign($('form-title'),I18n.ui("Inbox verwerken",'Inbox verwerken'),"textContent");I18n.assign(progress,I18n.ui("Bron {0} van {1} · {2} in Inbox",'Bron '+queue.position+' van '+queue.total+' · '+data.items.filter(i=>i.category==='Inbox').length+' in Inbox'),"textContent");
   const url=safeURL(item.url);link.hidden=!url;if(url)link.href=url;
   $('category').value='';$('category').setCustomValidity('');updateCategoryChoice();I18n.assign(submit,I18n.ui("Bewaar en volgende",'Bewaar en volgende'),"textContent");baseline=fields();$('category').focus();
  }
  const oldEdit=edit;
  edit=function(id=null){oldEdit(id);if(queue&&queue.next(data.items)?.id===id)showEditor(data.items.find(item=>item.id===id));};
  function next(){
   const item=queue?.next(data.items);
   if(!item){const remaining=data.items.filter(i=>i.category==='Inbox').length;stop();$('source-detail')?.close();resetFilters();notify(I18n.value((remaining?I18n.ui("Ronde klaar. {0} bronnen blijven in Inbox. Gebruik Bewaar alles.",'Ronde klaar. '+remaining+' bronnen blijven in Inbox. Gebruik Bewaar alles.'):I18n.ui("Inbox verwerkt. Gebruik Bewaar alles om je werk vast te leggen.",'Inbox verwerkt. Gebruik Bewaar alles om je werk vast te leggen.'))));return;}
   state='view';openSourceDetails(item.id);
   const detail=$('source-detail'),actions=detail.querySelector('.source-detail-actions');
   const review=document.createElement('p');review.className='inbox-view-progress';I18n.assign(review,I18n.ui("Inbox · bron {0} van {1}",'Inbox · bron '+queue.position+' van '+queue.total),"textContent");
   const advance=document.createElement('button');advance.type='button';advance.className='inbox-view-next';I18n.assign(advance,I18n.ui("Volgende (laat in Inbox)",'Volgende (laat in Inbox)'),"textContent");
   advance.onclick=()=>{queue.advance();next();};
   actions.before(review);actions.append(advance);
  }
  function startInbox(){if(document.querySelector('dialog[open]'))return;filter='cat:Inbox';$('search').value='';$('topic').value='';render();queue=inboxQueue(data.items);next();}
  launch.onclick=startInbox;
  // Start once; later arrivals must not interrupt someone already browsing.
  let initialReview=true;
  const hasSourceLink=new URL(location.href).searchParams.has('bron');
  function startInitialReview(){
   if(!initialReview||hasSourceLink||GereedschapskistMode.example)return;
   if(document.querySelector('dialog[open]')||Werkstatus.hasPending())return;
   if(data.items.some(item=>item.category==='Inbox')){initialReview=false;startInbox();}
  }
  const initialRender=render;render=function(...args){initialRender(...args);setTimeout(startInitialReview,0);};
  document.addEventListener('pointerdown',()=>{initialReview=false;},{once:true});
  document.addEventListener('keydown',()=>{initialReview=false;},{once:true});
  setTimeout(startInitialReview,0);
  skip.onclick=()=>{if(saving)return;if(fields()!==baseline&&!confirm(I18n.value(I18n.ui("Je wijzigingen aan deze bron overslaan? De bron blijft ongewijzigd in Inbox.",'Je wijzigingen aan deze bron overslaan? De bron blijft ongewijzigd in Inbox.'))))return;queue.advance();dialog.close();next();};
  $('category').addEventListener('input',()=>$('category').setCustomValidity(''));
  const oldSubmit=form.onsubmit;
  form.onsubmit=async event=>{
   if(!queue)return oldSubmit(event);event.preventDefault();if(saving)return;
   if(!$('category').value.trim()||$('category').value.trim().toLocaleLowerCase('nl')==='inbox'){$('category').setCustomValidity(I18n.value(I18n.ui("Kies een andere categorie om deze bron te verwerken.",'Kies een andere categorie om deze bron te verwerken.')));$('category').reportValidity();return;}
   if(!form.reportValidity())return;
   if($('source-project')?.disabled){notify(I18n.value(I18n.ui("De projectkeuze wordt nog geladen. Probeer het zo nog eens.",'De projectkeuze wordt nog geladen. Probeer het zo nog eens.')));return;}
   const id=editing;saving=true;submit.disabled=true;skip.disabled=true;
   try{await oldSubmit(event);if(!dialog.open&&data.items.some(i=>i.id===id&&i.category!=='Inbox')){queue.advance();next();}}
   finally{saving=false;submit.disabled=false;skip.disabled=false;}
  };
  dialog.addEventListener('close',()=>{if(state==='edit'&&!saving)stop();});
  document.addEventListener('close',event=>{if(event.target.id==='source-detail'&&state==='view')stop();},true);
  document.addEventListener('werkbestand-geopend',()=>{if(queue){$('source-detail')?.close();if(dialog.open)dialog.close();stop();}});
  const style=document.createElement('style');I18n.assign(style,I18n.ui("#inbox-process{margin:12px 0 20px;padding:10px 16px;font-weight:700}.inbox-review-bar{margin:16px 0 24px;padding:16px 20px;background:#f3f4f5;line-height:1.6}.inbox-review-bar[hidden]{display:none}.inbox-review-bar p{margin:0 0 8px}.inbox-review-bar a{font-weight:700}#form[data-inbox-processing] #delete{display:none}.inbox-view-progress{margin:18px 0 8px;font-size:13px;font-weight:700;color:#555}.inbox-view-next{margin-left:8px}",'#inbox-process{margin:12px 0 20px;padding:10px 16px;font-weight:700}.inbox-review-bar{margin:16px 0 24px;padding:16px 20px;background:#f3f4f5;line-height:1.6}.inbox-review-bar[hidden]{display:none}.inbox-review-bar p{margin:0 0 8px}.inbox-review-bar a{font-weight:700}#form[data-inbox-processing] #delete{display:none}.inbox-view-progress{margin:18px 0 8px;font-size:13px;font-weight:700;color:#555}.inbox-view-next{margin-left:8px}'),"textContent");document.head.append(style);
 }
 init().catch(error=>console.error('Inbox verwerken:',error));
})();
