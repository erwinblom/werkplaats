const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const loaded={exports:{}};new Function('module','WerkplaatsUitbreiding',fs.readFileSync(path.join(__dirname,'../app/Uitbreidingen/agenda-export/uitbreiding.js'),'utf8'))(loaded,{start(){}});const K=loaded.exports;

// Datums
assert.equal(K.geldigeDatum('2026-02-28'),true);assert.equal(K.geldigeDatum('2026-02-30'),false);assert.equal(K.geldigeDatum('1899-12-31'),false);assert.equal(K.geldigeDatum(''),false);assert.equal(K.geldigeDatum(20261013),false);
assert.equal(K.volgendeDag('2026-12-31'),'2027-01-01');assert.equal(K.volgendeDag('2028-02-28'),'2028-02-29');

// Verzamelen uit de vier bronnen
const gegevens={
 Projectbord:{format:'projectbord',version:1,name:'Mijn taken',tasks:[
  {id:'t1',title:'Offerte nalopen',notes:'Prijs; korting, zie mail',state:'todo',priority:'high',due:'2026-11-03',project:'Boek'},
  {id:'t2',title:'Zonder deadline',notes:'',state:'todo',priority:'normal',due:''},
  {id:'t3',title:'Al klaar',notes:'',state:'done',priority:'normal',due:'2026-10-01'},
  {id:'t4',title:'Gearchiveerd',notes:'',state:'archive',priority:'low',due:'2026-10-02'},
  {id:'t5',title:'Kapotte datum',notes:'',state:'todo',priority:'low',due:'2026-13-40'},
  null,'tekst']},
 Publicatieplanner:{format:'publicatieplanner',version:2,items:[
  {id:'p1',title:'Cursusweek',kind:'project',state:'active',channel:'',date:'2026-11-09',endDate:'2026-11-13',text:'',notes:'',url:''},
  {id:'p2',title:'Nieuwsbrief',kind:'publication',state:'published',channel:'Mail',date:'2026-10-05',endDate:'',text:'',notes:'',url:'https://voorbeeld.nl/n'},
  {id:'p3',title:'Overleg',kind:'meeting',state:'idea',channel:'Kantoor',date:'2026-11-03',endDate:'2026-11-01',text:'',notes:'Agenda meenemen',url:''}]},
 Contacten:{format:'contacten',version:1,contacts:[
  {id:'c1',name:'Jan Jansen',organization:'Jansen BV',email:'jan@voorbeeld.nl',phone:'',nextDate:'2026-11-04',nextAction:'Bellen over offerte'},
  {id:'c2',name:'Geen afspraak',organization:'',email:'',phone:'',nextDate:'',nextAction:''}]},
 Abonnementen:{format:'abonnementen',version:1,items:[
  {id:'a1',name:'Hosting',amountCents:1200,period:'year',renewal:'2026-12-01',cancelBy:'2026-11-01',status:'active',url:'https://voorbeeld.nl',notes:''},
  {id:'a2',name:'Opgezegd blad',amountCents:500,period:'month',renewal:'2026-11-15',cancelBy:'',status:'cancelled',url:'',notes:''}]}
};
const items=K.verzamel(gegevens);
assert.deepEqual(items.map(i=>[i.start,i.eind,i.titel]),[
 ['2026-11-01','2026-11-01','Uiterlijk opzeggen: Hosting'],
 ['2026-11-03','2026-11-03','Offerte nalopen'],
 ['2026-11-03','2026-11-03','Overleg'],
 ['2026-11-04','2026-11-04','Bellen over offerte (Jan Jansen)'],
 ['2026-11-09','2026-11-13','Cursusweek'],
 ['2026-12-01','2026-12-01','Verlenging: Hosting']]);
