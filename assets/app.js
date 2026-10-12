(function(){
'use strict';
var EXAMS=['BEC','IELTS','CET6','TOEFL'];
var DATA_FILES={BEC:'data/bec.json?v=9fa037c913',IELTS:'data/ielts.json?v=930872d47a',CET6:'data/cet6.json?v=5e4e7599e9',TOEFL:'data/toefl.json?v=deeceaa20d',CORE:'data/core.json?v=d7656640bc'};
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function examName(e){return e==='TOEFL'?'托福':e==='IELTS'?'雅思':e}
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function toast(msg){var t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('show')},2200)}
var SPEAK_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';

/* ---------- 发音（浏览器 TTS） ---------- */
var tts={
  ok:'speechSynthesis' in window&&'SpeechSynthesisUtterance' in window,
  voices:[],
  accent:store('elb-accent')==='us'?'us':'uk',
  load:function(){if(!tts.ok)return;tts.voices=speechSynthesis.getVoices()||[]},
  pick:function(accent){
    var want=accent==='us'?['en-US','en_US']:['en-GB','en_GB'],vs=tts.voices;
    var cand=vs.filter(function(v){return want.some(function(w){return v.lang&&v.lang.replace('_','-').toLowerCase()===w.replace('_','-').toLowerCase()})});
    if(!cand.length)cand=vs.filter(function(v){return/^en/i.test(v.lang||'')});
    cand.sort(function(a,b){return score(b)-score(a)});
    function score(v){var n=(v.name||'').toLowerCase(),s=0;if(/google|natural|neural|premium|enhanced|siri|samantha|daniel|serena|karen|moira/.test(n))s+=2;if(v.localService)s+=1;return s}
    return cand[0]||null;
  },
  speak:function(text,accent,btn){
    if(!tts.ok){toast('当前浏览器不支持朗读');return}
    if(!text)return;
    speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(text),a=accent||tts.accent,v=tts.pick(a);
    u.lang=a==='us'?'en-US':'en-GB';if(v)u.voice=v;u.rate=text.indexOf(' ')>-1?0.92:0.85;
    if(btn){document.querySelectorAll('.playing').forEach(function(x){x.classList.remove('playing')});btn.classList.add('playing');u.onend=u.onerror=function(){btn.classList.remove('playing')}}
    speechSynthesis.speak(u);
  }
};
if(tts.ok){tts.load();speechSynthesis.addEventListener&&speechSynthesis.addEventListener('voiceschanged',tts.load)}
function setAccent(a){tts.accent=a==='us'?'us':'uk';store('elb-accent',tts.accent);document.querySelectorAll('.accent-chip').forEach(function(c){c.classList.toggle('active',c.dataset.accent===tts.accent)})}
document.querySelectorAll('.speak').forEach(function(b){if(!b.innerHTML.trim())b.innerHTML=SPEAK_SVG});
document.querySelectorAll('.say-chip').forEach(function(b){b.insertAdjacentHTML('afterbegin',SPEAK_SVG)});

