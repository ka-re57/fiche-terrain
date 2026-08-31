/* ============ signature du client, sur la tablette ============
   Un récapitulatif de ce qu'il signe, puis son tracé.
   Sans signature : le document porte « client absent ». */
function texteEngagement(){
  var lignes = [];
  V.machines.forEach(function(m){
    var t = techDe(m); if(!t) return;
    var doc = t.regl.obligatoire ? "attestation d'entretien" : "compte rendu d'entretien";
    if(V.interv === "mes")      doc = "procès-verbal de mise en service";
    else if(V.interv === "dep") doc = "rapport d'intervention";
    lignes.push(doc + " — " + t.label.toLowerCase() + (txt(m.ident.marque) ? " (" + m.ident.marque + ")" : ""));
  });
  return lignes;
}

function ouvrirSignatureClient(){
  if(!V.machines.length){ toast("Aucune machine à faire signer","att"); return; }
  var dlg = document.getElementById("dlgSignClient");
  var corps = document.getElementById("signClientCorps");
  corps.innerHTML = "";

  var intro = el("div","sc-intro");
  intro.appendChild(el("div","sc-t","Vous allez signer pour :"));
  var ul = el("div","sc-liste");
  texteEngagement().forEach(function(l){ ul.appendChild(el("div",null,"• "+l)); });
  intro.appendChild(ul);
  intro.appendChild(el("div","sc-t2",
    "réalisés le " + (V.date||"") + " par " + (cfg.technicien||"Rémi KATA") + " — SARL KA-RÉ" +
    (txt(V.adresse) ? ", à " + V.adresse : "")));
  intro.appendChild(el("div","sc-mention",
    "Votre signature vaut réception des documents ci-dessus. Elle ne vaut pas approbation des constatations techniques."));
  corps.appendChild(intro);

  /* Neuf fois sur dix c'est le propriétaire qui signe. On propose son nom
     d'office, et on dit d'où il vient pour que Rémi pense à le corriger
     quand c'est le locataire, le fils ou le gardien qui est là. */
  var ch = el("div","champ plein");
  ch.appendChild(el("label",null,"Nom du signataire"));
  var repris = "";
  var propose = txt(V.signQui);
  if(!propose){ propose = txt(V.present); if(propose) repris = "personne présente"; }
  if(!propose){ propose = txt(V.client); if(propose) repris = "titulaire du dossier"; }
  var inp = el("input"); inp.type="text"; inp.value = propose || "";
  inp.placeholder = "NOM Prénom";
  inp.addEventListener("input", function(){ V.signQui = inp.value; sauver(); });
  ch.appendChild(inp);
  if(repris && !txt(V.signQui)){
    V.signQui = propose;                    /* proposé ET retenu : pas de case vide à l'envoi */
    ch.appendChild(el("div","aide", "Repris du " + repris + ". Si ce n'est pas lui qui signe, corrige le nom."));
  }
  corps.appendChild(ch);

  var toile = el("canvas"); toile.className = "sign-toile"; toile.width = 900; toile.height = 300;
  corps.appendChild(toile);
  var ctx = toile.getContext("2d");
  ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0E1A26";
  var trace = false, vierge = true;
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

  var barre = el("div","sc-barre");
  var bEff = el("button","btn mini","Effacer"); bEff.type="button";
  bEff.onclick = function(){ ctx.clearRect(0,0,toile.width,toile.height); vierge = true; };
  var bAbs = el("button","btn mini","Client absent"); bAbs.type="button";
  bAbs.onclick = function(){
    V.signClient = ""; V.signRefus = 1; sauverTout(); dlg.close();
    toast("Noté : client absent");
  };
  var bOk = el("button","btn p","Valider la signature"); bOk.type="button";
  bOk.onclick = function(){
    if(vierge){ toast("Fais signer, ou touche « Client absent »","att"); return; }
    V.signClient = rognerToile(toile, ctx, 520);
    V.signRefus = 0;
    if(!txt(V.signQui)) V.signQui = txt(V.present) || txt(V.client) || "";
    sauverTout(); dlg.close();
    toast("Signature enregistrée","ok");
    rendre();
  };
  barre.appendChild(bEff); barre.appendChild(bAbs); barre.appendChild(bOk);
  corps.appendChild(barre);
  dlg.showModal();
}

