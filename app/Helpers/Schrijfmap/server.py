"""Private loopback adapter for one explicitly configured writing directory."""
import argparse
import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MAX_BYTES = 24 * 1024 * 1024


def fingerprint(data):
    return hashlib.sha256(data).hexdigest()


class WritingStore:
    def __init__(self, root, recovery):
        self.root = Path(root).resolve(strict=True)
        self.recovery = Path(recovery)
        self.lock = threading.RLock()

    def path(self, relative):
        if not isinstance(relative, str) or '\\' in relative or '\x00' in relative:
            raise ValueError('Ongeldig pad.')
        parts = relative.split('/') if relative else []
        if any(not p or p in ('.', '..') or (p.startswith('.') and p not in ('.ignore', '.werkbank-herstel')) for p in parts):
            raise ValueError('Ongeldig pad.')
        target = self.root
        for part in parts:
            target = target / part
            if target.is_symlink():
                raise ValueError('Symbolische links worden niet geopend.')
        if not target.resolve().is_relative_to(self.root):
            raise ValueError('Pad buiten Schrijven.')
        return target

    def snapshot(self, target):
        data = target.read_bytes()
        if len(data) > MAX_BYTES:
            raise ValueError('Bestand te groot voor de lokale verbinding.')
        return {'data': base64.b64encode(data).decode(), 'revision': fingerprint(data),
                'modified': int(target.stat().st_mtime * 1000), 'size': len(data)}

    def backup(self, target, data):
        self.recovery.mkdir(parents=True, exist_ok=True)
        name = str(time.time_ns()) + '-' + target.name
        backup = self.recovery / name
        backup.write_bytes(data)
        os.chmod(backup, 0o600)
        if backup.read_bytes() != data:
            raise OSError('Herstelkopie niet bevestigd.')

    def execute(self, body):
        with self.lock:
            operation = body['op']
            target = self.path(body.get('path', ''))
            if operation == 'list':
                return {'entries': [{'name': p.name, 'kind': 'directory' if p.is_dir() else 'file'}
                        for p in sorted(target.iterdir()) if not p.name.startswith('.') and not p.is_symlink()]}
            if operation == 'stat':
                kind = body['kind']
                if kind not in ('file', 'directory'):
                    raise ValueError('Ongeldig bestandstype.')
                if not target.exists() and body.get('create'):
                    if kind == 'directory':
                        target.mkdir()
                    else:
                        with target.open('xb'):
                            pass
                if not target.exists():
                    raise FileNotFoundError('Bestand of map niet gevonden.')
                if target.is_dir() != (kind == 'directory'):
                    raise TypeError('Dit bestand heeft een ander type.')
                return {'kind': kind}
            if operation == 'read':
                return self.snapshot(target)
            if operation == 'write':
                data = base64.b64decode(body['data'], validate=True)
                if len(data) > MAX_BYTES:
                    raise ValueError('Bestand te groot.')
                old = target.read_bytes()
                if fingerprint(old) != body.get('revision'):
                    raise RuntimeError('Het bestand is elders gewijzigd. Je bewerking blijft in Schrijven staan.')
                if data == old:
                    return {'revision': fingerprint(data)}
                self.backup(target, old)
                fd, name = tempfile.mkstemp(prefix='.werkplaats-', dir=target.parent)
                try:
                    with os.fdopen(fd, 'wb') as stream:
                        stream.write(data)
                        stream.flush()
                        os.fsync(stream.fileno())
                    os.chmod(name, target.stat().st_mode & 0o777)
                    if target.read_bytes() != old:
                        raise RuntimeError('Het bestand is intussen gewijzigd. Bewaren gestopt.')
                    os.replace(name, target)
                finally:
                    if os.path.exists(name):
                        os.unlink(name)
                if target.read_bytes() != data:
                    raise OSError('Bewaarde tekst niet bevestigd.')
                return {'revision': fingerprint(data)}
            if operation == 'remove':
                if target == self.root or target.is_dir():
                    raise ValueError('Mappen verwijderen wordt niet ondersteund.')
                data = target.read_bytes()
                if fingerprint(data) != body.get('revision'):
                    raise RuntimeError('Bestand gewijzigd; verwijderen gestopt.')
                self.backup(target, data)
                target.unlink()
                return {'ok': True}
            raise ValueError('Onbekende functie.')


def make_handler(store, token, extra_origins=()):
    allowed_origins = {'null', *extra_origins}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def allowed(self):
            return (self.headers.get('Host') == f'127.0.0.1:{self.server.server_port}'
                    and self.headers.get('Origin') in allowed_origins)

        def reply(self, status, data):
            encoded = json.dumps(data, ensure_ascii=False).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(encoded)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            if self.allowed():
                self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
                self.send_header('Vary', 'Origin')
            self.end_headers()
            self.wfile.write(encoded)

        def do_OPTIONS(self):
            if not self.allowed():
                return self.reply(403, {'error': 'Geen toegang.'})
            self.send_response(204)
            self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
            self.send_header('Access-Control-Allow-Methods', 'POST')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Werkplaats-Schrijven')
            self.send_header('Vary', 'Origin')
            self.end_headers()

        def do_GET(self):
            # No file listings, credentials or paths in the public health response.
            if self.path == '/health' and self.headers.get('Host') == f'127.0.0.1:{self.server.server_port}':
                return self.reply(200, {'service': 'werkplaats-schrijfmap-v1'})
            self.reply(403, {'error': 'Geen toegang.'})

        def do_POST(self):
            if (not self.allowed() or self.path != '/fs'
                    or not hmac.compare_digest(self.headers.get('X-Werkplaats-Schrijven', ''), token)):
                return self.reply(403, {'error': 'Geen toegang.'})
            try:
                if self.headers.get('Content-Type') != 'application/json':
                    raise ValueError('Ongeldig verzoek.')
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length < MAX_BYTES * 2:
                    raise ValueError('Ongeldig verzoek.')
                result = store.execute(json.loads(self.rfile.read(length)))
                self.reply(200, result)
            except FileNotFoundError as error:
                self.reply(404, {'error': str(error), 'name': 'NotFoundError'})
            except TypeError as error:
                self.reply(400, {'error': str(error), 'name': 'TypeMismatchError'})
            except RuntimeError as error:
                self.reply(409, {'error': str(error), 'name': 'InvalidStateError'})
            except (ValueError, KeyError):
                self.reply(400, {'error': 'Ongeldig verzoek of pad.', 'name': 'NotAllowedError'})
            except OSError:
                self.reply(500, {'error': 'De Schrijven-map kan niet worden gelezen of bewaard.', 'name': 'NotReadableError'})

    return Handler


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', required=True)
    args = parser.parse_args()
    config = json.loads(Path(args.config).read_text())
    store = WritingStore(config['root'], config['recovery'])
    ThreadingHTTPServer(('127.0.0.1', config['port']), make_handler(store, config['token'])).serve_forever()
