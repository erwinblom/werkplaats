'use strict';
// One portable print route for local and online documents. The letterhead stays in Markdown.
window.DocumentPrint = (() => {
 const marker='::: pagina-einde :::';
 const tr=(nl,en)=>window.I18n?.locale?.().startsWith('en')?en:nl;
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function build(markdown,name,{margin=20,numbers=true}={}) {
  const parsed=parseFrontmatter(Kladblok.strip(markdown));
  const letter=String(parsed.frontmatter?.type||'').replace(/["']/g,'').trim()==='brief';
  const holder=document.createElement('div');
  holder.innerHTML=DOMPurify.sanitize(marked.parse(parsed.content),{FORBID_TAGS:['style','iframe','script','video','audio'],FORBID_ATTR:['style','class','id','contenteditable']});
  // Only an explicit marker starts a new page. Ordinary separators keep their meaning.
  for(const el of holder.querySelectorAll('p,hr[data-wp-pagebreak]'))if(el.matches('hr')||el.textContent.trim()===marker){const br=document.createElement('div');br.className='wp-page-break';el.replaceWith(br);}
  for(const img of holder.querySelectorAll('img')){
   const src=img.getAttribute('src')||'';
   if(!src)throw Error(tr('Een afbeelding heeft geen bron.','An image has no source.'));
   const url=new URL(src,location.href);
   if(!['http:','https:','file:','blob:'].includes(url.protocol)&&!/^data:image\//i.test(src))throw Error(tr('Deze afbeeldingsbron kan niet worden afgedrukt.','This image source cannot be printed.'));
   img.src=url.href;
   img.removeAttribute('width');img.removeAttribute('height');
  }
  if(letter){
   const title=holder.querySelector(':scope > h1');if(title)title.remove();
   const divider=holder.querySelector(':scope > hr');
   if(divider){const header=document.createElement('header');header.className='wp-letterhead';while(holder.firstChild!==divider)header.append(holder.firstChild);divider.replaceWith(header);}
  }
  const pageMargin=[15,20,25].includes(Number(margin))?Number(margin):20;
  const pageLabel=tr('Pagina','Page');
  return '<!doctype html><html lang="'+(tr('nl','en'))+'"><head><meta charset="utf-8"><title>'+esc(name)+'</title><style>'+`
   @page{size:A4;margin:${pageMargin}mm;${numbers?'@bottom-right{content:"'+pageLabel+' " counter(page);font:9pt Arial;color:#555}':''}}
   *{box-sizing:border-box}html{background:#eee}body{margin:0;color:#111;font:11pt/1.5 Arial,Helvetica,sans-serif;overflow-wrap:anywhere}
   main{background:white;margin:16px auto;padding:${pageMargin}mm;width:210mm;min-height:297mm}
   h1{font-size:24pt;line-height:1.2}h2{font-size:16pt}h3{font-size:13pt}h1,h2,h3{break-after:avoid}p{orphans:3;widows:3;margin:0 0 4mm}
   img{max-width:100%;max-height:235mm;object-fit:contain;height:auto;break-inside:avoid}p:has(>img:only-child){break-inside:avoid}
   .wp-letterhead{border-bottom:1px solid #999;padding-bottom:5mm;margin-bottom:9mm;break-inside:avoid;display:flow-root}
   .wp-letterhead img{max-width:48mm;max-height:24mm;float:right;margin:0 0 4mm 8mm}.wp-letterhead p{margin:0 0 2mm}
   table{border-collapse:collapse;width:100%;font-size:10pt}th,td{border:1px solid #aaa;text-align:left;padding:2mm;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}
   pre{white-space:pre-wrap}blockquote{border-left:2px solid #aaa;margin-left:0;padding-left:4mm}a{color:inherit}hr{border:0;border-top:1px solid #aaa}
   .wp-page-break{break-before:page;height:0}.wp-page-break:first-child,.wp-page-break:last-child{display:none}
   @media print{html{background:white}main{margin:0;padding:0;width:auto;min-height:0}a{text-decoration:none}}
   @media screen and (max-width:800px){main{width:100%;min-height:0}}
  `+'</style></head><body><main class="'+(letter?'wp-letter':'wp-document')+'">'+holder.innerHTML+'</main></body></html>';
 }
 async function ready(frame){
  const doc=frame.contentDocument;
  await doc.fonts?.ready;
  const failed=[];
  await Promise.all([...doc.images].map(img=>new Promise(resolve=>{
   let done=false;const timer=setTimeout(()=>finish(true),15000);
   const finish=(timedOut=false)=>{if(done)return;done=true;clearTimeout(timer);img.onload=img.onerror=null;if(timedOut||!img.naturalWidth)failed.push(img.alt||tr('Afbeelding','Image'));resolve();};
   if(img.complete){finish();return;}img.onload=()=>finish();img.onerror=()=>finish();
  })));
  if(failed.length)throw Error(tr('Afbeelding kon niet worden geladen: ','Could not load image: ')+failed.join(', '));
 }
 function open(markdown,name){
  const dialog=document.createElement('dialog');dialog.className='file-dialog document-print-dialog';dialog.setAttribute('aria-label',tr('Paginaopmaak en PDF','Page layout and PDF'));
  dialog.style.cssText='width:min(1080px,96vw);max-width:96vw;max-height:94vh';
  const title=document.createElement('h2');title.textContent=tr('Paginaopmaak en PDF','Page layout and PDF');
  const hint=document.createElement('p');hint.textContent=tr('A4 · Het briefhoofd blijft bij deze brief bewaard. Kies Bewaar als PDF in het afdrukvenster en zet Kop- en voetteksten uit.','A4 · The letterhead stays with this letter. Choose Save as PDF in the print dialog and turn off Headers and footers.');
  const controls=document.createElement('div');controls.className='wp-actions';
  const label=document.createElement('label');label.textContent=tr('Marges ','Margins ');const margins=document.createElement('select');margins.setAttribute('aria-label',tr('Marges','Margins'));for(const n of [15,20,25]){const option=new Option(n+' mm',String(n));margins.add(option);}margins.value='20';label.append(margins);
  const numberLabel=document.createElement('label'),numbers=document.createElement('input');numbers.type='checkbox';numbers.checked=true;numberLabel.append(numbers,document.createTextNode(tr(' Paginanummers',' Page numbers')));
  const print=document.createElement('button');print.type='button';print.className='action-primary';print.textContent=tr('Afdrukken / PDF bewaren','Print / Save PDF');
  const close=document.createElement('button');close.type='button';close.textContent=tr('Sluiten','Close');close.onclick=()=>dialog.close();
  controls.append(label,numberLabel,print,close);
  const status=document.createElement('p');status.setAttribute('role','status');
  const frame=document.createElement('iframe');frame.title=tr('Afdrukvoorbeeld document','Document print preview');frame.style.cssText='display:block;width:100%;height:60vh;border:1px solid var(--cte-border,#888);background:white';
  let revision=0,loaded=Promise.resolve(),previousTitle=null;
  const restoreTitle=()=>{if(previousTitle!==null){if(document.title===name)document.title=previousTitle;previousTitle=null;}};
  let loadTimer;
  function refresh(){clearTimeout(loadTimer);const version=++revision;print.disabled=true;status.textContent=tr('Voorbeeld laden…','Loading preview…');loaded=new Promise(resolve=>{let settled=false;loadTimer=setTimeout(()=>{if(version!==revision||settled)return;settled=true;status.textContent=tr('Het voorbeeld kon niet volledig laden. Controleer de afbeeldingen en probeer opnieuw.','The preview could not finish loading. Check the images and try again.');resolve(false);},20000);frame.onload=async()=>{if(settled||version!==revision)return;try{await ready(frame);if(settled||version!==revision)return;settled=true;clearTimeout(loadTimer);print.disabled=false;status.textContent=tr('Voorbeeld klaar. Controleer de pagina’s in het afdrukvenster.','Preview ready. Check the pages in the print dialog.');resolve(true);}catch(error){if(version!==revision||settled)return;settled=true;clearTimeout(loadTimer);status.textContent=error.message;resolve(false);}};try{frame.srcdoc=build(markdown,name,{margin:Number(margins.value),numbers:numbers.checked});}catch(error){settled=true;clearTimeout(loadTimer);status.textContent=error.message;resolve(false);}});}
  print.onclick=async()=>{const version=revision;if(!await loaded||version!==revision||!dialog.open)return;previousTitle=document.title;document.title=name;frame.contentWindow.addEventListener('afterprint',restoreTitle,{once:true});try{frame.contentWindow.focus();frame.contentWindow.print();}catch(error){restoreTitle();status.textContent=error.message;}};
  margins.onchange=numbers.onchange=refresh;
  dialog.append(title,hint,controls,status,frame);dialog.addEventListener('close',()=>{revision++;clearTimeout(loadTimer);restoreTitle();frame.srcdoc='';dialog.remove();},{once:true});document.body.append(dialog);dialog.showModal();refresh();return dialog;
 }
 // Preserve explicit page breaks through the existing visual editor and Markdown source mode.
 if(window.marked?.use)marked.use({extensions:[{name:'wpPageBreak',level:'block',start:src=>src.indexOf(marker),tokenizer(src){const m=/^::: pagina-einde :::[ \t]*(?:\n|$)/.exec(src);if(m)return{type:'wpPageBreak',raw:m[0]};},renderer(){return '<hr data-wp-pagebreak="true">\n';}}]});
 if(typeof createTurndownService==='function'){const original=createTurndownService;createTurndownService=function(){const td=original();td.addRule('wpPageBreak',{filter:node=>node.nodeName==='HR'&&node.hasAttribute('data-wp-pagebreak'),replacement:()=> '\n\n'+marker+'\n\n'});return td;};}
 const style=document.createElement('style');style.textContent='#wysiwygEditor hr[data-wp-pagebreak],.markdown-content hr[data-wp-pagebreak]{border:0;border-top:2px dashed var(--cte-border,#888);margin:24px 0}#wysiwygEditor hr[data-wp-pagebreak]::after{content:"'+tr('Pagina-einde','Page break')+'";font:12px Arial;color:var(--text-secondary,#555)}';document.head.append(style);
 function attach(){
  for(const toolbar of document.querySelectorAll('.wysiwyg-toolbar'))if(!toolbar.querySelector('[data-pagebreak-button]')){const button=document.createElement('button');button.type='button';button.dataset.pagebreakButton='';button.textContent=tr('Pagina-einde','Page break');button.title=button.textContent;button.style.width='auto';button.onmousedown=event=>event.preventDefault();button.onclick=()=>formatWysiwyg('insertHTML','<hr data-wp-pagebreak="true"><p><br></p>');toolbar.append(button);}
  for(const panel of document.querySelectorAll('.file-more-panel'))if(!panel.querySelector('[data-print-preview]')){const button=document.createElement('button');button.type='button';button.className='edit-btn';button.dataset.printPreview='';button.textContent=tr('Paginaopmaak / PDF','Page layout / PDF');button.onclick=()=>{if(activeFile)open(isEditMode?getWysiwygMarkdown():currentRawContent,activeFile.name.replace(/\.(md|markdown|txt)$/i,''));};panel.prepend(button);}
 }
 const content=document.getElementById('content');if(content)new MutationObserver(attach).observe(content,{childList:true,subtree:true});attach();
 return {build,open,ready,marker};
})();
// Keep the existing export entry point; PDF now includes an explicit layout preview.
printDocumentExport=(markdown,name)=>DocumentPrint.open(markdown,name);
