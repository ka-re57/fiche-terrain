/* ============================================================
   Le document remis au client.
   Construit à l'impression : un document par machine, complet,
   avec en-tête, références réglementaires, réserves et signatures.
   ============================================================ */
var KARE_ENTETE = {
  raison:"SARL KA-RÉ", slogan:"Votre confort, notre expertise !",
  adresse:"13 Rue de la Lâche, 57530 Raville",
  tel:"06 80 80 50 01", mail:"contact@ka-re.fr",
  siret:"SIRET 983 668 567 00016", tva:"TVA FR30983668567",
  qualif:"RGE QualiPac QPAC/76170 · Attestation de capacité fluides frigorigènes CF00574"
};
/* Devine la commune à partir de l'adresse du chantier : « … 57530 Raville » -> Raville */
function communeDe(adr){
  var a = txt(adr); if(!a) return null;
  var m = a.match(/\b\d{5}\s+([^,;]+)$/);
  if(m) return m[1].trim();
  var bouts = a.split(",");
  if(bouts.length > 1) return bouts[bouts.length-1].trim();
  /* Le 02/09, l'adresse valait « Faulquemont » tout court : pas de code postal,
     pas de virgule, donc aucune commune trouvée alors qu'elle était sous les
     yeux. Une adresse courte et sans numéro de rue EST une commune. */
  if(a.length <= 40 && !/\d/.test(a) && a.split(/\s+/).length <= 4) return a;
  return null;
}
var RESERVES =
  "Le présent document rend compte des vérifications, mesures et constatations réalisées le jour de la visite, "+
  "sur les seules parties accessibles de l'installation et sans démontage autre que celui nécessaire à l'entretien "+
  "courant. Il ne constitue ni une garantie de bon fonctionnement futur, ni un diagnostic exhaustif de l'installation. "+
  "Il ne couvre pas les désordres non apparents, les vices cachés, les conséquences d'interventions réalisées par des "+
  "tiers, ni les défauts d'un matériel dont KA-RÉ n'a pas assuré la pose lorsque son historique n'a pas été porté à sa "+
  "connaissance. Les causes mentionnées sont des causes probables. Lorsqu'un danger est constaté, il est signalé au "+
  "commanditaire au titre du devoir de conseil de l'entreprise. Les travaux correctifs identifiés et non réalisés ce "+
  "jour font l'objet d'un devis distinct ; leur non-réalisation engage la responsabilité du commanditaire quant aux "+
  "conséquences.";
/* Reprise mot pour mot du modèle d'attestation. J'avais retiré la réserve
   finale sur le CO en croyant l'avoir inventée : elle figure bien sur le
   modèle officiel, et c'est elle qui donne force au signalement en cas de
   teneur anormale. La retirer affaiblissait le document. */
var MENTION_CONSEILS =
  "Les conseils et recommandations de la présente attestation sont donnés à titre indicatif et ont une valeur "+
  "informative. Aucun investissement proposé par la personne ayant effectué l'entretien ne revêt un caractère "+
  "obligatoire. Il s'agit de conseils et non de prescriptions ou d'injonctions de faire, sauf pour le cas où une "+
  "teneur anormalement élevée en CO est constatée.";
/* Mention du modèle, due dès que l'appareil est raccordé à une VMC gaz. */
var MENTION_DSC =
  "Dans le cas d'absence du relais DSC sur chaudière VMC gaz, le distributeur de gaz concerné sera informé par le "+
  "prestataire ayant réalisé l'entretien selon la procédure définie dans la norme NF P 45-500.";

/* 2026-08-24 -> 24/08/2026 */
function dateFr(d){
  var v = txt(d); if(!v) return "";
  var m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? m[3]+"/"+m[2]+"/"+m[1] : v;
}
function ligneDoc(parent, cle, val){
  if(val===null || val===undefined || String(val).trim()==="") return;
  var l = el("div","dl");
  l.appendChild(el("span","dk", cle));
  l.appendChild(el("span","dv", String(val)));
  parent.appendChild(l);
}

/* ============================================================
   Une seule source pour le document : modeleDocument() décrit ce
   qu'il contient, documentMachine() le dessine à l'écran et pour
   l'impression, documentPDF() le dessine dans le fichier PDF.
   Tant que les deux passent par ce modèle, ils ne peuvent pas diverger.
   ============================================================ */
