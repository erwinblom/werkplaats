#!/usr/bin/env python3
"""Maak website en eenvoudige download uit dezelfde gecontroleerde publieksbron."""
from pathlib import Path
import shutil, zipfile, hashlib, subprocess, sys, json
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'app';web=ROOT/'docs';dist=ROOT/'dist'
subprocess.run(['node',str(source/'App-iconen/controleer.cjs')],check=True)
# The imported Master contains the checked extension ZIP. Do not replace it
# with a separately developed extension or alter the app storage namespace.
if web.exists():shutil.rmtree(web)
shutil.copytree(source,web,ignore=shutil.ignore_patterns('.DS_Store'))
homepage=web/'Begin hier.html'
(web/'index.html').write_text(homepage.read_text());(web/'.nojekyll').touch()
launcher='''<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Werkplaats openen</title><link rel="icon" type="image/svg+xml" href="Bestanden/App-iconen/app-icon.svg"></head>
<body><p><a href="Bestanden/Begin%20hier.html">Open Werkplaats →</a></p>
<script>
const destination=new URL('Bestanden/Begin%20hier.html',location.href);
destination.search=location.search;destination.hash=location.hash;
location.replace(destination.href);
</script></body></html>
'''
dist.mkdir(exist_ok=True)
with zipfile.ZipFile(dist/'Werkplaats.zip','w',zipfile.ZIP_DEFLATED) as archive:
 def add(name,content):
  info=zipfile.ZipInfo(name,date_time=(2026,10,8,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;archive.writestr(info,content)
 add('Werkplaats/Begin hier.html',launcher.encode())
 appmaker=zipfile.ZipInfo('Werkplaats/Maak Werkplaats-app.command',date_time=(2026,10,8,0,0,0))
 appmaker.compress_type=zipfile.ZIP_DEFLATED;appmaker.external_attr=0o100755<<16
 archive.writestr(appmaker,(source/'App-iconen/Maak Werkplaats-app.command').read_bytes())
 for file in sorted(source.rglob('*')):
  if file.is_file() and file.name!='.DS_Store':add('Werkplaats/Bestanden/'+str(file.relative_to(source)),file.read_bytes())
with zipfile.ZipFile(dist/'Werkplaats.zip') as archive:assert archive.testzip() is None
sums=hashlib.sha256((dist/'Werkplaats.zip').read_bytes()).hexdigest()+'  Werkplaats.zip\n'
agenda=source/'Uitbreidingen/agenda-export'
if agenda.is_dir():
 version=json.loads((agenda/'uitbreiding.json').read_text())['version']
 agenda_name='Agenda-export-'+version+'.zip'
 with zipfile.ZipFile(dist/agenda_name,'w',zipfile.ZIP_DEFLATED) as archive:
  for file in sorted(agenda.iterdir()):
   if file.is_file():add('agenda-export/'+file.name,file.read_bytes())
 with zipfile.ZipFile(dist/agenda_name) as archive:assert archive.testzip() is None
 sums+=hashlib.sha256((dist/agenda_name).read_bytes()).hexdigest()+'  '+agenda_name+'\n'
(dist/'SHA256SUMS.txt').write_text(sums)
print('Gebouwd: docs/ en dist/Werkplaats.zip; één startbestand en Bestanden/.')
