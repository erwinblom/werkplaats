from pathlib import Path, PurePosixPath
import hashlib, json, os, re, tempfile, zipfile

candidate = Path(os.environ['RELEASE_ZIP']).resolve(strict=True)
expected = os.environ['EXPECTED_ZIP_SHA256']
if not re.fullmatch(r'[a-f0-9]{64}', expected):
    raise ValueError('EXPECTED_ZIP_SHA256 must be an exact lowercase SHA-256')
digest = hashlib.sha256(candidate.read_bytes()).hexdigest()
if digest != expected:
    raise ValueError(f'Candidate hash mismatch: {digest}')
# Always extract into a fresh disposable directory, never into app/ or a user workspace.
extract = Path(tempfile.mkdtemp(prefix='ch753-candidate-', dir=os.environ.get('RUNNER_TEMP')))
out = Path('platform-evidence'); out.mkdir(exist_ok=True)
with zipfile.ZipFile(candidate) as archive:
    if archive.testzip() is not None:
        raise ValueError('ZIP CRC failed')
    infos = archive.infolist()
    names = [i.filename for i in infos]
    if len({n.casefold() for n in names}) != len(names):
        raise ValueError('Duplicate/case-colliding ZIP paths')
    for info in infos:
        name = info.filename
        p = PurePosixPath(name)
        if not name or '\\' in name or ':' in name or p.is_absolute() or '..' in p.parts or not p.parts or p.parts[0] != 'Werkplaats':
            raise ValueError(f'Unsafe ZIP path: {name!r}')
        # Refuse Unix symbolic links: extraction must contain only normal files/dirs.
        if (info.external_attr >> 16) & 0o170000 == 0o120000:
            raise ValueError(f'ZIP symlink refused: {name!r}')
        dest = extract.joinpath(*p.parts)
        if info.is_dir():
            dest.mkdir(parents=True, exist_ok=True)
        else:
            dest.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(info) as src, dest.open('wb') as target:
                while block := src.read(1024 * 1024):
                    target.write(block)
app = extract / 'Werkplaats' / 'Bestanden'
launcher = extract / 'Werkplaats' / 'Begin hier.html'
if not launcher.is_file() or not (app / 'Apps' / 'Databases' / 'Start Databases.html').is_file():
    raise ValueError('Expected downloaded launcher or Ordenen missing')
files = [p for p in app.rglob('*') if p.is_file()]
if not files:
    raise ValueError('Candidate contains no app files')
(out / 'candidate.json').write_text(json.dumps({'sha256':digest,'appFiles':len(files),'zipCRC':'pass','sourceCommit':os.environ.get('CANDIDATE_COMMIT','not supplied')}, indent=2))
if os.environ.get('GITHUB_ENV'):
    with open(os.environ['GITHUB_ENV'], 'a', encoding='utf-8') as f:
        f.write(f'APP_ROOT={app}\nRELEASE_LAUNCHER={launcher}\n')
print(f'Candidate verified: sha256={digest}, app files={len(files)}')
print('App root:', app)
