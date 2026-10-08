"use strict";
// Keep the original controls and handlers; group secondary controls without changing storage.
(()=>{
 document.body.classList.add('calm-writing');
 const sidebar=document.querySelector('.sidebar-header'),map=document.querySelector('.projectbar');
 if(sidebar&&map)sidebar.prepend(map);
 const management=document.querySelector('#folderMenu .sidebar-menu-panel'),open=document.getElementById('loose-open');
 if(management&&open)management.prepend(open);
 const content=document.getElementById('content');
 const segmenter=new Intl.Segmenter('nl',{granularity:'word'});
 function updateWordCount(){
  const actions=content.querySelector('.editor-actions'),editor=document.getElementById('wysiwygEditor');
  const focusBar=document.getElementById('writing-focus-bar');
  if(!editor&&!content.querySelector('.markdown-content'))return;
  const counters=[];
  for(const host of [actions,focusBar].filter(Boolean)){
   let counter=host.querySelector('.writing-word-count');
   if(!counter){counter=document.createElement('span');counter.className='writing-word-count';I18n.assign(counter,I18n.ui("Aantal woorden in je document, zonder documentgegevens",'Aantal woorden in je document, zonder documentgegevens'),"title");host.insertBefore(counter,host.querySelector('.document-focus,[data-focus-close]'));}
   counters.push(counter);
  }
  const source=document.getElementById('markdownSource');let text=editor?.innerText||'';
  if(!editor){const body=content.querySelector('.markdown-content').cloneNode(true);body.querySelectorAll('.frontmatter-details,.frontmatter,.backlinks-section').forEach(node=>node.remove());body.querySelectorAll('p,li,h1,h2,h3,h4,h5,h6,br,td,th').forEach(node=>node.append(I18n.node(' ')));text=body.textContent;}
  if(source&&!source.hidden){
   const parsed=document.createElement('div');
   parsed.innerHTML=DOMPurify.sanitize(marked.parse(parseFrontmatter(Kladblok.strip(source.value)).content));
   parsed.querySelectorAll('p,div,li,h1,h2,h3,h4,h5,h6,pre,blockquote,br,td,th').forEach(node=>node.append(I18n.node(' ')));
   text=parsed.textContent;
  }
  const count=[...segmenter.segment(text)].filter(part=>part.isWordLike).length;
  const label=count.toLocaleString(I18n.locale())+(' '+I18n.t(count===1?'woord':'woorden'));
  for(const counter of counters)if(counter.textContent!==label)counter.textContent=label;
 }
 document.addEventListener('writing-focus-updated',updateWordCount);
 content.addEventListener('input',updateWordCount);
 new MutationObserver(updateWordCount).observe(content,{childList:true,subtree:true,characterData:true});updateWordCount();
})();
