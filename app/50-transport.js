/* ============ construction du message ============ */
function etatLisible(v){ return v==="ok" ? "contrôlé" : v==="non" ? "NON CONTRÔLÉ" : v==="np" ? "non présent" : "non renseigné"; }

/* Options de la base « Parc équipements KA-RÉ » : on n'envoie à Notion que
   ce qu'elle sait recevoir. Une option inconnue fait échouer tout l'appel. */
var FLUIDES_NOTION = ["R32","R410A","R290","R454B","R134a","R407C","R404A","Sans objet"];
function perioNotion(p){
  var x = sansAccents(String(p || "").toLowerCase());
  if(x.indexOf("2 ans") >= 0 || x.indexOf("biennale") >= 0) return "Biennale";
  if(x.indexOf("annuelle") === 0 || x.indexOf("par an") >= 0) return "Annuelle";
  return "Ponctuel";
}
/* Les propriétés de la fiche équipement, au format Notion. */
function parcProps(m){
  var t = techDe(m), P = {};
  function rt(k, v){ v = txt(v); if(v) P[k] = {rich_text:[{text:{content:String(v).slice(0,1900)}}]}; }
  function num(k, v){ var x = nb(v); if(estNb(x)) P[k] = {number:x}; }
  function sel(k, v){ v = txt(v); if(v) P[k] = {select:{name:v}}; }
  var titre = [t.label, txt(m.ident.marque)].filter(Boolean).join(" — ")
              + (txt(V.client) ? " · " + txt(V.client) : "");
  P["Équipement"] = {title:[{text:{content:titre.slice(0,1900)}}]};
  rt("Client", V.client);
  rt("Adresse du site", V.adresse);
  rt("Ville", V.ville);
  rt("ID société Axonaut", V.axonaut);
  if(txt(V.email)) P["Email client"]  = {email: txt(V.email)};
  if(txt(V.tel))   P["Téléphone"]     = {phone_number: txt(V.tel)};
  sel("Type équipement", (typeof NOTION_TECH === "object") ? NOTION_TECH[m.tech] : null);
  rt("Marque", m.ident.marque);
  rt("N° de série", m.ident.serie);
  num("Année", m.ident.annee);
  num("Puissance (kW)", m.ident.puiss);
  var fl = txt(m.ident.fluide);
  sel("Fluide frigorigène", (fl && FLUIDES_NOTION.indexOf(fl) >= 0) ? fl : null);
  num("Charge fluide (kg)", m.ident.charge);
  num("Nb unités intérieures", m.ident.nbui);
  sel("Statut", "Entretien ponctuel");
  sel("Périodicité retenue", perioNotion(t.regl && t.regl.periodicite));
  return P;
}

