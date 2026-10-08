'use strict';
window.Startwerkmap={async create(root){
 const documents=[{"folder": "Inbox", "name": "Start hier.md", "content": "# Verzamel je ideeën\n\n- Bewaar hier losse ideeën en aantekeningen. Maak je eigen document via **Nieuw**.\n- Ga met de mappijlen of **← en →** naar een andere map. Tijdens het typen verplaatsen deze toetsen je cursor.\n- De drie mappen zijn fases. Je kunt mappen ook indelen op onderwerp of project.\n"}, {"folder": "In bewerking", "name": "Start hier.md", "content": "# Werk aan je tekst\n\n- Open een document en kies **Bewerk**, of kies een template onder **Nieuw**.\n- Gebruik **Bewaar** om je tekst op te slaan.\n- Is je tekst af? Kies **Meer → Verplaatsen** en zet hem in **Klaar**.\n"}, {"folder": "Klaar", "name": "Start hier.md", "content": "# Bewaar je afgeronde werk\n\n- Hier bewaar je teksten die klaar zijn om te gebruiken. Er wordt niets automatisch gepubliceerd of verstuurd.\n- Klik op **Bewaar alles** voordat je afsluit. Kies later **Verder werken** en open dezelfde werkmap.\n- Deze startdocumenten mag je aanpassen of verwijderen.\n"}];
 const names={Werkbank:'Schrijven',Ping:'Factureren',Projectbord:'Doen',Bronnenkast:'Verzamelen',Uren:'Uren schrijven',Contacten:'Contact houden',Publicatieplanner:'Plannen',Offerte:'Offreren',Kasboek:'Boekhouden',Abonnementen:'Abonnementen'};
 const revision=crypto.randomUUID(),date=new Date().toISOString(),sessions=[],docs=[];
 async function write(dir,name,data){const file=await dir.getFileHandle(name,{create:true});if((await file.getFile()).size)throw Error(I18n.value(I18n.ui("Startbestand bestaat al: {0}",'Startbestand bestaat al: '+name)));const stream=await file.createWritable();const text=typeof data==='string'?data:JSON.stringify(data,null,2);await stream.write(text);await stream.close();if(await(await file.getFile()).text()!==text)throw Error(I18n.value(I18n.ui("Startbestand niet correct bewaard: {0}",'Startbestand niet correct bewaard: '+name)));}
 const writing=await root.getDirectoryHandle('Schrijven',{create:true});
 for(const d of documents){const folder=await writing.getDirectoryHandle(d.folder,{create:true});await write(folder,d.name,d.content);docs.push({name:d.name,path:'Schrijven/'+d.folder+'/'+d.name,content:d.content});}
 const rounds=await root.getDirectoryHandle('Bewaard werk',{create:true}),round=await rounds.getDirectoryHandle('beginstand',{create:true});
 for(const [tool,name]of Object.entries(names)){
  await root.getDirectoryHandle(name,{create:true});const folder=name+'-'+(sessions.length+1),dir=await round.getDirectoryHandle(folder,{create:true});
  const value={format:'gereedschapskist-werksessie',version:1,tool,name,data:tool==='Werkbank'?null:GereedschapskistExamples(tool),draft:null,revision,savedAt:date};
  if(tool==='Werkbank'){value.documents=docs;value.activeDocument=docs.find(d=>d.path.includes('/Inbox/')).path;}
  await write(dir,'werksessie.json',value);sessions.push({tool,name,folder,source:'beginstand'});
 }
 await write(round,'bewaar-alles.json',{format:'gereedschapskist-bewaarronde',version:1,date,revision,sessions,shared:{}});
 await write(root,'gereedschapskist-werkmap.json',{format:'gereedschapskist-werkmap',version:1,id:revision});
 await write(rounds,'actueel.json',{format:'gereedschapskist-bewaard-werk',version:1,current:'beginstand',previous:null});
}};
