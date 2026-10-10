#!/usr/bin/env python3
"""Maak website en eenvoudige download uit dezelfde gecontroleerde publieksbron."""
from pathlib import Path
import shutil, zipfile, hashlib, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'app';web=ROOT/'docs';dist=ROOT/'dist'
# The imported Master contains the checked extension ZIP. Do not replace it
# with a separately developed extension or alter the app storage namespace.
if web.exists():shutil.rmtree(web)
shutil.copytree(source,web,ignore=shutil.ignore_patterns('.DS_Store'))
homepage=web/'Begin hier.html'
(web/'index.html').write_text(homepage.read_text());(web/'.nojekyll').touch()
launcher='''<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Werkplaats openen</title></head>
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
 for file in sorted(source.rglob('*')):
  if file.is_file() and file.name!='.DS_Store':add('Werkplaats/Bestanden/'+str(file.relative_to(source)),file.read_bytes())
with zipfile.ZipFile(dist/'Werkplaats.zip') as archive:assert archive.testzip() is None
(dist/'SHA256SUMS.txt').write_text(hashlib.sha256((dist/'Werkplaats.zip').read_bytes()).hexdigest()+'  Werkplaats.zip\n')
print('Gebouwd: docs/ en dist/Werkplaats.zip; één startbestand en Bestanden/.')