/* ---------- 词库 ---------- */
var coreWords=[],words=[],loadedFull=false;
var activeFilter='all',activeScope='all',visibleLimit=80,filteredWords=[];
var grid=$('wordGrid'),empty=$('emptyState'),count=$('wordCount'),loadMore=$('loadMore');
function fetchJSON(url){return fetch(url).then(function(r){if(!r.ok)throw new Error(url);return r.json()})}
function meaningHTML(m){
  return String(m||'').split('；').reduce(function(acc,seg){
    var mm=/^((?:n|v|vt|vi|adj|adv|prep|pron|conj|interj|num|aux|abbr|art|pl)\.)\s*(.*)$/.exec(seg);
    if(mm){acc.push('<span class="sense"><span class="pos">'+esc(mm[1])+'</span>'+esc(mm[2])+'</span>')}
    else if(acc.length&&/class="pos"/.test(acc[acc.length-1])){acc[acc.length-1]=acc[acc.length-1].replace(/<\/span>$/,'；'+esc(seg)+'</span>')}
    else acc.push('<span class="sense">'+esc(seg)+'</span>');
    return acc},[]).join('');
}
function renderWords(reset){
  if(reset!==false)visibleLimit=80;
  var q=$('wordSearch').value.trim().toLowerCase();
  filteredWords=words.filter(function(o){return(activeFilter==='all'||o.e===activeFilter)&&(activeScope==='all'||o.core)&&(!q||o.w.toLowerCase().indexOf(q)>-1||o.m.toLowerCase().indexOf(q)>-1)});
  if(q){filteredWords.sort(function(a,b){var aw=a.w.toLowerCase(),bw=b.w.toLowerCase();var ra=aw===q?0:aw.indexOf(q)===0?1:aw.indexOf(q)>-1?2:3,rb=bw===q?0:bw.indexOf(q)===0?1:bw.indexOf(q)>-1?2:3;return ra-rb})}
  var shown=filteredWords.slice(0,visibleLimit);
  grid.innerHTML=shown.map(function(o){
    var detail=o.h?'<p class="memory"><b>记忆线索</b> '+esc(o.h)+'</p>':'',badge=o.core?'<span class="core-badge">高频核心</span>':'';
    return'<article class="word-card" tabindex="0" data-index="'+o.i+'"><div class="word-head"><div><h3 class="word-title">'+esc(o.w)+'</h3><div class="phon-row"><span class="phonetic">'+esc(o.p||'暂无音标')+'</span><button class="speak small" type="button" data-say="'+o.i+'" aria-label="朗读 '+esc(o.w)+'">'+SPEAK_SVG+'</button></div></div><span class="exam-mark">'+examName(o.e)+'</span></div><p class="meaning">'+meaningHTML(o.m)+'</p>'+detail+badge+'</article>'}).join('');
  count.classList.toggle('loading-note',!loadedFull);
  count.textContent=filteredWords.length+' 个词'+(shown.length<filteredWords.length?' · 已显示 '+shown.length:'')+(loadedFull?'':' · 完整词表载入中…');
  empty.style.display=filteredWords.length?'none':'block';grid.style.display=filteredWords.length?'grid':'none';loadMore.style.display=shown.length<filteredWords.length?'block':'none';
}
function index(){words.forEach(function(o,i){o.i=i})}
var searchTimer;$('wordSearch').addEventListener('input',function(){clearTimeout(searchTimer);searchTimer=setTimeout(function(){renderWords()},120)});
$('filters').addEventListener('click',function(e){var b=e.target.closest('.chip');if(!b)return;activeFilter=b.dataset.filter;this.querySelectorAll('.chip').forEach(function(x){x.classList.toggle('active',x===b)});renderWords()});
$('scopeFilters').addEventListener('click',function(e){var b=e.target.closest('.chip');if(!b)return;activeScope=b.dataset.scope;this.querySelectorAll('.chip').forEach(function(x){x.classList.toggle('active',x===b)});renderWords()});
loadMore.addEventListener('click',function(){visibleLimit+=80;renderWords(false)});

function expandExam(rows,exam){
  var coreMap=Object.create(null);coreWords.forEach(function(o){if(o.e===exam)coreMap[o.w.toLowerCase()]=o});
  var seen=Object.create(null),out=rows.map(function(r){var k=String(r[0]).toLowerCase();seen[k]=1;return coreMap[k]||{e:exam,w:r[0],p:r[1],m:r[2],h:'',x:'',t:'',core:false}});
  coreWords.forEach(function(o){if(o.e===exam&&!seen[o.w.toLowerCase()])out.push(o)});
  return out;
}

/* ---------- 导航 ---------- */
function showView(id){
  document.querySelectorAll('.nav-btn[data-view]').forEach(function(x){x.classList.toggle('active',x.dataset.view===id)});
  document.querySelectorAll('.view').forEach(function(x){x.classList.toggle('active',x.id===id)});
}
document.querySelectorAll('.nav-btn[data-view]').forEach(function(btn){btn.addEventListener('click',function(){showView(btn.dataset.view);history.replaceState(null,'',btn.dataset.view==='review'?'#review':location.pathname+location.search);window.scrollTo(0,0)})});
document.querySelectorAll('.section-tab').forEach(function(btn){btn.addEventListener('click',function(){document.querySelectorAll('.section-tab').forEach(function(x){x.classList.toggle('active',x===btn)});document.querySelectorAll('.subview').forEach(function(x){x.classList.toggle('active',x.id===btn.dataset.tab)})})});
if(location.hash==='#review')showView('review');

