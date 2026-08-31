/* ============ fiche d'intervention fluides frigorigènes ============
   CERFA 15497*04, imposé par l'article 11 de l'arrêté du 29 février 2016 :
   « l'opérateur EST TENU d'utiliser le formulaire CERFA n° 15497 (4) comme
   fiche d'intervention ». On ne dessine donc pas une fiche maison — on
   remplit le formulaire officiel. Ici on ne fait que RECUEILLIR ce qu'il
   demande, proprement, une fois, sur place.

   Deux choses à ne pas confondre :
   — le SEUIL DE CONTRÔLE d'étanchéité (2 kg HCFC / 5 t éq. CO2 HFC-PFC,
     art. R. 543-79) : il décide si un contrôle périodique est dû ;
   — le SEUIL DE SIGNATURE du détenteur (3 kg HCFC / 5 t éq. CO2) : il décide
     seulement si le client doit signer la fiche.
   La fiche elle-même, elle, est due à CHAQUE manipulation, sans aucun seuil.
   (code de l'environnement, art. R. 543-82) */

/* Potentiels de réchauffement, annexe I du règlement (UE) 2024/573.
   RÉSERVE : je n'ai pas pu recouper ces valeurs avec la formule GWP de la
   base Notion, dont le code ne m'est pas accessible par l'API. Si les deux
   divergent, c'est Notion qui doit faire foi — voir Réglages, Sources. */
var GWP = {
  "R32":675, "R410A":2088, "R407C":1774, "R404A":3922, "R134a":1430,
  "R454B":466, "R454C":148, "R513A":631, "R290":3, "R744":1, "R1234yf":1
};
var FAMILLE = {
  "R32":"HFC", "R410A":"HFC", "R407C":"HFC", "R404A":"HFC", "R134a":"HFC",
  "R513A":"HFC", "R454B":"HFO", "R454C":"HFO", "R1234yf":"HFO",
  "R290":"naturel", "R744":"naturel"
};
var NATURES_CERFA = [
  {v:"assemblage",   l:"Assemblage",                 champ:"Case_Assemblage"},
  {v:"mise_service", l:"Mise en service",            champ:"Case_MiseService"},
  {v:"modification", l:"Modification",               champ:"Case_Modif"},
  {v:"maintenance",  l:"Maintenance",                champ:"Case_Maintenance"},
  {v:"ctrl_perio",   l:"Contrôle d'étanchéité périodique",     champ:"Case_CtrlPerio"},
  {v:"ctrl_non_perio", l:"Contrôle d'étanchéité non périodique", champ:"Case_CtrlNonPerio"},
  {v:"demantelement", l:"Démantèlement",             champ:"Case_Demantel"}
];

function machineAFluide(m){
  if(!m) return false;
  var t = techDe(m); if(!t) return false;
  return t.ident.some(function(f){ return f.k === "fluide"; });
}
function cerfaDe(m){
  if(!m.cerfa) m.cerfa = {nature:"", vierge:"", recycle:"", regenere:"",
                          traitement:"", reutil:"", contenant:"", bsff:"",
                          fuite:"", loca:"", repare:"", detecteur:"", detecteurLe:"",
                          detectionPerm:"", obs:""};
  return m.cerfa;
}
function fluideDe(m){ return txt((m.ident||{}).fluide) || ""; }
function familleFluide(m){ return FAMILLE[fluideDe(m)] || ""; }
function gwpDe(m){ var g = GWP[fluideDe(m)]; return estNb(g) ? g : NaN; }
/* Charge en tonnes équivalent CO2 : c'est elle qui commande tout côté HFC. */
function teqCO2(m){
  var c = nb((m.ident||{}).charge), g = gwpDe(m);
  if(!estNb(c) || !estNb(g)) return NaN;
  return Math.round(c * g / 1000 * 1000) / 1000;
}
/* Tableau de l'article 4 de l'arrêté du 29 février 2016.
   Le système permanent de détection double la période, pour les HFC/PFC. */
