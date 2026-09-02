/* Service worker — fiche terrain KA-RÉ
   La page elle-même : réseau d'abord, cache en secours -> on a toujours la dernière version,
   et ça marche quand même hors connexion.
   Les icônes et le manifeste : cache d'abord, ils ne changent presque jamais. */
var CACHE = "kare-fiche-v3-12";
var FICHIERS = ["./","./index.html","./app.css?v=3.12","./fiches.js?v=3.12","./logo.png?v=3.12","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./app/30-catalogue.js?v=3.12","./app/40-noyau.js?v=3.12","./app/44-ventilation.js?v=3.12","./app/45-vues.js?v=3.12","./app/47-signature-client.js?v=3.12","./app/48-photos.js?v=3.12","./app/50-transport.js?v=3.12","./app/52-maj.js?v=3.12","./app/55-document.js?v=3.12","./app/56-pdf.js?v=3.12","./app/57-doc-pdf.js?v=3.12","./app/58-cerfa.js?v=3.12","./app/60-boot.js?v=3.12"];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(FICHIERS); })
  );
});

/* Pas de skipWaiting automatique : une version fraîche attend sagement que
   Rémi appuie sur « Installer maintenant ». On ne recharge jamais la page
   au milieu d'une visite sans le lui demander. */
self.addEventListener("message", function(e){
  if(e.data && e.data.type === "PRENDRE_LA_MAIN") self.skipWaiting();
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
