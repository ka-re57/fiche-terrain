/* ============ réglages ============ */
function ouvrirReglages(){
  var t = document.querySelector("#dlgReglages .dlg-tete");
  if(t) t.textContent = "Réglages — version " + VERSION;
  $("#cfgWebhook").value = cfg.webhook || "";
  $("#cfgMajUrl").value = cfg.majUrl || "";
  majEtatMaj();
  $("#cfgSecret").value  = cfg.secret  || "";
  $("#cfgTech").value    = cfg.technicien || "";
  $("#cfgAppareils").value = cfg.appareils || "";
  $("#cfgMode").value = cfg.modeControles || "declare";
  $("#cfgSignClient").value = cfg.signClient || "oui";
  if(window.__signatureInit) window.__signatureInit();
  var ip = $("#infoParc");
  if(parc && parc.length){

    ip.textContent = parc.length+" machines au parc · "+clients.length+" clients Axonaut";
  } else ip.textContent = "Aucun parc chargé.";

  var iv = $("#infoVisites");
  var f = fileLire();
  iv.textContent = V.machines.length+" machine(s) en cours · "+f.length+" en attente"
    + (STOCK_OK ? "" : " · ENREGISTREMENT LOCAL INDISPONIBLE");

  var src = $("#infoSources");
  if(!src.dataset.rempli){
    src.innerHTML =
      "<p>Points de contrôle et mentions établis d'après les textes (arrêtés du 15/09/2009, 24/07/2020 et 21/11/2022) "+
      "et des sources professionnelles. Plusieurs libellés viennent de sources secondaires, pas du texte officiel. "+
      "Dernière vérification des sources : 26/08/2026.</p>"+

      "<p><b>Vérifié et corrigé le 26/08/2026 :</b></p>"+
      "<ul>"+
      "<li><b>Sodium apporté par l'adoucissement : 4,6 mg/L par °f</b>, et non 8. Le 8 vient du degré allemand "+
      "(1 °dH = 1,78 °f). Source : mémoire EHESP 2004, documents de formation du traitement de l'eau. "+
      "L'ancienne valeur surestimait le sodium de 74 % sur le document du client.</li>"+
      "<li><b>Eau adoucie potable.</b> Aucun texte ne la rend impropre. Le point d'eau froide non adoucie est "+
      "<b>obligatoire en installation collective</b> (art. R.1321-53 du code de la santé publique), "+
      "seulement recommandé en maison individuelle. Le sodium est une <i>référence</i> de qualité à 200 mg/L "+
      "(arrêté du 11 janvier 2007), pas une limite. Aucune position officielle française sur les nourrissons : "+
      "l'affirmation a été retirée.</li>"+
      "<li><b>Entretien d'adoucisseur : aucune obligation légale.</b> Recommandation professionnelle et condition "+
      "de garantie, rien de plus.</li>"+
      "<li><b>Ramonage : à l'initiative de l'occupant</b> (décret 2023-641, art. R.1331-21 du code de la santé publique). "+
      "L'arrêté du 15/09/2009 n'impose que d'en reporter la date « si disponible et si applicable ». "+
      "Le point de contrôle est devenu un devoir de conseil.</li>"+
      "<li><b>Raccordements NF EN 1749 :</b> B1 avec coupe-tirage, B2 sans. Second chiffre = position du ventilateur, "+
      "2 en aval de la chambre de combustion, 3 en amont. Suffixe P = conduit en surpression.</li>"+
      "</ul>"+

      "<p><b>Aération du local :</b> l'application ne calcule plus la section ou le module exigés. "+
      "Elle donne accès à la notice — <b>Fiche Visa Qualité Habitation 2026</b> et <b>Fiches pratiques ventilation</b>, "+
      "arrêté du 23 février 2018, art. 13 et 18 — et enregistre le verdict porté sur place. "+
      "Le référentiel vise la conformité de l'INSTALLATION ; l'entretien annuel, lui, n'impose que de vérifier "+
      "que les orifices d'amenée d'air ne sont pas obstrués, et d'investiguer au-delà de 10 ppm de CO. "+
      "Le point de contrôle correspondant existe dans la liste réglementaire du <b>fioul</b> ; l'annexe 1 de "+
      "l'arrêté du 15/09/2009 ne le cite pas pour le <b>gaz</b>, où le verdict figure donc comme constat de visite.</p>"+

      "<p><b>Plages usuelles et seuils opposables.</b> Un seul jeu de seuils est opposable en 4 à 400 kW : "+
      "le <b>CO ambiant</b> (10 ppm : anomalie et investigations ; 50 ppm : danger grave, arrêt et consignation). "+
      "Tout le reste — CO2, O2, température des fumées, rendement lu à l'analyseur, pression de circuit, "+
      "pression de vase, indice de noircissement, pression de pulvérisation — est affiché comme "+
      "<b>plage usuelle indicative</b>. Une valeur qui en sort n'est jamais portée en anomalie sur le document "+
      "du client. Les anciennes bornes opposables ont été corrigées le 26/08/2026 : un vase gonflé à 0,7 bar "+
      "(valeur d'usine) et une chaudière fioul à 89 % de rendement partaient à tort en anomalie.</p>"+

      "<p><b>RÉSERVE — NOx forfaitaires fioul.</b> La table de l'annexe 3 est appliquée dans l'alignement "+
      "Sauermann (ancienne avant 1990 : 170 · flamme jaune : 140, 210 au-delà de 150 kW · flamme jaune à "+
      "recirculation : 120, 180 · flamme bleue : 90 · radiant : 60 mg/kWh). Une autre reproduction sérieuse "+
      "du même tableau donne les mêmes chiffres <b>décalés d'une ligne</b>. L'alignement retenu est le seul "+
      "physiquement cohérent et il est confirmé par deux éditions du document, mais <b>il n'a pas été vérifié "+
      "sur le PDF officiel de l'annexe 3</b> (tableau publié en image, Légifrance inaccessible). "+
      "À contrôler une fois avant de considérer la table comme acquise. "+
      "Les <b>NOx de référence fioul à 90 mg/kWh</b>, eux, sont confirmés par le modèle d'attestation COSTIC "+
      "de novembre 2025 et par le guide Énergies Avenir.</p>"+

      "<p><b>Classe énergétique fioul :</b> bascule en 2000 (et non 2005 comme le gaz), condensation plafonnée "+
      "à B. Rubrique bornée par le modèle d'attestation aux appareils <b>antérieurs à 2015 et de moins de "+
      "70 kW</b> ; au-delà, l'application affiche « non déterminée » plutôt qu'une classe inventée. "+
      "Table confirmée par deux sources concordantes, pas par le texte primaire.</p>"+

      "<p><b>Réglé le 26/08/2026 par le modèle d'attestation 2023 :</b> les <b>NOx de référence à 35 mg/kWh</b> sont "+
      "la bonne valeur — c'est le niveau atteint par les meilleures technologies présentes sur le marché depuis 2009, "+
      "à ne pas confondre avec le plafond d'éco-conception de 56 mg/kWh. La valeur <i>évaluée</i> reste un forfait lié "+
      "au type de brûleur : je renvoyais 56 pour les appareils d'après 2018, c'était une confusion, c'est corrigé. "+
      "La <b>classe énergétique se calcule</b> (standard ou basse température : D avant 2005, C après ; condensation : "+
      "B avant 2005, A après), pour les appareils mis sur le marché avant septembre 2015 seulement. "+
      "Le <b>rendement de référence</b> est bien celui d'une chaudière à condensation de même puissance : la formule "+
      "de l'appli est conforme.</p>"+

      "<p><b>Toujours à faire confirmer :</b> valeurs du forfait NOx par type de brûleur (annexe 3) ; périodicité du "+
      "contrôle de cuve fioul ; section de transit sous les portes, non chiffrée dans le référentiel PG. "+
      "Le CO dans les fumées n'a aucun seuil réglementaire.</p>"+

      "<p><b>Périodicités :</b> chaudières annuelle · PAC et clim <b>biennale</b> · adoucisseur, VMC et CET "+
      "sans obligation, compte rendu contractuel.</p>";
    src.dataset.rempli="1";
  }
  $("#dlgReglages").showModal();
}

