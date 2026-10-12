#!/usr/bin/env python3
"""给静态资源加内容哈希 ?v=，并生成 sw.js 的版本号与预缓存清单。
改完 assets/、data/、icons/ 或页面后运行：python3 scripts/build.py
"""
import hashlib, json, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ['index.html', 'pronunciation.html']
STATIC = ['assets/app.css', 'assets/app.js', 'manifest.webmanifest',
          'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png']
DATA = sorted(str(p.relative_to(ROOT)) for p in (ROOT / 'data').glob('*.json'))

def h(path):
    return hashlib.sha1((ROOT / path).read_bytes()).hexdigest()[:10]

hashes = {p: h(p) for p in STATIC + DATA}
# app.js 里的数据文件地址
js = (ROOT / 'assets/app.js').read_text(encoding='utf8')
for p in DATA:
    js = re.sub(r"'%s(\?v=[0-9a-f]+)?'" % re.escape(p), "'%s?v=%s'" % (p, hashes[p]), js)
(ROOT / 'assets/app.js').write_text(js, encoding='utf8')
hashes['assets/app.js'] = h('assets/app.js')
for page in PAGES:
    f = ROOT / page
    s = f.read_text(encoding='utf8')
    for p in STATIC:
        s = re.sub(r'(["\'])%s(\?v=[0-9a-f]+)?\1' % re.escape(p), lambda m: '%s%s?v=%s%s' % (m.group(1), p, hashes[p], m.group(1)), s)
    f.write_text(s, encoding='utf8')
assets = ['./', 'index.html', 'pronunciation.html'] + ['%s?v=%s' % (p, hashes[p]) for p in STATIC + DATA]
version = hashlib.sha1(''.join(sorted(hashes.values()) + [h(p) for p in PAGES]).encode()).hexdigest()[:10]
sw = (ROOT / 'sw.js').read_text(encoding='utf8')
sw = re.sub(r"var VERSION='[^']*';", "var VERSION='%s';" % version, sw)
sw = re.sub(r"var ASSETS=.*?;\n", "var ASSETS=%s;\n" % json.dumps(assets), sw, flags=re.S)
(ROOT / 'sw.js').write_text(sw, encoding='utf8')
print('version', version)
