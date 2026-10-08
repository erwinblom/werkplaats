'use strict';
// Read contacts without changing the contact book or the receiving administration.
window.ContactenZoeken=(()=>{
 function validate(book){
  if(!book||book.format!=='contacten'||book.version!==1||!Array.isArray(book.contacts)||book.contacts.length>5000)throw Error(I18n.value(I18n.ui("Kies een geldig Contacten-bestand.",'Kies een geldig Contacten-bestand.')));
  if(!GereedschapskistMode.example&&book._gereedschapskistExample)throw Error(I18n.value(I18n.ui("Dit is een voorbeeldbestand. Open je eigen contactenbestand.",'Dit is een voorbeeldbestand. Open je eigen contactenbestand.')));
  const ids=new Set();
  for(const c of book.contacts){
   if(!c||typeof c.id!=='string'||!c.id||c.id.length>100||ids.has(c.id))throw Error(I18n.value(I18n.ui("Ongeldige of dubbele contactcode.",'Ongeldige of dubbele contactcode.')));ids.add(c.id);
   for(const [key,max]of Object.entries({name:160,organization:160,email:254}))if(typeof c[key]!=='string'||c[key].length>max)throw Error(I18n.value(I18n.ui("Onvolledige contactgegevens.",'Onvolledige contactgegevens.')));
   if(!c.name.trim()||(c.address!==undefined&&(typeof c.address!=='string'||c.address.length>2000)))throw Error(I18n.value(I18n.ui("Ongeldige naam of adres.",'Ongeldige naam of adres.')));
  }
  return book;
 }
 async function fromFile(file){if(file.size>20000000)throw Error(I18n.value(I18n.ui("Het contactenbestand mag maximaal 20 MB zijn.",'Het contactenbestand mag maximaal 20 MB zijn.')));return {book:validate(JSON.parse(await file.text())),source:file.name};}
 function fillMissingSavedAddresses(book,saved){
  const savedById=new Map((saved?.contacts||[]).map(contact=>[contact.id,contact]));
  let filled=0;
  for(const contact of book.contacts){
   const prior=savedById.get(contact.id);
   if(contact.address?.trim()||!prior?.address?.trim())continue;
   if(contact.name!==prior.name||contact.organization!==prior.organization||contact.email!==prior.email)continue;
   contact.address=prior.address;filled++;
  }
  return filled;
 }
 async function read(){
  await Werkmap.ready;
  if(GereedschapskistMode.example)return {book:validate(GereedschapskistExamples('Contacten')),source:'Voorbeeldcontacten'};
  const session=await BewaarAlles.readTool('Contacten');
  const book=validate(structuredClone(session.data));
  let filled=0;
  if(Werkmap.active&&book.contacts.some(contact=>!contact.address?.trim())){
   try{const {root}=await Werkmap.allAccess(false);const round=await BewaarAlles.readRound(root,false,'Contacten');const saved=round?.values[0]?.data;if(saved)filled=fillMissingSavedAddresses(book,validate(saved));}
   catch(error){if(error.name!=='NotFoundError')throw error;}
  }
  return {book,source:filled?'Contact houden · adres uit laatste bewaarkopie':'Contact houden · gezamenlijke werkruimte'};

 }
 const normalize=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('nl');
 function search(contacts,query){const words=normalize(query).trim().split(/\s+/).filter(Boolean);return contacts.filter(c=>words.every(word=>normalize([c.name,c.organization,c.email].join(' ')).includes(word)));}
 return {async add(contact){let result;await BewaarAlles.updateTool('Contacten',book=>{if(!book.contacts.some(c=>c.id===contact.id))book.contacts.push(contact);result=validate(book);});return result;},read,fromFile,validate,search};
})();
