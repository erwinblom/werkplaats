/* SQLite databases for the downloadable Werkplaats. SPDX-License-Identifier: MIT */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DatabasesCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_BYTES=20*1024*1024,MAX_COLS=100,MAX_ROWS=5000,MAX_VALUE=50000;
const fail=message=>{throw new Error(message);};
function name(value,column=false){if(typeof value!=='string'||!value.trim()||value!==value.trim()||value.length>64||!/[\p{L}\p{N}]/u.test(value)||/[\x00-\x1f\x7f"'`;\\]/.test(value)||!/^[\p{L}\p{N}_ .()-]+$/u.test(value)||/^(sqlite_|__wp)/i.test(value)||(column&&value.toLowerCase()==='id'))fail('Gebruik een naam van maximaal 64 letters, cijfers, spaties of eenvoudige leestekens. De naam id is gereserveerd.');return value;}
const quote=value=>'"'+String(value).replace(/"/g,'""')+'"';
function equalName(a,b){return a.toLowerCase()===b.toLowerCase();}
function parseCSV(text,delimiter){
 if(typeof text!=='string'||text.length>MAX_BYTES)fail('Het CSV-bestand is te groot (maximaal 20 MB).');
 text=text.replace(/^\uFEFF/,'');if(!text.trim())fail('Het CSV-bestand is leeg.');
 if(delimiter!==undefined&&![';',',','\t'].includes(delimiter))fail('Kies een komma, puntkomma of tab als scheidingsteken.');
 if(!delimiter){let counts={',':0,';':0,'\t':0},quoted=false;for(let i=0;i<text.length;i++){let c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){i++;continue;}quoted=!quoted;}else if(!quoted){if(c==='\r'||c==='\n')break;if(Object.hasOwn(counts,c))counts[c]++;}}delimiter=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];}
 const result=[];let row=[],cell='',quoted=false,afterQuote=false,start=true;
 const pushCell=()=>{if(cell.length>MAX_VALUE)fail('Een CSV-waarde is te lang (maximaal 50.000 tekens).');row.push(cell);if(row.length>MAX_COLS)fail('Maximaal 100 kolommen per tabel.');cell='';afterQuote=false;start=true;};
 const pushRow=()=>{pushCell();result.push(row);row=[];if(result.length>MAX_ROWS+1)fail('Importeer maximaal 5.000 gegevensrijen tegelijk.');};
 for(let i=0;i<text.length;i++){
  const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;afterQuote=true;}}else cell+=c;if(cell.length>MAX_VALUE)fail('Een CSV-waarde is te lang (maximaal 50.000 tekens).');continue;}
  if(c===delimiter){pushCell();continue;}if(c==='\n'||c==='\r'){pushRow();if(c==='\r'&&text[i+1]==='\n')i++;continue;}
  if(afterQuote)fail('Ongeldige CSV: er staat tekst achter een afgesloten aanhalingsteken.');
  if(c==='"'){if(!start)fail('Ongeldige CSV: een aanhalingsteken moet aan het begin van een veld staan.');quoted=true;start=false;}else{cell+=c;start=false;}
 }
 if(quoted)fail('Ongeldige CSV: een aanhalingsteken is niet afgesloten.');
 if(cell!==''||row.length||afterQuote)pushRow();
 if(!result.length)fail('Het CSV-bestand bevat geen kolomkoppen.');
 const headers=result.shift();headers.forEach(h=>name(h,true));if(new Set(headers.map(h=>h.toLowerCase())).size!==headers.length)fail('CSV-kolomkoppen moeten uniek zijn.');
 for(const r of result)if(r.length!==headers.length)fail('Iedere CSV-rij moet evenveel velden hebben als de kolomkoppen.');
 return {columns:headers.map(n=>({name:n,type:'TEXT'})),rows:result,delimiter};
}
class DatabaseModel{
 constructor(SQL,bytes){if(!SQL||typeof SQL.Database!=='function')fail('SQLite is nog niet geladen.');this.SQL=SQL;if(bytes!==undefined){if(!(bytes instanceof Uint8Array))bytes=new Uint8Array(bytes);if(bytes.byteLength>MAX_BYTES)fail('De database is te groot (maximaal 20 MB).');if(bytes.length<16||String.fromCharCode(...bytes.slice(0,16))!=='SQLite format 3\0')fail('Dit is geen SQLite-database.');}let db;try{db=bytes?new SQL.Database(bytes):new SQL.Database();db.run('PRAGMA trusted_schema=OFF');if(!bytes)db.run('PRAGMA user_version=1');const check=db.exec('PRAGMA quick_check(1)');if(check[0]?.values[0]?.[0]!=='ok')fail('De SQLite-database is beschadigd.');this.db=db;}catch(error){db?.close();fail('De SQLite-database kon niet worden geopend: '+error.message);}}
 _ready(){if(!this.db)fail('Deze database is gesloten.');}
 _query(sql,args=[]){this._ready();const s=this.db.prepare(sql);try{s.bind(args);const rows=[];while(s.step())rows.push(Object.fromEntries(s.getColumnNames().map((k,i)=>[k,s.get()[i]])));return rows;}finally{s.free();}}
 tables(){const ordinary=new Set(this._query('PRAGMA table_list').filter(t=>t.type==='table'&&t.schema==='main').map(t=>t.name));return this._query("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name COLLATE NOCASE").filter(t=>ordinary.has(t.name)&&!/^\s*CREATE\s+VIRTUAL\s+TABLE\b/i.test(t.sql||'')).map(t=>({name:t.name,columns:this._query('PRAGMA table_info('+quote(t.name)+')').map(c=>({name:c.name,type:c.type,pk:Number(c.pk)}))}));}
 _table(table){if(typeof table!=='string')fail('Kies een tabel.');const t=this.tables().find(t=>t.name===table);if(!t)fail('Deze gewone tabel bestaat niet.');return t;}
 _columns(columns){if(!Array.isArray(columns)||!columns.length||columns.length>MAX_COLS)fail('Maak een tabel met 1 tot 100 kolommen.');const seen=new Set();return columns.map(c=>{if(!c||typeof c!=='object')fail('Ongeldige kolom.');const n=name(c.name,true),type=String(c.type||'TEXT').toUpperCase();if(!['TEXT','INTEGER','REAL'].includes(type))fail('Kies Tekst, Geheel getal of Getal.');if(seen.has(n.toLowerCase()))fail('Kolomnamen moeten uniek zijn.');seen.add(n.toLowerCase());return {name:n,type};});}
 _mutate(fn){this._ready();const before=this.export();let committed=false;try{this.db.run('BEGIN IMMEDIATE');const result=fn();this.db.run('COMMIT');committed=true;this.export();return result;}catch(error){if(committed){this.db.close();this.db=new this.SQL.Database(before);this.db.run('PRAGMA trusted_schema=OFF');}else try{this.db.run('ROLLBACK');}catch{}throw error;}}
 _create(table,columns){this.db.run('CREATE TABLE '+quote(table)+' ("id" INTEGER PRIMARY KEY AUTOINCREMENT, '+columns.map(c=>quote(c.name)+' '+c.type).join(', ')+')');}
 createTable(table,columns){name(table);const cols=this._columns(columns);if(this.tables().some(t=>equalName(t.name,table)))fail('Er bestaat al een tabel met deze naam.');return this._mutate(()=>this._create(table,cols));}
 read(table,offset=0,limit=100,query=''){
  const t=this._table(table);if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit<1||limit>100)fail('Ongeldig paginanummer.');
  if(typeof query!=='string'||query.length>500)fail('Gebruik een zoektekst van maximaal 500 tekens.');
  const cols=t.columns;if(!cols.length)fail('Deze tabel bevat geen leesbare kolommen.');
  const pattern='%'+query.replace(/[\\%_]/g,match=>'\\'+match)+'%';
  const where=query===''?'':' WHERE ('+cols.map(c=>'CAST('+quote(c.name)+" AS TEXT) LIKE ? ESCAPE '\\'").join(' OR ')+')';
  const args=query===''?[]:cols.map(()=>pattern);
  const total=Number(this._query('SELECT COUNT(*) AS n FROM '+quote(table)+where,args)[0].n);
  const pk=cols.filter(c=>c.pk).sort((a,b)=>a.pk-b.pk);const order=pk.length?' ORDER BY '+pk.map(c=>quote(c.name)).join(', '):'';
  const rows=this._query('SELECT '+cols.map(c=>quote(c.name)).join(', ')+' FROM '+quote(table)+where+order+' LIMIT ? OFFSET ?',[...args,limit,offset]).map(r=>Object.fromEntries(cols.map(c=>[c.name,r[c.name] instanceof Uint8Array?'[BLOB: '+r[c.name].length+' bytes]':r[c.name]])));
  return {columns:cols,rows,total,offset,editable:this._editable(t)};
 }
 _editable(t){const p=t.columns.filter(c=>c.pk);return !this._query("SELECT 1 FROM sqlite_master WHERE type='trigger' AND tbl_name=? LIMIT 1",[t.name]).length&&p.length===1&&p[0].name==='id'&&p[0].type.toUpperCase()==='INTEGER';}
 _values(t,values,partial){if(!values||Array.isArray(values)||typeof values!=='object')fail('Ongeldige rij.');const allowed=t.columns.filter(c=>c.name!=='id');for(const key of Object.keys(values))if(!allowed.some(c=>c.name===key))fail('Onbekende of gereserveerde kolom: '+key);const cols=partial?allowed.filter(c=>Object.hasOwn(values,c.name)):allowed;if(!cols.length)fail('Vul minimaal één kolom in.');return {cols,vals:cols.map(c=>{let v=Object.hasOwn(values,c.name)?values[c.name]:null;if(v===null||v===undefined)return null;if(typeof v!=='string'&&typeof v!=='number')fail('Gebruik tekst of een getal als waarde.');if(String(v).length>MAX_VALUE)fail('Een waarde is te lang (maximaal 50.000 tekens).');const type=c.type.toUpperCase();if(['INTEGER','REAL'].includes(type)){if(typeof v==='string'&&v.trim()==='')return null;const n=Number(v);if(!Number.isFinite(n)||(type==='INTEGER'&&!Number.isSafeInteger(n)))fail('Vul een geldig '+(type==='INTEGER'?'geheel getal':'getal')+' in bij '+c.name+'.');return n;}if(type==='TEXT'||type==='')return String(v);fail('Deze kolomsoort kan alleen worden bekeken: '+c.type);})};}
 insert(table,values){const t=this._table(table);if(!this._editable(t))fail('Deze geïmporteerde tabel kan alleen worden bekeken.');const {cols,vals}=this._values(t,values,false);return this._mutate(()=>{this.db.run('INSERT INTO '+quote(table)+' ('+cols.map(c=>quote(c.name)).join(', ')+') VALUES ('+cols.map(()=>'?').join(', ')+')',vals);return Number(this._query('SELECT last_insert_rowid() AS id')[0].id);});}
 update(table,rowId,values){const t=this._table(table);if(!this._editable(t))fail('Deze geïmporteerde tabel kan alleen worden bekeken.');if(!Number.isSafeInteger(rowId))fail('Ongeldig rijnummer.');const {cols,vals}=this._values(t,values,true);return this._mutate(()=>{if(!this._query('SELECT id FROM '+quote(table)+' WHERE id=?',[rowId]).length)fail('Deze rij bestaat niet meer.');this.db.run('UPDATE '+quote(table)+' SET '+cols.map(c=>quote(c.name)+'=?').join(', ')+' WHERE "id"=?',[...vals,rowId]);});}
 importCSV(table,text,delimiter){name(table);const parsed=parseCSV(text,delimiter),cols=this._columns(parsed.columns);if(this.tables().some(t=>equalName(t.name,table)))fail('Er bestaat al een tabel met deze naam.');this._mutate(()=>{this._create(table,cols);const statement=this.db.prepare('INSERT INTO '+quote(table)+' ('+cols.map(c=>quote(c.name)).join(', ')+') VALUES ('+cols.map(()=>'?').join(', ')+')');try{for(const row of parsed.rows)statement.run(row);}finally{statement.free();}});return {table,rows:parsed.rows.length,columns:cols};}
 export(){this._ready();const bytes=this.db.export();this.db.run('PRAGMA trusted_schema=OFF');if(bytes.byteLength>MAX_BYTES)fail('De database is te groot (maximaal 20 MB).');return bytes;}
 close(){if(this.db){this.db.close();this.db=null;}}
 static parseCSV(text,delimiter){return parseCSV(text,delimiter);}
}
return {DatabaseModel,parseCSV,MAX_BYTES,MAX_ROWS,MAX_COLS,MAX_VALUE};
});