function payloadMachine(m, idx){
  var t = techDe(m), lc = listeCtrl(m);
  var ident = {}, i;
  t.ident.forEach(function(f){ var v=propre(m.ident[f.k]); if(v!==null) ident[f.l]=v; });

  var ctrl = [], nOk=0, nNon=0, nNp=0;
  lc.forEach(function(lib, j){
    var e = m.ctrl["c"+j] || "";
    if(e==="ok") nOk++; else if(e==="non") nNon++; else if(e==="np") nNp++;
    ctrl.push({point:lib, etat:etatLisible(e)});
  });

  var mesures = {};
  t.mes.forEach(function(f){
    var val, brut;
    if(m.na && m.na[f.k]){
      mesures[f.l] = {valeur:"sans objet", unite:f.u||null, verdict:null, alerte:false,
                      motif:"non relevable sur cet équipement"};
      return;
    }
    if(f.type==="calc"){
      val = valeurCalc(m,f);
      brut = estNb(val) ? val : (typeof val === "string" && val ? val : null);
    }
    else if(f.type==="fixe"){ brut = f.valeur; val = f.valeur; }
    else { brut = (f.type==="num") ? n0(m.mes[f.k]) : propre(m.mes[f.k]); val = nb(m.mes[f.k]); }
    if(brut===null || brut===undefined || brut==="") return;
    var v = verdict(f, estNb(val)?val:NaN, m);
    mesures[f.l] = {valeur:brut, unite:f.u||null, verdict:v?v.t:null,
                    alerte: !!(v && v.k!=="ok" && !v.indicatif)};
  });
  if(typeof ligneVentilation === "function"){
    var lv = ligneVentilation(m);
    if(lv) mesures[lv.k] = {valeur:lv.v, unite:null, verdict:null, alerte:lv.alerte};
  }

  var sous = [];
  if(t.sousMachines){
    m.sous.forEach(function(ligne, k){
      var o = {n:k+1};
      t.sousMachines.champs.forEach(function(f){
        var v;
        if(f.type==="calc"){ var x=valeurCalc(m,f,ligne); v = estNb(x)?x:null; }
        else if(f.type==="case"){ v = ligne[f.k]?"oui":"non"; }
        else { v = (f.type==="num") ? n0(ligne[f.k]) : txt(ligne[f.k]); }
        if(v!==null && v!==undefined && v!=="") o[f.l]=v;
      });
      if(Object.keys(o).length>1) sous.push(o);
    });
  }

  var conseils = [];
  t.conseils.forEach(function(lib,k){ if(m.conseils["k"+k]) conseils.push(lib); });

  var ecarts = anomaliesDe(m).map(function(x){ return propre((x.grave?"[DANGER] ":"")+x.lib); }).filter(Boolean);

  return {
    secret: cfg.secret || "",
    visite_id: V.id,
    fiche_id: m.mid,
    machine_num: idx+1,
    machines_total: V.machines.length,
    date: V.date,
    type_intervention: (INTERV.filter(function(x){return x.c===V.interv;})[0]||{}).cle || "entretien",
    technologie: m.tech,
    technologie_label: t.label,
    notion_page_id: m.notion || null,
    axonaut_id: m.axonaut || null,
    /* Repris de la fiche Notion : c'est ce qui permettra d'envoyer
       l'attestation au client sans aller la chercher à la main. */
    /* La fiche du parc d'abord ; à défaut ce que Rémi a saisi sur place. */
    email_client: propre(m.email) || propre(V.email),
    /* Fiche fluides frigorigènes : ce qui alimentera le CERFA 15497*04
       et, en fin d'année, la déclaration annuelle de l'article R. 543-100. */
    cerfa: (typeof payloadCerfa === "function") ? payloadCerfa(m) : null,
    reglementaire: estReglementaire(m),
    hors_plage: horsPlage(m) ? (fmt(horsPlage(m).p,1)+" kW, "+horsPlage(m).sens+" "+horsPlage(m).seuil+" kW") : null,
    document_a_produire: estReglementaire(m) ? t.regl.doc : "Compte rendu d'entretien contractuel",
    periodicite: t.regl.periodicite,
    base_reglementaire: t.regl.cadre,
    client: {
      nom: propre(V.client), adresse: propre(V.adresse), ville: propre(V.ville),
      email: propre(V.email), tel: propre(V.tel),
      contact: propre(V.contact), present: propre(V.present)
    },
    /* De quoi créer la fiche équipement quand la machine n'est pas encore au
       parc. Sans ça, rien ne se déclenche : pas de ligne d'intervention, pas
       de date de prochain entretien, et l'appareil sort des radars l'année
       suivante — c'est exactement ce qui s'est passé le 02/09.
       Le bloc « parc » est lisible par un humain (mail interne) ; le champ
       parc_props est la même chose au format attendu par Notion, prêt à être
       recopié tel quel dans l'appel d'API — c'est ici, où on peut le tester,
       que se traitent les valeurs vides et les types, pas dans Make. */
    parc_props: m.notion ? null : parcProps(m),
    /* La même chose déjà sérialisée : Make ne sait pas transformer un objet
       en texte JSON, il écrirait « [object Object] ». On lui mâche le travail. */
    parc_props_json: m.notion ? null : JSON.stringify(parcProps(m)),
    parc: (m.notion ? null : {
      titre: [t.label, propre(m.ident.marque)].filter(Boolean).join(" — "),
      type_notion: (typeof NOTION_TECH === "object" && NOTION_TECH[m.tech]) || null,
      client: propre(V.client), adresse: propre(V.adresse), ville: propre(V.ville),
      email: propre(V.email), tel: propre(V.tel),
      marque: propre(m.ident.marque), serie: propre(m.ident.serie),
      annee: n0(m.ident.annee), puissance: n0(m.ident.puiss),
      fluide: propre(m.ident.fluide), charge_kg: n0(m.ident.charge),
      nb_ui: n0(m.ident.nbui),
      axonaut: propre(V.axonaut),
      periodicite: t.regl.periodicite || null
    }),
    technicien: cfg.technicien || "Rémi KATA",
    appareils_mesure: t.sansAppareils ? null : propre(cfg.appareils || V.appareils),
    identification: ident,
    controles: ctrl,
    controles_controles: nOk, controles_non: nNon, controles_np: nNp, controles_total: lc.length,
    mesures: mesures,
    sous_machines: sous,
    anomalies: propre(m.anomalies),
    actions: propre(m.actions),
    conseils_donnes: conseils,
    precisions: propre(m.note),
    a_prevoir: propre(m.prochaine),
    photos: (m.photos||[]).map(function(ph){ return {etiquette:ph.et}; }),
    photos_nb: (m.photos||[]).length,
    ecarts: ecarts,
    danger: ecarts.some(function(e){ return e.indexOf("[DANGER]")===0; }),
    application: "fiche-terrain KA-RÉ v"+VERSION,
    resume: propre(resumeTexte(m, idx))
  };
}