function importerConfig(fichier){
  var r = new FileReader();
  r.onload = function(){
    try{
      var d = JSON.parse(r.result);
      var n = 0;
      if(d.webhook){ cfg.webhook = d.webhook; n++; }
      if(d.majUrl){ cfg.majUrl = d.majUrl; n++; }
      if(d.secret){ cfg.secret = d.secret; n++; }
      if(d.technicien){ cfg.technicien = d.technicien; }
      var liste = d.parc || d.machines || (Array.isArray(d) ? d : null);
      if(Array.isArray(liste)){ parc = liste; ecrire(CLE_PARC, parc); n++; }
      if(Array.isArray(d.clients)){ clients = d.clients; ecrire(CLE_CLIENTS, clients); n++; }
      sauverCfg();
      ouvrirReglages(); rendre();
      toast(n ? "Configuration importée" : "Fichier lu, mais rien de reconnu", n?"ok":"att");
    }catch(e){ toast("Fichier illisible : "+e.message,"mal"); }
  };
  r.onerror = function(){ toast("Lecture impossible","mal"); };
  r.readAsText(fichier);
}

/* ============ enchaîner sur le client suivant ============ */
function nouvelleVisite(){
  V = visiteVierge(); sauverTout(); vue="visite"; rendre();
  window.scrollTo(0,0);
}
function proposerSuite(n){
  var d = $("#dlgApres"); if(!d) return;
  $("#apresTitre").textContent = n>1 ? (n+" fiches envoyées") : "Fiche envoyée";
  d.showModal();
}