/* Rogne les marges vides d'un tracé et réduit à la largeur voulue. */
function rognerToile(toile, ctx, largeur){
  var d = ctx.getImageData(0,0,toile.width,toile.height).data;
  var x0=toile.width, y0=toile.height, x1=0, y1=0, vu=false;
  for(var y=0;y<toile.height;y++) for(var x=0;x<toile.width;x++){
    if(d[(y*toile.width+x)*4+3] > 12){
      vu=true; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y;
    }
  }
  if(!vu) return "";
  var mx = 8;
  x0=Math.max(0,x0-mx); y0=Math.max(0,y0-mx);
  x1=Math.min(toile.width-1,x1+mx); y1=Math.min(toile.height-1,y1+mx);
  var w = x1-x0+1, h = y1-y0+1;
  var out = document.createElement("canvas");
  var ech = Math.min(1, largeur/w);
  out.width = Math.round(w*ech); out.height = Math.round(h*ech);
  out.getContext("2d").drawImage(toile, x0,y0,w,h, 0,0,out.width,out.height);
  return out.toDataURL("image/png");
}

/* ============ garde-fou avant de sortir le document ============
   Rémi peut imprimer ou envoyer sans avoir pensé à la signature. Le document
   part alors sans preuve de remise et sans mention « client absent » : les
   deux seules formes valables. On ne bloque pas — on rappelle, et on laisse
   passer si c'est délibéré. */
var _suiteSignature = null;
function signatureManquante(){
  return cfg.signClient !== "non" && !V.signClient && !V.signRefus;
}
function avecSignature(suite){
  if(!signatureManquante()){ suite(); return; }
  _suiteSignature = suite;
  var d = document.getElementById("dlgSignRappel");
  if(!d){ suite(); return; }
  d.showModal();
}
function cablerRappelSignature(){
  var d = document.getElementById("dlgSignRappel");
  if(!d) return;
  function ferme(){ d.close(); }
  document.getElementById("bSignPlusTard").onclick = function(){
    ferme(); var f=_suiteSignature; _suiteSignature=null; if(f) f();
  };
  document.getElementById("bSignAbsent").onclick = function(){
    V.signRefus = 1; V.signClient = ""; sauverTout(); rendre();
    ferme(); var f=_suiteSignature; _suiteSignature=null; if(f) f();
  };
  document.getElementById("bSignMaintenant").onclick = function(){
    ferme(); _suiteSignature = null; ouvrirSignatureClient();
  };
}

/* ============ ce qu'il reste à relever ============
   Un point laissé vide s'imprime « non renseigné » sur l'attestation. Autant
   le savoir avant, pas en relisant le PDF chez le client suivant. */
function relevesManquants(){
  var manque = [];
  V.machines.forEach(function(m, i){
    var lc = listeCtrl(m), n = 0;
    lc.forEach(function(_, j){ if(!m.ctrl["c"+j]) n++; });
    if(n) manque.push({mid:m.mid, label:(techDe(m)||{}).label || m.tech, n:n, num:i+1});
  });
  return manque;
}
var _suiteRestant = null;
/* Rémi a vu ce qui manque et a décidé d'envoyer : on ne le redemande pas
   en boucle. L'accord vaut pour cet envoi-là, pas pour les suivants. */
