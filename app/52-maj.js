/* ============ mise à jour du parc et des clients ============
   Le fichier de configuration était une photographie : au moment où j'écris,
   81 sociétés créées dans Axonaut depuis l'export n'existaient pas sur la
   tablette. Un client absent de la liste, c'est une fiche qui part avec un
   nom mal orthographié et un dossier Drive créé en double.
   La tablette va donc chercher elle-même la vérité :
     — le parc dans Notion (base « Parc équipements KA-RÉ »),
     — les clients dans Axonaut.
   Elle passe par un scénario Make : ni la clé Axonaut ni le jeton Notion
   ne descendent jamais sur la tablette. */

var CLE_MAJ = "kare.maj.v1";
var maj = lire(CLE_MAJ, {le:"", parc:0, clients:0});
var DELAI_MAJ = 12 * 3600 * 1000;   /* au démarrage, pas plus d'une fois par demi-journée */

/* ---- lecture d'une propriété Notion, quel que soit son type ---- */
function valProp(p){
  if(!p) return "";
  var t = p.type;
  if(t === "title" || t === "rich_text"){
    return (p[t] || []).map(function(x){ return x.plain_text || ""; }).join("").trim();
  }
  if(t === "select")        return p.select ? (p.select.name || "") : "";
  if(t === "multi_select")  return (p.multi_select || []).map(function(x){ return x.name; }).join(", ");
  if(t === "number")        return (p.number === null || p.number === undefined) ? "" : String(p.number);
  if(t === "date")          return p.date ? (p.date.start || "") : "";
  if(t === "email")         return p.email || "";
  if(t === "phone_number")  return p.phone_number || "";
  if(t === "url")           return p.url || "";
  if(t === "checkbox")      return p.checkbox ? "oui" : "non";
  if(t === "formula"){
    var f = p.formula; if(!f) return "";
    if(f.string) return f.string;
    if(f.number !== null && f.number !== undefined) return String(f.number);
    if(f.date && f.date.start) return f.date.start;
    return "";
  }
  return "";
}
/* Notion nomme les technologies pour l'œil, l'application pour le code. */
var TECH_NOTION = {
  "Chaudière gaz":       "chaudiere_gaz",
  "Chaudière fioul":     "chaudiere_fioul",
  "PAC air/eau":         "pac_air_eau",
  "PAC air/air (clim)":  "clim_air_air",
  "Clim réversible":     "clim_air_air",
  "CET":                 "cet",
  "Adoucisseur":         "adoucisseur",
  "VMC":                 "vmc_df"
};
/* « Chaudière bois » et « Autre » n'ont pas de fiche : la machine reste
   dans le parc, sans technologie. On ne l'invente pas. */

function parcDepuisNotion(resultats){
  var out = [];
  (resultats || []).forEach(function(page){
    var pr = page.properties || {};
    var v  = function(k){ return valProp(pr[k]); };
    var client = v("Client");
    if(!client) return;                       /* une machine sans client ne sert à rien ici */
    var marque = [v("Marque"), v("Modèle")].filter(Boolean).join(" ");
    var ville  = v("Ville");
    var adr    = v("Adresse du site");
    var e = {
      client:  client,
      tech:    TECH_NOTION[v("Type équipement")] || "",
      marque:  marque,
      serie:   v("N° de série"),
      puiss:   v("Puissance (kW)"),
      annee:   v("Année"),
      fluide:  v("Fluide frigorigène") === "Sans objet" ? "" : v("Fluide frigorigène"),
      charge:  v("Charge fluide (kg)"),
      nbui:    v("Nb unités intérieures"),
      mes:     v("Date mise en service"),
      adresse: adr || ville,
      ville:   ville,
      dernier: v("Dernier entretien"),
      prochaine: v("À prévoir prochaine visite"),
      statut:  v("Statut"),
      email:   v("Email client"),
      tel:     v("Téléphone"),
      drive:   v("Dossier Drive"),
      axonaut: v("ID société Axonaut"),
      notion:  page.id || ""
    };
    Object.keys(e).forEach(function(k){ if(e[k] === "") delete e[k]; });
    out.push(e);
  });
  return out;
}

/* Axonaut mélange tout : clients, prospects et fournisseurs. Sur 393
   sociétés, 185 sont des fournisseurs — CEDEO, Amazon, Qualit'EnR. On ne
   leur fera jamais un entretien : ils n'ont rien à faire dans le sélecteur
   de client d'une fiche terrain. On garde clients et prospects. */
