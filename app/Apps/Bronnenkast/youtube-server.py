"""Serve only the local YouTube embed page for the Werkplaats desktop starter."""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


PORT = 8779
HEALTH = b"werkplaats-youtube-player-v1\n"
PLAYER = Path(__file__).with_name("youtube-player.html")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/health":
            self.respond(200, "text/plain; charset=utf-8", HEALTH)
        elif path == "/player":
            self.respond(200, "text/html; charset=utf-8", PLAYER.read_bytes())
        else:
            self.respond(404, "text/plain; charset=utf-8", b"Niet gevonden.\n")

    def respond(self, status, content_type, body):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