/* ============ câblage ============ */
function cabler(){
  $("#bReglages").onclick = ouvrirReglages;
  $("#bEnvoyer").onclick  = envoyer;
  $("#bFichier").onclick  = telecharger;
  $("#bImprimer").onclick = imprimer;

  Array.prototype.forEach.call(document.querySelectorAll("[data-fermer]"), function(b){
    b.onclick = function(){ b.closest("dialog").close(); };
  });

  $("#cfgWebhook").addEventListener("input", function(){ cfg.webhook=this.value.trim(); sauverCfg(); });
  $("#cfgMajUrl").addEventListener("input", function(){ cfg.majUrl=this.value.trim(); sauverCfg(); });
  $("#bMaj").addEventListener("click", function(){
    var b = this;
    b.disabled = true; majEtatMaj("mise à jour en cours…");
    majParcEtClients(function(ok, m){
      b.disabled = false;
      if(ok){ majEtatMaj(); rendre(); toast("Parc et clients à jour — " + m, "ok"); }
      else  { majEtatMaj("échec : " + m); toast("Mise à jour impossible : " + m, "mal"); }
    });
  });
  $("#cfgSecret").addEventListener("input",  function(){ cfg.secret=this.value.trim(); sauverCfg(); });
  $("#cfgTech").addEventListener("input",    function(){ cfg.technicien=this.value.trim(); sauverCfg(); });
  $("#cfgAppareils").addEventListener("input", function(){ cfg.appareils=this.value.trim(); sauverCfg(); });
  $("#cfgSignClient").addEventListener("change", function(){ cfg.signClient=this.value; sauverCfg(); });
  $("#cfgMode").addEventListener("change", function(){
    cfg.modeControles = this.value; sauverCfg(); recalerControles(); sauverTout(); rendre();
    toast(this.value==="aFaire" ? "Mode liste à faire" : "Mode déclaration");
  });
  $("#cfgFichier").addEventListener("change", function(){ if(this.files && this.files[0]) importerConfig(this.files[0]); });

  $("#bTester").onclick = function(){
    if(!cfg.webhook){ toast("Adresse d'envoi non renseignée","mal"); return; }
    postMake(cfg.webhook, {secret:cfg.secret||"", test:true, application:"fiche-terrain KA-RÉ v"+VERSION})
      .then(function(r){
        if(r.ok) toast("Envoi accepté (HTTP "+r.status+") — Make écoute bien","ok");
        else if(r.status===400 || r.status===410) toast("Make répond "+r.status+" : aucun scénario n'écoute ce webhook","mal");
        else toast("Refusé — HTTP "+r.status,"mal");
      })
      .catch(function(e){
        toast(navigator.onLine===false
          ? "Pas de réseau — remets la connexion pour tester"
          : "Aucune réponse de Make. Soit le scénario n'écoute pas, soit il ne renvoie pas d'en-tête d'autorisation au navigateur.","mal");
      });
  };
  $("#bVider").onclick = function(){ fileEcrire([]); toast("File vidée"); };
  $("#bMajAppli").onclick = function(){ chercherMaj(true); };
  var bi = $("#bMajInstaller"), bt = $("#bMajPlusTard");
  if(bi) bi.onclick = installerMaj;
  if(bt) bt.onclick = function(){ var b = $("#majBandeau"); if(b) b.hidden = true; };
  $("#bReset").onclick = function(){
    if(this.dataset.arme!=="1"){ this.dataset.arme="1"; this.textContent="Confirmer l'effacement"; var b=this;
      setTimeout(function(){ if(b.dataset.arme==="1"){ b.dataset.arme=""; b.textContent="Effacer cette visite"; } },6000); return; }
    this.dataset.arme=""; this.textContent="Effacer cette visite";
    nouvelleVisite(); $("#dlgReglages").close(); toast("Visite effacée");
  };
  if(typeof cablerRappelSignature === "function") cablerRappelSignature();
  if(typeof cablerRappelReleves === "function") cablerRappelReleves();
  if(typeof cablerNotice === "function") cablerNotice();
  $("#bNouveauClient").onclick = function(){
    $("#dlgApres").close(); nouvelleVisite(); toast("Nouvelle visite — à toi de jouer","ok");
  };

  window.addEventListener("online",  function(){ majReseau(); viderFile(false); });
  window.addEventListener("offline", majReseau);
  document.addEventListener("visibilitychange", function(){ if(!document.hidden){ majReseau(); viderFile(false); } });
  window.addEventListener("beforeunload", sauverTout);
  setInterval(function(){ viderFile(false); }, 60000);
}

