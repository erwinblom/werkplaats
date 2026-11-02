/* Document images remain untouched; downloads use the displayed original bytes. */
(function(root){
 'use strict';
 const encoder=new TextEncoder();
 const tr=(nl,en)=>root.I18n?.locale?.().startsWith('en')?en:nl;
 function filename(label,index,type){
  const extensions={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/svg+xml':'svg','image/avif':'avif'};
  const extension=extensions[type];if(!extension)throw Error(tr('Dit afbeeldingsformaat kan niet worden gedownload.','This image format cannot be downloaded.'));
  const stem=String(label||'afbeelding').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/\.[a-z0-9]{2,5}$/i,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,95)||'afbeelding';
  return String(index+1).padStart(2,'0')+'-'+stem+'.'+extension;
 }
 const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
 function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
 function zip(files){
  const local=[],central=[];let offset=0,centralSize=0;
  for(const file of files){
   const name=encoder.encode(file.name),bytes=file.bytes,crc=crc32(bytes);
   if(bytes.length>0xffffffff||offset>0xffffffff||name.length>65535)throw Error(tr('Deze afbeeldingen zijn te groot voor één ZIP.','These images are too large for one ZIP.'));
   const header=new Uint8Array(30),h=new DataView(header.buffer);
   h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,bytes.length,true);h.setUint32(22,bytes.length,true);h.setUint16(26,name.length,true);
   const entry=new Uint8Array(46),e=new DataView(entry.buffer);
   e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x800,true);e.setUint16(14,33,true);e.setUint32(16,crc,true);e.setUint32(20,bytes.length,true);e.setUint32(24,bytes.length,true);e.setUint16(28,name.length,true);e.setUint32(42,offset,true);
   local.push(header,name,bytes);central.push(entry,name);offset+=header.length+name.length+bytes.length;centralSize+=entry.length+name.length;
  }
  if(files.length>65535||offset+centralSize>0xffffffff)throw Error(tr('Deze afbeeldingen zijn te groot voor één ZIP.','These images are too large for one ZIP.'));
  const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
  return new Blob([...local,...central,end],{type:'application/zip'});
 }
 const api={filename,crc32,zip,read};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 const doc=root.document;
 function images(){
  const content=doc.querySelector('#content .markdown-content');if(!content||content.isContentEditable)return [];
  const seen=new Set();return [...content.querySelectorAll('img')].filter(img=>!img.closest('.backlinks,.backlinks-container,.backlinks-section')).map(img=>({src:img.currentSrc||img.src,label:img.alt||'afbeelding',width:img.naturalWidth,height:img.naturalHeight})).filter(item=>{if(!item.src||seen.has(item.src))return false;seen.add(item.src);return true;});
 }
 async function read(item,index){
  const url=new URL(item.src,location.href);if(!['data:','blob:','https:','http:'].includes(url.protocol))throw Error(tr('Deze afbeelding kan niet worden gedownload.','This image cannot be downloaded.'));
  if(url.protocol==='data:'){
   const match=/^data:(image\/[a-z0-9.+-]+)(;base64)?,([\s\S]*)$/i.exec(item.src);if(!match)throw Error(tr('Ongeldige afbeelding.','Invalid image.'));
   const type=match[1].toLowerCase(),name=filename(item.label,index,type);
   const bytes=match[2]?Uint8Array.from(atob(match[3].replace(/\s/g,'')),c=>c.charCodeAt(0)):encoder.encode(decodeURIComponent(match[3]));
   return {name,bytes,type};
  }
  throw Error(tr('Deze afbeelding is een verwijzing. Voeg het oorspronkelijke bestand toe aan het document om het offline te exporteren.','This image is a reference. Add the original file to the document to export it offline.'));
 }
 function save(blob,name){const url=URL.createObjectURL(blob),link=doc.createElement('a');link.href=url;link.download=name;doc.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
 function open(selected){
  const all=images();if(!all.length){root.showNotification?.(tr('Dit document heeft geen afbeeldingen om te downloaden.','This document has no images to download.'),'info');return;}
  const dialog=doc.createElement('dialog');dialog.className='wp-image-downloads';dialog.setAttribute('aria-label',tr('Afbeeldingen downloaden','Download images'));
  const heading=doc.createElement('h2');heading.textContent=tr('Afbeeldingen downloaden','Download images');dialog.append(heading);
  const help=doc.createElement('p');help.textContent=tr('Download losse afbeeldingen of alle '+all.length+' samen als ZIP. Ingesloten beelden werken offline; webverwijzingen worden niet opgehaald.','Download individual images or all '+all.length+' as a ZIP. Embedded images work offline; web references are not retrieved.');dialog.append(help);
  const status=doc.createElement('p');status.setAttribute('role','status');
  function button(text,fn){const b=doc.createElement('button');b.type='button';b.textContent=text;b.onclick=async()=>{b.disabled=true;status.textContent=tr('Download voorbereiden…','Preparing download…');try{await fn();status.textContent=tr('Download gestart.','Download started.');}catch(error){status.textContent=tr('Download mislukt. ','Download failed. ')+(error.message||tr('Probeer opnieuw.','Try again.'));}finally{b.disabled=false;}};return b;}
  const actions=doc.createElement('div');actions.className='wp-image-download-actions';
  actions.append(button(tr('Download alle afbeeldingen (ZIP)','Download all images (ZIP)'),async()=>{const files=[];for(let i=0;i<all.length;i++)files.push(await read(all[i],i));const title=doc.querySelector('#content .markdown-content h1')?.textContent||'document';save(zip(files),filename(title,0,'image/png').replace(/^01-/,'').replace(/\.png$/,'-afbeeldingen.zip'));}));
  const close=doc.createElement('button');close.type='button';close.textContent=tr('Sluiten','Close');close.onclick=()=>dialog.close();actions.append(close);dialog.append(actions,status);
  const list=doc.createElement('div');list.className='wp-image-download-list';
  all.forEach((item,index)=>{const row=doc.createElement('section');row.className='wp-image-download-row';const thumb=doc.createElement('img');if(/^data:image\//i.test(item.src))thumb.src=item.src;else thumb.hidden=true;thumb.alt='';const info=doc.createElement('div'),label=doc.createElement('strong');label.textContent=(index+1)+'. '+item.label;info.append(label);if(item.width&&item.height){const dimensions=doc.createElement('p');dimensions.textContent=item.width+' × '+item.height+' pixels';info.append(dimensions);}const download=button(tr('Download afbeelding ','Download image ')+(index+1),async()=>{const file=await read(item,index);save(new Blob([file.bytes],{type:file.type}),file.name);});info.append(download);row.append(thumb,info);if(selected===item.src)row.classList.add('selected');list.append(row);});
  dialog.append(list);dialog.addEventListener('close',()=>dialog.remove(),{once:true});doc.body.append(dialog);dialog.showModal();if(selected)list.querySelector('.selected')?.scrollIntoView({block:'nearest'});
 }
 const style=doc.createElement('style');style.textContent=`
 .wp-image-downloads{box-sizing:border-box;width:min(900px,94vw);max-height:88vh;overflow:auto;padding:var(--space-l);border:0;border-radius:var(--radius-s);box-shadow:inset 0 0 0 var(--border-m) var(--cte-border);background:var(--cte-surface);color:var(--cte-text);font-family:var(--font-ui);font-size:var(--size-m);line-height:var(--line-m)}
 .wp-image-downloads h2{margin:0 0 var(--space-m)}
 .wp-image-download-actions{display:flex;gap:var(--space-m);flex-wrap:wrap}
 .wp-image-downloads button{cursor:pointer}
 .wp-image-download-list{display:grid;gap:var(--space-m)}
 .wp-image-download-row{display:grid;grid-template-columns:minmax(100px,240px) 1fr;gap:var(--space-m);align-items:center;box-shadow:inset 0 var(--border-s) var(--cte-border);padding:var(--space-m)}
 .wp-image-download-row>img{width:100%;height:auto;max-height:180px;object-fit:contain}
 .wp-image-download-row strong{overflow-wrap:anywhere}
 .wp-image-download-row.selected{outline:var(--border-m) solid var(--cte-accent);outline-offset:var(--space-xs)}
 .wp-image-downloads [role=status]{overflow-wrap:anywhere}
 @media(max-width:520px){.wp-image-download-row{grid-template-columns:1fr}}
 @media print{.document-image-download-button,.wp-image-downloads{display:none!important}}
 `;doc.head.append(style);
 let scheduled=false;
 function refresh(){scheduled=false;const actions=doc.querySelector('.file-actions .file-more-panel')||doc.querySelector('.file-actions');const all=images();let b=actions?.querySelector('.document-image-download-button');if(!actions)return;if(!all.length){b?.remove();return;}if(!b){b=doc.createElement('button');b.type='button';b.className='edit-btn document-image-download-button';b.textContent=tr('Download afbeeldingen','Download images');b.onclick=()=>open();actions.append(b);}}
 new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(refresh);}}).observe(doc.body,{childList:true,subtree:true});
 doc.addEventListener('click',event=>{const img=event.target.closest?.('#content .markdown-content img');if(!img||img.closest('[contenteditable="true"],a'))return;event.preventDefault();open(img.currentSrc||img.src);});
 root.DocumentImageDownloads={open,...api};refresh();
})(typeof window==='undefined'?globalThis:window);
