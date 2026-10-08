'use strict';
function openDocumentExport(){
 if(!activeFile)return;
 const markdown=Kladblok.strip(isEditMode?getWysiwygMarkdown():currentRawContent);
 const name=activeFile.name.replace(/\.(md|markdown|txt)$/i,'');
 const dialog=document.createElement('dialog');dialog.className='file-dialog';I18n.attribute(dialog,'aria-label',I18n.ui("Document exporteren",'Document exporteren'));
 dialog.innerHTML="<h2><span data-i18n=\"Document exporteren\">Document exporteren</span></h2><p><span data-i18n=\"Exporteer de huidige tekst, inclusief je laatste bewerkingen.\">Exporteer de huidige tekst, inclusief je laatste bewerkingen.</span></p><div style=\"display:flex;gap:10px;flex-wrap:wrap\"><button type=\"button\" data-format=\"pdf\"><span data-i18n=\"PDF (.pdf)\">PDF (.pdf)</span></button><button type=\"button\" data-format=\"md\"><span data-i18n=\"Markdown (.md)\">Markdown (.md)</span></button><button type=\"button\" data-format=\"txt\"><span data-i18n=\"Platte tekst (.txt)\">Platte tekst (.txt)</span></button></div><p style=\"font-size:14px\"><span data-i18n=\"Voor PDF kies je ‘Bewaar als PDF’ in het afdrukvenster.\">Voor PDF kies je ‘Bewaar als PDF’ in het afdrukvenster.</span></p><p role=\"status\"></p><button type=\"button\" data-close><span data-i18n=\"Sluit\">Sluit</span></button>";
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 dialog.addEventListener('click',event=>{const format=event.target.dataset.format;if(!format)return;try{
  if(format==='pdf'){printDocumentExport(markdown,name);return;}
  let content=markdown;if(format==='txt'){const div=document.createElement('div');div.innerHTML=DOMPurify.sanitize(marked.parse(parseFrontmatter(markdown).content));div.querySelectorAll('br').forEach(el=>el.replaceWith('\n'));div.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,tr,pre,blockquote').forEach(el=>el.append('\n'));content=div.textContent;}
  const url=URL.createObjectURL(new Blob([content],{type:format==='md'?'text/markdown;charset=utf-8':'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=name+'.'+format;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);I18n.assign(dialog.querySelector('[role=status]'),I18n.ui("Download gestart. Controleer je downloads.",'Download gestart. Controleer je downloads.'),"textContent");
 }catch(error){I18n.assign(dialog.querySelector('[role=status]'),I18n.ui("Exporteren is niet gelukt: {0}",'Exporteren is niet gelukt: '+error.message),"textContent");}});
 document.body.append(dialog);dialog.showModal();
}
function printDocumentExport(markdown,name){
 markdown=Kladblok.strip(markdown);
 const frame=document.createElement('iframe');I18n.assign(frame,I18n.ui("Afdrukvoorbeeld document",'Afdrukvoorbeeld document'),"title");frame.style.cssText='position:fixed;left:-10000px;width:800px;height:1000px;border:0';
 const html=DOMPurify.sanitize(marked.parse(parseFrontmatter(markdown).content),{FORBID_TAGS:['style','iframe'],FORBID_ATTR:['style','class','id']});
 frame.onload=()=>{const win=frame.contentWindow;win.addEventListener('afterprint',()=>frame.remove(),{once:true});win.focus();win.print();};
 frame.srcdoc="<!doctype html><html lang=\"nl\"><head><meta charset=\"utf-8\"><title>"+(escapeHtml(name))+"</title><style>@page{size:A4;margin:20mm}body{font:11pt/1.6 Arial,sans-serif;color:#111;overflow-wrap:anywhere}h1{font-size:25pt;line-height:1.2}h2{font-size:18pt}h3{font-size:14pt}h1,h2,h3{break-after:avoid}table{border-collapse:collapse;width:100%;font-size:10pt}td,th{padding:7px;border:1px solid #ccc;text-align:left}tr{break-inside:avoid}thead{display:table-header-group}pre{white-space:pre-wrap}img{max-width:100%}blockquote{border-left:3px solid #ccc;padding-left:14px;margin-left:0}a{color:inherit}</style></head><body>"+(html)+"</body></html>";
 document.body.append(frame);
}
