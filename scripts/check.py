#!/usr/bin/env python3
"""Controleer links, schone Master-herkomst en gelijke appinhoud in website en ZIP."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import re,zipfile,json,hashlib,subprocess
root=Path(__file__).resolve().parents[1]
class Links(HTMLParser):
 def __init__(self,path):super().__init__();self.path=path
 def handle_starttag(self,tag,attrs):
  for key,value in attrs:
   if key not in ['src','href'] or not value:continue
   u=urlsplit(value)
   if u.scheme or value.startswith(('#','/','data:')):continue
   target=self.path.parent/unquote(u.path)
   assert target.exists(),f'{self.path.relative_to(root)}: ontbreekt {value}'
manifest=json.loads((root/'release/master-bestanden.json').read_text())
actual={str(p.relative_to(root/'app')):hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/'app').rglob('*') if p.is_file() and p.name!='.DS_Store'}
assert actual==manifest['files'],'Publieksbron wijkt af van schone Master; wijzig de ontwikkelbron en importeer opnieuw'
for directory in [root/'app',root/'docs']:
 for p in directory.rglob('*.html'):Links(p).feed(p.read_text())
 for p in directory.rglob('*.js'):subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
 start=(directory/'Begin hier.html').read_text();assert len(re.findall(r'<li class="card active">',start))==9
 for p in directory.rglob('*'):
  if p.is_file() and p.suffix in ['.html','.js','.json','.md','.txt']:
   text=p.read_text(errors='replace')
   assert not any(x in text for x in ['/Users/','persoonlijke-notities-sync.js','persoonlijke-feedback.js','persoonlijk-projectherstel.js','persoonlijke-nahv-','NAHV-export']),f'Privéreferentie in {p}'
 for name in ['Over.html','Uitleg.html','LEESMIJ.txt']:
  assert not any(x in (directory/name).read_text() for x in ['Proeftuin','Bekijk voorbeelden','Begin met mijn eigen werk']),f'Achterhaalde uitleg in {name}'
for name in actual:
 if name=='Begin hier.html':continue # Website adds the development notice.
 assert (root/'docs'/name).read_bytes()==(root/'app'/name).read_bytes(),f'Website wijkt af: {name}'
with zipfile.ZipFile(root/'dist/Werkplaats.zip') as z:
 assert z.testzip() is None
 assert {n.split('/')[1] for n in z.namelist()}=={'Begin hier.html','Bestanden'}
 for name in actual:assert z.read('Werkplaats/Bestanden/'+name)==(root/'app'/name).read_bytes(),name
print(f'OK: {len(actual)} Master-bestanden, lokale HTML-links, JavaScript, privacyuitsluitingen, actuele uitleg en ZIP gelijk aan bron.')