function periodiciteEtancheite(m){
  var fam = familleFluide(m), c = nb((m.ident||{}).charge), t = teqCO2(m);
  var perm = cerfaDe(m).detectionPerm === "oui";
  if(fam === "HFC"){
    if(!estNb(t)) return null;
    if(t < 5)   return {mois:0, motif:"sous 5 t éq. CO2 : aucun contrôle périodique exigé"};
    if(t < 50)  return {mois: perm ? 24 : 12, tranche:"HFC_5"};
    if(t < 500) return {mois: perm ? 12 : 6,  tranche:"HFC_50"};
    return {mois: perm ? 6 : 3, tranche:"HFC_500"};
  }
  if(fam === "HFO"){
    if(!estNb(c)) return null;
    if(c < 1)   return {mois:0, motif:"sous 1 kg : aucun contrôle périodique exigé"};
    if(c < 10)  return {tranche:"HFO_1"};
    if(c < 100) return {tranche:"HFO_10"};
    return {tranche:"HFO_100"};
  }
  if(fam === "naturel") return {mois:0, motif:"fluide non fluoré : hors champ du règlement F-Gas"};
  return null;
}
/* Le détenteur ne signe qu'au-dessus des seuils. En dessous, la notice du
   CERFA dit expressément que la fiche est remplie sans sa signature. */
function signatureDetenteurRequise(m){
  var t = teqCO2(m);
  return estNb(t) && t > 5;
}
/* La fiche est due dès qu'il y a manipulation OU contrôle d'étanchéité. */
function cerfaRequis(m){
  if(!machineAFluide(m)) return false;
  var c = cerfaDe(m);
  if(c.nature) return true;
  return quantiteManipulee(m) > 0;
}
function nb0(v){ var x = nb(v); return estNb(x) ? x : 0; }
function quantiteChargee(m){ var c = cerfaDe(m); return nb0(c.vierge) + nb0(c.recycle) + nb0(c.regenere); }
function quantiteRecuperee(m){ var c = cerfaDe(m); return nb0(c.traitement) + nb0(c.reutil); }
function quantiteManipulee(m){ return quantiteChargee(m) + quantiteRecuperee(m); }
/* Les grammes sont l'unité du terrain et celle de la base Notion ;
   le CERFA, lui, se remplit en kilogrammes. */
function gVersKg(g){ return estNb(nb(g)) ? (nb(g)/1000) : 0; }
function fmtKg(g){ return gVersKg(g).toFixed(3).replace(".", ","); }

function anomaliesCerfa(m){
  var out = [], c = cerfaDe(m);
  if(!machineAFluide(m)) return out;
  if(c.fuite === "oui" && !txt(c.loca))
    out.push("fuite constatée sans localisation : l'arrêté du 29/02/2016 impose de consigner le point de fuite");
  if(quantiteManipulee(m) > 0 && !txt(c.contenant))
    out.push("fluide manipulé sans identification du contenant");
  if(cerfaRequis(m) && !txt(c.nature))
    out.push("nature de l'intervention non renseignée sur la fiche fluides");
  return out;
}
/* Ce qui part vers Make, et de là vers Notion et le CERFA. */
function payloadCerfa(m){
  if(!machineAFluide(m)) return null;
  var c = cerfaDe(m), p = periodiciteEtancheite(m);
  return {
    requis: cerfaRequis(m),
    nature: c.nature || null,
    fluide: fluideDe(m) || null,
    famille: familleFluide(m) || null,
    charge_kg: n0((m.ident||{}).charge),
    teq_co2: estNb(teqCO2(m)) ? teqCO2(m) : null,
    gwp: estNb(gwpDe(m)) ? gwpDe(m) : null,
    periodicite_mois: p && estNb(p.mois) ? p.mois : null,
    detection_permanente: c.detectionPerm || null,
    detecteur: propre(c.detecteur),
    detecteur_le: propre(c.detecteurLe),
    fuite: c.fuite || null,
    fuite_localisation: propre(c.loca),
    fuite_reparation: c.repare || null,
    /* grammes pour Notion, kilogrammes pour le CERFA */
    charge_vierge_g: n0(c.vierge),
    charge_recycle_g: n0(c.recycle),
    charge_regenere_g: n0(c.regenere),
    charge_totale_g: quantiteChargee(m),
    recup_traitement_g: n0(c.traitement),
    recup_reutilisation_g: n0(c.reutil),
    recup_totale_g: quantiteRecuperee(m),
    contenant: propre(c.contenant),
    bsff: propre(c.bsff),
    observations: propre(c.obs),
    signature_detenteur_requise: signatureDetenteurRequise(m)
  };
}
