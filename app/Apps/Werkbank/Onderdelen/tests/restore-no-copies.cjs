const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../losse-documenten.js'), 'utf8');
const start = source.indexOf('Werkmap.register({async restore(s){') + 'Werkmap.register({'.length;
const end = source.indexOf('},saveId:', start) + 1;
const restoreSource = source.slice(start, end);

function directory(name, entries = {}) {
  return {
    name,
    async queryPermission() { return 'granted'; },
    async getDirectoryHandle(child) {
      if (!entries[child] || entries[child].kind !== 'directory') throw Error('Not found');
      return entries[child];
    },
    async getFileHandle(child) {
      if (!entries[child] || entries[child].kind !== 'file') throw Error('Not found');
      return entries[child];
    },
    async *values() { yield* Object.values(entries); },
  };
}

function file(name, content) {
  return {kind: 'file', name, async getFile() { return {text: async () => content}; }};
}

test('restoring saved rounds does not make browser copies of existing documents', async () => {
  const writing = directory('Schrijven', {
    Inbox: Object.assign(directory('Inbox', {'Start hier.md': file('Start hier.md', 'Inbox text')}), {kind: 'directory'}),
    Klaar: Object.assign(directory('Klaar', {'Start hier.md': file('Start hier.md', 'Klaar text')}), {kind: 'directory'}),
    'kennisdelen.md': file('kennisdelen.md', 'Current text'),
  });
  const context = {
    window: {},
    Werkmap: {allAccess: async () => ({root: {getDirectoryHandle: async () => writing}})},
    directoryHandles: [], folderHandlesByPath: new Map(), expandedFolders:new Set(),renderFileList(){},fileContents: new Map(),
    converterFiles: new Map(), files: [], activeFile: null,
    saveDirectoryHandles: async () => {}, saveConverterFiles: () => {},
    loadFiles: async () => {}, selectFile: async () => {},
    Werkstatus: {opened: () => {}}, showNotification: () => {},
    confirm: () => {throw Error('Opening a document must not ask for versions');},
  };
  const run = vm.runInNewContext(`({${restoreSource}}).restore`, context);
  await run({documents: [
    {name: 'Start hier.md', path: 'converter/Start hier.md', content: 'Inbox text'},
    {name: 'Start hier.md (2)', path: 'converter/Start hier.md (2)', content: 'Klaar text'},
    {name: 'kennisdelen.md (2)', path: 'converter/kennisdelen.md (2)', content: 'Current text'},
    {name: 'kennisdelen.md', path: 'Schrijven/kennisdelen.md', content: 'Older saved text'},
  ]});
  assert.equal(context.converterFiles.size, 0);
  assert.equal(context.directoryHandles.length, 1);
  await run({documents: [
    {name: 'kennisdelen.md (2)', path: 'converter/kennisdelen.md (2)', content: 'Old browser copy'},
  ]});
  assert.equal(context.converterFiles.size, 0);
  await run({documents: [
    {name: 'kennisdelen.md', path: 'Schrijven/kennisdelen.md', content: 'Older saved text'},
  ], restoreSavedVersions: true});
  assert.equal(context.converterFiles.size, 1);
  assert.equal([...context.converterFiles.values()][0].content, 'Older saved text');
  await run({documents: [
    {name: 'kennisdelen.md', path: 'converter/kennisdelen.md', content: 'Separate draft', explicit: true},
  ]});
  assert.equal(context.converterFiles.size, 1);
  assert.equal([...context.converterFiles.values()][0].content, 'Separate draft');
});


test('restore opens the canonical writing folder and retains other connections', async () => {
 const external=directory('Werkplaats', {Inbox:Object.assign(directory('Inbox',{'artikel.md':file('artikel.md','Disk text')}),{kind:'directory'})});
 const writing=directory('Schrijven');
 const denied={name:'Tijdelijk niet beschikbaar',queryPermission:async()=> 'prompt'};
 let stored;
 const context={window:{},Werkmap:{allAccess:async()=>({root:{getDirectoryHandle:async()=>writing}})},
  directoryHandles:[],selectedProject:'Werkplaats/Inbox',activeFile:null,
  getSavedDirectoryHandles:async()=>[external,denied],saveDirectoryHandles:async value=>{stored=value;},
  folderHandlesByPath:new Map(),expandedFolders:new Set(),renderFileList(){},fileContents:new Map(),converterFiles:new Map(),files:[],
  saveConverterFiles(){},loadFiles:async()=>{},selectFile:async()=>{},Werkstatus:{opened(){}},showNotification(){}};
 const run=vm.runInNewContext(`({${restoreSource}}).restore`,context);
 await run({activeDocument:'Werkplaats/Inbox/artikel.md',documents:[{name:'artikel.md',path:'Werkplaats/Inbox/artikel.md',content:'Saved text'}]});
 assert.equal(context.directoryHandles[0],writing);
 assert.equal(context.selectedProject,'Schrijven');
 assert.equal(context.converterFiles.size,0);
 assert.ok(stored.includes(external));
 assert.ok(stored.includes(denied),'permission loss must not erase the saved connection');
 await run({documents:[]});
 assert.equal(context.directoryHandles[0],writing);
 assert.equal(context.selectedProject,'Schrijven');
});


test('missing browser permission does not replace folders with browser copies', async()=>{
 let shown=false;
 const handles=[{name:'Schrijven'}],copies=new Map();
 const context={Werkmap:{active:true,allAccess:async()=>({root:{queryPermission:async()=> 'prompt'}})},getSavedDirectoryHandles:async()=>[],showWritingAccessRequired(){shown=true;},directoryHandles:handles,converterFiles:copies};
 const run=vm.runInNewContext(`({${restoreSource}}).restore`,context);
 await run({documents:[{name:'example.md',path:'Schrijven/Inbox/example.md',content:'Saved text'}]});
 assert.equal(shown,true);assert.equal(context.directoryHandles,handles);assert.equal(copies.size,0);
});

test('a reconnected writing folder opens when the parent handle is unavailable',async()=>{
 const writing=directory('Schrijven');let loaded=false;
 const context={Werkmap:{active:true,allAccess:async()=>{throw Error('parent permission unavailable');}},getSavedDirectoryHandles:async()=>[writing],directoryHandles:[],selectedProject:'all',activeFile:null,folderHandlesByPath:new Map([['Schrijven/Inbox',{}]]),expandedFolders:new Set(),loadFiles:async()=>{loaded=true;},renderFileList(){},showWritingAccessRequired(){throw Error('should use saved child');}};
 // The access failure must occur during opening the parent directory, not resolving its identity.
 context.Werkmap.allAccess=async()=>({root:{getDirectoryHandle:async()=>{throw Error('denied');}}});
 await vm.runInNewContext(`({${restoreSource}}).restore`,context)({documents:[]});
 assert.equal(loaded,true);assert.equal(context.directoryHandles[0],writing);assert.equal(context.selectedProject,'Schrijven');assert.equal(context.expandedFolders.has('Schrijven/Inbox'),true);
});
