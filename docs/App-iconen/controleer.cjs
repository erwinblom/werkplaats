const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname;
for(const [name,hash] of Object.entries(JSON.parse(fs.readFileSync(path.join(root,'hashes.json'))))){
 if(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')!==hash)throw Error('Werkplaats-appicoon gewijzigd of ontbreekt: '+name);
}
const home=fs.readFileSync(path.join(root,'../Begin hier.html'),'utf8');
if(!home.includes('href="App-iconen/app-icon.svg"')||!home.includes('href="App-iconen/app.webmanifest"'))throw Error('Werkplaats-appicoonverwijzing ontbreekt');
console.log('Werkplaats-appiconen gecontroleerd.');