/* ============ démarrage ============ */
function demarrer(){
  cabler();
  /* Une visite en cours peut dater d'une version précédente du catalogue. */
  var migrees = 0, incertaines = 0;
  V.machines.forEach(function(m){
    if(!migrerMachine(m)) return;
    if(m.migre && m.migre.incertain) incertaines++; else migrees++;
  });
  if(migrees || incertaines){
    sauverTout();
    setTimeout(function(){
      var msg = migrees
        ? migrees + (migrees>1 ? " machines réalignées" : " machine réalignée") +
          " sur la nouvelle liste de points — vérifie les cases avant d'envoyer"
        : "visite commencée sur une version précédente — relis les cases de contrôle avant d'envoyer";
      toast(msg, "att");
    }, 900);
  }
  majReseau(); majFile();
  /* Le parc et les clients se rafraîchissent tout seuls, en arrière-plan. */
  setTimeout(majAutomatique, 3000);
  majEtat(STOCK_OK ? "prêt" : "enregistrement indisponible", STOCK_OK ? "" : "mal");
  rendre();
  setTimeout(function(){ viderFile(false); }, 2000);
  if("serviceWorker" in navigator){
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("sw.js").then(brancherMaj).catch(function(){});
    });
  }
}

/* ---- Mise à jour de l'application --------------------------------------
   Rien à désinstaller, jamais. Le navigateur va chercher la nouvelle version
   tout seul ; quand elle est prête et rangée hors ligne, un bandeau le dit et
   Rémi choisit le moment. Une visite en cours n'est jamais perdue : elle vit
   dans le stockage de la tablette, pas dans la page.                        */
var SW_REG = null, SW_PRET = null, SW_RECHARGE = false;

function brancherMaj(reg){
  if(!reg) return;
  SW_REG = reg;
  /* Au tout premier lancement il n'y a pas encore de version en place : ce qui
     s'installe n'est pas une mise à jour, c'est l'application elle-même. On ne
     dérange donc pas Rémi avec un bandeau. */
  var deja = !!navigator.serviceWorker.controller;
  if(deja && reg.waiting) annoncerMaj(reg.waiting);
  reg.addEventListener("updatefound", function(){
    var nv = reg.installing;
    if(!nv) return;
    nv.addEventListener("statechange", function(){
      if(nv.state !== "installed") return;
      if(deja) annoncerMaj(nv);
      else majAppliEtat("application installée hors ligne");
    });
  });
  navigator.serviceWorker.addEventListener("controllerchange", function(){
    if(SW_RECHARGE) return;
    SW_RECHARGE = true;
    location.reload();
  });
  chercherMaj(false);
  setInterval(function(){ if(navigator.onLine) chercherMaj(false); }, 30*60*1000);
  window.addEventListener("online", function(){ chercherMaj(false); });
}

