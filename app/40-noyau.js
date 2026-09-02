"use strict";
var VERSION = "3.10";

/* ============ stockage ============ */
var CLE_VISITE = "kare.visite.v1", CLE_CFG = "kare.cfg.v1", CLE_PARC = "kare.parc.v1", CLE_FILE = "kare.file.v1";
var STOCK_OK = (function(){ try{ localStorage.setItem("_t","1"); localStorage.removeItem("_t"); return true; }catch(e){ return false; } })();
function lire(cle, def){ try{ var v = localStorage.getItem(cle); return v===null ? def : JSON.parse(v); }catch(e){ return def; } }
function ecrire(cle, val){ try{ localStorage.setItem(cle, JSON.stringify(val)); return true; }catch(e){ return false; } }

/* ============ utilitaires ============ */
function $(s, r){ return (r||document).querySelector(s); }
function el(tag, cls, txt){ var n=document.createElement(tag); if(cls) n.className=cls; if(txt!==undefined && txt!==null) n.textContent=txt; return n; }
function estNb(v){ return typeof v==="number" && isFinite(v); }
/* fiches.js porte les seize planches de la notice et le logo. Il pèse 1,3 Mo
   et ne bouge jamais, donc il se dépose à part. Si jamais il manque, on veut
   une appli qui fonctionne sans logo — pas une appli qui plante. */
function logoKare(){ return (typeof LOGO_KARE !== "undefined" && LOGO_KARE) ? LOGO_KARE : ""; }
function nb(v){
  if(v===undefined||v===null||v==="") return NaN;
  var s=String(v).replace(",",".").trim(); if(!s) return NaN;
  var n=parseFloat(s); return isFinite(n)?n:NaN;
}
function fmt(n,d){ return estNb(n) ? n.toFixed(d===undefined?1:d).replace(".",",") : "—"; }
function txt(v){ v=(v===undefined||v===null)?"":String(v).trim(); return v||null; }
/* Texte destiné au message sortant : on neutralise ce qui casse le JSON en aval
   (guillemets droits, retours chariot, caractères de contrôle). */
