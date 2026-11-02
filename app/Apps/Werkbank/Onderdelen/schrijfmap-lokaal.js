'use strict';
// Optional local directory adapter. Ordinary browser installations stay unchanged.
window.WerkplaatsSchrijfmap = (() => {
 const config = window.WerkplaatsSchrijfmapConfig;
 if (!config || window.GereedschapskistMode?.example) return null;
 const handles = new Map();
 const invalidName = name => typeof name !== 'string' || !name || (name.startsWith('.') && !['.ignore', '.werkbank-herstel'].includes(name)) || /[\\/\x00]/.test(name);
 async function request(op, path, extra = {}) {
  let response;
  try {
   response = await fetch(config.endpoint + '/fs', {
    method: 'POST', headers: {'Content-Type': 'application/json', 'X-Werkplaats-Schrijven': config.token},
    body: JSON.stringify({op, path, ...extra}), signal: AbortSignal.timeout(15000)
   });
  } catch {
   throw new DOMException('De lokale Schrijven-verbinding is niet bereikbaar. Open Werkplaats via de startapp en probeer opnieuw.', 'NotReadableError');
  }
  const result = await response.json();
  if (!response.ok) throw new DOMException(result.error, result.name || 'NotReadableError');
  return result;
 }
 function base64(bytes) {
  let result = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) result += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(result);
 }
 function handle(path, kind) {
  const key = kind + ':' + path;
  if (handles.has(key)) return handles.get(key);
  const item = {
   name: path.split('/').pop() || 'Schrijven', kind, werkplaatsLokaal: true,
   async queryPermission() { await request('stat', path, {kind}); return 'granted'; },
   async requestPermission() { return this.queryPermission(); },
   async isSameEntry(other) { return other === item; }
  };
  if (kind === 'directory') {
   async function child(name, childKind, options) {
    if (invalidName(name)) throw new TypeError('Ongeldige bestandsnaam.');
    const childPath = path ? path + '/' + name : name;
    await request('stat', childPath, {kind: childKind, create: options?.create === true});
    return handle(childPath, childKind);
   }
   item.getDirectoryHandle = (name, options) => child(name, 'directory', options);
   item.getFileHandle = (name, options) => child(name, 'file', options);
   item.values = async function* () {
    const result = await request('list', path);
    for (const entry of result.entries) yield handle(path ? path + '/' + entry.name : entry.name, entry.kind);
   };
   item.entries = async function* () { for await (const entry of item.values()) yield [entry.name, entry]; };
   item[Symbol.asyncIterator] = item.entries;
   item.resolve = async other => {
    for (const [otherKey, value] of handles) if (value === other) {
     const otherPath = otherKey.slice(otherKey.indexOf(':') + 1);
     if (otherPath === path) return [];
     if (!path || otherPath.startsWith(path + '/')) return otherPath.slice(path ? path.length + 1 : 0).split('/');
    }
    return null;
   };
   item.removeEntry = async name => {
    const file = await child(name, 'file');
    const current = await request('read', path ? path + '/' + name : name);
    await request('remove', path ? path + '/' + name : name, {revision: current.revision});
    handles.delete('file:' + (path ? path + '/' + name : name));
   };
  } else {
   item.getFile = async () => {
    const result = await request('read', path);
    const bytes = Uint8Array.from(atob(result.data), char => char.charCodeAt(0));
    return new File([bytes], item.name, {lastModified: result.modified});
   };
   item.createWritable = async () => {
    const before = await request('read', path);
    let data = new Uint8Array(), closed = false;
    return {
     async write(value) {
      if (closed) throw new DOMException('Bestand gesloten.', 'InvalidStateError');
      if (value && typeof value === 'object' && value.type === 'write') value = value.data;
      if (typeof value === 'string') data = new TextEncoder().encode(value);
      else if (value instanceof Blob) data = new Uint8Array(await value.arrayBuffer());
      else if (ArrayBuffer.isView(value)) data = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      else if (value instanceof ArrayBuffer) data = new Uint8Array(value);
      else throw new TypeError('Onbekende bestandsinhoud.');
     },
     async close() {
      if (closed) throw new DOMException('Bestand gesloten.', 'InvalidStateError');
      await request('write', path, {data: base64(data), revision: before.revision});
      closed = true;
     },
     async abort() { closed = true; data = new Uint8Array(); }
    };
   };
  }
  handles.set(key, item);
  return item;
 }
 const root = handle('', 'directory');
 return {root, async ready() { await root.queryPermission(); return root; }};
})();
