"""
Serves chat.html on http://localhost:4000
No install needed — uses Python's built-in http.server.

    python server.py
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 4000
DIR  = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def log_message(self, fmt, *args):
        # Only log non-asset requests; args[0] may be a str or HTTPStatus object
        msg = str(args[0]) if args else ''
        if not any(msg.endswith(ext) for ext in (".css", ".js", ".ico", ".png")):
            print(f"  {self.address_string()} → {msg}")

    def end_headers(self):
        # Allow the page to call localhost:8000 (PromptShield backend)
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


def main():
    os.chdir(DIR)

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/chat.html"
        print(f"\n🚀  Demo server running at  {url}")
        print(f"   Make sure PromptShield backend is running on port 8000")
        print(f"   Press Ctrl+C to stop\n")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