var _relevesAcceptes = false;
function avecReleves(suite){
  var manque = relevesManquants();
  if(!manque.length){ suite(); return; }
  var d = document.getElementById("dlgRestant");
  if(!d){ suite(); return; }
  var c = document.getElementById("restantCorps");
  c.innerHTML = "";
  manque.forEach(function(x){
    var l = el("div","dl");
    l.appendChild(el("span","dk", "Machine "+x.num+" — "+x.label));
    l.appendChild(el("span","dv", x.n + (x.n>1 ? " points à relever" : " point à relever")));
    c.appendChild(l);
  });
  _suiteRestant = suite;
  d.showModal();
}
function cablerRappelReleves(){
  var d = document.getElementById("dlgRestant");
  if(!d) return;
  document.getElementById("bRestantEnvoyer").onclick = function(){
    d.close(); _relevesAcceptes = true;
    var f=_suiteRestant; _suiteRestant=null; if(f) f();
  };
  document.getElementById("bRestantVoir").onclick = function(){
    d.close(); _suiteRestant = null;
    var m = relevesManquants()[0];
    if(m) aller(m.mid);
  };
}

/* ============ fiches de référence ============
   Les planches consultées sur le terrain vivent DANS l'appli, pas sur Drive :
   une cave n'a pas de réseau, et c'est justement là qu'on se pose la question.
   Elles sont compressées et intégrées à la compilation. */
function ficheDispo(cle){
  return typeof FICHES_REF !== "undefined" && FICHES_REF.some(function(f){ return f.cle === cle; });
}
/* Une notice se feuillette. La version précédente ouvrait une image et
   la refermait : pour trouver la bonne planche il fallait ressortir et
   retaper. Ici on ouvre un cahier, avec ses onglets et ses flèches. */
var _notice = {liste:[], i:0, titre:""};
function ouvrirNotice(liste, titre, depart){
  var dispo = (liste || []).filter(function(x){ return ficheDispo(x.cle); });
  if(!dispo.length){ toast("Notice absente de cette version","mal"); return; }
  _notice.liste = dispo; _notice.titre = titre || "Notice";
  _notice.i = 0;
  if(depart){
    for(var j=0;j<dispo.length;j++) if(dispo[j].cle === depart){ _notice.i = j; break; }
  }
  var ong = document.getElementById("ficheOnglets");
  ong.innerHTML = "";
  dispo.forEach(function(f, j){
    var b = el("button","chip mini", f.l); b.type = "button";
    b.onclick = function(){ _notice.i = j; majNotice(); };
    ong.appendChild(b);
  });
  majNotice();
  document.getElementById("dlgFiche").showModal();
}
function majNotice(){
  var f = _notice.liste[_notice.i]; if(!f) return;
  var src = FICHES_REF.filter(function(x){ return x.cle === f.cle; })[0];
  document.getElementById("ficheTitre").textContent = _notice.titre + " — " + f.l;
  document.getElementById("ficheImg").src = src ? src.src : "";
  document.getElementById("fichePos").textContent = (_notice.i+1) + " / " + _notice.liste.length;
  var ong = document.getElementById("ficheOnglets");
  Array.prototype.forEach.call(ong.children, function(b, j){
    b.setAttribute("aria-pressed", j === _notice.i ? "true" : "false");
  });
  var actif = ong.children[_notice.i];
  if(actif && actif.scrollIntoView) actif.scrollIntoView({block:"nearest", inline:"nearest"});
  document.getElementById("ficheImg").scrollTop = 0;
}
function feuilleter(pas){
  if(!_notice.liste.length) return;
  _notice.i = (_notice.i + pas + _notice.liste.length) % _notice.liste.length;
  majNotice();
}
function cablerNotice(){
  var p = document.getElementById("fichePrec"), s = document.getElementById("ficheSuiv");
  if(p) p.onclick = function(){ feuilleter(-1); };
  if(s) s.onclick = function(){ feuilleter(1); };
  var d = document.getElementById("dlgFiche");
  if(d) d.addEventListener("keydown", function(e){
    if(e.key === "ArrowLeft"){ feuilleter(-1); e.preventDefault(); }
    if(e.key === "ArrowRight"){ feuilleter(1); e.preventDefault(); }
  });
}
function ouvrirFiche(cle, titre){ ouvrirNotice([{cle:cle, l:titre||"Planche"}], titre || "Fiche de référence", cle); }