function clientsDepuisAxonaut(donnees){
  var out = [];
  (donnees || []).forEach(function(s){
    if(!s || s.is_disabled) return;
    if(s.is_supplier && !s.is_customer && !s.is_prospect) return;
    var nom = String(s.name || "").trim();
    if(!nom) return;
    var adresse = [s.address_street, s.address_zip_code, s.address_city]
                    .map(function(x){ return String(x || "").trim(); })
                    .filter(Boolean).join(" ");
    var e = {nom:nom, ax:String(s.id || "")};
    if(adresse) e.adresse = adresse;
    if(s.is_customer) e.cli = 1;
    if(s.is_supplier) e.f = 1;   /* aussi fournisseur : gardé, mais rangé après */
    out.push(e);
  });
  return out;
}

function listeDe(x){
  if(Array.isArray(x)) return x;
  if(x && Array.isArray(x.object)) return x.object;
  if(x && Array.isArray(x.results)) return x.results;
  if(x && Array.isArray(x.data)) return x.data;
  return [];
}
/* ---- l'appel ---- */
function urlMaj(){
  var u = txt(cfg.majUrl);
  if(!u) return "";
  return u + (u.indexOf("?") >= 0 ? "&" : "?") + "k=" + encodeURIComponent(cfg.secret || "");
}
/* fini(ok, message, detail) */
function majParcEtClients(fini){
  fini = fini || function(){};
  var u = urlMaj();
  if(!u){ fini(false, "Adresse de mise à jour non renseignée"); return; }
  if(!navigator.onLine){ fini(false, "Hors connexion"); return; }

  var minuteurAbandon = null, abandonne = false;
  var ctrl = (typeof AbortController === "function") ? new AbortController() : null;
  if(ctrl){ minuteurAbandon = setTimeout(function(){ abandonne = true; ctrl.abort(); }, 45000); }

  fetch(u, {method:"GET", cache:"no-store", signal: ctrl ? ctrl.signal : undefined})
    .then(function(r){
      if(!r.ok) throw new Error("réponse " + r.status);
      return r.text();
    })
    .then(function(brut){
      clearTimeout(minuteurAbandon);
      var d;
      try{ d = JSON.parse(brut); }
      catch(e){
        /* Ne jamais dire « erreur » sans montrer ce qui est arrivé : c'est
           ce qui m'a fait perdre une soirée sur le scénario précédent. */
        throw new Error("réponse illisible (" + String(brut).length + " car.) — début : " + String(brut).slice(0, 120));
      }
      /* Make sait sérialiser un tableau avec le module JSON, mais pas en
         l'injectant dans un champ texte : on récupérait « [object Object] ».
         Si le scénario est un jour remonté d'un cran ({object:[...]}), on
         accepte quand même plutôt que de refuser une réponse valable. */
      var np = parcDepuisNotion(listeDe(d.parc));
      var nc = clientsDepuisAxonaut(listeDe(d.clients));
      if(!np.length && !nc.length) throw new Error("réponse vide : ni parc ni clients");

      if(np.length){ parc = np; ecrire(CLE_PARC, parc); }
      if(nc.length){ clients = nc; ecrire(CLE_CLIENTS, clients); }
      maj = {le: new Date().toISOString(), parc: np.length, clients: nc.length};
      ecrire(CLE_MAJ, maj);
      fini(true, np.length + " machines · " + nc.length + " clients", d.maj || "");
    })
    .catch(function(e){
      clearTimeout(minuteurAbandon);
      fini(false, abandonne ? "délai dépassé" : (e.message || "échec"));
    });
}
/* Au démarrage : silencieux, sans bloquer, et pas plus d'une fois par
   demi-journée. Rémi ne doit jamais attendre après le réseau. */
function majAutomatique(){
  if(!txt(cfg.majUrl) || !navigator.onLine) return;
  var dernier = Date.parse(maj.le || "");
  if(isFinite(dernier) && (Date.now() - dernier) < DELAI_MAJ) return;
  majParcEtClients(function(ok, m){
    if(ok){ majEtatMaj(); rendre(); toast("Parc et clients à jour — " + m, "ok"); }
  });
}
function texteMaj(){
  if(!maj.le) return "jamais mis à jour depuis Notion et Axonaut";
  var d = new Date(maj.le);
  if(isNaN(d.getTime())) return "date de mise à jour illisible";
  var j = String(d.getDate()).padStart(2,"0") + "/" + String(d.getMonth()+1).padStart(2,"0") + "/" + d.getFullYear();
  var h = String(d.getHours()).padStart(2,"0") + "h" + String(d.getMinutes()).padStart(2,"0");
  return "dernière mise à jour le " + j + " à " + h + " — " + maj.parc + " machines, " + maj.clients + " clients";
}
function majEtatMaj(t){
  var e = document.getElementById("majEtat");
  if(e) e.textContent = t || texteMaj();
}