function annoncerMaj(sw){
  SW_PRET = sw;
  var b = document.getElementById("majBandeau");
  if(b) b.hidden = false;
  majAppliEtat("une nouvelle version attend d'être installée");
}

function chercherMaj(direct){
  if(!SW_REG){ if(direct) majAppliEtat("mise à jour indisponible sur ce navigateur"); return; }
  if(!navigator.onLine){ if(direct) majAppliEtat("hors connexion — réessaie quand tu auras du réseau"); return; }
  if(direct) majAppliEtat("recherche…");
  SW_REG.update().then(function(){
    if(!direct) return;
    setTimeout(function(){
      if(!SW_PRET) majAppliEtat("tu es déjà sur la dernière version (" + VERSION + ")");
    }, 1500);
  }).catch(function(){ if(direct) majAppliEtat("recherche impossible"); });
}

function installerMaj(){
  if(!SW_PRET) return;
  majAppliEtat("installation…");
  SW_PRET.postMessage({type:"PRENDRE_LA_MAIN"});
  /* filet de sécurité si controllerchange ne vient pas */
  setTimeout(function(){ if(!SW_RECHARGE){ SW_RECHARGE = true; location.reload(); } }, 2500);
}

function majAppliEtat(t){
  var e = document.getElementById("majAppliEtat");
  if(e) e.textContent = t;
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer);
else demarrer();

/* Accès de service — utile pour diagnostiquer depuis la console du navigateur.
   Ne contient aucun secret : la configuration vit dans le stockage local. */
window.KARE = {
  version: VERSION,
  TECHNOS: TECHNOS,
  get visite(){ return V; },
  set visite(x){ V = x; },
  get config(){ return cfg; },
  get parc(){ return parc; },
  get clients(){ return clients; },
  set parc(x){ parc = x; ecrire(CLE_PARC, parc); },
  ajouterMachine: ajouterMachine, aller: aller, rendre: rendre,
  valeurCalc: valeurCalc, verdict: verdict, verdictCO: verdictCO,
  anomaliesDe: anomaliesDe, avancement: avancement,
  payloadMachine: payloadMachine, resumeTexte: resumeTexte,
  fileLire: fileLire, fileEcrire: fileEcrire, viderFile: viderFile,
  envoyer: envoyer, sauverTout: sauverTout, sauverCfg: sauverCfg,
  visiteVierge: visiteVierge, majReseau: majReseau, telecharger: telecharger,
  documentMachine: documentMachine, imprimer: imprimer,
  pointsJustifies: pointsJustifies, appliquerLiens: appliquerLiens, listeCtrl: listeCtrl,
  pointsMesure: pointsMesure, basculerSansObjet: basculerSansObjet,
  horsPlage: horsPlage, estReglementaire: estReglementaire,
  appliquerProfil: appliquerProfil, enregistrerProfil: enregistrerProfil,
  rendementGaz: rendementGaz, rendementRefGaz: rendementRefGaz,
  recalerConseils: recalerConseils,
  modeleDocument: modeleDocument, documentPDF: documentPDF,
  nomPDF: nomPDF, pdfBase64: pdfBase64,
  pdfCouper: pdfCouper, pdfLargeur: pdfLargeur, pdfNettoie: pdfNettoie,
  ventilationConcernee: ventilationConcernee, ventDe: ventDe,
  appliquerVentilation: appliquerVentilation, ligneVentilation: ligneVentilation,
  ouvrirNotice: ouvrirNotice, feuilleter: feuilleter,
  texteRef: texteRef, plageRef: plageRef, verdict: verdict,
  noxGaz: noxGaz, noxFioul: noxFioul, classeEnergie: classeEnergie,
  get notice(){ return NOTICE_VENT; },
  initCtrl: initCtrl, appliquerNP: appliquerNP, recalerConseils: recalerConseils,
  relevesManquants: relevesManquants,
  ouvrirFiche: ouvrirFiche, ficheDispo: ficheDispo, migrerMachine: migrerMachine,
  ouvrirSignatureClient: ouvrirSignatureClient,
  majParcEtClients: majParcEtClients, majAutomatique: majAutomatique,
  parcDepuisNotion: parcDepuisNotion, clientsDepuisAxonaut: clientsDepuisAxonaut,
  valProp: valProp, texteMaj: texteMaj,
  get maj(){ return maj; },
  technos: function(){ return TECHNOS; },
  machineAFluide: machineAFluide, cerfaDe: cerfaDe, cerfaRequis: cerfaRequis,
  teqCO2: teqCO2, gwpDe: gwpDe, familleFluide: familleFluide,
  periodiciteEtancheite: periodiciteEtancheite, payloadCerfa: payloadCerfa,
  signatureDetenteurRequise: signatureDetenteurRequise, anomaliesCerfa: anomaliesCerfa,
  get fiches(){ return (typeof FICHES_REF !== "undefined") ? FICHES_REF : []; }
};

