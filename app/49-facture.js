/* ============================================================
   Facturation de l'entretien au forfait.
   Grille figée le 03/08/2026 (préférences KA-RÉ), en HT :
     chaudière gaz 150 · PAC air/eau 210 · clim 150 par unité
     extérieure + 50 par unité intérieure · adoucisseur 120.
   Les autres technologies n'ont pas de forfait : la facture se
   fait à la main. TVA 10 % par défaut — entretien dans un logement
   achevé depuis plus de deux ans — 20 % sinon.
   L'appli propose la ligne, Rémi valide ou décoche ; Make crée la
   facture dans Axonaut seulement si la facturation automatique est
   activée dans les Réglages. Une facture ne s'annule pas : le
   garde-fou est volontairement double.
   ============================================================ */
var FORFAITS_ENTRETIEN = {
  chaudiere_gaz: function(m){ return {ht:150, lib:"Entretien annuel de chaudière gaz"}; },
  pac_air_eau:   function(m){ return {ht:210, lib:"Entretien de pompe à chaleur air/eau"}; },
  clim_air_air:  function(m){
    var ui = Math.max(1, (m.sous||[]).length);
    return {ht:150 + 50*ui, lib:"Entretien de climatisation — 1 unité extérieure, " + ui + " unité" + (ui>1?"s":"") + " intérieure" + (ui>1?"s":""),
            detail:"150 € l'unité extérieure + 50 € par unité intérieure"};
  },
  adoucisseur:   function(m){ return {ht:120, lib:"Entretien annuel d'adoucisseur"}; }
};
var MENTION_TVA10 = "TVA au taux réduit de 10 % : prestation d'entretien réalisée dans un local à usage d'habitation achevé depuis plus de deux ans (CGI, art. 279-0 bis).";

function forfaitEntretien(m){
  if(V.interv !== "entretien") return null;
  var f = FORFAITS_ENTRETIEN[m.tech]; if(!f) return null;
  var r = f(m);
  var t = techDe(m) || {};
  /* Ces textes partent dans un corps JSON composé par Make : pas de guillemet
     droit ni de barre oblique inverse dedans. */
  var sain = function(x){ return String(x||"").replace(/["\\]/g, "'").replace(/[\r\n]+/g, " "); };
  return {
    libelle: sain(r.lib),
    description: sain([txt(m.ident.marque), txt(m.ident.serie) ? "n° " + txt(m.ident.serie) : null,
                  "intervention du " + dateFr(V.date)].filter(Boolean).join(" - ")),
    ht: r.ht, detail: r.detail || null, techLabel: t.label
  };
}
function arrondi2(x){ return Math.round(x*100)/100; }
/* Ce que Rémi a décidé sur l'écran d'envoi pour cette fiche. */
function decisionFacture(m){
  V.facturer = V.facturer || {};
  var d = V.facturer[m.mid];
  if(!d){ d = {creer:true, tva:10}; V.facturer[m.mid] = d; }
  if(d.tva !== 20) d.tva = 10;
  return d;
}
/* Ce qui part vers Make. null = rien à facturer automatiquement. */
function payloadFacture(m){
  var f = forfaitEntretien(m); if(!f) return null;
  var d = decisionFacture(m);
  var auto = (cfg.factureAuto === "oui");
  var ttc = arrondi2(f.ht * (1 + d.tva/100));
  return {
    creer: !!(auto && d.creer),
    auto_active: auto,
    coche: !!d.creer,
    libelle: f.libelle,
    description: f.description,
    ht: f.ht, tva: d.tva, ttc: ttc,
    mention: d.tva === 10 ? MENTION_TVA10 : null,
    lignes: [{name:f.libelle, description:f.description, quantity:1, unit:"forfait", price:f.ht, tax_rate:d.tva}]
  };
}
