/* ============ navigation ============ */
var vue = "visite";

function rendreOnglets(){
  var o = $("#onglets"); o.innerHTML = "";
  var b = el("button","ong","Visite");
  b.type="button"; b.setAttribute("role","tab");
  b.setAttribute("aria-selected", vue==="visite" ? "true":"false");
  b.onclick = function(){ aller("visite"); };
  o.appendChild(b);
  V.machines.forEach(function(m){
    var t = techDe(m);
    var x = el("button","ong");
    x.type="button"; x.setAttribute("role","tab");
    x.setAttribute("aria-selected", vue===m.mid ? "true":"false");
    x.textContent = (t?t.icone+" ":"")+(t?t.court:"?");
    var ec = anomaliesDe(m).length;
    if(ec) x.appendChild(el("span","pc", "!"+ec));
    x.onclick = function(){ aller(m.mid); };
    o.appendChild(x);
  });
  var plus = el("button","ong","+"); plus.type="button";
  plus.setAttribute("aria-label","Ajouter une machine");
  plus.onclick = ouvrirChoixMachine;
  o.appendChild(plus);
}
function aller(v){ vue=v; rendre(); window.scrollTo(0,0); }
function rendre(){
  rendreOnglets();
  var a=$("#app"); a.innerHTML="";
  if(vue==="visite") vueVisite(a); else vueMachine(a, machineParId(vue));
}

/* ============ champs ============ */
function champ(parent, obj, cle, libelle, o){
  o = o || {};
  var d = el("div","champ"+(o.plein?" plein":""));
  var lab = el("label", null, libelle);
  lab.htmlFor = "f_"+cle+"_"+(o.suffixe||"");
  if(o.u) lab.appendChild(el("span","u",o.u));
  d.appendChild(lab);
  if(o.type==="multi"){
    var choix = String(obj[cle]||"").split(",").map(function(x){return x.trim();}).filter(Boolean);
    var wrap = el("div","chips petit");
    (o.opts||[]).forEach(function(x){
      var bb = el("button","chip mini",x); bb.type="button";
      bb.setAttribute("aria-pressed", choix.indexOf(x)>=0 ? "true":"false");
      bb.onclick = function(){
        var k = choix.indexOf(x);
        if(k>=0) choix.splice(k,1); else choix.push(x);
        bb.setAttribute("aria-pressed", choix.indexOf(x)>=0 ? "true":"false");
        obj[cle] = choix.join(", ");
        if(o.auMaj) o.auMaj();
        sauver();
      };
      wrap.appendChild(bb);
    });
    d.appendChild(wrap); parent.appendChild(d); return wrap;
  }
  var i;
  if(o.type==="zone") i = el("textarea");
  else if(o.type==="liste"){
    i = el("select");
    i.appendChild(el("option","",""));
    (o.opts||[]).forEach(function(x){ var op=el("option",null,x); op.value=x; i.appendChild(op); });
  } else {
    i = el("input");
    i.type = o.type==="num" ? "number" : (o.type==="date" ? "date" : "text");
    if(o.type==="num"){ i.inputMode="decimal"; i.step="any"; }
  }
  i.id = lab.htmlFor;
  i.value = (obj[cle]===undefined||obj[cle]===null) ? "" : obj[cle];
  if(o.ph) i.placeholder = o.ph;
  i.addEventListener("input", function(){ obj[cle]=i.value; if(o.auMaj) o.auMaj(); sauver(); });
  d.appendChild(i);
  /* La plage usuelle s'affiche AVANT de saisir : c'est à ce moment-là
     qu'elle sert. « dans la plage » après coup, c'est trop tard pour
     savoir si on tient la bonne valeur. */
  if(o.plage !== undefined){
    var dp = el("div","ref-plage", o.plage || "");
    dp.hidden = !o.plage;
    d.appendChild(dp);
  }
  /* L'explication vit SOUS le champ, jamais dans le champ : un texte
     d'aide en placeholder se coupe sur un téléphone et disparaît dès
     qu'on saisit. C'est justement là qu'on en a besoin. */
  if(o.aide) d.appendChild(el("div","aide", o.aide));
  if(o.slot) d.appendChild(o.slot);
  parent.appendChild(d);
  return i;
}
/* Ce qu'il manque pour qu'un calcul aboutisse, en clair.
   « NOx évalués : — » sans explication, c'est une impasse : Rémi n'a pas
   d'appareil pour mesurer les NOx, et rien ne lui disait que la valeur
   forfaitaire attendait seulement le type de brûleur dans l'identification. */
function manquePour(m, besoin){
  if(!m || !besoin || !besoin.length) return [];
  return besoin.filter(function(b){
    return txt(m.ident[b.k]) === null && txt((m.mes||{})[b.k]) === null;
  }).map(function(b){ return b.l; });
}
function calcule(parent, libelle, o, fn){
  var d = el("div","champ"+(o.plein?" plein":""));
  var lab = el("label", null, libelle);
  if(o.u) lab.appendChild(el("span","u",o.u));
  d.appendChild(lab);
  var c = el("div","calc","—"); d.appendChild(c);
  var v = el("div"); d.appendChild(v);
  parent.appendChild(d);
  return function(){
    var val = fn();
    c.textContent = estNb(val) ? fmt(val, Math.abs(val)>=100?0:1)+(o.u?" "+o.u:"")
                  : (typeof val === "string" && val ? val : "—");
    var ver = o.ch ? verdict(o.ch, val, o.m) : null;
    v.innerHTML="";
    if(ver) v.appendChild(el("span","verdict "+ver.k, ver.t));
    if(!estNb(val) && !(typeof val === "string" && val)){
      var mq = manquePour(o.m, o.besoin);
      if(mq.length) v.appendChild(el("span","verdict att", "il manque : " + mq.join(", ")));
    }
  };
}
/* Un volet déplié de 26 lignes se referme mal : le titre est remonté hors
   de l'écran et il faut redescendre le chercher. Deux réponses, les deux
   utiles au doigt : le titre reste collé en haut pendant qu'on fait défiler,
   et un bouton « Replier » ferme le volet depuis le bas. */
