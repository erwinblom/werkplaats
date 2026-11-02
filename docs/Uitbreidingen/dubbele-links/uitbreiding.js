'use strict';
// Read-only comparison. URL/title/user text never become executable markup.
(function(root){
 const text=value=>typeof value==='string'?value:'';
 const labels={
  nl:{title:'Dubbele links vinden',intro:'Vergelijk de exemplaren voordat je zelf iets aanpast. Deze uitbreiding verandert of verwijdert niets.',none:'Geen dubbele links gevonden.',groups:'Groepen met dezelfde link',copies:'Exemplaren',skipped:'Niet vergeleken: lege, ongeldige of niet-HTTP(S)-links',group:'Groep',copy:'Exemplaar',id:'Bron-ID',titleLabel:'Titel',url:'Bewaarde link',source:'Maker / bron',category:'Categorie',tags:'Onderwerpen',summary:'Samenvatting',quote:'Citaat',notes:'Eigen notities',project:'Projecten',results:'Gekoppelde resultaten',unknown:'Onbekend project',noProject:'Geen projectkoppeling',open:'Open bron',tooMany:'Er zijn meer dan 200 dubbele exemplaren. Het volledige overzicht past niet in één rapport; er is niets gewijzigd.',tooLarge:'Het volledige overzicht bevat meer dan 500.000 tekens. Er is niets gewijzigd. Vergelijk een kleinere collectie.',badSource:'De collectie in Verzamelen is niet leesbaar.',badProjects:'De gegevens in Projecten zijn niet leesbaar.',badId:'Een bron heeft geen unieke geldige ID. Het overzicht is niet gemaakt.'},
  en:{title:'Find duplicate links',intro:'Compare the copies before making changes yourself. This extension does not change or delete anything.',none:'No duplicate links found.',groups:'Groups with the same link',copies:'Copies',skipped:'Not compared: empty, invalid or non-HTTP(S) links',group:'Group',copy:'Copy',id:'Source ID',titleLabel:'Title',url:'Saved link',source:'Author / source',category:'Category',tags:'Topics',summary:'Summary',quote:'Quote',notes:'Your notes',project:'Projects',results:'Linked results',unknown:'Unknown project',noProject:'No project link',open:'Open source',tooMany:'There are more than 200 duplicate copies. The complete overview does not fit in one report; nothing was changed.',tooLarge:'The complete overview contains more than 500,000 characters. Nothing was changed. Compare a smaller collection.',badSource:'The collection in Collect is not readable.',badProjects:'The data in Projects is not readable.',badId:'A source does not have a unique valid ID. The overview was not created.'}
 };
 function canonicalUrl(value){
  if(typeof value!=='string'||/[\u0000-\u001f\u007f]/.test(value))return null;
  try{const url=new URL(value.trim());if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;return url.href;}catch{return null;}
 }
 function findGroups(items,lang='nl'){
  const l=labels[lang==='en'?'en':'nl'];if(!Array.isArray(items))throw Error(l.badSource);
  const groups=new Map(),ids=new Set();let skipped=0;
  for(const item of items){
   if(!item||typeof item!=='object'||typeof item.id!=='string'||!item.id||item.id.length>100||ids.has(item.id))throw Error(l.badId);ids.add(item.id);
   const key=canonicalUrl(item.url);if(!key){skipped++;continue;}
   if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);
  }
  return {groups:[...groups].filter(([,copies])=>copies.length>1).map(([url,copies])=>({url,copies})),skipped};
 }
 function connections(source,plans,l){
  const projects=new Map(plans.filter(item=>item&&item.kind==='project'&&typeof item.id==='string').map(item=>[item.id,text(item.title)]));
  const related=plans.filter(item=>item&&item.kind!=='project'&&Array.isArray(item.sourceIds)&&item.sourceIds.includes(source.id));
  const ids=[...new Set([text(source.projectId),...plans.filter(item=>item&&item.kind==='project'&&Array.isArray(item.sourceIds)&&item.sourceIds.includes(source.id)).map(item=>text(item.id)),...related.map(item=>text(item.projectId))].filter(Boolean))];
  return {projects:ids.map(id=>(projects.get(id)||l.unknown)+' ['+id+']'),results:related.map(item=>(text(item.title)||text(item.id))+' ['+text(item.id)+']')};
 }
 function makeReport(sourceData,projectData,options={}){
  const lang=options.language==='en'?'en':'nl',l=labels[lang];
  if(!sourceData||!Array.isArray(sourceData.items))throw Error(l.badSource);
  if(!projectData||!Array.isArray(projectData.items))throw Error(l.badProjects);
  const result=findGroups(sourceData.items,lang),copies=result.groups.reduce((total,group)=>total+group.copies.length,0);
  if(copies>200)throw Error(l.tooMany);
  const lines=['# '+l.title,'',l.intro,'',l.groups+': '+result.groups.length,l.copies+': '+copies,l.skipped+': '+result.skipped,''],links=[];
  if(!result.groups.length)lines.push(l.none);
  result.groups.forEach((group,groupIndex)=>{
   lines.push('## '+l.group+' '+(groupIndex+1),'',group.url,'');
   group.copies.forEach((item,index)=>{
    const linked=connections(item,projectData.items,l),number=(groupIndex+1)+'.'+(index+1);
    lines.push('### '+l.copy+' '+number,'',l.id+': '+item.id);
    for(const [label,value] of [[l.titleLabel,item.title],[l.url,item.url],[l.source,item.source],[l.category,item.category],[l.tags,Array.isArray(item.tags)?item.tags.map(text).join(', '):''],[l.summary,item.summary],[l.quote,item.quote],[l.notes,item.notes]])if(text(value))lines.push(label+': '+value);
    lines.push(l.project+': '+(linked.projects.join('; ')||l.noProject));if(linked.results.length)lines.push(l.results+': '+linked.results.join('; '));lines.push('');
    // Button labels and report headings share a number; user text remains in the report.
    links.push({tool:'Bronnenkast',id:item.id,label:number+' · '+text(item.title).replace(/[\r\n]+/g,' ').slice(0,160)});
   });
  });
  const body=lines.join('\n');if(body.length>500000)throw Error(l.tooLarge);
  return {title:l.title,text:body,filename:'werkplaats-dubbele-links.md',links};
 }
 const core={canonicalUrl,findGroups,makeReport};
 if(typeof module!=='undefined'&&module.exports)module.exports=core;else root.DubbeleLinksKern=core;
 if(typeof root.WerkplaatsUitbreiding!=='undefined')root.WerkplaatsUitbreiding.start(api=>{
  const en=api.language==='en';
  api.addAction({label:en?'View duplicate links':'Bekijk dubbele links',async run(){
   const [sources,projects]=await Promise.all([api.readTool('Bronnenkast'),api.readTool('Publicatieplanner')]);
   await api.showReport(makeReport(sources.data,projects.data,{language:api.language}));
  }});
 });
})(globalThis);
