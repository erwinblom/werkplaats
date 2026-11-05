/* Empty starting tables with illustrative previews. SPDX-License-Identifier: MIT */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./databases-core.js'));else root.TabellenVoorbeelden=factory(root.DatabasesCore);})(typeof globalThis!=='undefined'?globalThis:this,function(core){
'use strict';
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
const templates=freeze([
 {id:'boeken',category:'Persoonlijk',title:'Boeken',file:'Mijn boeken',table:'Boeken',description:'Houd bij welke boeken je wilt lezen, aan het lezen bent of al uit hebt.',previewLabel:'Voorbeeld, wordt niet bewaard',preview:['Titel: Een boek dat je wilt lezen','Schrijver: Naam van de schrijver','Status: Nog lezen'],columns:[{name:'Titel',type:'TEXT'},{name:'Schrijver',type:'TEXT'},{name:'Status',type:'TEXT'}]},
 {id:'voorraad',category:'Zakelijk',title:'Voorraad',file:'Mijn voorraad',table:'Voorraad',description:'Bekijk wat je in huis hebt, hoeveel er nog is en waar het ligt.',previewLabel:'Voorbeeld, wordt niet bewaard',preview:['Artikel: Koffie','Aantal: 2','Eenheid: pakken','Plek: Keukenkast'],columns:[{name:'Artikel',type:'TEXT'},{name:'Aantal',type:'INTEGER'},{name:'Eenheid',type:'TEXT'},{name:'Plek',type:'TEXT'}]},
 {id:'informatieverzoeken',category:'Overheid',title:'Informatieverzoeken',file:'Mijn informatieverzoeken',table:'Informatieverzoeken',description:'Houd bij welke informatie is gevraagd, wie het oppakt en wat de volgende actie is.',previewLabel:'Fictief voorbeeld, wordt niet bewaard',preview:['Onderwerp: Informatie over laadpalen in de wijk','Ontvangstdatum: 5 november','Verantwoordelijke: Team informatie','Status: Nieuw','Volgende actie: Beschikbare informatie inventariseren'],columns:[{name:'Onderwerp',type:'TEXT'},{name:'Ontvangstdatum',type:'TEXT'},{name:'Verantwoordelijke',type:'TEXT'},{name:'Status',type:'TEXT'},{name:'Volgende actie',type:'TEXT'}]}
]);
function get(id){if(typeof id!=='string')throw Error('Kies Persoonlijk, Zakelijk of Overheid.');const item=templates.find(t=>t.id===id);if(!item)throw Error('Dit tabelvoorbeeld bestaat niet. Kies Persoonlijk, Zakelijk of Overheid.');return item;}
function list(){return templates;}
function create(SQL,id){const template=get(id);if(!core||typeof core.DatabaseModel!=='function')throw Error('Ordenen is nog niet geladen. Probeer opnieuw.');const model=new core.DatabaseModel(SQL);try{model.createTable(template.table,template.columns);return {model,template};}catch(error){model.close();throw error;}}
return Object.freeze({templates,list,get,create});
});
