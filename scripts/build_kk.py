#!/usr/bin/env python3
"""content/kk-lesson.md + content/kk-vs-ipa.md -> kk.html（音标课页面）。改 md 后运行，再跑 build.py。"""
import pathlib, re, subprocess, html
ROOT = pathlib.Path(__file__).resolve().parent.parent
VID = 'https://www.youtube.com/watch?v=eLSOXxHa8Ps'

def frag(md):
    text = (ROOT / 'content' / md).read_text(encoding='utf8')
    text = re.sub(r'^---\n.*?\n---\n', '', text, flags=re.S)
    out = subprocess.run(['pandoc', '-f', 'gfm+pipe_tables', '-t', 'html5', '--shift-heading-level-by=1', '--wrap=none'],
                         input=text, capture_output=True, text=True, check=True).stdout
    return out

def secs(ts):
    p = [int(x) for x in ts.split(':')]
    return p[0]*3600 + p[1]*60 + p[2]

def process(h, prefix, link_ts):
    # 表格横向可滚动
    h = re.sub(r'<table>', '<div class="tbl"><table>', h); h = h.replace('</table>', '</table></div>')
    toc = []
    def h2(m):
        n = len(toc); ident = '%s-%d' % (prefix, n)
        title = re.sub('<[^>]+>', '', m.group(2)); toc.append((ident, title))
        return '<h2 id="%s">%s</h2>' % (ident, m.group(2))
    h = re.sub(r'<h2( id="[^"]*")?>(.*?)</h2>', h2, h)
    if link_ts:
        def h3(m):
            inner = re.sub(r'(?<![\d:])(\d:\d\d:\d\d)(?![\d])', lambda t: '<a class="ts" href="%s&t=%ds" target="_blank" rel="noopener">%s</a>' % (VID, secs(t.group(1)), t.group(1)), m.group(2), count=1)
            return '<h3%s>%s</h3>' % (m.group(1) or '', inner)
        h = re.sub(r'<h3( id="[^"]*")?>(.*?)</h3>', h3, h)
    h = h.replace('[?]', '<span class="q" title="转写不清或看不到板书">[?]</span>')
    return h, toc

a, ta = process(frag('kk-lesson.md'), 'a', True)
b, tb = process(frag('kk-vs-ipa.md'), 'b', False)
def tochtml(t):
    return '<nav class="toc">' + ''.join('<a href="#%s">%s</a>' % (i, html.escape(re.split(r'[　：]', re.sub(r'（.*?）', '', x))[0])) for i, x in t) + '</nav>'

page = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="color-scheme" content="light dark" />
<meta name="theme-color" content="#f3f1ec" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#171916" media="(prefers-color-scheme: dark)" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="manifest" href="manifest.webmanifest" />
<link rel="icon" href="icons/icon-192.png" type="image/png" />
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png" />
<title>KK 音标课 · 英语学习</title>
<style>
:root{color-scheme:light dark;--bg:#f3f1ec;--panel:#fffefa;--panel-2:#ebe8df;--ink:#1d211d;--muted:#64675f;--line:#d4d0c6;--accent:#e45a35;--accent-soft:#ffe2d6;--lime:#d5eb74;--lime-ink:#273000}
@media(prefers-color-scheme:dark){:root{--bg:#171916;--panel:#21241f;--panel-2:#2a2d27;--ink:#f4f1e8;--muted:#b8bbb1;--line:#3b3e36;--accent:#ff7652;--accent-soft:#4a2920;--lime:#bfd35e;--lime-ink:#1d2500}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans","Doulos SIL","Charis SIL",sans-serif;line-height:1.7}
.wrap{max-width:940px;margin:0 auto;padding:28px clamp(16px,4vw,40px) 90px}
.back{display:inline-flex;gap:8px;color:var(--muted);text-decoration:none;font-size:14px;font-weight:600;margin-bottom:26px}.back:hover{color:var(--ink)}
.hero h1{margin:0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(36px,5.5vw,60px);font-weight:400;letter-spacing:-.03em;line-height:1.05}
.hero .sub{color:var(--accent);font-weight:700;font-size:14px;margin:14px 0 6px;letter-spacing:.06em}
.hero p{color:var(--muted);max-width:660px;margin:0 0 8px;font-size:15px}.hero a{color:var(--accent)}
.tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:26px 0 18px;position:sticky;top:0;background:var(--bg);z-index:5;padding-top:8px}
.tab{border:0;background:transparent;padding:12px 16px;cursor:pointer;color:var(--muted);border-bottom:3px solid transparent;margin-bottom:-1px;font-weight:700;font-size:15px}.tab.active{color:var(--ink);border-color:var(--accent)}
.panel{display:none}.panel.active{display:block}
.toc{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px}.toc a{font-size:13px;text-decoration:none;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:99px;padding:5px 12px}.toc a:hover{background:var(--panel-2)}
.doc h2{font-family:Georgia,"Times New Roman",serif;font-size:28px;font-weight:400;letter-spacing:-.02em;margin:46px 0 12px;scroll-margin-top:64px}.doc h3{scroll-margin-top:64px}
.doc h3{font-size:17px;margin:26px 0 8px;padding:12px 16px;background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--lime);border-radius:8px}
.doc h4{font-size:15px;margin:18px 0 6px}
.doc p,.doc li{font-size:15px}.doc ul,.doc ol{padding-left:22px}.doc li{margin:3px 0}
.doc strong{color:var(--ink)}.doc hr{border:0;border-top:1px solid var(--line);margin:30px 0}
.doc blockquote{margin:12px 0;padding:8px 16px;border-left:3px solid var(--accent);background:var(--accent-soft);border-radius:0 8px 8px 0}
.doc code{font-family:inherit;background:var(--panel-2);padding:1px 5px;border-radius:4px}
.tbl{overflow-x:auto;margin:14px 0;border:1px solid var(--line);border-radius:10px;background:var(--panel);-webkit-overflow-scrolling:touch}
table{border-collapse:collapse;width:100%;font-size:14px;min-width:560px}th,td{padding:9px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{background:var(--panel-2);font-weight:700;white-space:nowrap}tr:last-child td{border-bottom:0}
td:first-child{white-space:nowrap;font-weight:600}
a.ts{color:var(--accent);text-decoration:none;font-family:Georgia,serif;font-weight:400}a.ts:hover{text-decoration:underline}
.q{color:var(--accent);font-weight:700;cursor:help}
.note{font-size:13px;color:var(--muted);border-top:1px solid var(--line);margin-top:40px;padding-top:14px}
@media(max-width:600px){.doc h2{font-size:24px}.tab{padding:10px 12px;font-size:14px}table{font-size:13px}}
</style>
</head>
<body>
<div class="wrap">
<a class="back" href="index.html">← 返回英语学习</a>
<div class="hero">
  <h1>KK 音标课</h1>
  <div class="sub">周育如老师 · 透过字母学音标</div>
  <p>按 <a href="@@vid@@" target="_blank" rel="noopener">YouTube《K.K 音標英文教學（自然發音）》</a>（约 1:55:03，连续四堂课）逐段整理：顺序、口诀、例词和作业都照老师课堂。点时间戳可直接跳到视频对应位置。另附 KK 音标与现代国际音标（IPA）的对照。</p>
</div>
<div class="tabs" role="tablist"><button class="tab active" data-p="lesson" role="tab">课堂教案</button><button class="tab" data-p="ipa" role="tab">KK 与 IPA 对照</button></div>
<section class="panel active" id="lesson">@@ta@@<div class="doc">@@a@@</div></section>
<section class="panel" id="ipa">@@tb@@<div class="doc">@@b@@</div></section>
<p class="note">教案依视频语音整理，看不到黑板，音标符号按老师读音与 KK 惯例还原；标 <span class="q">[?]</span> 处为听不清或无法确定的板书。</p>
</div>
<script>
(function(){var tabs=document.querySelectorAll('.tab');function show(p){tabs.forEach(function(t){t.classList.toggle('active',t.dataset.p===p)});document.querySelectorAll('.panel').forEach(function(x){x.classList.toggle('active',x.id===p)})}
tabs.forEach(function(t){t.addEventListener('click',function(){show(t.dataset.p);history.replaceState(null,'','#'+t.dataset.p)})});
var h=location.hash.slice(1);if(h==='ipa'||/^b-/.test(h))show('ipa');
document.querySelectorAll('.toc a').forEach(function(a){a.addEventListener('click',function(){var id=a.getAttribute('href').slice(1);show(/^b-/.test(id)?'ipa':'lesson')})});
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}})();
</script>
</body>
</html>
'''
for k, v in {'vid': VID, 'ta': tochtml(ta), 'tb': tochtml(tb), 'a': a, 'b': b}.items():
    page = page.replace('@@%s@@' % k, v)
(ROOT / 'kk.html').write_text(page, encoding='utf8')
print('kk.html', len(page), 'toc', len(ta), len(tb))