function resumeTexte(m, idx){
  var t = techDe(m), L = [], lc = listeCtrl(m);
  function ligne(k,v){ if(v!==null && v!==undefined && String(v).trim()!=="") L.push(k+" : "+v); }
  L.push("=== "+t.label.toUpperCase()+" — machine "+(idx+1)+"/"+V.machines.length+" ===");
  ligne("Document à produire", t.regl.doc + (t.regl.obligatoire?" (réglementaire)":" (contractuel — PAS réglementaire)"));
  ligne("Client", V.client); ligne("Adresse", V.adresse);
  ligne("Date", V.date);
  ligne("Intervention", (INTERV.filter(function(x){return x.c===V.interv;})[0]||{}).l);
  ligne("Technicien", cfg.technicien||"Rémi KATA");
  ligne("Personne présente", V.present);
  ligne("Appareils de mesure", cfg.appareils || V.appareils);
  L.push(""); L.push("-- Identification --");
  t.ident.forEach(function(f){ ligne(f.l, txt(m.ident[f.k])); });
  L.push(""); L.push("-- Points de contrôle --");
  lc.forEach(function(lib,j){ L.push("["+ (m.ctrl["c"+j]==="ok"?"X":m.ctrl["c"+j]==="non"?"!":m.ctrl["c"+j]==="np"?"-":" ") +"] "+lib); });
  L.push(""); L.push("-- Mesures --");
  t.mes.forEach(function(f){
    var val, aff;
    if(f.type==="calc"){
      val = valeurCalc(m,f);
      aff = estNb(val) ? fmt(val,1) : (typeof val === "string" && val ? val : null);
    }
    else if(f.type==="fixe"){ val=f.valeur; aff=String(f.valeur); }
    else { aff = txt(m.mes[f.k]); val = nb(m.mes[f.k]); }
    if(m.na && m.na[f.k]){ ligne(f.l, "sans objet"); return; }
    if(aff===null) return;
    var v = verdict(f, estNb(val)?val:NaN, m);
    ligne(f.l, aff + (f.u?" "+f.u:"") + (v ? "  → "+v.t : ""));
  });
  if(typeof ligneVentilation === "function"){
    var lvt = ligneVentilation(m);
    if(lvt) ligne(lvt.k, lvt.v);
  }
  if(t.sousMachines && m.sous.length){
    L.push(""); L.push("-- "+t.sousMachines.label+" --");
    m.sous.forEach(function(ligneS, k){
      var bouts=[];
      t.sousMachines.champs.forEach(function(f){
        var v;
        if(f.type==="calc"){ var x=valeurCalc(m,f,ligneS); v = estNb(x)?fmt(x,1):null; }
        else if(f.type==="case"){ v = ligneS[f.k]?"oui":null; }
        else v = txt(ligneS[f.k]);
        if(v!==null) bouts.push(f.l+" "+v+(f.u?" "+f.u:""));
      });
      if(bouts.length) L.push((k+1)+". "+bouts.join(" | "));
    });
  }
  var ec = anomaliesDe(m);
  if(ec.length){ L.push(""); L.push("-- Écarts relevés --"); ec.forEach(function(x){ L.push((x.grave?"!! ":"- ")+x.lib); }); }
  if(txt(m.anomalies)){ L.push(""); L.push("-- Défauts constatés --"); L.push(m.anomalies); }
  if(txt(m.actions)){ L.push(""); L.push("-- Actions réalisées --"); L.push(m.actions); }
  var cs=[]; t.conseils.forEach(function(lib,k){ if(m.conseils["k"+k]) cs.push(lib); });
  if(cs.length){ L.push(""); L.push("-- Conseils donnés --"); cs.forEach(function(c){ L.push("- "+c); }); }
  if(txt(m.note)){ L.push(""); L.push("-- Précisions --"); L.push(m.note); }
  if(txt(m.prochaine)){ L.push(""); L.push("-- À prévoir la prochaine fois --"); L.push(m.prochaine); }
  return L.join("\n");
}