/* ---------- 详情抽屉 ---------- */
var drawer=$('drawerWrap'),drawerWord=null;
function openDrawer(i){
  var o=words[i];if(!o)return;drawerWord=o;
  $('drawerExam').textContent=examName(o.e)+(o.core?' · 高频核心':'');$('drawerTitle').textContent=o.w;$('drawerPhonetic').textContent=o.p||'暂无音标';
  $('drawerMeaning').innerHTML=meaningHTML(o.m);$('drawerHint').textContent=o.h||'';$('drawerExample').textContent=o.x||'';$('drawerTranslation').textContent=o.t||'';
  $('hintBlock').style.display=o.h?'block':'none';$('exampleBlock').style.display=o.x?'block':'none';$('drawerCoreNote').style.display=o.h||o.x?'none':'block';
  drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');$('closeDrawer').focus();
}
grid.addEventListener('click',function(e){var s=e.target.closest('[data-say]');if(s){e.stopPropagation();var o=words[+s.dataset.say];if(o)tts.speak(o.w,null,s);return}var c=e.target.closest('.word-card');if(c)openDrawer(+c.dataset.index)});
grid.addEventListener('keydown',function(e){if(e.target.closest('[data-say]'))return;var c=e.target.closest('.word-card');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openDrawer(+c.dataset.index)}});
function closeDrawer(){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true')}
$('closeDrawer').addEventListener('click',closeDrawer);drawer.addEventListener('click',function(e){if(e.target===drawer)closeDrawer()});
document.querySelectorAll('.say-chip').forEach(function(b){b.addEventListener('click',function(){if(drawerWord)tts.speak(drawerWord.w,b.dataset.accent,b)})});
$('exampleSpeak').addEventListener('click',function(){if(drawerWord&&drawerWord.x)tts.speak(drawerWord.x,null,this)});

/* ---------- 间隔复习（SRS） ---------- */
var MIN=60e3,DAY=864e5;
var IV=[0,20*MIN,1*DAY,2*DAY,4*DAY,7*DAY,15*DAY,30*DAY,60*DAY];
var MAX_STAGE=IV.length-1,MASTERED=6;
var SRS_KEY='elb-srs-v1',srs={};
try{srs=JSON.parse(store(SRS_KEY)||'{}')||{}}catch(e){srs={}}
function saveSRS(){store(SRS_KEY,JSON.stringify(srs))}
function sk(o){return o.e+'|'+o.w.toLowerCase()}
function fmtIv(ms){if(ms<60*MIN)return Math.round(ms/MIN)+' 分钟';if(ms<DAY)return Math.round(ms/36e5)+' 小时';return Math.round(ms/DAY)+' 天'}
function fmtWhen(ts){var d=new Date(ts),now=new Date(),t=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');var day=Math.floor((new Date(d.getFullYear(),d.getMonth(),d.getDate())-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/DAY);return day<=0?'今天 '+t:day===1?'明天 '+t:day===2?'后天 '+t:(d.getMonth()+1)+'月'+d.getDate()+'日'}
function schedule(o,rate){
  var k=sk(o),r=srs[k]||{s:0,r:0,l:0},now=Date.now();
  if(rate==='again'){r.s=1;r.l=(r.l||0)+1}
  else if(rate==='fuzzy'){r.s=Math.max(1,r.s)}
  else{r.s=r.s?Math.min(MAX_STAGE,r.s+1):2}
  r.r=(r.r||0)+1;r.d=now+IV[r.s];r.t=now;srs[k]=r;saveSRS();
}
function previewIv(o,rate){var r=srs[sk(o)]||{s:0},s=rate==='again'?1:rate==='fuzzy'?Math.max(1,r.s):r.s?Math.min(MAX_STAGE,r.s+1):2;return fmtIv(IV[s])}

var selectedExam=EXAMS.indexOf(store('elb-review-exam'))>-1?store('elb-review-exam'):'CET6';
var deck=[],completed=0,sessionTotal=0,rated={},card=$('flashcard'),rateButtons=document.querySelectorAll('.rate-btn');
function getCount(){var n=parseInt(store('elb-review-count'),10);return n>0?n:20}
function getPool(){return store('elb-review-pool')==='all'?'all':'core'}
function getOrder(){var v=store('elb-review-order');return v==='shuffle'||v==='list'?v:'review-first'}
function autoplay(){return store('elb-autoplay')==='1'}
function syncSettingsUI(){
  var n=getCount(),preset=['20','50','100'].indexOf(String(n))>-1;
  document.querySelectorAll('#countRow .count-chip').forEach(function(c){c.classList.toggle('active',String(n)===c.dataset.count)});$('countInput').value=preset?'':n;
  document.querySelectorAll('#poolRow .pool-chip').forEach(function(c){c.classList.toggle('active',c.dataset.pool===getPool())});
  document.querySelectorAll('#orderRow .order-chip').forEach(function(c){c.classList.toggle('active',c.dataset.order===getOrder())});
  document.querySelectorAll('#examSelect .chip').forEach(function(c){c.classList.toggle('active',c.dataset.exam===selectedExam)});
  setAccent(tts.accent);var ap=$('autoplayChip');ap.classList.toggle('active',autoplay());ap.setAttribute('aria-pressed',autoplay()?'true':'false');
}
function poolWords(){return(getPool()==='all'&&loadedFull?words:coreWords).filter(function(o){return o.e===selectedExam})}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function stats(){
  var now=Date.now(),list=poolWords(),due=0,fresh=0,learning=0,mastered=0,next=Infinity;
  list.forEach(function(o){var r=srs[sk(o)];if(!r){fresh++;return}if(r.d<=now)due++;else if(r.d<next)next=r.d;if(r.s>=MASTERED)mastered++;else learning++});
  return{due:due,fresh:fresh,learning:learning,mastered:mastered,next:next};
}
function renderStats(){
  var s=stats();$('statDue').textContent=s.due;$('statNew').textContent=s.fresh;$('statLearning').textContent=s.learning;$('statMastered').textContent=s.mastered;
  $('nextDue').textContent=s.due?'有 '+s.due+' 个词已到复习时间。':s.next<Infinity?'下一批复习：'+fmtWhen(s.next):'还没有学过的词，从新词开始吧。';
}
function buildDeck(){
  var now=Date.now(),list=poolWords(),due=[],fresh=[],n=getCount(),order=getOrder();
  list.forEach(function(o){var r=srs[sk(o)];if(!r)fresh.push(o);else if(r.d<=now)due.push(o)});
  due.sort(function(a,b){return srs[sk(a)].d-srs[sk(b)].d});
  if(order==='shuffle'){shuffle(due);shuffle(fresh)}
  else if(order==='review-first'){shuffle(fresh)}
  var picked=due.slice(0,n);picked=picked.concat(fresh.slice(0,Math.max(0,n-picked.length)));
  if(order==='shuffle')shuffle(picked);
  return picked;
}
function resetDeck(){
  deck=buildDeck();completed=0;sessionTotal=deck.length;rated={};
  renderStats();
  if(!deck.length){showDone(true);return}
  $('studyArea').style.display='block';$('done').style.display='none';showCard();updateProgress();
}
function showCard(){
  var o=deck[0],r=srs[sk(o)],tag=$('cardTag'),now=Date.now();
  card.classList.remove('revealed');
  $('studyWord').textContent=o.w;$('studyWordBack').textContent=o.w;$('studyPhonetic').textContent=o.p||'';
  $('studyMeaning').innerHTML=meaningHTML(o.m);$('studyHint').textContent=o.h||'';$('studyHintRow').style.display=o.h?'':'none';
  tag.textContent=!r?'新词':r.d<=now?'复习':'本轮重来';tag.className='card-tag '+(!r?'new':'due');
  $('ivAgain').textContent=previewIv(o,'again')+'后';$('ivFuzzy').textContent=previewIv(o,'fuzzy')+'后';$('ivKnown').textContent=previewIv(o,'known')+'后';
  rateButtons.forEach(function(b){b.disabled=true});card.setAttribute('aria-label','点击翻面查看释义');
  if(autoplay())tts.speak(o.w,null,$('cardSpeak'));
}
function reveal(){card.classList.add('revealed');rateButtons.forEach(function(b){b.disabled=false});card.setAttribute('aria-label','点击翻回单词')}
function unreveal(){card.classList.remove('revealed');rateButtons.forEach(function(b){b.disabled=true});card.setAttribute('aria-label','点击翻面查看释义')}
function toggleCard(){card.classList.contains('revealed')?unreveal():reveal()}
card.addEventListener('click',function(e){if(e.target.closest('#cardSpeak'))return;toggleCard()});
card.addEventListener('keydown',function(e){if(e.target!==card)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleCard()}});
$('cardSpeak').addEventListener('click',function(e){e.stopPropagation();if(deck[0])tts.speak(deck[0].w,null,this)});
function updateProgress(){$('progressCopy').textContent=completed+' / '+sessionTotal;$('progressBar').style.width=(sessionTotal?completed/sessionTotal*100:0)+'%'}
function rate(kind){
  if(!deck.length||!card.classList.contains('revealed'))return;
  var cur=deck.shift(),k=sk(cur);
  if(!rated[k]){rated[k]=1;schedule(cur,kind)}else if(kind==='again'){schedule(cur,'again')}
  if(kind==='again')deck.splice(Math.min(4,deck.length),0,cur);
  else if(kind==='fuzzy'&&rated[k]===1){rated[k]=2;deck.splice(Math.min(2,deck.length),0,cur)}
  else completed++;
  renderStats();
  if(!deck.length)showDone(false);else{showCard();updateProgress()}
}
function showDone(emptyDeck){
  $('studyArea').style.display='none';$('done').style.display='block';
  var s=stats();
  if(emptyDeck){$('doneTitle').textContent=s.fresh?'今天没有到期的词。':'这个词库已经全部学过。';$('doneCopy').textContent=s.next<Infinity?'下一批复习：'+fmtWhen(s.next)+'。':'换个词库或调大每轮数量继续。'}
  else{$('doneTitle').textContent='本轮完成。';$('doneCopy').textContent=sessionTotal+' 个'+examName(selectedExam)+'词已过一遍。'+(s.due?'还有 '+s.due+' 个到期待复习。':s.next<Infinity?'下一批复习：'+fmtWhen(s.next)+'。':'')}
  $('restartBtn').textContent=s.due||s.fresh?'再来一轮':'重新开始';
  $('progressCopy').textContent=completed+' / '+sessionTotal;$('progressBar').style.width=sessionTotal?'100%':'0';
}
rateButtons.forEach(function(btn){btn.addEventListener('click',function(){rate(btn.dataset.rate)})});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){closeDrawer();return}
  if(!$('review').classList.contains('active')||$('studyArea').style.display==='none')return;
  var tg=e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||e.metaKey||e.ctrlKey||e.altKey)return;
  if(e.key===' '&&e.target===document.body){e.preventDefault();toggleCard()}
  else if(e.key==='1')rate('again');else if(e.key==='2')rate('fuzzy');else if(e.key==='3')rate('known');
  else if(e.key==='p'||e.key==='P'){if(deck[0])tts.speak(deck[0].w,null,$('cardSpeak'))}
});
$('examSelect').addEventListener('click',function(e){var b=e.target.closest('.chip');if(!b)return;selectedExam=b.dataset.exam;store('elb-review-exam',selectedExam);syncSettingsUI();resetDeck()});
document.querySelectorAll('#countRow .count-chip').forEach(function(c){c.addEventListener('click',function(){store('elb-review-count',c.dataset.count);syncSettingsUI();resetDeck()})});
$('countInput').addEventListener('change',function(){var n=parseInt(this.value,10);store('elb-review-count',String(n>0?Math.min(n,9999):20));syncSettingsUI();resetDeck()});
document.querySelectorAll('#poolRow .pool-chip').forEach(function(c){c.addEventListener('click',function(){store('elb-review-pool',c.dataset.pool);syncSettingsUI();resetDeck()})});
document.querySelectorAll('#orderRow .order-chip').forEach(function(c){c.addEventListener('click',function(){store('elb-review-order',c.dataset.order);syncSettingsUI();resetDeck()})});
document.querySelectorAll('.accent-chip').forEach(function(c){c.addEventListener('click',function(){setAccent(c.dataset.accent);tts.speak('hello',c.dataset.accent)})});
$('autoplayChip').addEventListener('click',function(){store('elb-autoplay',autoplay()?'0':'1');syncSettingsUI()});
$('restartBtn').addEventListener('click',resetDeck);

