#!/usr/bin/env python3
"""Importeer uitsluitend een gecontroleerde, schone Master; lees de ontwikkelapp niet."""
from pathlib import Path
import argparse, hashlib, json, shutil
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('master',type=Path);args=p.parse_args()
source=args.master/'Gereedschapskist';manifest=json.loads((args.master/'master-bestanden.json').read_text())
actual={str(f.relative_to(source)):hashlib.sha256(f.read_bytes()).hexdigest() for f in source.rglob('*') if f.is_file() and f.name!='.DS_Store'}
assert actual==manifest['files'],'Master wijkt af van het gecontroleerde manifest'
assert not any('persoonlijke-' in name or 'persoonlijk-projectherstel' in name or 'Mijn werk/' in name for name in actual),'Privébestand in Master'
for name in actual:
 f=source/name
 if f.suffix in {'.html','.js','.json','.md','.txt'}:
  text=f.read_text(errors='replace')
  assert not any(x in text for x in ['/Users/','persoonlijke-notities-sync.js','persoonlijke-feedback.js','persoonlijk-projectherstel.js','persoonlijke-nahv-','NAHV-export']),f'Privéreferentie in {name}'
stage=root/'.master-import'
assert not stage.exists(),'Er staat al een importvoorbereiding'
shutil.copytree(source,stage,ignore=shutil.ignore_patterns('.DS_Store'))
shutil.rmtree(root/'app');stage.rename(root/'app')
# The extension shipped with the app is also the repository extension source.
shutil.rmtree(root/'extensies/link-bewaren-lokaal')
shutil.copytree(root/'app/extensies/link-bewaren-lokaal',root/'extensies/link-bewaren-lokaal')
(root/'release').mkdir(exist_ok=True)
(root/'release/master-bestanden.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(f'Geïmporteerd: {len(actual)} gecontroleerde publieke bestanden; geen persoonlijke werkmap gelezen.')