/* ============ file d'attente ============ */
function fileLire(){ return lire(CLE_FILE, []); }
function fileEcrire(f){ var ok = ecrire(CLE_FILE, f); majFile(); return ok; }
/* La file doit survivre à la fermeture de l'appli : c'est elle qui garantit
   qu'une fiche relevée hors connexion n'est jamais perdue. Si le stockage
   sature (le PDF pèse ~30 Ko, les photos bien plus), on sacrifie le PDF
   plutôt que le relevé, et on le dit. */
function fileAjouter(p){
  var f = fileLire();
  f.push({t:Date.now(), p:p});
  if(fileEcrire(f)) return true;
  if(p.pdf_base64){
    var pdf = p.pdf_base64;
    delete p.pdf_base64;
    p.pdf_abandonne = "stockage saturé sur la tablette";
    if(fileEcrire(f)){
      toast("Mémoire pleine : le relevé est gardé, le document PDF est à refaire au retour du réseau","att");
      return true;
    }
    p.pdf_base64 = pdf;
  }
  f.pop(); fileEcrire(f);
  toast("Mémoire de la tablette pleine — fiche NON mise en attente. Envoie dès que tu as du réseau.","mal");
  return false;
}
function majFile(){
  var f = fileLire(), p = $("#pFile");
  if(!p) return;
  p.hidden = f.length===0;
  p.textContent = f.length + (f.length>1?" en attente":" en attente");
  p.className = "pastille "+(f.length?"att":"");
}
function majReseau(){
  var p = $("#pReseau"); if(!p) return;
  var on = navigator.onLine !== false;
  p.textContent = on ? "en ligne" : "hors connexion";
  p.className = "pastille "+(on?"ok":"att");
}

/* Envoi vers Make.
   On poste en formulaire (payload=<json encode>) et non en JSON brut :
   c'est le seul type de contenu que le navigateur laisse passer sans requete
   preliminaire CORS, et c'est le seul que Make sait decouper en champs.
   Le scenario remet le JSON a plat avec un module "Parse JSON". */
function postMake(url, obj){
  return fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
    body: "payload=" + encodeURIComponent(JSON.stringify(obj))
  });
}

var envoiEnCours = false;
function viderFile(manuel){
  if(envoiEnCours) return;
  if(navigator.onLine === false){ if(manuel) toast("Pas de réseau — les fiches restent en attente","att"); return; }
  var f = fileLire();
  if(!f.length){ if(manuel) toast("Rien en attente"); return; }
  if(!cfg.webhook){ if(manuel) toast("Adresse d'envoi non renseignée","mal"); return; }
  envoiEnCours = true;
  var reste = f.slice(), envoyes = 0;
  function suivant(){
    if(!reste.length){
      envoiEnCours=false; fileEcrire([]);
      if(envoyes){
        toast(envoyes+(envoyes>1?" fiches envoyées":" fiche envoyée"),"ok");
        if(typeof proposerSuite==="function") proposerSuite(envoyes);
      }
      return;
    }
    var item = reste[0];
    postMake(cfg.webhook, item.p)
      .then(function(r){
        if(!r.ok) throw new Error("HTTP "+r.status);
        return r.text();
      })
      .then(function(){
        reste.shift(); envoyes++;
        fileEcrire(reste.slice());
        if(item.p && item.p.fiche_id){ V.envoye[item.p.fiche_id]=Date.now(); sauverTout(); }
        suivant();
      })
      .catch(function(e){
        envoiEnCours=false;
        fileEcrire(reste.slice());
        if(manuel) toast(navigator.onLine===false
          ? "Pas de réseau — gardé en attente"
          : "Make n'a pas répondu — gardé en attente, rien n'est perdu","mal");
      });
  }
  suivant();
}