/* 导出 / 导入 */
$('exportBtn').addEventListener('click',function(){
  var keys=['elb-review-count','elb-review-pool','elb-review-order','elb-review-exam','elb-accent','elb-autoplay'],settings={};keys.forEach(function(k){var v=store(k);if(v!=null)settings[k]=v});
  var blob=new Blob([JSON.stringify({app:'english-learning',version:1,exportedAt:new Date().toISOString(),srs:srs,settings:settings})],{type:'application/json'});
  var a=document.createElement('a'),d=new Date();a.href=URL.createObjectURL(blob);a.download='english-learning-进度-'+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);
  toast('已导出 '+Object.keys(srs).length+' 个词的进度');
});
$('importBtn').addEventListener('click',function(){$('importFile').click()});
$('importFile').addEventListener('change',function(){
  var f=this.files&&this.files[0];if(!f)return;var rd=new FileReader();
  rd.onload=function(){try{var j=JSON.parse(rd.result);if(!j||typeof j.srs!=='object')throw 0;var n=0;Object.keys(j.srs).forEach(function(k){var a=j.srs[k],b=srs[k];if(a&&typeof a.d==='number'&&(!b||(a.t||0)>(b.t||0))){srs[k]=a;n++}});saveSRS();if(j.settings)Object.keys(j.settings).forEach(function(k){if(/^elb-/.test(k))store(k,String(j.settings[k]))});
    tts.accent=store('elb-accent')==='us'?'us':'uk';if(EXAMS.indexOf(store('elb-review-exam'))>-1)selectedExam=store('elb-review-exam');syncSettingsUI();resetDeck();toast('已导入，更新了 '+n+' 个词')}catch(e){toast('文件格式不对，导入失败')}};
  rd.readAsText(f);this.value='';
});