function bloc(parent, titre, compteur, ouvert){
  var d = el("details","repl"+(ouvert?" ouvert":""));
  if(ouvert) d.open = true;
  var s = el("summary", null, titre);
  if(compteur) s.appendChild(el("span","cpt", compteur));
  d.appendChild(s);
  var corps = el("div"); d.appendChild(corps);
  if(!ouvert){
    var pied = el("div","repl-pied noprint");
    var b = el("button","btn mini","▴  Replier « "+titre+" »"); b.type="button";
    b.onclick = function(){
      d.open = false;
      if(s.scrollIntoView) s.scrollIntoView({block:"nearest"});
    };
    pied.appendChild(b); d.appendChild(pied);
  }
  parent.appendChild(d);
  return corps;
}

/* ============ écran VISITE ============ */
function vueVisite(root){
  var dansLeParc = false;
  var c1 = el("div","carte");
  var g = el("div","g2"); c1.appendChild(g);

  /* ---- recherche client : on tape trois lettres, on choisit ---- */
  var dc = el("div","champ plein");
  dc.appendChild(el("label",null,"Client"));
  var rech = el("input"); rech.type="text"; rech.autocomplete="off"; rech.id="rechClient";
  rech.placeholder = V.client ? V.client : "tape les premières lettres…";
  if(V.client) rech.classList.add("choisi");
  dc.appendChild(rech);
  var res = el("div","resultats"); dc.appendChild(res);
  g.appendChild(dc);

  function sansAcc(x){ return String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); }
  /* Deux écritures d'un même nom donnent la même clé : civilité, forme juridique
     et ordre des mots sont ignorés. Évite d'afficher deux fois la même personne. */
  function cleNom(n){
    var x = sansAcc(n)
      .replace(/\b(m|mme|mr|monsieur|madame|melle|sarl|sas|sasu|eurl|sci|ets|earl)\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ").trim();
    return x.split(/\s+/).filter(Boolean).sort().join(" ");
  }
  function chercher(q){
    res.innerHTML = "";
    q = sansAcc(q).trim();
    if(q.length < 2){
      /* Se tromper de client arrive. Il faut pouvoir revenir en arrière ici,
         pas aller chercher « effacer cette visite » au fond des réglages. */
      if(V.client){
        var ligne = el("div","choisi-ligne");
        ligne.appendChild(el("span","choisi-nom", V.client));
        var chg = el("button","btn mini","Changer"); chg.type="button";
        chg.onclick = function(){
          V.client=""; V.adresse=""; V.ville=""; V.axonaut=null;
          sauver(); rendre();
          var r = document.getElementById("rechClient");
          if(r){ r.value=""; r.focus(); }
        };
        ligne.appendChild(chg);
        res.appendChild(ligne);
      }
      return;
    }
    var mots = q.split(/\s+/);
    var pool = [], vus = {};
    /* le parc d'abord : c'est lui qui porte les machines */
    (parc||[]).forEach(function(p){
      if(!p.client) return;
      var k = cleNom(p.client);
      if(vus[k]) return;
      vus[k] = 1;
      pool.push({nom:p.client, adresse:p.adresse, parc:1});
    });
    (clients||[]).forEach(function(c){
      var k = cleNom(c.nom);
      if(vus[k]) return;
      vus[k] = 1;
      pool.push({nom:c.nom, adresse:c.adresse, ax:c.ax, cli:c.cli, f:c.f});
    });
    var trouves = pool.filter(function(c){
      var t = sansAcc(c.nom) + " " + sansAcc(c.adresse);
      return mots.every(function(m){ return t.indexOf(m) >= 0; });
    });
    /* Le parc d'abord — c'est là qu'on va —, puis les clients, puis les
       prospects, et les fournisseurs en dernier : on n'entretient pas la
       chaudière de CEDEO. */
    function rang(c){ return c.parc ? 0 : (c.cli ? 1 : (c.f ? 3 : 2)); }
    trouves.sort(function(a,b){
      var pa = rang(a), pb = rang(b);
      if(pa !== pb) return pa - pb;
      return a.nom.toLowerCase() < b.nom.toLowerCase() ? -1 : 1;
    });
    if(!trouves.length){
      var rien = el("div","mini","Aucun client trouvé. Tape le nom en entier, il sera créé à l'envoi.");
      res.appendChild(rien);
      V.client = rech.value.trim(); sauver(); rendreOnglets();
      return;
    }
    trouves.slice(0,8).forEach(function(c){
      var b = el("button","res"); b.type="button";
      var t1 = el("div","r1", c.nom);
      if(c.parc) t1.appendChild(el("span","tagp","parc"));
      else if(c.f) t1.appendChild(el("span","tagf","fournisseur"));
      b.appendChild(t1);
      if(c.adresse) b.appendChild(el("div","r2", c.adresse));
      b.onclick = function(){
        V.client = c.nom;
        if(c.adresse && !txt(V.adresse)) V.adresse = c.adresse;
        if(c.ax) V.axonaut = c.ax;
        sauver(); rendre();
      };
      res.appendChild(b);
    });
    if(trouves.length > 8) res.appendChild(el("div","mini", (trouves.length-8)+" autres — précise ta recherche"));
  }
  rech.addEventListener("input", function(){ chercher(rech.value); });
  rech.addEventListener("focus", function(){ if(rech.value) chercher(rech.value); });

  champ(g, V, "adresse", "Adresse", {});
  champ(g, V, "ville", "Commune", {ph:"reprise de l'adresse si vide"});
  champ(g, V, "present", "Personne présente", {});
  root.appendChild(c1);

  var c2 = el("div","carte");
  var ch = el("div","chips"); c2.appendChild(ch);
  INTERV.forEach(function(it){
    var b = el("button","chip",it.l); b.type="button";
    b.setAttribute("aria-pressed", V.interv===it.c ? "true":"false");
    b.onclick = function(){ V.interv=it.c; recalerControles(); sauver(); rendre(); };
    ch.appendChild(b);
  });
  var g2 = el("div","g2"); g2.style.marginTop="9px"; c2.appendChild(g2);
  champ(g2, V, "date", "Date", {type:"date"});
  root.appendChild(c2);

  /* machines connues du client : reprise en un tap */
  if(V.client && parc && parc.length){
    var connues = parc.filter(function(p){ return p.client===V.client; })
                      .filter(function(p){ return !V.machines.some(function(m){ return m.notion && m.notion===p.notion; }); });
    if(connues.length){
      var c4 = el("div","carte");
      c4.appendChild(el("h2",null,"Machines du client"));
      connues.forEach(function(p){
        var b = el("button","mach"); b.type="button";
        b.appendChild(el("span","ic", (TECHNOS[p.tech]||{}).icone || "•"));
        var tx = el("div","txt");
        tx.appendChild(el("div","t1", (TECHNOS[p.tech]||{}).court || p.tech || "machine"));
        tx.appendChild(el("div","t2", [p.marque, p.serie, p.local].filter(Boolean).join(" · ")));
        b.appendChild(tx);
        b.appendChild(el("span","plus","+"));
        b.onclick = function(){
          if(!TECHNOS[p.tech]){ toast("Technologie inconnue","mal"); return; }
          var m = ajouterMachine(p.tech);
          ["marque","serie","puiss","fluide","charge","mes","local","nbui","volume","annee","techno","combustible","resine"]
            .forEach(function(k){ if(p[k]!==undefined && p[k]!==null && p[k]!=="") m.ident[k]=String(p[k]); });
          if(p.dernier) m.ident.dernier = p.dernier;
          if(p.notion)  m.notion  = p.notion;
          if(p.axonaut) m.axonaut = p.axonaut;
          if(p.email)   m.email   = p.email;
          /* Ce que je m'étais noté la dernière fois ressort ici, sur place. */
          if(p.prochaine) m.prochaineAvant = p.prochaine;
          appliquerProfil(m);      /* ce qui n'est pas relevable sur cette machine est repris */
          sauver(); aller(m.mid);
        };
        c4.appendChild(b);
      });
      root.appendChild(c4);
    }
  }

  var c3 = el("div","carte");
  if(V.machines.length){
    c3.appendChild(el("h2",null,"Machines relevées"));
    V.machines.forEach(function(m){
      var t = techDe(m), a = avancement(m), an = anomaliesDe(m);
      var row = el("div","rang");
      var b = el("button","mach"); b.type="button";
      b.appendChild(el("span","ic", t?t.icone:"?"));
      var tx = el("div","txt");
      tx.appendChild(el("div","t1", t?t.court:"?"));
      tx.appendChild(el("div","t2", libelleMachine(m)));
      b.appendChild(tx);
      if(an.length) b.appendChild(el("span","pastille "+(an.some(function(x){return x.grave;})?"mal":"att"), "!"+an.length));
      b.onclick = function(){ aller(m.mid); };
      row.appendChild(b);
      var sup = el("button","oter","×"); sup.type="button"; sup.setAttribute("aria-label","Retirer");
      sup.onclick = function(){ retirerMachine(m.mid, sup); };
      row.appendChild(sup);
      c3.appendChild(row);
    });
  }
  var add = el("button","btn","+ Machine"); add.type="button"; add.style.width="100%";
  add.onclick = ouvrirChoixMachine;
  c3.appendChild(add);
  root.appendChild(c3);

  /* --- signature du client --- */
  if(V.machines.length){
    var c5 = el("div","carte");
    c5.appendChild(el("h2",null,"Signature du client"));
    if(V.signClient){
      var vu = el("div","sc-vu");
      var im = el("img"); im.src = V.signClient; im.alt="signature"; vu.appendChild(im);
      vu.appendChild(el("div","mini", (txt(V.signQui)||"signé")+" — le "+(V.date||"")));
      c5.appendChild(vu);
      var bR = el("button","btn mini","Refaire signer"); bR.type="button";
      bR.onclick = ouvrirSignatureClient; c5.appendChild(bR);
    } else if(V.signRefus){
      c5.appendChild(el("div","alerte att","Client absent — les documents porteront cette mention."));
      var bR2 = el("button","btn mini","Le client est là finalement"); bR2.type="button";
      bR2.onclick = ouvrirSignatureClient; c5.appendChild(bR2);
    } else {
      var bS = el("button","btn p","Faire signer le client"); bS.type="button"; bS.style.width="100%";
      bS.onclick = ouvrirSignatureClient;
      c5.appendChild(bS);
      c5.appendChild(el("div","mini","Récapitulatif à l'écran, le client signe au doigt. S'il n'est pas là, un bouton le note."));
    }
    root.appendChild(c5);
  }
}