function propre(v){
  if(v===undefined||v===null) return null;
  var x = String(v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/"/g, "\u201d")
    .replace(/\\/g, "/")
    .trim();
  return x || null;
}
function n0(v){ var x=nb(v); return estNb(x)?x:null; }
function slug(v){ return String(v||"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,42) || "fiche"; }
function aujourdhui(){ var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function idUnique(p){ return (p||"id")+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8); }

/* ============ configuration ============ */
var cfg = lire(CLE_CFG, {webhook:"", secret:"", technicien:"Rémi KATA", appareils:"", modeControles:"declare", signature:"", signClient:"oui"});
var parc = lire(CLE_PARC, []);
var CLE_CLIENTS = "kare.clients.v1";
var clients = lire(CLE_CLIENTS, []);
function sauverCfg(){ ecrire(CLE_CFG, cfg); }

/* ============ état de la visite ============ */
var INTERV = [
  {c:"entretien", l:"Entretien", cle:"entretien"},
  {c:"mes",       l:"Mise en service", cle:"mise_en_service"},
  {c:"dep",       l:"Dépannage", cle:"depannage"}
];
function visiteVierge(){
  return {
    id: idUnique("visite"),
    client:"", adresse:"", ville:"", contact:"", present:"",
    signClient:"", signQui:"", signRefus:0,
    interv:"entretien",
    date: aujourdhui(),
    appareils:"",
    machines:[],
    envoye:{}
  };
}
var V = lire(CLE_VISITE, null);
if(!V || !Array.isArray(V.machines)) V = visiteVierge();

var minuteur=null, dernierEtat="";
function sauver(){
  clearTimeout(minuteur);
  minuteur = setTimeout(function(){
    var ok = ecrire(CLE_VISITE, V);
    majEtat(ok ? "enregistré" : "non enregistré", ok?"ok":"mal");
  }, 250);
}
function sauverTout(){ clearTimeout(minuteur); var ok=ecrire(CLE_VISITE,V); majEtat(ok?"enregistré":"non enregistré", ok?"ok":"mal"); return ok; }
function majEtat(t, k){
  var p=$("#pEtat"); if(!p) return;
  p.textContent = t; p.className = "pastille "+(k||"");
}

/* ============ machines ============ */
function machineVierge(cle){
  var t = TECHNOS[cle];
  var m = {mid: idUnique("m"), tech: cle, ident:{}, ctrl:{}, mes:{}, sous:[], anomalies:"", actions:"", conseils:{}, note:""};
  /* Une clim a toujours au moins une unité intérieure ; une VMC n'a pas
     à ouvrir une bouche vide qu'on ne remplira pas. */
  if(t && t.sousMachines) m.sous = t.sousMachines.vide ? [] : [{}];
  m.ctrlManuel = {}; m.na = {}; m.naAuto = {};
  m.prochaine = "";
  if(t){
    initCtrl(m);
    m.libCtrl = libellesCtrl(m);
    t.conseils.forEach(function(_, i){ m.conseils["k"+i] = 1; });
  }
  return m;
}
/* Un point adossé à une mesure ne se coche JAMAIS d'avance.
   Cocher un relevé que personne n'a pris, c'est écrire dans un document
   réglementaire qu'un contrôle a été fait alors qu'il ne l'a pas été — et
   ça prive Rémi du seul écran qui lui dit ce qu'il lui reste à faire.
   Les gestes manuels, eux, restent déclarés en bloc : aucune mesure ne
   pourra jamais les prouver. */
/* ============ migration d'une visite en cours ============
   Les points de contrôle sont mémorisés par INDICE (c0, c1, c2...). Si le
   catalogue change entre deux versions — un point ajouté, deux fusionnés —
   les indices se décalent et une visite déjà commencée se retrouve avec des
   cases cochées en face des mauvais libellés. Sur un document réglementaire,
   c'est inacceptable.
   On mémorise donc la liste des libellés avec la machine. Au chargement, si
   elle a changé, on réaligne case par case sur le libellé, et ce qui n'a pas
   d'équivalent repart à vide plutôt que de mentir. */
function libellesCtrl(m){ return listeCtrl(m).slice(); }
function migrerMachine(m){
  var t = techDe(m); if(!t) return false;
  var actuels = libellesCtrl(m);
  var anciens = m.libCtrl;
  if(!anciens){
    /* Visite commencée avant que l'application ne mémorise les libellés :
       on ne peut PAS savoir sur quelle liste les cases ont été cochées.
       On ne touche à rien — on photographie et on prévient une seule fois. */
    m.libCtrl = actuels;
    var coche = Object.keys(m.ctrlManuel || {}).length > 0;
    if(coche){ m.migre = {perdus: 0, avant: 0, incertain: 1}; return true; }
    return false;
  }
  if(anciens.length === actuels.length && anciens.every(function(l,i){ return l === actuels[i]; })) return false;

  var ancienCtrl = m.ctrl || {}, ancienManuel = m.ctrlManuel || {};
  var neuf = {}, neufManuel = {}, repris = 0;
  actuels.forEach(function(lib, i){
    var j = anciens.indexOf(lib);
    if(j >= 0){
      if(ancienCtrl["c"+j] !== undefined) neuf["c"+i] = ancienCtrl["c"+j];
      if(ancienManuel["c"+j]) neufManuel["c"+i] = 1;
      repris++;
    }
  });
  m.ctrl = neuf; m.ctrlManuel = neufManuel; m.libCtrl = actuels;
  m.migre = {perdus: actuels.length - repris, avant: anciens.length};
  return true;
}
function initCtrl(m){
  var t = techDe(m); if(!t) return;
  var lc = listeCtrl(m);
  var adossee = pointsMesure(m);
  var defautGeste = (cfg.modeControles === "aFaire") ? "" : "ok";
  var neuf = {};
  lc.forEach(function(_, i){ neuf["c"+i] = adossee[i] ? "" : defautGeste; });
  m.ctrl = neuf;
}
function recalerControles(){
  V.machines.forEach(function(m){
    var t = techDe(m); if(!t) return;
    var lc = t.ctrl[V.interv] || t.ctrl.entretien || [];
    var adossee = pointsMesure(m);
    var defautGeste = (cfg.modeControles === "aFaire") ? "" : "ok";
    var neuf = {};
    lc.forEach(function(_, i){
      neuf["c"+i] = (m.ctrl["c"+i] !== undefined) ? m.ctrl["c"+i]
                                                  : (adossee[i] ? "" : defautGeste);
    });
    m.ctrl = neuf;
    appliquerLiens(m);
  });
}
function ajouterMachine(cle){
  var m = machineVierge(cle);
  V.machines.push(m); sauver(); return m;
}
function machineParId(mid){
  for(var i=0;i<V.machines.length;i++) if(V.machines[i].mid===mid) return V.machines[i];
  return null;
}
function techDe(m){ return TECHNOS[m.tech] || null; }
function listeCtrl(m){
  var t=techDe(m); if(!t) return [];
  return t.ctrl[V.interv] || t.ctrl.entretien || [];
}
function libelleMachine(m){
  var t=techDe(m); if(!t) return "Machine";
  var d=[]; if(m.ident.marque) d.push(m.ident.marque);
  if(m.ident.serie) d.push("n° "+m.ident.serie);
  if(m.ident.puiss) d.push(m.ident.puiss+" kW");
  return d.length ? d.join(" · ") : t.label;
}

/* ============ mesure -> point de contrôle ============
   Quand une mesure est renseignée, le point de contrôle qu'elle prouve
   se coche tout seul. Le repérage se fait sur un fragment de libellé,
   pour rester juste même si l'ordre de la liste change. */
var LIENS = {
  chaudiere_gaz: {
    co_amb:"teneur en CO dans l", tfum:"température des fumées", co2:"CO2 ou en O2", o2:"CO2 ou en O2",
    pcirc:"pression du circuit hydraulique", pvase:"gonflage du vase", emboue:"embouement du circuit",
    isol:"isolation des réseaux", dimension:"dimensionnement de la chaudière",
    classe_ener:"classe énergétique", rdt:"Évaluation du rendement", nox:"émissions de NOx"
  },
  chaudiere_fioul: {
    co_amb:"CO dans l'ambiance", co_fum:"Mesures de combustion", tfum:"Mesures de combustion",
    co2:"Mesures de combustion", o2:"Mesures de combustion", noircissement:"Mesures de combustion",
    rdt_mes:"Évaluation du rendement", nox:"émissions de NOx", ppulv:"pression de pulvérisation",
    pcirc:"Circuit hydraulique", pvase:"Circuit hydraulique", emboue:"Circuit hydraulique",
    isol:"isolation des réseaux", cuve_etat:"Cuve :", cuve_eau:"Cuve :"
  },
  pac_air_eau: {
    tstat:"tensions électriques statique", tdyn:"tensions électriques statique",
    pcirc:"contrôle de la pression", pvase:"gonflage du vase", emboue:"embouement",
    isol:"isolation des réseaux", classe_reg:"classes IV à VIII",
    bp:"pressions à l'entrée et à la sortie", hp:"pressions à l'entrée et à la sortie",
    ue_rep:"Relevé des températures", ue_souf:"Relevé des températures"
  },
  clim_air_air: {
    tstat:"tensions statique et dynamique", tdyn:"tensions statique et dynamique",
    bp:"pressions à l'entrée et à la sortie", hp:"pressions à l'entrée et à la sortie",
    etanch:"étanchéité du circuit", voyant:"voyant de fluide",
    ue_rep:"Relevé des températures", ue_souf:"Relevé des températures"
  },
  adoucisseur: {
    th_brut:"TH de l'eau brute", th_adouci:"TH de l'eau adoucie",
    pression:"Mesure de la pression d'entrée", index:"index du compteur volumétrique",
    regen_ok:"Régénération manuelle", sel:"Bac à sel : niveau",
    regen_fin:"Nouvelle mesure du TH après régénération"
  },
  vmc_df: {
    debit_ext:"Mesure des débits", debit_souf:"Mesure des débits",
    equilibrage:"équilibrage entre insufflation",
    t_ext:"Relevé des températures air extérieur", t_souf:"Relevé des températures air extérieur",
    t_rep:"Relevé des températures air extérieur", t_rej:"Relevé des températures air extérieur",
    filtres_etat:"Filtres :", filtres_ref:"Filtres :", siphon:"Bac et siphon de condensats"
  },
  cet: {
    consigne:"température de consigne et du cycle", antilegio:"température de consigne et du cycle",
    t_puisage:"mitigeur thermostatique", groupe_secu:"groupe de sécurité",
    anode_etat:"anode", appoint:"appoint électrique"
  }
};
function sansAccents(x){ return String(x).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); }
/* Indices de TOUS les points adossés à une mesure, remplie ou non.
   C'est ce qui sépare les relevés des gestes manuels. */
function pointsMesure(m){
  var t = techDe(m), liens = LIENS[m.tech], out = {};
  if(!t || !liens) return out;
  var lc = listeCtrl(m);
  Object.keys(liens).forEach(function(k){
    var frag = sansAccents(liens[k]);
    for(var i=0;i<lc.length;i++) if(sansAccents(lc[i]).indexOf(frag) >= 0){
      out[i] = out[i] || []; if(out[i].indexOf(k)<0) out[i].push(k);
    }
  });
  return out;
}
/* Indices des points prouvés par une mesure effectivement renseignée. */
function pointsJustifies(m){
  var t = techDe(m), liens = LIENS[m.tech];
  var out = {};
  if(!t || !liens) return out;
  var lc = listeCtrl(m);
  Object.keys(liens).forEach(function(k){
    var champ = null;
    for(var j=0;j<t.mes.length;j++) if(t.mes[j].k===k){ champ = t.mes[j]; break; }
    var rempli;
    if(champ && champ.type==="calc"){
      /* Une valeur calculée n'est pas forcément un nombre : la classe
         énergétique rend « B » ou « étiquette ErP du fabricant ». Ne tester
         que estNb() laissait ces points-là éternellement « à relever », et
         donc le document impossible à finir. */
      var vc = valeurCalc(m, champ);
      rempli = estNb(vc) || (typeof vc === "string" && vc !== "");
    }
    else rempli = txt(m.mes[k]) !== null;
    if(!rempli) return;
    var frag = sansAccents(liens[k]);
    for(var i=0;i<lc.length;i++) if(sansAccents(lc[i]).indexOf(frag) >= 0) out[i] = k;
  });
  return out;
}
/* ============ sans objet automatique ============
   Un point qui ne peut pas exister sur cet appareil ne doit pas attendre
   qu'on le décoche : une chaudière étanche n'a pas de CO d'ambiance à
   relever, un brûleur à prémélange n'a pas de mesure de brûleur soufflé.
   Les règles vivent dans le catalogue, à côté des points qu'elles visent.
   On ne touche jamais à ce que Rémi a réglé lui-même. */
/* Une règle peut s'appuyer sur l'identification ou sur un relevé déjà pris
   (le voyant de fluide, par exemple, se constate avant de se juger). */
function valeurChamp(m, cle){
  var v = txt(m.ident[cle]);
  if(v === null) v = txt(m.mes[cle]);
  return sansAccents(v || "");
}
function regleSApplique(m, r){
  var ok = true;
  if(r.si) Object.keys(r.si).forEach(function(c){
    var v = valeurChamp(m, c);
    if(!v) { ok = false; return; }                       /* pas renseigné : on ne présume rien */
    if(!r.si[c].some(function(x){ return v.indexOf(sansAccents(x)) >= 0; })) ok = false;
  });
  if(ok && r.sauf) Object.keys(r.sauf).forEach(function(c){
    var v = valeurChamp(m, c);
    if(!v) { ok = false; return; }
    if(r.sauf[c].some(function(x){ return v.indexOf(sansAccents(x)) >= 0; })) ok = false;
  });
  return ok;
}
function appliquerNP(m){
  var t = techDe(m); if(!t || !t.np) return;
  var lc = listeCtrl(m);
  m.na = m.na || {}; m.naAuto = m.naAuto || {}; m.naManuel = m.naManuel || {};
  m.ctrlManuel = m.ctrlManuel || {};
  m.npAuto = {};
  t.np.forEach(function(r){
    var actif = regleSApplique(m, r);
    (r.points || []).forEach(function(frag){
      var f = sansAccents(frag);
      lc.forEach(function(lib, i){
        if(sansAccents(lib).indexOf(f) < 0) return;
        if(m.ctrlManuel["c"+i]) return;
        if(actif){ m.ctrl["c"+i] = "np"; m.npAuto["c"+i] = r.pourquoi || "sans objet sur cet appareil"; }
        else if(m.ctrl["c"+i] === "np") m.ctrl["c"+i] = "";
      });
    });
    (r.mesures || []).forEach(function(k){
      if(m.naManuel[k]) return;
      if(actif){ m.na[k] = 1; m.naAuto[k] = r.pourquoi || "sans objet sur cet appareil"; delete m.mes[k]; }
      else if(m.naAuto[k]){ delete m.na[k]; delete m.naAuto[k]; }
    });
  });
}

/* Applique les liaisons sans jamais écraser un choix fait à la main.
   Une mesure marquée sans objet met son point en NP, pas en non contrôlé. */
function appliquerLiens(m){
  appliquerNP(m);
  var j = pointsJustifies(m);
  var tous = pointsMesure(m);
  m.na = m.na || {};
  m.ctrlManuel = m.ctrlManuel || {};
  /* Un point déclaré sans objet par l'appareil lui-même l'emporte sur tout :
     relever une valeur ne rend pas présent un organe qui n'existe pas. */
  m.npAuto = m.npAuto || {};
  Object.keys(j).forEach(function(i){
    if(m.ctrlManuel["c"+i] || m.npAuto["c"+i]) return;
    m.ctrl["c"+i] = "ok";
  });
  Object.keys(tous).forEach(function(i){
    if(m.ctrlManuel["c"+i] || m.npAuto["c"+i]) return;
    var cles = tous[i];
    var toutesSO = cles.length && cles.every(function(k){ return m.na[k]; });
    if(toutesSO) m.ctrl["c"+i] = "np";
    else if(m.ctrl["c"+i] === "np" && !j[i]) m.ctrl["c"+i] = "";
    else if(m.ctrl["c"+i] === "ok" && !j[i]) m.ctrl["c"+i] = "";
  });
  recalerConseils(m);
  return j;
}
/* Le conseil de remplacement pour écart de rendement affirme un fait.
   Sur une chaudière à condensation, rendement évalué et rendement de référence
   sont donnés par la même formule : l'écart est nul et le conseil n'a pas lieu
   d'être. On ne le coche donc que s'il existe un écart réel, et on n'y touche
   plus dès que Rémi l'a réglé lui-même. */
var CONSEIL_ECART_RENDEMENT = "Remplacement : écart entre le rendement";
/* Un conseil affirme quelque chose. Trois raisons de ne pas le donner :
   il ne concerne pas cet appareil, il conseille une amélioration déjà
   constatée conforme, ou il repose sur un écart qui n'existe pas.
   Les règles vivent dans le catalogue, sous « conseilsSi ». Dès que Rémi
   a réglé un conseil lui-même, on n'y touche plus. */
function recalerConseils(m){
  var t = techDe(m); if(!t || !t.conseils) return;
  m.conseilsManuel = m.conseilsManuel || {};
  var lc = listeCtrl(m), regles = t.conseilsSi || {};
  t.conseils.forEach(function(lib, i){
    if(m.conseilsManuel["k"+i]) return;

    if(lib.indexOf(CONSEIL_ECART_RENDEMENT) === 0){
      var r0 = rendementGaz(m), ref0 = rendementRefGaz(m);
      m.conseils["k"+i] = (estNb(r0) && estNb(ref0) && r0 < ref0 - 0.05) ? 1 : 0;
      return;
    }
    var r = regles[lib];
    if(!r) return;                                   /* sans règle : donné par défaut */
    var ok = (r.si || r.sauf) ? regleSApplique(m, r) : true;
    if(ok && r.siPointNonOk){
      var f = sansAccents(r.siPointNonOk), trouve = false, conforme = false;
      lc.forEach(function(pt, k){
        if(sansAccents(pt).indexOf(f) < 0) return;
        trouve = true;
        if(m.ctrl["c"+k] === "ok" || m.ctrl["c"+k] === "np") conforme = true;
      });
      if(trouve && conforme) ok = false;
    }
    m.conseils["k"+i] = ok ? 1 : 0;
  });
}

function basculerSansObjet(m, k){
  m.na = m.na || {}; m.naAuto = m.naAuto || {};
  if(m.na[k]){ delete m.na[k]; delete m.naAuto[k]; } else { m.na[k] = 1; delete m.mes[k]; }
  m.naManuel = m.naManuel || {}; m.naManuel[k] = 1;   /* Rémi a tranché : on n'y revient plus */
  appliquerLiens(m); enregistrerProfil(m);
}

/* ============ mémoire par machine ============
   Ce qui n'est pas relevable sur CETTE machine est retenu,
   pour ne plus être demandé à la visite suivante. */
var CLE_PROFILS = "kare.profils.v1";
function cleProfil(m){ return m.notion || (m.ident && m.ident.serie ? m.tech+":"+m.ident.serie : null); }
/* Ce qui ne change pas d'une visite à l'autre n'a pas à être ressaisi chaque
   année : l'isolation des réseaux, le type d'évacuation, le brûleur, la
   production d'eau chaude. On les mémorise par machine, on les repropose à la
   visite suivante — et Rémi garde la main : il modifie, c'est sa saisie qui
   gagne et qui devient la nouvelle mémoire. */
var IDENT_STABLE = ["techno","bruleur","flamme","evac","ecs","combustible","puiss","marque","serie",
                    "annee","fluide","charge","nbui","emetteurs","cuve_type","cuve_vol",
                    "resine","protection","bypass","local","mes"];
function enregistrerProfil(m){
  var c = cleProfil(m); if(!c) return;
  var p = lire(CLE_PROFILS, {});
  var na = Object.keys(m.na || {}).filter(function(k){ return !(m.naAuto||{})[k]; });
  var ident = {};
  IDENT_STABLE.forEach(function(k){ var v = txt(m.ident[k]); if(v !== null) ident[k] = v; });
  if(na.length || Object.keys(ident).length) p[c] = {na:na, ident:ident, tech:m.tech, le:V.date};
  else delete p[c];
  ecrire(CLE_PROFILS, p);
}
function appliquerProfil(m){
  var c = cleProfil(m); if(!c) return;
  var p = lire(CLE_PROFILS, {})[c];
  if(!p || p.tech !== m.tech) return;
  m.na = m.na || {};
  (p.na || []).forEach(function(k){ m.na[k] = 1; m.naManuel = m.naManuel || {}; m.naManuel[k] = 1; });
  /* on ne remplit que les cases vides : jamais écraser ce qui vient d'être saisi */
  Object.keys(p.ident || {}).forEach(function(k){
    if(txt(m.ident[k]) === null){ m.ident[k] = p.ident[k]; m.identRepris = m.identRepris || {}; m.identRepris[k] = p.le || 1; }
  });
  appliquerLiens(m);
}

function horsPlage(m){
  var t = techDe(m);
  if(!t || !t.regl.obligatoire || !estNb(t.regl.pmin)) return null;
  var p = nb(m.ident.puiss);
  if(!estNb(p) || p <= 0) return null;
  if(p < t.regl.pmin) return {sens:"sous", seuil:t.regl.pmin, p:p};
  if(p > t.regl.pmax) return {sens:"au-dessus de", seuil:t.regl.pmax, p:p};
  return false;
}
function estReglementaire(m){
  var t = techDe(m);
  if(!t || !t.regl.obligatoire) return false;
  return horsPlage(m) ? false : true;
}
function estEssentielle(tech, k){ var l = ESSENTIELLES[tech]; return !l || l.indexOf(k) >= 0; }
function estMasquee(tech, k){ var l = MASQUEES[tech]; return !!l && l.indexOf(k) >= 0; }

/* ============ calculs ============ */
function valeurCalc(m, champ, source){
  source = source || m.mes;
  var c = champ.calc || "";
  if(c.indexOf("absdiff:")===0){
    var p=c.slice(8).split(","), a=nb(source[p[0]]), b=nb(source[p[1]]);
    return (estNb(a)&&estNb(b)) ? Math.round(Math.abs(b-a)*10)/10 : NaN;
  }
  if(c==="rendement_gaz")      return rendementGaz(m);
  if(c==="rendement_ref_gaz")  return rendementRefGaz(m);
  if(c==="nox_gaz")            return noxGaz(m);
  if(c==="nox_fioul")          return noxFioul(m);
  if(c==="classe_energie")     return classeEnergie(m);
  /* 1 °f retiré = 0,2 mmol/L de Na+ = 4,6 mg/L. Le chiffre de 8 mg/L qui
     circule vient du degré allemand (1 °dH = 1,78 °f). Source : mémoire EHESP
     2004, repris par les documents de formation du traitement de l'eau. */
  if(c==="sodium"){ var thb=nb(source.th_brut), tha=nb(source.th_adouci);
    return (estNb(thb)&&estNb(tha)&&thb>=tha) ? Math.round((thb-tha)*4.6) : NaN; }
  if(c==="rendement_echangeur"){
    var te=nb(source.t_ext), ts=nb(source.t_souf), tr=nb(source.t_rep);
    if(!estNb(te)||!estNb(ts)||!estNb(tr)||Math.abs(tr-te)<0.1) return NaN;
    return Math.round((ts-te)/(tr-te)*1000)/10;
  }
  if(c==="equilibrage"){
    var de=nb(source.debit_ext), ds=nb(source.debit_souf);
    if(!estNb(de)||!estNb(ds)||de<=0) return NaN;
    return Math.round(Math.abs(ds-de)/de*1000)/10;
  }
  return NaN;
}

/* Rendement forfaitaire gaz — annexe 2 de l'arrêté du 15/09/2009.
   ATTENTION : valeur FORFAITAIRE, pas la lecture de l'analyseur.
   Formules à recaler sur le modèle CAPEB (voir Sources). */
function rendementGaz(m){
  var p = nb(m.ident.puiss), an = nb(m.ident.annee), tech = m.ident.techno || "";
  if(!estNb(p) || p<=0) return NaN;
  var L = Math.log(p)/Math.LN10, r;
  if(tech.indexOf("condensation")===0)        r = 91   + 1.0*L;
  else if(tech.indexOf("basse")===0)          r = 87.5 + 1.5*L;
  else if(tech.indexOf("standard")===0)       r = 84   + 2.0*L;
  else if(estNb(an) && an<1981)               r = 79   + 2.0*L;
  else if(estNb(an) && an<1986)               r = 82   + 2.0*L;
  else if(estNb(an) && an<1991)               r = 83   + 2.0*L;
  else                                        r = 84   + 2.0*L;
  return Math.round(r*10)/10;
}
function rendementRefGaz(m){
  var p = nb(m.ident.puiss);
  if(!estNb(p) || p<=0) return NaN;
  return Math.round((91 + 1.0*(Math.log(p)/Math.LN10))*10)/10;
}
/* NOx forfaitaires gaz — annexe 3. Ne se mesurent pas en entretien courant. */
var NOX_GAZ = {
  "prémélange total":45, "prémélange partiel":170, "atmosphérique":300, "air soufflé":130
};
/* Annexe 3 : la valeur portée sur l'attestation est forfaitaire et dépend du
   type de brûleur, quelle que soit l'année. Je renvoyais 56 mg/kWh pour les
   appareils d'après 2018 — c'était le plafond d'éco-conception, pas un
   forfait d'annexe 3. Deux choses différentes : le plafond dit ce qu'un
   appareil a le droit d'émettre, le forfait dit ce qu'on inscrit. */
function noxGaz(m){
  var b = m.ident.bruleur || "";
  var v = NOX_GAZ[b];
  return estNb(v) ? v : NaN;
}
/* NOx forfaitaires fioul — annexe 3, classement par technologie de flamme
   (et non par nombre d'allures : le texte ne connaît pas ce critère).
   RÉSERVE : deux reproductions sérieuses de l'annexe donnent le même jeu de
   chiffres décalé d'une ligne. J'ai retenu l'alignement Sauermann, seul
   physiquement cohérent (jaune > jaune à recirculation > bleue > radiant),
   confirmé par deux éditions du document. À contrôler une fois sur le PDF
   officiel de l'annexe 3 avant de considérer la table comme acquise. */
var NOX_FIOUL = {
  "ancienne (avant 1990)":        {v:170},
  "flamme jaune":                 {v:140, gros:210},
  "flamme jaune à recirculation": {v:120, gros:180},
  "flamme bleue":                 {v:90},
  "radiant":                      {v:60}
};
function noxFioul(m){
  var e = NOX_FIOUL[m.ident.flamme || ""];
  if(!e) return NaN;
  var p = nb(m.ident.puiss);
  if(e.gros && estNb(p) && p >= 150) return e.gros;
  return e.v;
}
/* Table de classification énergétique du modèle d'attestation 2023.
   Ne vaut que pour les appareils mis sur le marché avant septembre 2015 ;
   au-delà, c'est l'étiquette ErP du fabricant. */
function classeEnergie(m){
  var tech = sansAccents(txt(m.ident.techno) || ""), an = nb(m.ident.annee);
  if(!tech || !estNb(an)) return null;
  /* Après septembre 2015 la table ne vaut plus : la classe est celle de
     l'étiquette ErP. Si Rémi l'a relevée sur place, c'est elle qui compte ;
     sinon on écrit une phrase qui se tient sur un document client, pas une
     consigne à soi-même. */
  if(an >= 2015){
    var lue = txt((m.mes||{}).classe_erp);
    if(lue && lue !== "étiquette absente ou illisible") return lue;
    return "non déterminée — classe portée sur l'étiquette ErP du fabricant";
  }
  /* Le modèle d'attestation borne la rubrique : « si antérieure à 2015 et de
     moins de 70 kW ». Au-delà, on n'invente pas une classe. */
  var p = nb(m.ident.puiss);
  if(estNb(p) && p >= 70) return "non déterminée (appareil de 70 kW ou plus)";
  var condens = tech.indexOf("condensation") === 0;
  if(m.tech === "chaudiere_fioul"){
    /* Fioul : bascule en 2000 et plafond à B pour la condensation. */
    if(condens) return "B";
    return an < 2000 ? "D" : "C";
  }
  if(condens) return an < 2005 ? "B" : "A";
  return an < 2005 ? "D" : "C";
}

/* ============ verdicts ============ */
/* Paliers CO ambiant — art. 3 de l'arrêté du 15/09/2009 */
function verdictCO(v){
  if(!estNb(v)) return null;
  if(v < 10)  return {k:"ok",  t:"NORMALE"};
  if(v < 50)  return {k:"att", t:"ANORMALE — investigations obligatoires"};
  return {k:"mal", t:"DANGER GRAVE — arrêt et consignation"};
}
/* Deux repères d'appareil qui reviennent partout dans les plages usuelles. */
function estCondensation(m){
  return sansAccents(txt((m&&m.ident||{}).techno) || "").indexOf("condensation") === 0;
}
function estAtmospherique(m){
  return sansAccents(txt((m&&m.ident||{}).bruleur) || "").indexOf("atmospherique") >= 0;
}
/* Deux natures de bornes, à ne surtout pas mélanger :
   — min/max : seuil opposable. Le dépassement est une anomalie, il part sur
     le document du client.
   — ref     : plage usuelle de bon fonctionnement. Elle sert à voir d'un
     coup d'œil si la valeur est plausible. Elle ne crée JAMAIS d'anomalie,
     et rien n'échoue parce qu'une mesure en sort.
   La plage usuelle peut dépendre de l'appareil (condensation ou non) : on
   accepte alors une fonction plutôt qu'un objet. */
function plageRef(champ, m){
  var r = champ.ref;
  if(typeof r === "function") r = r(m || {ident:{}, tech:""});
  if(!r || (!estNb(r.min) && !estNb(r.max))) return null;
  return r;
}
function bornerTexte(v, u){ return fmt(v, v%1 ? 1 : 0) + (u ? " "+u : ""); }
function texteRef(champ, m){
  var r = plageRef(champ, m); if(!r) return "";
  var u = champ.u || "";
  var t;
  if(estNb(r.min) && estNb(r.max)) t = "usuel : " + bornerTexte(r.min,"") + " à " + bornerTexte(r.max,u);
  else if(estNb(r.min))            t = "usuel : au moins " + bornerTexte(r.min,u);
  else                             t = "usuel : jusqu'à " + bornerTexte(r.max,u);
  return t + (r.note ? " — " + r.note : "");
}
function verdict(champ, val, m){
  if(champ.paliers === "co") return verdictCO(val);
  if(!estNb(val)) return null;
  var min = estNb(champ.min)?champ.min:null, max = estNb(champ.max)?champ.max:null;
  if(min!==null || max!==null){
    if(min!==null && val < min) return {k:"att", t:"sous " + bornerTexte(min, champ.u)};
    if(max!==null && val > max) return {k:"att", t:"au-dessus de " + bornerTexte(max, champ.u)};
    return {k:"ok", t:"dans la plage"};
  }
  var r = plageRef(champ, m);
  if(!r) return null;
  /* Une dépression se note tantôt −8 Pa, tantôt 8 Pa. On ne va pas
     transformer une convention de signe en alerte. */
  if(champ.absRef) val = Math.abs(val);
  if((estNb(r.min) && val < r.min) || (estNb(r.max) && val > r.max))
    return {k:"att", t:"hors plage usuelle", indicatif:true};
  return {k:"ok", t:"dans la plage usuelle", indicatif:true};
}

/* ============ avancement ============ */
function avancement(m){
  var t=techDe(m); if(!t) return {fait:0, total:0};
  var lc = listeCtrl(m), fait=0, total=lc.length;
  for(var i=0;i<lc.length;i++) if(m.ctrl["c"+i]) fait++;
  var mesFaites=0, mesTotal=0;
  for(var j=0;j<t.mes.length;j++){
    var ch=t.mes[j]; if(ch.type==="calc"||ch.type==="fixe") continue;
    mesTotal++; if(txt(m.mes[ch.k])!==null) mesFaites++;
  }
  return {fait:fait+mesFaites, total:total+mesTotal, ctrlFait:fait, ctrlTotal:total};
}
function anomaliesDe(m){
  var t=techDe(m); if(!t) return [];
  var out=[], lc=listeCtrl(m), i;
  if(typeof ligneVentilation === "function"){
    var lv = ligneVentilation(m);
    if(lv && lv.alerte) out.push({type:"aération", lib:lv.k+" : "+lv.v});
  }
  for(i=0;i<lc.length;i++) if(m.ctrl["c"+i]==="non") out.push({type:"contrôle", lib:lc[i]});
  for(i=0;i<t.mes.length;i++){
    var ch=t.mes[i], val = ch.type==="calc" ? valeurCalc(m,ch) : nb(m.mes[ch.k]);
    var v = verdict(ch, val, m);
    /* Une plage usuelle n'est pas un seuil : elle ne part pas chez le client. */
    if(v && v.k!=="ok" && !v.indicatif) out.push({type:"mesure", lib:ch.l+" : "+fmt(val,1)+(ch.u?" "+ch.u:"")+" — "+v.t, grave:v.k==="mal"});
  }
  return out;
}