function envoyer(){
  if(!V.machines.length){ toast("Aucune machine à envoyer","att"); return; }
  if(!txt(V.client)){ toast("Renseigne le nom du client d'abord","att"); aller("visite"); return; }
  if(!cfg.webhook){ toast("Adresse d'envoi non renseignée — voir Réglages","mal"); return; }
  if(typeof avecSignature === "function" && signatureManquante()){ avecSignature(envoyer); return; }
  if(typeof avecReleves === "function" && !_relevesAcceptes && relevesManquants().length){ avecReleves(envoyer); return; }
  _relevesAcceptes = false;
  sauverTout();
  toast("Préparation des documents…");
  Promise.all(V.machines.map(function(m,i){
    return documentPDF(m,i).then(function(u8){
      var p = payloadMachine(m,i);
      p.pdf_nom = nomPDF(m,i);
      p.pdf_base64 = pdfBase64(u8);
      p.pdf_octets = u8.length;
      return p;
    }).catch(function(e){
      /* Un PDF raté ne doit jamais faire perdre le relevé : la fiche part sans lui. */
      var p = payloadMachine(m,i);
      p.pdf_erreur = propre(String(e && e.message ? e.message : e));
      return p;
    });
  })).then(function(ps){
    var sansPdf = ps.filter(function(x){ return !x.pdf_base64; }).length;
    ps.forEach(fileAjouter);
    /* Les photos suivent la fiche : quand elles arrivent, le dossier client existe. */
    var nPh = 0;
    V.machines.forEach(function(m, i){
      (m.photos||[]).forEach(function(ph, k){
        var pp = payloadPhoto(m, ph, k, i);
        if(pp.photo_base64 && fileAjouter(pp)) nPh++;
      });
    });
    if(sansPdf) toast(sansPdf+(sansPdf>1?" documents n'ont pas pu être créés":" document n'a pas pu être créé")+" — le relevé part quand même","att");
    else toast(ps.length+(ps.length>1?" fiches prêtes":" fiche prête")+(nPh?" · "+nPh+(nPh>1?" photos":" photo"):""));
    viderFile(true);
  });
}

/* ============ fichier ============ */
function nomFichier(ext){
  return [slug(V.date), slug(V.client||"client"), "KA-RE"].join("_")+"."+ext;
}
function texteVisite(){
  var L = ["FICHE TERRAIN KA-RÉ — "+(V.client||"client"), "Visite "+V.id, ""];
  V.machines.forEach(function(m,i){ L.push(resumeTexte(m,i)); L.push(""); L.push(""); });
  return L.join("\n");
}
/* « Fichier » rend le document, pas un relevé texte : c'est le PDF que Rémi
   veut pouvoir garder ou envoyer depuis la tablette. Un fichier par machine. */
function telecharger(){
  if(!V.machines.length){ toast("Aucune machine","att"); return; }
  sauverTout();
  toast("Préparation du document…");
  var faits = 0;
  V.machines.reduce(function(chaine, m, i){
    return chaine.then(function(){
      return documentPDF(m, i).then(function(u8){
        var b = new Blob([u8], {type:"application/pdf"});
        var u = URL.createObjectURL(b);
        var a = document.createElement("a");
        a.href = u; a.download = nomPDF(m, i);
        document.body.appendChild(a); a.click();
        setTimeout(function(){ URL.revokeObjectURL(u); a.remove(); }, 2000);
        faits++;
      });
    });
  }, Promise.resolve()).then(function(){
    toast(faits + (faits>1 ? " documents enregistrés" : " document enregistré"), "ok");
  }).catch(function(e){
    toast("Impossible de créer le document : " + (e && e.message ? e.message : e), "mal");
  });
}


/* ============ toast ============ */
var toastTimer=null;
function toast(msg, kind){
  var t = $(".toast");
  if(t) t.remove();
  t = el("div","toast"+(kind?" "+kind:""), msg);
  document.body.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ if(t) t.remove(); }, 3600);
}
