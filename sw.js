/* 由 scripts/build.py 生成版本号和清单，勿手改 VERSION / ASSETS */
var VERSION='469756c23a';
var ASSETS=["./", "index.html", "pronunciation.html", "assets/app.css?v=edbfc55582", "assets/app.js?v=78f8443f03", "manifest.webmanifest?v=e32edb886b", "icons/icon-192.png?v=c60cdbd991", "icons/icon-512.png?v=be89b75b6f", "icons/maskable-512.png?v=7fd2d79c07", "icons/apple-touch-icon.png?v=d29ffb3756", "data/bec.json?v=9fa037c913", "data/cet6.json?v=5e4e7599e9", "data/core.json?v=d7656640bc", "data/ielts.json?v=930872d47a", "data/toefl.json?v=deeceaa20d"];
var CACHE='elb-'+VERSION;
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('elb-')===0&&k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var req=e.request;if(req.method!=='GET')return;
  var url=new URL(req.url);if(url.origin!==location.origin)return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(function(r){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(req,cp)});return r}).catch(function(){return caches.match(req,{ignoreSearch:true}).then(function(r){return r||caches.match('./index.html')})}));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){
    if(hit)return hit;
    return fetch(req).then(function(r){if(r.ok){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(req,cp)})}return r}).catch(function(){return caches.match(req,{ignoreSearch:true})});
  }));
});
