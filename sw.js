/* Service worker — fiche terrain KA-RÉ
   La page elle-même : réseau d'abord, cache en secours -> on a toujours la dernière version,
   et ça marche quand même hors connexion.
   Les icônes et le manifeste : cache d'abord, ils ne changent presque jamais. */
var CACHE = "kare-fiche-v2-11";
var FICHIERS = ["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(FICHIERS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function estLaPage(r){
  return r.mode === "navigate" || (r.destination === "document") || /\/(index\.html)?(\?|$)/.test(new URL(r.url).pathname + new URL(r.url).search);
}

self.addEventListener("fetch", function(e){
  var r = e.request;
  if(r.method !== "GET") return;                        /* jamais les POST vers Make */
  var u = new URL(r.url);
  if(u.origin !== self.location.origin) return;          /* jamais le trafic externe */

  if(estLaPage(r)){
    /* réseau d'abord : la mise à jour arrive dès qu'il y a du signal */
    e.respondWith(
      fetch(r).then(function(f){
        if(f && f.status === 200){
          var copie = f.clone();
          caches.open(CACHE).then(function(c){ c.put("./index.html", copie); });
        }
        return f;
      }).catch(function(){
        return caches.match("./index.html").then(function(rep){ return rep || caches.match("./"); });
      })
    );
    return;
  }

  /* le reste : cache d'abord, rafraîchi en arrière-plan */
  e.respondWith(
    caches.match(r).then(function(rep){
      var reseau = fetch(r).then(function(f){
        if(f && f.status === 200) caches.open(CACHE).then(function(c){ c.put(r, f.clone()); });
        return f;
      }).catch(function(){ return rep; });
      return rep || reseau;
    })
  );
});