/* ============ signature du technicien ============ */
(function(){
  var toile, ctx, trace = false, vierge = true;
  function init(){
    toile = document.getElementById("cfgSign");
    if(!toile || toile.dataset.pret) return;
    toile.dataset.pret = "1";
    ctx = toile.getContext("2d");
    ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#0E1A26";
    function pos(e){
      var r = toile.getBoundingClientRect();
      return {x:(e.clientX-r.left)*toile.width/r.width, y:(e.clientY-r.top)*toile.height/r.height};
    }
    toile.addEventListener("pointerdown", function(e){
      trace = true; vierge = false; toile.setPointerCapture(e.pointerId);
      var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault();
    });
    toile.addEventListener("pointermove", function(e){
      if(!trace) return; var p = pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault();
    });
    ["pointerup","pointercancel","pointerleave"].forEach(function(ev){
      toile.addEventListener(ev, function(){ trace = false; });
    });
    document.getElementById("bSignEffacer").onclick = function(){
      ctx.clearRect(0,0,toile.width,toile.height); vierge = true;
      cfg.signature = ""; sauverCfg(); etat();
    };
    document.getElementById("bSignGarder").onclick = function(){
      if(vierge && !cfg.signature){ toast("Trace ta signature d'abord","att"); return; }
      cfg.signature = rogner(); sauverCfg(); etat();
      toast("Signature enregistrée","ok");
    };
  }
  /* rogne les marges vides et réduit, pour ne garder que le tracé */
  function rogner(){
    var d = ctx.getImageData(0,0,toile.width,toile.height).data;
    var x0=toile.width, y0=toile.height, x1=0, y1=0, vu=false;
    for(var y=0;y<toile.height;y++) for(var x=0;x<toile.width;x++){
      if(d[(y*toile.width+x)*4+3] > 12){
        vu=true; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y;
      }
    }
    if(!vu) return "";
    var mx = 6;
    x0=Math.max(0,x0-mx); y0=Math.max(0,y0-mx);
    x1=Math.min(toile.width-1,x1+mx); y1=Math.min(toile.height-1,y1+mx);
    var w = x1-x0+1, h = y1-y0+1;
    var out = document.createElement("canvas");
    var ech = Math.min(1, 420/w);
    out.width = Math.round(w*ech); out.height = Math.round(h*ech);
    out.getContext("2d").drawImage(toile, x0,y0,w,h, 0,0,out.width,out.height);
    return out.toDataURL("image/png");
  }
  function etat(){
    var e = document.getElementById("signEtat");
    if(e) e.textContent = cfg.signature ? "signature enregistrée" : "aucune signature";
  }
  function redessiner(){
    if(!ctx || !cfg.signature) return;
    var im = new Image();
    im.onload = function(){
      ctx.clearRect(0,0,toile.width,toile.height);
      var ech = Math.min(toile.width/im.width, toile.height/im.height, 1);
      ctx.drawImage(im, (toile.width-im.width*ech)/2, (toile.height-im.height*ech)/2, im.width*ech, im.height*ech);
      vierge = false;
    };
    im.src = cfg.signature;
  }
  window.__signatureInit = function(){ init(); etat(); redessiner(); };
})();
