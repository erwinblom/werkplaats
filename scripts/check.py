#!/usr/bin/env python3
"""Controleer links, schone Master-herkomst en gelijke appinhoud in website en ZIP."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import re,zipfile,json,hashlib,subprocess
from release_metadata import VERSION, release_bytes
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
actual={p.relative_to(root/'app').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/'app').rglob('*') if p.is_file() and p.name!='.DS_Store'}
assert actual==manifest['files'],'Publieksbron wijkt af van schone Master; wijzig de ontwikkelbron en importeer opnieuw'
for directory in [root/'app',root/'docs']:
 for p in directory.rglob('*.html'):Links(p).feed(p.read_text())
 for p in directory.rglob('*.js'):subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
 start=(directory/'Begin hier.html').read_text();assert len(re.findall(r'<li class="card active">',start))==10
 assert 'wordmark-brand' not in start and 'Blom Bouwt' not in start
 if directory==root/'docs':assert 'Versie '+VERSION in start
 assert 'Apps/Zoeken/' not in start
 assert 'Apps/Omvormen/Start Omvormen.html' in start
 for p in directory.rglob('*'):
  if p.is_file() and p.suffix in ['.html','.js','.json','.md','.txt']:
   text=p.read_text(errors='replace')
   assert not any(x in text for x in ['/Users/','persoonlijke-notities-sync.js','persoonlijke-feedback.js','persoonlijk-projectherstel.js','persoonlijke-nahv-','NAHV-export']),f'Privéreferentie in {p}'
 for name in ['Over.html','Uitleg.html','LEESMIJ.txt']:
  assert not any(x in (directory/name).read_text() for x in ['Proeftuin','Bekijk voorbeelden','Begin met mijn eigen werk']),f'Achterhaalde uitleg in {name}'
assert 'Apps/Databases/Start Databases.html' in actual
assert 'vendor/sqljs/sql-wasm-inline.js' in actual
for name in actual:
 expected=release_bytes(name,(root/'app'/name).read_bytes())
 assert (root/'docs'/name).read_bytes()==expected,f'Website wijkt af: {name}'
assert (root/'docs/index.html').read_bytes()==(root/'docs/Begin hier.html').read_bytes()
with zipfile.ZipFile(root/'dist/Werkplaats.zip') as z:
 assert z.testzip() is None
 assert {n.split('/')[1] for n in z.namelist()}=={'Begin hier.html','Bestanden','Maak Werkplaats-app.command','START-HIER.txt'}
 assert z.read('Werkplaats/Begin hier.html')==(root/'release/launcher.html').read_bytes()
 assert z.read('Werkplaats/START-HIER.txt')==(root/'START-HIER.txt').read_bytes()
 expected_app_paths={'Werkplaats/Bestanden/'+name for name in actual}
 assert {name for name in z.namelist() if name.startswith('Werkplaats/Bestanden/')}==expected_app_paths
 for name in actual:assert z.read('Werkplaats/Bestanden/'+name)==(root/'docs'/name).read_bytes(),name
print(f'OK: {len(actual)} Master-bestanden, lokale HTML-links, JavaScript, privacyuitsluitingen, website en ZIP gelijk na toepassing van het uitgavenummer.')

agenda=root/'app/Uitbreidingen/agenda-export'
if agenda.is_dir():
 version=json.loads((agenda/'uitbreiding.json').read_text())['version']
 with zipfile.ZipFile(root/'dist'/('Agenda-export-'+version+'.zip')) as z:
  assert z.testzip() is None
  assert set(z.namelist())=={'agenda-export/'+p.name for p in agenda.iterdir() if p.is_file()}
  for p in agenda.iterdir():
   if p.is_file():assert z.read('agenda-export/'+p.name)==p.read_bytes()
 assert 'Erik van Elten' in (agenda/'LICENSE').read_text()
 assert 'Erik van Elten' in (agenda/'LEESMIJ.md').read_text()
 assert 'Erik van Elten' in (root/'README.md').read_text()
 print('OK: apart Agenda-exportpakket bytegelijk aan Master-bron; oorspronkelijke maker en licentie vermeld.')
