'use strict';
// Local, read-only week snapshot. Completion dates are not stored by Werkplaats.
(function(root){
 const line=value=>String(value??'').replace(/[\r\n\u0000-\u001f\u007f]+/g,' ').trim();
 const key=date=>String(date.getFullYear()).padStart(4,'0')+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
 function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00');return Number.isFinite(d.getTime())&&key(d)===value;}
 function weekDates(now=new Date()){
  if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw Error('Invalid date');
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12),monday=new Date(today);monday.setDate(today.getDate()-(today.getDay()+6)%7);
  const shift=days=>{const d=new Date(monday);d.setDate(d.getDate()+days);return key(d);};
  return {today:key(today),monday:shift(0),sunday:shift(6),nextMonday:shift(7),nextSunday:shift(13)};
 }
 function report(taskData,projectData,{now=new Date(),language='nl'}={}){
  const en=language==='en',t=(nl,english)=>en?english:nl,dates=weekDates(now);
  if(!taskData||!Array.isArray(taskData.tasks)||!projectData||!Array.isArray(projectData.items))throw Error(t('Doen of Projecten kon niet volledig worden gelezen.','Tasks or Projects could not be read completely.'));
  const taskIds=new Set(),projectIds=new Set();
  for(const item of taskData.tasks){
   if(!item||typeof item.id!=='string'||!item.id||taskIds.has(item.id)||typeof item.title!=='string'||!item.title.trim()||!['inbox','todo','doing','done','archive'].includes(item.state)||typeof item.due!=='string'||item.due&&!validDate(item.due))throw Error(t('Een taak bevat ongeldige gegevens. Het overzicht is niet gemaakt.','A task contains invalid data. The overview was not created.'));
   taskIds.add(item.id);
  }
  for(const item of projectData.items){
   if(!item||typeof item.id!=='string'||!item.id||projectIds.has(item.id)||typeof item.title!=='string'||!item.title.trim())throw Error(t('Een project bevat ongeldige gegevens. Het overzicht is niet gemaakt.','A project contains invalid data. The overview was not created.'));
   projectIds.add(item.id);
  }
  const order=(a,b)=>(a.due||'9999-99-99').localeCompare(b.due||'9999-99-99')||a.title.localeCompare(b.title,en?'en':'nl')||a.id.localeCompare(b.id);
  const open=taskData.tasks.filter(item=>!['done','archive'].includes(item.state)).sort(order),done=taskData.tasks.filter(item=>item.state==='done').sort(order),projects=projectData.items.filter(item=>item.kind==='project');
  const title=t('Mijn weekoverzicht','My weekly overview'),out=[title,dates.monday+' — '+dates.sunday,t('Momentopname op ','Snapshot on ')+dates.today,''];
  const taskLine=item=>'- '+line(item.title)+(item.due?' ('+item.due+')':'');
  function section(name,list,note){out.push(name+' ('+list.length+')');if(note)out.push(note);out.push(...(list.length?list.map(taskLine):[t('Geen taken.','No tasks.')]),'');}
  section(t('Achterstallige open taken','Overdue open tasks'),open.filter(item=>item.due&&item.due<dates.today));
  section(t('Komende deadlines deze week','Upcoming deadlines this week'),open.filter(item=>item.due>=dates.today&&item.due<=dates.sunday));
  section(t('Deadlines volgende week','Deadlines next week'),open.filter(item=>item.due>=dates.nextMonday&&item.due<=dates.nextSunday));
  section(t('Open taken zonder deadline','Open tasks without a deadline'),open.filter(item=>!item.due));
  const assignments=new Map(projects.map(project=>[project.id,[]])),loose=[];
  for(const task of open){
   let project=task.projectId?projects.find(item=>item.id===task.projectId):null;
   if(!task.projectId&&typeof task.project==='string'&&task.project.trim()){
    const matches=projects.filter(item=>item.title===task.project.trim());if(matches.length===1)project=matches[0];
   }
   if(project)assignments.get(project.id).push(task);else loose.push(task);
  }
  const withTasks=projects.filter(project=>assignments.get(project.id).length).sort((a,b)=>a.title.localeCompare(b.title,en?'en':'nl'));
  out.push(t('Projecten met open taken','Projects with open tasks')+' ('+withTasks.length+')');
  if(!withTasks.length)out.push(t('Geen gekoppelde open taken.','No linked open tasks.'));
  for(const project of withTasks){out.push(line(project.title)+' ('+assignments.get(project.id).length+')',...assignments.get(project.id).map(taskLine));}
  out.push('');section(t('Losse taken / onduidelijke projectkoppeling','Unassigned tasks / unclear project link'),loose);
  section(t('Nu klaar','Currently done'),done,t('Dit is de huidige kolom Klaar. Er is geen voltooiingsdatum opgeslagen; dit is geen telling van deze week.','This is the current Done column. Completion dates are not stored; this is not a count for this week.'));
  out.push(t('Bronnen: Doen en Projecten. Er zijn geen gegevens gewijzigd.','Sources: Tasks and Projects. No data was changed.'));
  return {title,text:out.join('\n')+'\n',filename:'weekoverzicht-'+dates.today+'.md'};
 }
 const core={line,validDate,weekDates,report};if(typeof module!=='undefined'&&module.exports)module.exports=core;else root.WeekoverzichtKern=core;
 if(typeof WerkplaatsUitbreiding!=='undefined')WerkplaatsUitbreiding.start(api=>{
  const en=api.language==='en';api.addAction({label:en?'View weekly overview':'Bekijk weekoverzicht',async run(){
   let tasks,projects;try{tasks=(await api.readTool('Projectbord')).data;projects=(await api.readTool('Publicatieplanner')).data;}catch(error){throw Error((en?'Overview not created. A source could not be read: ':'Overzicht niet gemaakt. Een bron kon niet worden gelezen: ')+error.message);}
   await api.showReport(core.report(tasks,projects,{language:api.language}));
  }});
 });
})(globalThis);