function modeleDocument(m, idx){
  var t = techDe(m);
  var regl  = estReglementaire(m);
  var titre = regl ? "Attestation d'entretien" : "Compte rendu d'entretien";
  if(V.interv === "mes")      titre = "Procès-verbal de mise en service";
  else if(V.interv === "dep") titre = "Rapport d'intervention";

  var sous;
  if(regl && V.interv === "entretien"){
    sous = "Établi en application du " + t.regl.cadre +
      " Puissance concernée : " + t.regl.plage + ". Périodicité : " + t.regl.periodicite.toLowerCase() + ".";
  } else if(V.interv === "entretien"){
    var hp = horsPlage(m);
    sous = hp
      ? ("Prestation contractuelle. La puissance de cet équipement (" + fmt(hp.p,1) + " kW) se situe " + hp.sens +
         " " + hp.seuil + " kW : l'entretien ne relève pas de l'obligation réglementaire. Le présent document ne " +
         "constitue pas une attestation réglementaire.")
      : ("Prestation contractuelle. L'entretien de ce type d'équipement ne fait l'objet d'aucune " +
         "obligation réglementaire : le présent document ne constitue pas une attestation réglementaire.");
  } else {
    sous = "Document établi au titre de l'intervention réalisée. " +
      (t.regl.obligatoire ? "L'entretien périodique de cet équipement relève par ailleurs du " + t.regl.cadre : "");
  }

  function L(k, v){ return (v===null||v===undefined||String(v).trim()==="") ? null : {k:k, v:String(v)}; }
  function nettoie(a){ return a.filter(function(x){ return !!x; }); }

  /* 1 — commanditaire */
  var s1 = nettoie([
    L("Commanditaire", V.client),
    L("Adresse de l'installation", V.adresse),
    L("Personne présente", V.present),
    L("Date de la visite", dateFr(V.date)),
    L("Nature de l'intervention", (INTERV.filter(function(x){return x.c===V.interv;})[0]||{}).l),
    L("Intervenant", (cfg.technicien||"Rémi KATA")+" — "+KARE_ENTETE.raison+" — "+KARE_ENTETE.tel),
    t.sansAppareils ? null : L("Appareils de mesure utilisés", cfg.appareils)
  ]);

  /* 2 — identification */
  var s2 = nettoie(t.ident.map(function(f){
    var v = txt(m.ident[f.k]);
    return v===null ? null : L(f.l, (f.type==="date" ? dateFr(v) : v) + (f.u?" "+f.u:""));
  }));

  /* 3 — points de contrôle */
  var tableau = listeCtrl(m).map(function(lib, i){
    var e = m.ctrl["c"+i];
    return {lib:lib, etat:e||"", grave:(e==="non")};
  });

  /* 4 — mesures */
  var s4 = [], sousM = [];
  t.mes.forEach(function(f){
    if(f.horsDoc) return;             /* saisie de service : elle nourrit un calcul, elle ne s'imprime pas */
    if(m.na && m.na[f.k]){ s4.push({k:f.l, v:"sans objet — non relevable sur cet équipement"}); return; }
    var val, aff;
    if(f.type==="calc"){
      val = valeurCalc(m,f);
      /* Un calcul peut rendre du texte : la classe énergétique vaut « B »,
         pas un nombre. Ne garder que estNb() faisait disparaître la ligne
         du document — et le document restait « à finir ». */
      /* Un forfait entier n'a pas à s'écrire « 45,0 » : sur un document,
         la décimale vide donne l'air d'une précision qu'on n'a pas. */
      aff = estNb(val) ? (val === Math.round(val) ? String(val) : fmt(val,1))
                       : (typeof val === "string" && val ? val : null);
    }
    else if(f.type==="fixe"){ val=f.valeur; aff=String(f.valeur); }
    else {
      aff = txt(m.mes[f.k]); val = nb(m.mes[f.k]);
      /* Rémi tape « 91.4 » au pavé numérique de la tablette. À côté d'un
         « 92,4 » calculé, le point fait tache sur un document français. */
      if(f.type === "num" && estNb(val)) aff = aff.replace(".", ",");
    }
    if(aff===null) return;
    var v = verdict(f, estNb(val)?val:NaN, m);
    var alerte = !!(v && v.k!=="ok" && !v.indicatif);
    s4.push({kk:f.k, k:f.l, v:aff + (f.u?" "+f.u:""), alerte:alerte, verdict:alerte ? v.t : null});
  });
  /* Sur une chaudière à condensation, le rendement évalué et le rendement de
     référence sortent de la même formule d'annexe 2 : deux lignes, le même
     nombre. Sur un document client ça ressemble à une erreur de saisie. On
     n'en garde qu'une, et on dit en toutes lettres ce que la comparaison
     donne — l'information de référence n'est pas perdue, elle est écrite. */
  (function(){
    var iR = -1, iRef = -1;
    s4.forEach(function(l, i){ if(l.kk === "rdt") iR = i; if(l.kk === "rdt_ref") iRef = i; });
    if(iR < 0 || iRef < 0) return;
    if(s4[iR].v !== s4[iRef].v) return;
    s4[iR].v = s4[iR].v + " — au niveau du rendement de référence d'un appareil de même puissance (annexe 2)";
    s4.splice(iRef, 1);
  })();
  /* Le verdict d'aération du local se lit avec les mesures : c'est un
     constat de la visite, au même titre qu'une valeur relevée. */
  if(typeof ligneVentilation === "function"){
    var lv = ligneVentilation(m);
    if(lv) s4.push({k:lv.k, v:lv.v, alerte:lv.alerte, verdict:lv.alerte ? "non conforme" : null});
  }
  if(t.sousMachines && m.sous.length){
    m.sous.forEach(function(l, k){
      var bouts=[];
      t.sousMachines.champs.forEach(function(f){
        var v;
        if(f.type==="calc"){ var x=valeurCalc(m,f,l); v = estNb(x)?fmt(x,1):null; }
        else if(f.type==="case"){ v = l[f.k]?"oui":null; }
        else v = txt(l[f.k]);
        if(v!==null) bouts.push(f.l+" "+v+(f.u?" "+f.u:""));
      });
      if(bouts.length) sousM.push({k:t.sousMachines.singulier+" "+(k+1), v:bouts.join(" · ")});
    });
  }

  /* 5 — défauts */
  var ec = anomaliesDe(m);
  var s5 = nettoie([
    L("Défauts constatés", txt(m.anomalies) || (ec.length ? "voir ci-dessus" : "Aucune anomalie constatée")),
    L("Actions correctives réalisées", txt(m.actions) || "Néant")
  ]);

  /* 6 — conseils */
  var don = t.conseils.filter(function(_,i){ return m.conseils["k"+i]; });
  var s6 = nettoie([ L("Précisions", txt(m.note)) ]);

  var pied = [];
  if(regl && V.interv === "entretien"){
    pied.push("À remettre au commanditaire sous "+t.regl.delai+" · "+t.regl.conserv+
              " · à tenir à disposition des agents de contrôle.");
  }
  pied.push(KARE_ENTETE.raison+" · "+KARE_ENTETE.adresse+" · "+KARE_ENTETE.siret+
            " · fiche "+m.mid.slice(-6)+" · visite "+V.id.slice(-6));

  return {
    reglementaire: regl,
    titre: titre + " — " + t.label,
    sousTitre: sous,
    sections: [
      {titre:"1 — Commanditaire et intervention", lignes:s1},
      {titre:"2 — Identification de l'équipement", lignes:s2, sinon:"—"},
      {titre:"3 — Points de contrôle",
       legende:"État de chaque point : contrôlé, NON CONTRÔLÉ, ou NP lorsque l'organe n'est pas présent sur l'installation.", tableau:tableau},
      {titre:"4 — Mesures et relevés", lignes:s4, sinon:"Aucune mesure relevée.",
       sousTitre:(sousM.length ? t.sousMachines.label : null), sousLignes:sousM},
      {titre:"5 — Défauts constatés et actions réalisées",
       puces:ec.map(function(x){ return {t:x.lib, grave:x.grave}; }), lignes:s5},
      {titre:"6 — Conseils et recommandations",
       puces:don.map(function(c){ return {t:c, grave:false}; }), lignes:s6,
       sinon:(don.length?null:"—"),
       mention: MENTION_CONSEILS +
         (sansAccents(txt(m.ident.evac) || "").indexOf("vmc gaz") === 0 ? " " + MENTION_DSC : "")}
    ],
    reserves: RESERVES,
    signatures: {
      technicien: {
        nom: "Le technicien — "+(cfg.technicien||"Rémi KATA"),
        image: cfg.signature || null,
        /* Sans commune connue, on n'imprime pas « Fait à … » : trois points de
           suspension sur un document signé, ça fait brouillon. La date seule
           suffit, elle est ce qui fait foi. */
        lieuDate: (function(){
          var lieu = txt(V.ville) || communeDe(V.adresse) || "";
          return (lieu ? "Fait à " + lieu + ", le " : "Le ") + dateFr(V.date);
        })()
      },
      client: (cfg.signClient === "non") ? null : {
        nom: "Le commanditaire",
        image: V.signClient || null,
        legende: V.signClient
          ? ((txt(V.signQui) || txt(V.present) || "") + " — signé sur tablette le " + dateFr(V.date))
          : (V.signRefus ? null : "Pour réception du présent document"),
        absent: (!V.signClient && V.signRefus) ? "CLIENT ABSENT — document remis par voie électronique" : null
      }
    },
    pied: pied
  };
}

