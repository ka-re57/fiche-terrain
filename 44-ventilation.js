/* ============ aération du local ============
   Version précédente : un moteur qui déduisait le CAS applicable de six
   questions posées à Rémi, puis affichait la section ou le module à
   respecter. Rémi a tranché : « je veux la notice pour voir si c'est
   conforme ou non, pas plusieurs cases à remplir. »
   Il a raison. Il lit la planche sur place, il juge, il note. L'application
   ne rejuge pas à sa place : elle lui met la bonne page sous les yeux et
   enregistre son verdict. Une case, et une description si ça ne va pas. */

/* Les planches, dans l'ordre où on les feuillette. Les clés correspondent
   aux fichiers de src/ref/ intégrés au build. */
var NOTICE_VENT = [
  {cle:"ventilation-00-introduction",      l:"Introduction"},
  {cle:"ventilation-01-types-appareils",   l:"Types d'appareils A, B, C"},
  {cle:"ventilation-02-points-vigilance",  l:"Points de vigilance"},
  {cle:"ventilation-03-configurations",    l:"Table des 11 cas"},
  {cle:"ventilation-04-dimensionnement",   l:"Dimensionnement des entrées d'air"},
  {cle:"ventilation-cas-01",  l:"CAS 1"},
  {cle:"ventilation-cas-02",  l:"CAS 2"},
  {cle:"ventilation-cas-03",  l:"CAS 3"},
  {cle:"ventilation-cas-04",  l:"CAS 4"},
  {cle:"ventilation-cas-05",  l:"CAS 5"},
  {cle:"ventilation-cas-06",  l:"CAS 6"},
  {cle:"ventilation-cas-07",  l:"CAS 7"},
  {cle:"ventilation-cas-08",  l:"CAS 8"},
  {cle:"ventilation-cas-09",  l:"CAS 9"},
  {cle:"ventilation-cas-10",  l:"CAS 10"},
  {cle:"ventilation-cas-11",  l:"CAS 11"}
];
var SOURCE_VENT = "Fiche Visa Qualité Habitation 2026 et Fiches pratiques ventilation — arrêté du 23 février 2018, art. 13 et 18";

/* La question ne se pose que sur un appareil qui prend son air dans la
   pièce. Une ventouse étanche n'a pas besoin d'aération de local. */
function ventilationConcernee(m){
  if(!m) return false;
  if(m.tech === "chaudiere_fioul") return true;
  if(m.tech !== "chaudiere_gaz") return false;
  var e = sansAccents(txt(m.ident.evac) || "");   /* sansAccents met aussi en minuscules */
  if(!e) return true;                       /* pas encore renseigné : on montre */
  return e.indexOf("c etanche") !== 0;      /* étanche seul : sans objet */
}

var VENT_ETATS = [
  {v:"conforme", l:"Conforme"},
  {v:"non",      l:"Non conforme"},
  {v:"so",       l:"Sans objet"}
];
function ventDe(m){
  if(!m.vent) m.vent = {etat:"", desc:""};
  return m.vent;
}
function ventLibelle(m){
  var e = ventDe(m).etat;
  for(var i=0;i<VENT_ETATS.length;i++) if(VENT_ETATS[i].v === e) return VENT_ETATS[i].l;
  return "";
}
/* Le verdict de Rémi coche lui-même le point de contrôle correspondant :
   il ne va pas dire deux fois la même chose. */
/* Le fioul a ce point dans sa liste réglementaire d'entretien, le gaz ne
   l'a pas : l'annexe 1 de l'arrêté du 15/09/2009 ne le cite pas parmi les
   opérations d'entretien de la chaudière gaz. On ne l'invente donc pas dans
   la liste. Sur gaz, le verdict d'aération vaut constat à lui seul et
   figure sur le document comme tel. */
var FRAG_VENT = "amenee d'air et de la ventilation du local";
function indexPointVent(m){
  var lc = listeCtrl(m), f = sansAccents(FRAG_VENT);
  for(var i=0;i<lc.length;i++) if(sansAccents(lc[i]).indexOf(f) >= 0) return i;
  return -1;
}
function appliquerVentilation(m){
  if(!ventilationConcernee(m)) return;
  var i = indexPointVent(m); if(i < 0) return;
  var e = ventDe(m).etat;
  if(!e) return;
  m.ctrl["c"+i] = (e === "conforme") ? "ok" : (e === "non" ? "non" : "np");
  m.ctrlManuel = m.ctrlManuel || {}; m.ctrlManuel["c"+i] = 1;
}
/* Ce qui part sur le document du client. */
function ligneVentilation(m){
  if(!ventilationConcernee(m)) return null;
  var v = ventDe(m);
  if(!v.etat) return null;
  var t = ventLibelle(m);
  if(v.etat === "non" && txt(v.desc)) t += " — " + txt(v.desc);
  return {k:"Aération du local", v:t, alerte:(v.etat === "non")};
}
