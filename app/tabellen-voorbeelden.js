/* Empty starting tables with illustrative previews. SPDX-License-Identifier: MIT */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./databases-core.js'));else root.TabellenVoorbeelden=factory(root.DatabasesCore);})(typeof globalThis!=='undefined'?globalThis:this,function(core){
'use strict';
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
const templates=freeze([
 {id:'boeken',title:'Boeken',file:'Mijn boeken',table:'Boeken',description:'Houd bij welke boeken je wilt lezen, aan het lezen bent of al uit hebt.',previewLabel:'Voorbeeld, wordt niet bewaard',preview:['Titel: Een boek dat je wilt lezen','Schrijver: Naam van de schrijver','Status: Nog lezen'],columns:[{name:'Titel',type:'TEXT'},{name:'Schrijver',type:'TEXT'},{name:'Status',type:'TEXT'}]},
 {id:'uitleen',title:'Uitleenlijst',file:'Mijn uitleenlijst',table:'Uitleen',description:'Onthoud wat je hebt uitgeleend, aan wie en wanneer je het terugverwacht.',previewLabel:'Voorbeeld, wordt niet bewaard',preview:['Voorwerp: Boormachine','Aan wie: Een vriend','Uitgeleend op: 5 november','Terug op: 12 november'],columns:[{name:'Voorwerp',type:'TEXT'},{name:'Aan wie',type:'TEXT'},{name:'Uitgeleend op',type:'TEXT'},{name:'Terug op',type:'TEXT'}]},
 {id:'voorraad',title:'Voorraad',file:'Mijn voorraad',table:'Voorraad',description:'Bekijk wat je in huis hebt, hoeveel er nog is en waar het ligt.',previewLabel:'Voorbeeld, wordt niet bewaard',preview:['Artikel: Koffie','Aantal: 2','Eenheid: pakken','Plek: Keukenkast'],columns:[{name:'Artikel',type:'TEXT'},{name:'Aantal',type:'INTEGER'},{name:'Eenheid',type:'TEXT'},{name:'Plek',type:'TEXT'}]}
]);
function get(id){if(typeof id!=='string')throw Error('Kies Boeken, Uitleenlijst of Voorraad.');const item=templates.find(t=>t.id===id);if(!item)throw Error('Dit tabelvoorbeeld bestaat niet. Kies Boeken, Uitleenlijst of Voorraad.');return item;}
function list(){return templates;}
function create(SQL,id){const template=get(id);if(!core||typeof core.DatabaseModel!=='function')throw Error('Tabellen is nog niet geladen. Probeer opnieuw.');const model=new core.DatabaseModel(SQL);try{model.createTable(template.table,template.columns);return {model,template};}catch(error){model.close();throw error;}}
return Object.freeze({templates,list,get,create});
});