function documentMachine(m, idx){
  var mo = modeleDocument(m, idx);
  var d = el("div","doc");
  if(idx > 0) d.classList.add("saut");

  var e = el("div","doc-entete");
  var img = el("img"); img.className="doc-logo"; img.src = logoKare(); img.alt="KA-RÉ";
  e.appendChild(img);
  var ident = el("div","doc-ident");
  ident.appendChild(el("div","slog", KARE_ENTETE.slogan));
  ident.appendChild(el("div","coord", KARE_ENTETE.adresse+" · "+KARE_ENTETE.tel+" · "+KARE_ENTETE.mail));
  ident.appendChild(el("div","coord", KARE_ENTETE.siret+" · "+KARE_ENTETE.tva));
  ident.appendChild(el("div","qualif", KARE_ENTETE.qualif));
  e.appendChild(ident);
  d.appendChild(e);

  d.appendChild(el("h1", null, mo.titre));
  d.appendChild(el("div","doc-sous", mo.sousTitre));

  mo.sections.forEach(function(sec){
    var s = el("div","doc-sect");
    s.appendChild(el("h2",null,sec.titre));
    if(sec.legende) s.appendChild(el("div","doc-leg","✓ contrôlé    ✗ non contrôlé    NP non présent sur l'installation"));
    if(sec.puces && sec.puces.length){
      var u = el("div","doc-ec");
      sec.puces.forEach(function(x){ u.appendChild(el("div", x.grave?"mal":"", "• "+x.t)); });
      s.appendChild(u);
    }
    if(sec.tableau){
      var tb = el("table","doc-tbl");
      sec.tableau.forEach(function(r){
        var tr = el("tr");
        tr.appendChild(el("td", null, r.lib));
        var td2 = el("td","c", r.etat==="ok" ? "✓" : r.etat==="non" ? "✗" : r.etat==="np" ? "NP" : "—");
        if(r.grave) td2.className = "c mal";
        tr.appendChild(td2); tb.appendChild(tr);
      });
      s.appendChild(tb);
    }
    (sec.lignes||[]).forEach(function(l){
      ligneDoc(s, l.k, l.v + (l.verdict ? "   ⚠ "+l.verdict : ""));
    });
    if(sec.sousTitre){
      s.appendChild(el("h3",null,sec.sousTitre));
      (sec.sousLignes||[]).forEach(function(l){ ligneDoc(s, l.k, l.v); });
    }
    if(sec.sinon && !(sec.lignes||[]).length && !(sec.puces||[]).length && !sec.tableau){
      s.appendChild(el("div","dl", sec.sinon));
    }
    if(sec.mention) s.appendChild(el("div","doc-mention", sec.mention));
    d.appendChild(s);
  });

  var r = el("div","doc-clause");
  r.appendChild(el("b",null,"Réserves. "));
  r.appendChild(document.createTextNode(mo.reserves));
  d.appendChild(r);

  var sg = el("div","doc-sign");
  var g1 = el("div");
  g1.appendChild(el("div","l", mo.signatures.technicien.nom));
  if(mo.signatures.technicien.image){
    var si = el("img"); si.className="doc-para"; si.src = mo.signatures.technicien.image; si.alt="signature";
    g1.appendChild(si);
  }
  g1.appendChild(el("div","dt", mo.signatures.technicien.lieuDate));
  sg.appendChild(g1);
  if(mo.signatures.client){
    var c = mo.signatures.client, g2 = el("div");
    g2.appendChild(el("div","l", c.nom));
    if(c.image){
      var sc = el("img"); sc.className="doc-para"; sc.src = c.image; sc.alt="signature du client";
      g2.appendChild(sc);
    }
    if(c.absent) g2.appendChild(el("div","absent", c.absent));
    else if(c.legende) g2.appendChild(el("div","dt", c.legende));
    sg.appendChild(g2);
  }
  d.appendChild(sg);

  var p = el("div","doc-pied");
  mo.pied.forEach(function(x){ p.appendChild(el("div",null,x)); });
  d.appendChild(p);
  return d;
}

function imprimer(){
  sauverTout();
  if(!V.machines.length){ toast("Aucune machine à imprimer","att"); return; }
  if(typeof avecSignature === "function" && signatureManquante()){ avecSignature(imprimer); return; }
  var zone = document.getElementById("zoneImpression");
  if(zone) zone.remove();
  zone = el("div"); zone.id = "zoneImpression";
  V.machines.forEach(function(m,i){ zone.appendChild(documentMachine(m,i)); });
  document.body.appendChild(zone);
  document.body.classList.add("mode-impression");
  var fin = function(){
    document.body.classList.remove("mode-impression");
    var z = document.getElementById("zoneImpression"); if(z) z.remove();
    window.removeEventListener("afterprint", fin);
  };
  window.addEventListener("afterprint", fin);
  setTimeout(function(){ window.print(); setTimeout(fin, 1500); }, 60);
}