assert.equal(new Set(items.map(i=>i.uid)).size,items.length,'unieke codes');
assert.equal(items[1].uid,'werkplaats-taak-t1@werkplaats.lokaal');
assert.equal(items[1].notitie,'Werkplaats · Doen\nProject: Boek\nPrijs; korting, zie mail');
assert.deepEqual(K.verzamel(gegevens).map(i=>i.uid),items.map(i=>i.uid),'stabiele volgorde en codes');
assert.equal(K.verzamel(gegevens,{afgerond:true}).length,10,'afgeronde, gearchiveerde, gepubliceerde en opgezegde items erbij');
assert.equal(K.verzamel({Contacten:gegevens.Contacten}).length,1,'alleen gekozen bronnen');
assert.deepEqual(K.verzamel({}),[]);assert.deepEqual(K.verzamel({Projectbord:null,Contacten:{contacts:'fout'}}),[]);
assert.equal(K.verzamel(gegevens,{t:s=>({Verlenging:'Renewal',Doen:'Tasks'})[s]||s}).at(-1).titel,'Renewal: Hosting');
assert.equal(K.verzamel({Projectbord:{tasks:[{id:'a b/ç',title:'x',due:'2026-01-01'}]}})[0].uid,'werkplaats-taak-a%20b%2F%C3%A7@werkplaats.lokaal');

// iCalendar
const nu=new Date('2026-10-13T08:15:30.123Z'),tekst=K.ics(items,{nu});
assert.ok(tekst.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Werkplaats//Agenda-export '+K.VERSIE+'//NL\r\n'));assert.ok(tekst.endsWith('END:VCALENDAR\r\n'));
assert.equal(tekst.replace(/\r\n/g,'').includes('\n'),false,'alleen CRLF');assert.equal(tekst.includes('\r\n\r\n'),false,'geen lege regels');
assert.equal((tekst.match(/BEGIN:VEVENT/g)||[]).length,6);assert.equal((tekst.match(/END:VEVENT/g)||[]).length,6);
assert.ok(tekst.includes('DTSTAMP:20261013T081530Z\r\n'));
assert.ok(tekst.includes('DTSTART;VALUE=DATE:20261109\r\nDTEND;VALUE=DATE:20261114\r\nSUMMARY:Cursusweek\r\n'),'einddatum is de dag erna');
assert.ok(tekst.includes('DESCRIPTION:Werkplaats · Doen\\nProject: Boek\\nPrijs\\; korting\\, zie mail\r\n'));
assert.equal(tekst.includes('VALARM'),false);
const metHerinnering=K.ics(items,{nu,herinnering:true});assert.equal((metHerinnering.match(/BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:[^\r]+\r\nTRIGGER:PT9H\r\nEND:VALARM/g)||[]).length,6);
assert.equal(K.ontsnap('a\\b;c,d\r\ne\u0007'),'a\\\\b\\;c\\,d\\ne');
// Vouwen: geen regel langer dan 75 bytes, geen gebroken tekens, inhoud ongewijzigd.
const lang=K.ics([{uid:'u',bron:'Doen',start:'2026-01-01',eind:'2026-01-01',titel:'é€😀'.repeat(40),notitie:'x'.repeat(3000)}],{nu});
for(const regel of lang.split('\r\n'))assert.ok(Buffer.byteLength(regel)<=75,'regel te lang: '+Buffer.byteLength(regel));
const ontvouwd=lang.replace(/\r\n /g,'');assert.ok(ontvouwd.includes('SUMMARY:'+'é€😀'.repeat(40)+'\r\n'));assert.equal(Buffer.from(lang).toString(),lang);
assert.ok(ontvouwd.includes('DESCRIPTION:'+'x'.repeat(1999)+'…\r\n'),'lange notitie ingekort');
assert.equal(K.ics([],{nu}).includes('VEVENT'),false);
assert.equal(K.bestandsnaam(new Date(2026,0,5)),'werkplaats-agenda-2026-01-05.ics');
console.log('OK: datums, vier bronnen, overslaan van afgeronde items, stabiele codes, iCalendar-opmaak, ontsnappen, vouwen, herinnering');
