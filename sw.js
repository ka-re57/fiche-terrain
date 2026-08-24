/* Service worker — fiche terrain KA-RÉ */
var CACHE = "kare-fiche-v2-8";
var FICHIERS = ["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FICHIERS); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ return k===CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var r = e.request;
  if(r.method !== "GET") return;                       /* jamais les POST vers Make */
  var u = new URL(r.url);
  if(u.origin !== self.location.origin) return;         /* jamais le trafic externe */
  e.respondWith(
    caches.match(r).then(function(rep){
      var reseau = fetch(r).then(function(f){
        if(f && f.status===200) caches.open(CACHE).then(function(c){ c.put(r, f.clone()); });
        return f;
      }).catch(function(){ return rep; });
      return rep || reseau;                             /* cache d'abord, mise à jour en arrière-plan */
    })
  );
});