function retirerMachine(mid, btn){
  if(btn.dataset.arme !== "1"){
    btn.dataset.arme="1"; btn.textContent="?";
    setTimeout(function(){ if(btn.dataset.arme==="1"){ btn.dataset.arme=""; btn.textContent="×"; } }, 5000);
    return;
  }
  V.machines = V.machines.filter(function(m){ return m.mid!==mid; });
  if(vue===mid) vue="visite";
  sauver(); rendre();
}

function ouvrirChoixMachine(){
  var box = $("#listeTechnos"); box.innerHTML="";
  Object.keys(TECHNOS).forEach(function(cle){
    var t = TECHNOS[cle];
    var b = el("button","mach"); b.type="button";
    b.appendChild(el("span","ic", t.icone));
    var tx = el("div","txt");
    tx.appendChild(el("div","t1", t.label));
    b.appendChild(tx);
    b.onclick = function(){ $("#dlgMachine").close(); var m=ajouterMachine(cle); aller(m.mid); };
    box.appendChild(b);
  });
  $("#dlgMachine").showModal();
}

/* ============ écran MACHINE ============ */
function vueMachine(root, m){
  if(!m){ vue="visite"; return vueVisite(root); }
  var t = techDe(m);
  if(!t){ root.appendChild(el("div","vide","Technologie inconnue.")); return; }
  var majs = [];

  /* --- identification, repliée --- */
  var c1 = el("div","carte");
  var h1 = el("h2",null, t.icone+" "+t.label);
  var hp = horsPlage(m), regl = estReglementaire(m);
  h1.appendChild(el("span","tag"+(regl?"":" gris"), regl ? "attestation" : "compte rendu"));
  c1.appendChild(h1);
  if(hp){
    var av = el("div","alerte mal");
    av.innerHTML = "<b>"+fmt(hp.p,1)+" kW : "+hp.sens+" "+hp.seuil+" kW.</b> Cet entretien ne relève pas de "+
      "l'obligation réglementaire. Le document sortira en <b>compte rendu contractuel</b>. "+
      "Vérifie la puissance si c'est une faute de frappe.";
    c1.appendChild(av);
  }
  var vide = t.ident.every(function(f){ return !txt(m.ident[f.k]); });
  var corpsId = bloc(c1, libelleMachine(m)===t.label ? "Identification" : libelleMachine(m), null, vide);
  var g1 = el("div","g2"); corpsId.appendChild(g1);
  function pertinent(f){
    if(f.siAnneeAvant){ var an = nb(m.ident.annee); return !estNb(an) || an < f.siAnneeAvant; }
    return true;
  }
  function poserIdent(parent, f){
    var repris = m.identRepris && m.identRepris[f.k];
    champ(parent, m.ident, f.k, f.l, {type:f.type, opts:f.opts, u:f.u, ph:f.aide||f.ph, suffixe:m.mid,
      aide: repris ? ("repris de la visite précédente — corrige si ça a changé") : f.aide,
      auMaj:function(){
        if(m.identRepris) delete m.identRepris[f.k];   /* saisi à la main : ce n'est plus un report */
        majs.forEach(function(fn){fn();});
        appliquerLiens(m); enregistrerProfil(m); rendreOnglets();
      }});
  }
  t.ident.filter(function(f){ return !f.opt && pertinent(f); }).forEach(function(f){ poserIdent(g1, f); });
  var secondaires = t.ident.filter(function(f){ return f.opt || !pertinent(f); });
  if(secondaires.length){
    var corpsSec = bloc(corpsId, "Autres informations", String(secondaires.length), false);
    var gSec = el("div","g2"); corpsSec.appendChild(gSec);
    secondaires.forEach(function(f){ poserIdent(gSec, f); });
  }
  root.appendChild(c1);

  /* --- points de contrôle --- */
  var lc = listeCtrl(m);
  var c2 = el("div","carte");
  var h2 = el("h2",null,"Contrôles");
  var cptC = el("span","cpt",""); h2.appendChild(cptC); c2.appendChild(h2);
  var resume = el("div","mini"); c2.appendChild(resume);
  var justifies = appliquerLiens(m);
  var adossees  = pointsMesure(m);
  /* Un point que l'appareil rend sans objet — « VMC gaz : … » sur une
     chaudière qui n'est pas raccordée à une VMC gaz — encombrait la liste
     des gestes à déclarer. Il reste consultable et rectifiable, mais il
     sort de la liste de travail : ce n'est pas un geste à faire. */
  var idxMesure = [], idxGeste = [], idxSO = [];
  var npAuto = m.npAuto || {};
  lc.forEach(function(_,i){
    if(npAuto["c"+i] && !(m.ctrlManuel||{})["c"+i]) idxSO.push(i);
    else (adossees[i] ? idxMesure : idxGeste).push(i);
  });

  var corpsMes = idxMesure.length ? bloc(c2, "Relevés — se cochent avec les mesures", String(idxMesure.length), false) : null;
  var corpsGes = bloc(c2, "Gestes — à déclarer", String(idxGeste.length), false);
  var corpsSO  = idxSO.length ? bloc(c2, "Sans objet sur cet appareil", String(idxSO.length), false) : null;
  var barreG = el("div","barre-geste");
  var bTout = el("button","btn mini","Tout fait"); bTout.type="button";
  bTout.onclick = function(){
    idxGeste.forEach(function(i){ m.ctrl["c"+i]="ok"; m.ctrlManuel["c"+i]=1; });
    sauver(); rendre();
  };
  var bRien = el("button","btn mini","Tout décocher"); bRien.type="button";
  bRien.onclick = function(){
    idxGeste.forEach(function(i){ m.ctrl["c"+i]=""; m.ctrlManuel["c"+i]=1; });
    sauver(); rendre();
  };
  barreG.appendChild(bTout); barreG.appendChild(bRien);
  corpsGes.appendChild(barreG);

  function majCpt(){
    var non=[], np=[];
    /* Les sans-objet automatiques ont déjà leur volet à eux : les répéter
       en tête de carte remplit l'écran sans rien apprendre. Seuls les NP
       posés à la main sont rappelés ici. */
    lc.forEach(function(lib,i){
      if(m.ctrl["c"+i]==="non") non.push(lib);
      else if(m.ctrl["c"+i]==="np" && idxSO.indexOf(i) < 0) np.push(lib);
    });
    var npTotal = 0;
    lc.forEach(function(_,i){ if(m.ctrl["c"+i]==="np") npTotal++; });
    var ok = lc.length-non.length-npTotal;
    cptC.textContent = ok+"/"+lc.length + (non.length?" · "+non.length+" non":"") + (npTotal?" · "+npTotal+" NP":"");
    cptC.className = "cpt"+(non.length?" mal":"");
    resume.innerHTML = "";
    var nj = Object.keys(justifies).length;
    var gestesOk = idxGeste.filter(function(i){ return m.ctrl["c"+i]==="ok"; }).length;
    if(!non.length && !np.length){
      resume.textContent = nj+"/"+idxMesure.length+" relevés · "+gestesOk+"/"+idxGeste.length+" gestes"
                         + (idxSO.length ? " · "+idxSO.length+" sans objet" : "");
    } else {
      non.forEach(function(l){ var d=el("div","exc mal"); d.textContent="✗ "+l; resume.appendChild(d); });
      np.forEach(function(l){ var d=el("div","exc"); d.textContent="NP  "+l; resume.appendChild(d); });
    }
  }
  lc.forEach(function(lib, i){
    var l = el("div","pc-ligne");
    var lb = el("div","pc-lib", lib);
    if(justifies[i]) lb.appendChild(el("span","auto","mesure"));
    l.appendChild(lb);
    var e = el("div","pc-etats");
    [["ok","✓"],["non","✗"],["np","NP"]].forEach(function(p){
      var b = el("button","et",p[1]); b.type="button"; b.dataset.v=p[0];
      b.setAttribute("aria-pressed", m.ctrl["c"+i]===p[0] ? "true":"false");
      b.setAttribute("aria-label", p[0]);
      b.onclick = function(){
        m.ctrl["c"+i] = p[0];
        m.ctrlManuel = m.ctrlManuel || {}; m.ctrlManuel["c"+i] = 1;
        Array.prototype.forEach.call(e.children, function(x){
          x.setAttribute("aria-pressed", m.ctrl["c"+i]===x.dataset.v ? "true":"false");
        });
        majCpt(); rendreOnglets(); sauver();
      };
      e.appendChild(b);
    });
    l.appendChild(e);
    if(idxSO.indexOf(i) >= 0 && corpsSO){
      if(npAuto["c"+i] && typeof npAuto["c"+i] === "string") lb.appendChild(el("span","auto", npAuto["c"+i]));
      corpsSO.appendChild(l);
    } else {
      (adossees[i] && corpsMes ? corpsMes : corpsGes).appendChild(l);
    }
  });
  majCpt();
  root.appendChild(c2);

  /* --- mesures --- */
  function poserMesure(parent, f){
    if(estMasquee(m.tech, f.k)) return;
    if(f.type==="calc"){ majs.push(calcule(parent, f.l, {u:f.u, ch:f, m:m, besoin:f.besoin}, function(){ return valeurCalc(m,f); })); return; }
    if(m.na && m.na[f.k]){
      var dso = el("div","champ so");
      var lso = el("label", null, f.l); dso.appendChild(lso);
      var box = el("div","so-box");
      box.appendChild(el("span","so-txt","sans objet sur cette machine"));
      var rev = el("button","btn mini","Relever"); rev.type="button";
      rev.onclick = function(){ basculerSansObjet(m, f.k); sauver(); rendre(); };
      box.appendChild(rev);
      dso.appendChild(box); parent.appendChild(dso);
      return;
    }
    if(f.type==="fixe"){
      var d=el("div","champ"); d.appendChild(el("label",null,f.l));
      d.appendChild(el("div","calc", f.valeur+(f.u?" "+f.u:""))); parent.appendChild(d); return;
    }
    var slot = el("div");
    var so = el("button","so-btn","sans objet"); so.type="button";
    so.title = "Cette mesure n'est pas relevable sur cette machine";
    so.onclick = function(){ basculerSansObjet(m, f.k); sauver(); rendre(); };
    slot.appendChild(so);
    var entree = champ(parent, m.mes, f.k, f.l, {type:f.type, opts:f.opts, u:f.u, suffixe:m.mid, slot:slot,
      aide: f.aide || "", plage: texteRef(f, m),
      auMaj:function(){ rafraichir(); majs.forEach(function(fn){fn();}); appliquerLiens(m); rendreOnglets(); }});
    /* La plage usuelle dépend souvent de l'appareil : condensation ou non,
       brûleur atmosphérique ou non. Changer la technologie ou le brûleur
       APRÈS avoir saisi la mesure doit donc redessiner le verdict.
       Sans ça, la pastille restait figée sur l'ancienne plage — le document
       était juste, mais l'écran mentait. */
    function rafraichir(){
      var v = verdict(f, nb(m.mes[f.k]), m);
      slot.innerHTML="";
      if(v) slot.appendChild(el("span","verdict "+(v.indicatif && v.k==="ok" ? "info" : v.k), v.t));
      else slot.appendChild(so);
      var d = entree && entree.parentNode;
      var dp = d && d.querySelector(".ref-plage");
      if(dp){
        var t = texteRef(f, m);
        dp.textContent = t; dp.hidden = !t;
      }
    }
    majs.push(rafraichir);
    rafraichir();
  }
  var c3 = el("div","carte");
  c3.appendChild(el("h2",null,"Mesures"));
  var g3 = el("div","g2"); c3.appendChild(g3);
  var autres = t.mes.filter(function(f){ return !estEssentielle(m.tech, f.k) && !estMasquee(m.tech, f.k); });
  t.mes.filter(function(f){ return estEssentielle(m.tech, f.k); }).forEach(function(f){ poserMesure(g3, f); });
  if(autres.length){
    var corpsA = bloc(c3, "Autres mesures", String(autres.length), false);
    var gA = el("div","g2"); corpsA.appendChild(gA);
    autres.forEach(function(f){ poserMesure(gA, f); });
  }
  root.appendChild(c3);

  /* --- sous-machines --- */
  if(t.sousMachines){
    var sm = t.sousMachines;
    var c4 = el("div","carte");
    var h4 = el("h2",null, sm.label);
    h4.appendChild(el("span","cpt", String(m.sous.length)));
    c4.appendChild(h4);
    m.sous.forEach(function(ligne, idx){
      var b2 = el("div","sm");
      var tete = el("div","sm-tete");
      tete.appendChild(el("span","n", sm.singulier+" "+(idx+1)));
      if(m.sous.length>1){
        var x = el("button","oter","×"); x.type="button"; x.style.marginLeft="auto";
        x.onclick = function(){ m.sous.splice(idx,1); sauver(); rendre(); };
        tete.appendChild(x);
      }
      b2.appendChild(tete);
      var gg = el("div","g2"); b2.appendChild(gg);
      var mj = [];
      sm.champs.forEach(function(f){
        if(f.type==="calc"){ mj.push(calcule(gg, f.l, {u:f.u}, function(){ return valeurCalc(m,f,ligne); })); return; }
        if(f.type==="case"){
          var d = el("div","champ"); d.appendChild(el("label",null,f.l));
          var bb = el("button","case","✓"); bb.type="button";
          bb.setAttribute("aria-pressed", ligne[f.k]?"true":"false");
          bb.onclick = function(){ ligne[f.k]=ligne[f.k]?0:1; bb.setAttribute("aria-pressed", ligne[f.k]?"true":"false"); sauver(); };
          d.appendChild(bb); gg.appendChild(d); return;
        }
        champ(gg, ligne, f.k, f.l, {type:f.type, opts:f.opts, u:f.u, suffixe:m.mid+"_"+idx,
          auMaj:function(){ mj.forEach(function(fn){fn();}); }});
      });
      mj.forEach(function(fn){fn();});
      c4.appendChild(b2);
    });
    var addSm = el("button","btn mini","+ "+sm.singulier); addSm.type="button"; addSm.style.width="100%";
    addSm.onclick = function(){ m.sous.push({}); sauver(); rendre(); };
    c4.appendChild(addSm);
    root.appendChild(c4);
  }

  /* --- fluides frigorigènes : ce que le CERFA 15497*04 réclame --- */
  if(typeof machineAFluide === "function" && machineAFluide(m)){
    var cf = cerfaDe(m);
    var cc = el("div","carte");
    var hcf = el("h2",null,"Fluide frigorigène");
    if(cerfaRequis(m)) hcf.appendChild(el("span","cpt mal","CERFA dû"));
    cc.appendChild(hcf);

    /* Ce que l'appli sait déjà, avant toute saisie. */
    var tq = teqCO2(m), per = periodiciteEtancheite(m);
    var info = el("div","mini");
    var bouts = [];
    if(fluideDe(m)) bouts.push(fluideDe(m) + (familleFluide(m) ? " (" + familleFluide(m) + ")" : ""));
    if(estNb(gwpDe(m))) bouts.push("PRG " + gwpDe(m));
    if(estNb(tq)) bouts.push(fmt(tq, 2) + " t éq. CO2");
    if(per && estNb(per.mois) && per.mois > 0) bouts.push("contrôle tous les " + per.mois + " mois");
    else if(per && per.motif) bouts.push(per.motif);
    info.textContent = bouts.join(" · ") || "renseigne le fluide et la charge dans l'identification";
    cc.appendChild(info);

    var gN = el("div","g2"); gN.style.marginTop = "8px"; cc.appendChild(gN);
    champ(gN, cf, "nature", "Nature de l'intervention", {plein:true, type:"liste", suffixe:m.mid+"_cf",
      opts: NATURES_CERFA.map(function(x){ return x.l; }),
      aide:"la fiche est due à chaque manipulation de fluide ET à chaque contrôle d'étanchéité, sans seuil de charge",
      auMaj:function(){ sauver(); rendre(); }});

    /* Les quantités : en grammes, comme sur le terrain et comme dans Notion. */
    var corpsQ = bloc(cc, "Quantités manipulées", quantiteManipulee(m) ? fmtKg(quantiteManipulee(m)) + " kg" : null, false);
    var gQ = el("div","g2"); corpsQ.appendChild(gQ);
    function qte(cle, lib, aide){
      champ(gQ, cf, cle, lib, {type:"num", u:"g", suffixe:m.mid+"_cf", aide:aide||"",
        auMaj:function(){ sauver(); rendreOnglets(); }});
    }
    qte("vierge", "Fluide vierge chargé", "A du cadre 11");
    qte("recycle", "Fluide recyclé chargé", "B");
    qte("regenere", "Fluide régénéré chargé", "C");
    qte("traitement", "Récupéré pour traitement", "D");
    qte("reutil", "Récupéré pour réutilisation", "E");
    champ(gQ, cf, "contenant", "Identification du ou des contenants", {plein:true, suffixe:m.mid+"_cf",
      ph:"n° de bouteille — plusieurs séparés par une virgule",
      aide:"obligatoire dès qu'il y a transfert de fluide"});
    champ(gQ, cf, "bsff", "N° de BSFF (Trackdéchets)", {plein:true, suffixe:m.mid+"_cf", opt:true,
      aide:"seulement si du fluide part au traitement, et si le numéro est connu"});

    /* Étanchéité : le détecteur, puis la fuite s'il y en a une. */
    var corpsE = bloc(cc, "Contrôle d'étanchéité", null, false);
    var gE = el("div","g2"); corpsE.appendChild(gE);
    champ(gE, cf, "detecteur", "Détecteur manuel utilisé", {suffixe:m.mid+"_cf", ph:"marque, modèle, n° de série"});
    champ(gE, cf, "detecteurLe", "Détecteur contrôlé le", {type:"date", suffixe:m.mid+"_cf"});
    champ(gE, cf, "detectionPerm", "Système permanent de détection de fuites", {type:"liste", opts:["non","oui"],
      suffixe:m.mid+"_cf", aide:"quand il y en a un, la période entre deux contrôles est doublée",
      auMaj:function(){ sauver(); rendre(); }});
    champ(gE, cf, "fuite", "Fuite constatée", {type:"liste", opts:["non","oui"], suffixe:m.mid+"_cf",
      auMaj:function(){ sauver(); rendre(); }});
    if(cf.fuite === "oui"){
      champ(gE, cf, "loca", "Localisation de la fuite", {plein:true, type:"zone", suffixe:m.mid+"_cf",
        ph:"circuit et point précis — ex. raccord flare liaison liquide, unité extérieure",
        aide:"l'arrêté du 29 février 2018 impose de consigner chaque circuit et chaque point où une fuite a été détectée"});
      champ(gE, cf, "repare", "Réparation", {type:"liste", opts:["réalisée","à faire"], suffixe:m.mid+"_cf"});
    }
    champ(corpsE.appendChild(el("div","g2")), cf, "obs", "Observations portées sur la fiche",
      {plein:true, type:"zone", suffixe:m.mid+"_cf"});

    /* Ce qui manque pour que la fiche soit valable. */
    var manques = anomaliesCerfa(m);
    if(manques.length){
      var am = el("div","alerte att"); am.style.marginTop = "8px";
      manques.forEach(function(x){ am.appendChild(el("div",null,"• "+x)); });
      cc.appendChild(am);
    }
    if(signatureDetenteurRequise(m)){
      cc.appendChild(el("div","alerte info",
        "Charge supérieure à 5 t éq. CO2 : le détenteur doit signer la fiche. En dessous, sa signature n'est pas exigée."));
    }
    root.appendChild(cc);
  }

  /* --- aération du local : la notice, puis le verdict de Rémi --- */
  if(typeof ventilationConcernee === "function" && ventilationConcernee(m)){
    var cv = el("div","carte");
    cv.appendChild(el("h2",null,"Aération du local"));

    var bN = el("button","btn p large","📖  Ouvrir la notice ventilation");
    bN.type = "button";
    bN.onclick = function(){ ouvrirNotice(NOTICE_VENT, "Ventilation"); };
    cv.appendChild(bN);
    cv.appendChild(el("div","mini", SOURCE_VENT));

    var v = ventDe(m);
    var lg = el("div","champ plein"); lg.style.marginTop = "10px";
    lg.appendChild(el("label",null,"Ce que j'ai constaté"));
    var eta = el("div","pc-etats large");
    VENT_ETATS.forEach(function(o){
      var b = el("button","et large", o.l); b.type="button"; b.dataset.v=o.v;
      b.setAttribute("aria-pressed", v.etat===o.v ? "true":"false");
      b.onclick = function(){
        v.etat = (v.etat === o.v) ? "" : o.v;
        appliquerVentilation(m);
        sauver(); rendre();
      };
      eta.appendChild(b);
    });
    lg.appendChild(eta);
    cv.appendChild(lg);

    if(v.etat === "non"){
      var gd = el("div","g2"); gd.style.marginTop="8px"; cv.appendChild(gd);
      champ(gd, v, "desc", "Ce qui n'est pas conforme", {plein:true, type:"zone", suffixe:m.mid+"_vent",
        ph:"ex. entrée d'air basse obstruée par un meuble · pas de sortie d'air haute · grille de 50 cm² au lieu de 100"});
      cv.appendChild(el("div","aide",
        "Cette description part telle quelle sur le document du client, en anomalie. " +
        "Décris le constat, pas la cause : « grille obstruée », pas « le client a bouché ». Formule au conditionnel ce qui n'est qu'une hypothèse."));
    }
    root.appendChild(cv);
  }

  /* --- défauts et actions --- */
  var c5 = el("div","carte");
  var auto = anomaliesDe(m);
  if(auto.length){
    var a5 = el("div","alerte "+(auto.some(function(x){return x.grave;})?"mal":"att"));
    auto.forEach(function(x){ a5.appendChild(el("div",null,"• "+x.lib)); });
    c5.appendChild(a5);
  }
  var g5 = el("div","g2"); c5.appendChild(g5);
  champ(g5, m, "anomalies", "Défauts constatés", {plein:true, type:"zone", suffixe:m.mid, ph:"vide = aucune anomalie"});
  champ(g5, m, "actions", "Actions réalisées", {plein:true, type:"zone", suffixe:m.mid, ph:"vide = néant"});
  root.appendChild(c5);

  /* --- à prévoir la prochaine fois ---
     Note interne : elle ne figure jamais sur le document du client, elle
     remonte à la préparation du prochain rendez-vous. */
  var c5b = el("div","carte");
  var h5b = el("h2",null,"À prévoir la prochaine fois");
  if(txt(m.prochaine)) h5b.appendChild(el("span","cpt","noté"));
  c5b.appendChild(h5b);
  c5b.appendChild(el("div","mini","Interne. Ça ressortira quand on calera le prochain rendez-vous : matériel à emporter, temps à réserver, accès."));
  var chp = el("div","chips petit"); chp.style.margin = "7px 0";
  RAPPELS.forEach(function(r){
    var br = el("button","chip mini", r); br.type = "button";
    var pose = (txt(m.prochaine)||"").indexOf(r) >= 0;
    br.setAttribute("aria-pressed", pose ? "true" : "false");
    br.onclick = function(){
      var v = txt(m.prochaine) || "";
      if(v.indexOf(r) >= 0) v = v.split(" · ").filter(function(x){ return x !== r; }).join(" · ");
      else v = v ? (v + " · " + r) : r;
      m.prochaine = v; sauver(); rendre();
    };
    chp.appendChild(br);
  });
  c5b.appendChild(chp);
  if(txt(m.prochaineAvant)){
    var rap = el("div","alerte att");
    rap.appendChild(el("div", null, "Noté à la visite précédente : " + m.prochaineAvant));
    c5b.appendChild(rap);
  }
  var g5b = el("div","g2"); c5b.appendChild(g5b);
  champ(g5b, m, "prochaine", "Détail", {plein:true, type:"zone", suffixe:m.mid,
    ph:"ex. amener un joint de vanne gaz DN20 · prévoir 1 h de plus · clé du local chez le voisin"});
  root.appendChild(c5b);

  /* --- photos --- */
  carteMachinePhotos(root, m, !!m.notion);

  /* --- conseils, repliés, tous donnés par défaut --- */
  var c6 = el("div","carte");
  var donnes = t.conseils.filter(function(_,i){ return m.conseils["k"+i]; }).length;
  var corpsC = bloc(c6, "Conseils au client", donnes+"/"+t.conseils.length, false);
  t.conseils.forEach(function(lib, i){
    var l = el("div","pc-ligne");
    l.appendChild(el("div","pc-lib", lib));
    var b3 = el("button","case","✓"); b3.type="button";
    b3.setAttribute("aria-pressed", m.conseils["k"+i]?"true":"false");
    b3.onclick = function(){
      m.conseilsManuel = m.conseilsManuel || {}; m.conseilsManuel["k"+i] = 1;
      m.conseils["k"+i] = m.conseils["k"+i]?0:1;
      b3.setAttribute("aria-pressed", m.conseils["k"+i]?"true":"false");
      var n = t.conseils.filter(function(_,j){ return m.conseils["k"+j]; }).length;
      corpsC.parentNode.querySelector(".cpt").textContent = n+"/"+t.conseils.length;
      sauver();
    };
    var w = el("div","pc-etats"); w.appendChild(b3); l.appendChild(w);
    corpsC.appendChild(l);
  });
  champ(c6, m, "note", "Précisions", {plein:true, type:"zone", suffixe:m.mid});
  root.appendChild(c6);

  majs.forEach(function(fn){fn();});
}
