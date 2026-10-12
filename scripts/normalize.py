import re
def _common(p):
    p=p.replace('\u200b','').replace('\xa0',' ').replace('；','; ').replace('‘',"'")
    p=re.sub(r'\\+:', 'ə:', p)
    p=p.replace('(?@) ','').replace('^','ɡ')
    p=p.replace('ә','ə').replace('єә','eə').replace('εә','eə').replace('є','e').replace('ε','e')
    p=re.sub(r'\.\s+','; ',p)
    return p
def _stress(p):
    p=p.replace("'",'ˈ')
    p=re.sub(r',(?=[^\s\-])','ˌ',p)
    if not re.search(r'\([a-z]+\.',p):
        p=re.sub(r'\.(?=[^\s.;,)/])','ˌ',p)
    p=p.replace(':','ː')
    out=[];depth=0
    for ch in p:
        if ch=='(':depth+=1
        elif ch==')':depth=max(0,depth-1)
        out.append('ɡ' if ch=='g' and depth==0 else ch)
    p=''.join(out)
    p=re.sub(r'ˈ\s+','ˈ',p); p=re.sub(r'ˌ\s+','ˌ',p)
    p=re.sub(r';(?=\S)','; ',p)
    p=p.replace('ˌˈ','; ˈ').replace('oʊ','əʊ')
    p=re.sub(r'^,\s*','ˌ',p)
    return p
def _brit(p):
    p=re.sub(r'əj(?!u)','əu',p); p=p.replace('aj','au')
    for a,b in [('ɒ:','ɔ:'),('ɒi','ɔi'),('ə:','ɜː'),('ɜ:','ɜː'),('i:','iː'),('u:','uː'),('ɑ:','ɑː'),('ɔ:','ɔː'),('a:','ɑː'),
                ('əu','əʊ'),('ei','eɪ'),('ai','aɪ'),('au','aʊ'),('ɔi','ɔɪ'),
                ('iə','ɪə'),('uə','ʊə')]:
        p=p.replace(a,b)
    p=re.sub(r"i(?!ː)(?=[^/\s;,()]*[^/\s;,()ˈ'ˌ-])", 'ɪ', p)
    p=re.sub(r'u(?!ː)','ʊ',p)
    p=re.sub(r'ɔ(?![ːɪ])','ɒ',p)
    return p
FIX={'simultaneously':'/ˌsɪməlˈteɪnɪəsli/','philanthropic':'/ˌfɪlənˈθrɒpɪk/','psychiatric':'/ˌsaɪkiˈætrɪk/',
     'paddler':'/ˈpædlə/','passengers':'/ˈpæsɪndʒəz/','survivability':'/səˌvaɪvəˈbɪlɪti/','entrepreneurship':'/ˌɒntrəprəˈnɜːʃɪp/'}
def ipa(word,p,ec=None):
    if word in FIX: return FIX[word]
    if ec and ec.get(word):
        p=_stress(_brit(_common(ec[word])))
    else:
        p=_stress(_common(p or '').strip())
    p=p.strip()
    if not p: return ''
    p=p.strip('/')
    return '/'+p+'/'
POSRE=r'(?:n|v|vt|vi|adj|adv|prep|pron|conj|interj|num|aux|abbr|art|pl)\.'
def meaning(m):
    m=(m or '').replace('\u200b','').strip()
    m=re.sub(r'(^|[;；]\s*|\s)a\.(?=\s)',lambda x:x.group(1)+'adj.',m)
    m=re.sub(r'(^|[;；]\s*|\s)ad\.(?=\s)',lambda x:x.group(1)+'adv.',m)
    parts=re.split(r'\s*[;；]\s*(?='+POSRE+')',m)
    out=[]
    for part in parts:
        mm=re.match('('+POSRE+r')\s*(.*)$',part,re.S)
        pos,body=(mm.group(1),mm.group(2)) if mm else ('',part)
        body=re.sub(r'\s*,\s*','，',body); body=re.sub(r'\s*;\s*','；',body)
        body=body.strip('，；; ')
        out.append((pos+' '+body).strip())
    return '；'.join(o for o in out if o)
