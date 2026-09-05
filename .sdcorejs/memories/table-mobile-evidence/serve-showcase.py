from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, unquote
root=Path.cwd().resolve()
site=root/'showcase/dist/showcase/browser'
class Handler(SimpleHTTPRequestHandler):
 def translate_path(self,path):
  rel=unquote(urlparse(path).path).lstrip('/')
  base=root/'published-docs' if rel.startswith('docs/') else site
  if rel.startswith('docs/'): rel=rel[5:]
  target=(base/rel).resolve()
  if not target.is_relative_to(base): return str(site/'index.html')
  return str(target if target.is_file() else site/'index.html')
 def log_message(self,*args): pass
print('Showcase review server http://127.0.0.1:4300',flush=True)
ThreadingHTTPServer(('127.0.0.1',4300),Handler).serve_forever()
