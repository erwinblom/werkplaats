const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/Apps/Werkbank/Onderdelen/projects.js'),'utf8');
const start=source.indexOf('function projectRoot('),end=source.indexOf('function projectTreePath(');
const ctx={selectedProject:'Schrijven',files:[{relativePath:'Schrijven/nieuw.md'},{relativePath:'Schrijven/Inbox/idee.md'},{relativePath:'Andere map/prive.md'}],writingFolderOverview:()=>true};vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
assert.equal(ctx.projectFiles().map(x=>x.relativePath).join('|'),'Schrijven/nieuw.md|Schrijven/Inbox/idee.md');
ctx.selectedProject='Schrijven/Inbox';assert.equal(ctx.projectFiles().map(x=>x.relativePath).join('|'),'Schrijven/Inbox/idee.md');
ctx.selectedProject='all';assert.equal(ctx.projectFiles().length,3);
console.log('PASS: Schrijven — alles includes root documents and phases; a phase filters correctly; all folders remain available.');
