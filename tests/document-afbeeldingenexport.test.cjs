const assert=require('node:assert/strict'),fs=require('node:fs');
const api=require('../app/document-image-downloads.js');
(async()=>{
 assert.equal(api.filename('../../Mooie foto.PNG',0,'image/png'),'01-mooie-foto.png');
 assert.throws(()=>api.filename('x',0,'text/html'));
 global.location={href:'https://example.test/document'};
 const original=Uint8Array.from([0,1,255,12,94,34]);
 const file=await api.read({src:'data:image/png;base64,'+Buffer.from(original).toString('base64'),label:'Omslag'},0);
 assert.deepEqual([...file.bytes],[...original]);
 assert.equal(file.name,'01-omslag.png');
 await assert.rejects(()=>api.read({src:'https://example.test/x.png',label:'Extern'},1),/verwijzing/);
 await assert.rejects(()=>api.read({src:'javascript:alert(1)',label:'Ongeldig'},1),/niet worden/);
 const blob=api.zip([file,{name:'02-café.webp',bytes:original}]);
 const zip=Buffer.from(await blob.arrayBuffer());assert.equal(zip.readUInt32LE(0),0x04034b50);assert.equal(zip.readUInt32LE(zip.length-22),0x06054b50);assert.equal(zip.readUInt16LE(zip.length-12),2);
 console.log('PASS original image bytes, safe filenames/types, no remote requests, ZIP fixture.');
})().catch(e=>{console.error(e);process.exit(1)});
