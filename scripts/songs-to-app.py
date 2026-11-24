"""Write the potty songs (scripts/songs.json) into app/src/lib/content.ts as SONGS, with CDN audio URLs."""
import json, os, re

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
songs = json.load(open(os.path.join(root, 'scripts', 'songs.json'), encoding='utf-8'))
CDN = 'https://cdn.shopify.com/s/files/1/0684/6149/4493/files/'


def lit(x):
    return json.dumps(x, ensure_ascii=False)


rows = []
for s in songs:
    out = []
    for ln in s['lyrics'].split('\n'):
        ln = ln.strip()
        if re.match(r'^\[.*\]$', ln):
            continue
        if ln == '' and (not out or out[-1] == ''):
            continue
        out.append(ln)
    while out and out[-1] == '':
        out.pop()
    s['url'] = CDN + s['file']
    rows.append(' {t:%s,tag:%s,a:%s,l:[%s]},' % (lit(s['t']), lit(s['tag']), lit(s['url']), ','.join(lit(l) for l in out)))

json.dump(songs, open(os.path.join(root, 'scripts', 'songs.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
p = os.path.join(root, 'app', 'src', 'lib', 'content.ts')
c = open(p, encoding='utf-8').read()
i = c.index('export const SONGS: Song[] = [')
j = c.index('\n];', i)
head = ('// Potty songs: written for Potty Up, sung by Suno (via kie.ai), hosted on the UpAiry Shopify CDN.\n'
        '// Source lyrics and both Suno versions: scripts/songs.json. Audio files: songs-audio/ (not in git).\n')
k = c.rfind('\n', 0, i)
prev = c[:k + 1]
if prev.rstrip().endswith('(not in git).'):
    prev = prev[:prev.rfind('// Potty songs:')]
c = prev + head + 'export const SONGS: Song[] = [\n' + '\n'.join(rows) + c[j:]
open(p, 'w', encoding='utf-8', newline='').write(c)
print(len(rows), 'songs written')
