"""INITE Agents webhook receiver for Python 3.8+, standard library only.

    INITE_WEBHOOK_SECRET=whsec_... python3 receiver.py

Listens on PORT (default 8787) and accepts POSTs on any path. Every delivery
is checked before its body is trusted:

    INITE-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256(secret, "<t>.<raw body>")>

The HMAC is computed over the raw bytes received, never a re-serialised
object. A t more than five minutes from now is refused. INITE-Webhook-Id is
the same on every retry of one event, so a repeat is acknowledged and
dropped. Answer 2xx within ten seconds; anything else is retried after 1, 5,
30, 120 and 360 minutes.

In a framework, keep `verify_signature` and call it with the raw body:
Flask `request.get_data()`, Django `request.body`, FastAPI `await request.body()`.
"""

import hashlib
import hmac
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOLERANCE_S = 300
MAX_BODY = 1024 * 1024
INITE_ORIGIN = "https://inite.ai"


def verify_signature(raw_body: bytes, header, secret: str, now=None) -> bool:
    """True when one of the header's v1 signatures matches and t is within five minutes of now."""
    if not secret or not header:
        return False
    t = None
    signatures = []
    for part in header.split(","):
        key, sep, value = part.strip().partition("=")
        if not sep:
            continue
        if key == "t" and value.isdigit():
            t = int(value)
        elif key == "v1" and value:
            signatures.append(value)
    now = int(time.time()) if now is None else now
    if t is None or abs(now - t) > TOLERANCE_S:
        return False
    want = hmac.new(secret.encode(), f"{t}.".encode() + raw_body, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(want, got) for got in signatures)


# Event ids already handled. In memory for the example; keep them in your
# database in production, so a retry after a restart is still dropped.
_seen = set()
_seen_lock = threading.Lock()


def first_time(event_id: str) -> bool:
    with _seen_lock:
        if event_id in _seen:
            return False
        _seen.add(event_id)
        return True


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def report_published(article_id: str, url: str, site_key: str) -> int:
    """Tell INITE where an approved article was published.

    The address is built here from the article id, never taken from the
    payload, so the site key only ever goes to inite.ai."""
    req = urllib.request.Request(
        f"{INITE_ORIGIN}/api/site/v1/content/{urllib.parse.quote(article_id, safe='')}/published",
        data=json.dumps({"url": url}).encode(),
        headers={"Authorization": f"Bearer {site_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.build_opener(_NoRedirect).open(req, timeout=10) as res:
            return res.status
    except urllib.error.HTTPError as err:
        return err.code


def handle(event: dict) -> None:
    kind = event.get("event")
    if kind == "facts.confirmed":
        # A new version of the facts: refresh whatever serves them.
        print(f"facts.confirmed: {event['site']} is at version {event['version']}", flush=True)
    elif kind == "content.approved":
        # The article exactly as the owner approved it: title, slug,
        # metaDescription, body (Markdown), html, lang, sources.
        print(f"content.approved: \"{event['article']['title']}\" for {event['site']}", flush=True)
        # url = create_post_in_your_cms(event["article"])
        # report_published(event["article"]["id"], url, os.environ["INITE_SITE_KEY"])
    else:
        print(f"ignored event {kind}", flush=True)


def make_handler(secret: str):
    class Receiver(BaseHTTPRequestHandler):
        def _answer(self, status: int, text: str = "") -> None:
            body = text.encode()
            self.send_response(status)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self):
            length = int(self.headers.get("Content-Length") or 0)
            if length > MAX_BODY:
                return self._answer(413, "too large\n")
            raw = self.rfile.read(length)
            if not verify_signature(raw, self.headers.get("INITE-Signature"), secret):
                return self._answer(401, "bad signature\n")
            try:
                event = json.loads(raw)
            except ValueError:
                return self._answer(400, "bad json\n")
            event_id = self.headers.get("INITE-Webhook-Id") or event.get("id", "")
            if not first_time(event_id):
                return self._answer(200, "already handled\n")
            # Acknowledge first; do the slow work (a CMS call) after the answer.
            self._answer(200, "ok\n")
            threading.Thread(target=handle, args=(event,), daemon=True).start()

        def log_message(self, fmt, *args):
            sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))

    return Receiver


if __name__ == "__main__":
    secret = os.environ.get("INITE_WEBHOOK_SECRET", "")
    if not secret:
        sys.exit("Set INITE_WEBHOOK_SECRET to the secret the cabinet showed when you added the address.")
    port = int(os.environ.get("PORT", "8787"))
    print(f"listening on http://localhost:{port}", flush=True)
    ThreadingHTTPServer(("", port), make_handler(secret)).serve_forever()
