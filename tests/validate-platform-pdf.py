import json,sys
from pathlib import Path
from pypdf import PdfReader
p=Path(sys.argv[1]);raw=p.read_bytes();assert raw.startswith(b'%PDF-')
r=PdfReader(str(p));texts=[page.extract_text() or '' for page in r.pages]
assert len(r.pages)==2, f'Expected explicit two-page document, got {len(r.pages)}'
assert 'CH510 PDF FIRST PAGE' in texts[0],texts[0]
assert 'CH510 PDF SECOND PAGE' in texts[1],texts[1]
for page in r.pages:
 assert abs(float(page.mediabox.width)-595.28)<2 and abs(float(page.mediabox.height)-841.89)<2,'Expected A4'
assert 'Pagina 1' in texts[0] and 'Pagina 2' in texts[1],texts
print(json.dumps({'file':p.name,'bytes':len(raw),'pages':len(r.pages),'pageSizes':[[float(p.mediabox.width),float(p.mediabox.height)] for p in r.pages],'texts':texts},ensure_ascii=False))
