import base64
import os
from pathlib import Path
import tempfile
import threading
import unittest
import urllib.request
import urllib.error
import json
from http.server import ThreadingHTTPServer
from server import WritingStore, make_handler, fingerprint


class WritingTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)
        self.root = self.base/'Schrijven'
        self.root.mkdir()
        (self.root/'proef.md').write_text('# Eerste versie\n')
        self.store = WritingStore(self.root, self.base/'recovery')

    def tearDown(self):
        self.tmp.cleanup()

    def test_roundtrip_conflict_and_recovery(self):
        original = self.store.execute({'op':'read','path':'proef.md'})
        data = '# Gewijzigd\nÉén echte tekst.\n'.encode()
        body = {'op':'write','path':'proef.md','revision':original['revision'],'data':base64.b64encode(data).decode()}
        self.store.execute(body)
        self.assertEqual((self.root/'proef.md').read_bytes(), data)
        self.assertEqual(next((self.base/'recovery').iterdir()).read_bytes(), b'# Eerste versie\n')
        with self.assertRaises(RuntimeError): self.store.execute(body)
        reopened = WritingStore(self.root, self.base/'recovery')
        self.assertEqual(reopened.execute({'op':'read','path':'proef.md'})['revision'],fingerprint(data))

    def test_editor_recovery_directory(self):
        # The editor preserves a previous version before replacing the document.
        folder = '.werkbank-herstel/' + 'a' * 64
        self.store.execute({'op':'stat','path':'.werkbank-herstel','kind':'directory','create':True})
        self.store.execute({'op':'stat','path':folder,'kind':'directory','create':True})
        backup = folder + '/vorige.md'
        self.store.execute({'op':'stat','path':backup,'kind':'file','create':True})
        self.store.execute({'op':'write','path':backup,'revision':fingerprint(b''),'data':base64.b64encode(b'# Eerste versie\n').decode()})
        self.assertEqual(base64.b64decode(self.store.execute({'op':'read','path':backup})['data']), b'# Eerste versie\n')
        self.assertNotIn('.werkbank-herstel', [x['name'] for x in self.store.execute({'op':'list'})['entries']])
        self.assertEqual(self.store.execute({'op':'list','path':folder})['entries'][0]['name'],'vorige.md')

    def test_boundaries(self):
        (self.root/'.ignore').write_text('Herstelkopieen/\n')
        self.assertEqual(base64.b64decode(self.store.execute({'op':'read','path':'.ignore'})['data']), b'Herstelkopieen/\n')
        for name in ['../outside.md','/outside.md','x/../../a','a\\b','.hidden','.werkbank-herstel-ander/x','a//b','.werkbank-herstel/../outside.md']:
            with self.assertRaises(ValueError): self.store.execute({'op':'read','path':name})
        outside = self.base/'outside.md'
        outside.write_text('private')
        (self.root/'link.md').symlink_to(outside)
        with self.assertRaises(ValueError): self.store.execute({'op':'read','path':'link.md'})
        self.assertNotIn('link.md', [x['name'] for x in self.store.execute({'op':'list'})['entries']])

    def test_create_move_remove_has_recovery(self):
        self.store.execute({'op':'stat','path':'Inbox','kind':'directory','create':True})
        self.store.execute({'op':'stat','path':'Inbox/nieuw.md','kind':'file','create':True})
        body = {'op':'remove','path':'proef.md','revision':fingerprint(b'# Eerste versie\n')}
        self.store.execute(body)
        self.assertFalse((self.root/'proef.md').exists())
        self.assertEqual(next((self.base/'recovery').iterdir()).read_bytes(),b'# Eerste versie\n')
        with self.assertRaises(ValueError): self.store.execute({'op':'remove','path':''})

    @unittest.skipUnless(os.environ.get('WERKPLAATS_HTTP_PROEF') == '1', 'HTTP-proef apart uitvoeren')
    def test_http_security(self):
        server = ThreadingHTTPServer(('127.0.0.1',0),make_handler(self.store,'test-secret'))
        thread = threading.Thread(target=server.serve_forever,daemon=True)
        thread.start()
        try:
            url = f'http://127.0.0.1:{server.server_port}/fs'
            def call(origin='null',token='test-secret',host=None):
                headers={'Origin':origin,'X-Werkplaats-Schrijven':token,'Content-Type':'application/json'}
                if host: headers['Host']=host
                request=urllib.request.Request(url,json.dumps({'op':'list'}).encode(),headers)
                try:
                    with urllib.request.urlopen(request) as result:return result.status,json.load(result)
                except urllib.error.HTTPError as result:return result.code,json.load(result)
            self.assertEqual(call()[0],200)
            self.assertEqual(call(origin='https://evil.example')[0],403)
            self.assertEqual(call(token='wrong')[0],403)
            self.assertEqual(call(host='evil.example')[0],403)
        finally:
            server.shutdown()
            server.server_close()


if __name__=='__main__':unittest.main()
