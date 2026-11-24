"""Write the potty songs (scripts/songs.json) into app/src/lib/content.ts as SONGS, with CDN audio URLs."""
import json, os, re

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
songs = json.load(open(os.path.join(root, 'scripts', 'songs.json'), encoding='utf-8'))
CDN = 'https://cdn.shopify.com/s/files/1/0684/6149/4493/files/'


def lit(x):
    return json.dumps(x, ensure_ascii=False)


TIMES = json.load(open(os.path.join(root, 'scripts', 'song-times.json'), encoding='utf-8'))


def norm(x):
    return re.sub(r'[^a-z0-9]', '', x.lower())


def line_times(lines, timed):
    """Start second of each sung line, matched in order to Suno's word timings (None if not found)."""
    out, p = [], 0
    for ln in lines:
        if not ln:
            continue
        k = next((j for j in range(p, len(timed)) if norm(timed[j][1]) == norm(ln)), None)
        if k is None:
            out.append(None)
        else:
            out.append(timed[k][0]); p = k + 1
    return out


rows = []
for n, s in enumerate(songs):
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
    ts = line_times(out, TIMES[n])
    print(s['t'], sum(t is not None for t in ts), '/', len(ts), 'lines timed')
    rows.append(' {t:%s,tag:%s,a:%s,ts:[%s],l:[%s]},' % (lit(s['t']), lit(s['tag']), lit(s['url']),
                ','.join('null' if t is None else str(t) for t in ts), ','.join(lit(l) for l in out)))

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
