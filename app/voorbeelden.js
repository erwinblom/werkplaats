 'use strict';
window.GereedschapskistExampleVersion='empty-v1';
window.GereedschapskistExamples=function(tool){
 const formats={Contacten:'contacten',Offerte:'offerte',Ping:'ping-local',Projectbord:'projectbord',Bronnenkast:'bronnenkast',Uren:'uren',Publicatieplanner:'publicatieplanner',Kasboek:'kasboek',Abonnementen:'abonnementen'};
 if(tool==='Werkbank')return [];
 const value={format:formats[tool],version:tool==='Ping'?3:1};
 const lists={Contacten:'contacts',Offerte:'quotes',Ping:'invoices',Projectbord:'tasks',Bronnenkast:'items',Uren:'entries',Publicatieplanner:'items',Kasboek:'entries',Abonnementen:'items'};
 value[lists[tool]]=[];
 if(tool==='Ping')Object.assign(value,{sequences:{},creditSequences:{},business:{name:'',address:'',email:'',iban:'',kvk:'',vat:''}});
 if(tool==='Kasboek')value.invoices=[];
 if(tool==='Projectbord')value.name='Mijn taken';
 if(tool==='Bronnenkast')value.name='Mijn verzameling';
 return value;
};
window.GereedschapskistExampleShared=()=>({});
window.GereedschapskistExampleSources={format:'bronnenkast',version:1,name:'Mijn verzameling',items:[]};