var intervals=[['20 分钟','快速巩固'],['1 天','次日回忆'],['2 天','拉开间隔'],['4 天','稳定提取'],['7 天','长期加固'],['15 天','迁移复习'],['30 天','已掌握'],['60 天','长期保持']];
$('schedule').innerHTML=intervals.map(function(a,i){return'<div class="schedule-row"><strong>'+String(i+1).padStart(2,'0')+'</strong><span>'+a[0]+'</span><em>'+a[1]+'</em></div>'}).join('');
var now=new Date(),months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],days=['SUN','MON','TUE','WED','THU','FRI','SAT'];
$('dateDay').textContent=String(now.getDate()).padStart(2,'0');$('dateMonth').textContent=months[now.getMonth()]+' · '+days[now.getDay()];
syncSettingsUI();

/* ---------- 启动 ---------- */
fetchJSON(DATA_FILES.CORE).then(function(core){
  coreWords=core.map(function(o){o.core=true;return o});words=coreWords.slice();index();renderWords();resetDeck();
  return Promise.all(EXAMS.map(function(e){return fetchJSON(DATA_FILES[e]).then(function(d){return{ok:true,e:e,d:d}},function(){return{ok:false,e:e,d:[]}})}));
}).then(function(res){
  if(!res)return;var full=[],failed=[],counts=[];
  res.forEach(function(x){if(x.ok){var l=expandExam(x.d,x.e);full=full.concat(l);counts.push(examName(x.e)+' '+l.length.toLocaleString()+' 词')}else{failed.push(examName(x.e));full=full.concat(coreWords.filter(function(o){return o.e===x.e}))}});
  words=full;index();loadedFull=true;renderWords(false);$('asideCount').textContent=counts.join(' · ');
  if(failed.length){count.textContent=failed.join('、')+' 词表载入失败，已显示可用词库'}
  if(getPool()==='all')resetDeck();else renderStats();
}).catch(function(){count.textContent='词库载入失败，请检查网络后刷新'});

if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}
})();
