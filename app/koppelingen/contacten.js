'use strict';
(()=>{
 const K=Koppelingen;
 async function makeTask(contact){
  try{
   K.ready();K.fresh();
   let projects=[];
   try{projects=await Samenwerken.projects()}catch{}
   K.fresh();
   const defaultProject=projects.find(p=>p.name===contact.organization);
   const choices=projects.map(p=>"<option value=\""+(K.esc(p.id))+"\" "+(p.id===defaultProject?.id?' selected':'')+">"+(K.esc(p.name))+"</option>").join('');
   K.dialog('Taak voor '+contact.name,
    "<p><span data-i18n=\"Deze taak verschijnt in Doen en blijft aan dit contact gekoppeld.\">Deze taak verschijnt in Doen en blijft aan dit contact gekoppeld.</span></p><label><span data-i18n=\"Taak\">Taak</span><input name=\"title\" maxlength=\"160\" required value=\""+(K.esc(''))+"\"></label><label><span data-i18n=\"Project (optioneel)\">Project (optioneel)</span><select name=\"projectId\"><option value=\"\" data-i18n=\"Geen project\">Geen project</option>"+(choices)+"</select></label><label><span data-i18n=\"Deadline (optioneel)\">Deadline (optioneel)</span><input type=\"date\" name=\"due\" value=\""+(K.esc(''))+"\"></label>",
    async form=>{
     K.fresh();
     const project=projects.find(p=>p.id===form.elements.projectId.value);
     const task={contactId:contact.id,title:K.text(form.elements.title.value.trim(),160,true),project:project?.name||'',projectId:project?.id||'',due:K.date(form.elements.due.value,false),notes:'Contact: '+contact.name,sourceLink:await K.key(['contact-task',contact.id,K.uid()])};
     await K.send('taken',{tasks:[task]},'Projectbord','Open Doen en kies Taken overnemen.');
     document.dispatchEvent(new CustomEvent('project-tasks-changed'));
    },'Taak toevoegen');
  }catch(e){K.notice(e.message)}
 }
 function decorate(){
  for(const card of $('cards').querySelectorAll('article.card')){
   if(card.querySelector('[data-contact-task]'))continue;
   const editButton=card.querySelector('[data-edit]'),contact=data.contacts.find(c=>c.id===editButton?.dataset.edit);
   if(!contact)continue;
   const button=document.createElement('button');button.type='button';button.dataset.contactTask=contact.id;I18n.assign(button,I18n.ui("Maak taak",'Maak taak'),"textContent");
   button.onclick=()=>makeTask(contact);
   editButton.before(button);
  }
 }
 const oldRender=render;render=function(){oldRender();decorate()};
 new MutationObserver(decorate).observe($('cards'),{childList:true});decorate();
})();
