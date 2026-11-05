from pathlib import Path,PurePosixPath
import hashlib,zipfile,shutil,json
candidate=Path('fixtures/Werkplaats-CH535.zip')
h=hashlib.sha256(candidate.read_bytes()).hexdigest()
assert h=="4de97d730e130dee2d64fc777d6eaeb5e45b467c195a4fe646928097869dc883",h
out=Path('platform-evidence');out.mkdir(exist_ok=True)
with zipfile.ZipFile(candidate) as z:
 assert z.testzip() is None
 names=z.namelist();assert len(names)==len(set(names))
 assert all(not PurePosixPath(n).is_absolute() and '..' not in PurePosixPath(n).parts for n in names)
 if Path('app').exists():shutil.rmtree('app')
 prefix='Werkplaats/Bestanden/'
 files=[n for n in names if n.startswith(prefix) and not n.endswith('/')]
 assert len(files)==259,len(files)
 for name in files:
  path=Path('app')/name[len(prefix):];path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(z.read(name))
 assert (Path('app')/'databases.js').is_file()
(out/'candidate.json').write_text(json.dumps({'sha256':h,'appFiles':len(files),'zipCRC':'pass','sourceCommit':'ea07567'},indent=2))
print('Exact CH535 candidate verified and extracted: '+h)
