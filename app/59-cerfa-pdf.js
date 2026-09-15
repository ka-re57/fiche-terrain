/* ============================================================
   Remplissage du CERFA 15497*04 — le formulaire officiel, embarqué
   dans l'appli (cerfa.js, réécrit une fois en objets simples), rempli
   hors ligne par mise à jour incrémentale du PDF : on ne touche pas
   au formulaire, on lui ajoute à la fin les objets modifiés et une
   nouvelle table de références. Chaque champ texte reçoit aussi son
   apparence dessinée (le texte lui-même), pour que le document se
   lise tel quel sur un téléphone, dans Gmail ou dans un aperçu qui
   ne sait pas recalculer les champs.
   ============================================================ */
var CERFA_CAPACITE = "CF00574";
var CERFA_OPERATEUR = "SARL KA-RÉ\n13 Rue de la Lâche, 57530 Raville\nSIRET 983 668 567 00016";

/* -- lecture du formulaire de base -- */
var _cerfaBase = null;
function cerfaBase(){
  if(_cerfaBase) return _cerfaBase;
  if(typeof CERFA_FORM_B64 === "undefined" || !CERFA_FORM_B64) return null;
  var bin = atob(CERFA_FORM_B64);
  /* Seuls les dictionnaires de champs nous intéressent : ils n'ont pas de
     flux. On saute les flux à la main plutôt qu'au hasard d'une expression
     régulière : un flux compressé peut contenir n'importe quels octets. */
  var objs = {}, pos = 0, re = /(\d+) 0 obj/g, m;
  while((m = re.exec(bin))){
    var debut = m.index + m[0].length;
    var fin = bin.indexOf("endobj", debut);
    if(fin < 0) break;
    var st = bin.indexOf("stream", debut);
    if(st >= 0 && st < fin){
      var es = bin.indexOf("endstream", st);
      fin = bin.indexOf("endobj", es >= 0 ? es : fin);
      re.lastIndex = fin + 6;
      continue;
    }
    objs[m[1]] = bin.slice(debut, fin).trim();
    re.lastIndex = fin + 6;
  }
  var champs = {};
  Object.keys(objs).forEach(function(n){
    var o = objs[n], t = o.match(/\/T\s*\(([^)]*)\)/);
    if(!t) return;
    var nom = t[1].replace(/\\137/g,"_").replace(/\\055/g,"-");
    champs[nom] = n;
  });
  var taille = bin.match(/\/Size (\d+)/g), size = 0;
  (taille||[]).forEach(function(x){ var v = parseInt(x.slice(6),10); if(v > size) size = v; });
  var sx = bin.lastIndexOf("startxref");
  var prev = parseInt(bin.slice(sx+9).trim().split(/\s/)[0], 10);
  var root = (bin.match(/\/Root (\d+) 0 R/)||[])[1] || "1";
  _cerfaBase = {bin:bin, objs:objs, champs:champs, size:size, prev:prev, root:root};
  return _cerfaBase;
}

/* -- ce qu'on écrit dans chaque champ -- */
function cerfaValeurs(m){
  var c = cerfaDe(m), t = techDe(m) || {}, P = payloadCerfa(m) || {};
  var v = {}, x = {};                      /* v : textes, x : cases cochées */
  var ident = m.ident || {};
  function dj(d){ var s = txt(d)||""; var mm = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); return mm ? {j:mm[3], m:mm[2], a:mm[1]} : null; }
  function kg(g){ var n = nb(g); return (estNb(n) && n > 0) ? String(Math.round(n)/1000).replace(".", ",") : ""; }

  v.Fiche_no = "KA-RÉ " + dateFr(V.date) + "\n" + m.mid.slice(-6);
  v.Operateur = CERFA_OPERATEUR;
  v.Attestation_no = CERFA_CAPACITE;
  v.Detenteur = [txt(V.client), txt(V.adresse)].filter(Boolean).join("\n");
  v.Equipement_ID = [t.label, txt(ident.marque), txt(ident.serie) ? "n° " + txt(ident.serie) : null].filter(Boolean).join(" - ");
  var fl = txt(ident.fluide) || "";
  v.Equipement_Fluide = fl.replace(/^R-?/i, "");
  v.Equipement_Charge = estNb(nb(ident.charge)) ? String(nb(ident.charge)).replace(".", ",") : "";
  v.Equipement_teqCO2 = estNb(P.teq_co2) ? String(P.teq_co2).replace(".", ",") : "";

  /* [4] nature : la case déclarée, et la recherche de fuite compte comme un
     contrôle d'étanchéité non périodique si aucun contrôle n'est déjà coché. */
  var nat = NATURES_CERFA.filter(function(n){ return n.l === c.nature || n.v === c.nature; })[0];
  if(nat) x[nat.champ] = true;
  if(c.recherche === "oui" && !x.Case_CtrlPerio && !x.Case_CtrlNonPerio) x.Case_CtrlNonPerio = true;
  if(!nat && c.mano === "oui" && !x.Case_CtrlNonPerio) x.Case_CtrlNonPerio = true;

  /* [5] détecteur */
  v.Detecteur_ID = txt(c.detecteur) || txt((cfg.outils||{}).detecteur_repere) || "";
  var dd = dj(c.detecteurLe || (cfg.outils||{}).detecteur_controle);
  if(dd){ v.Controle_Jour = dd.j; v.Controle_Mois = dd.m; v.Controle_Annee = dd.a; }

  /* [6] détection permanente : radio /1 = oui, /2 = non */
  if(c.detectionPerm === "oui") x.Bouton_Oui = "1";
  else if(c.detectionPerm === "non") x.Bouton_Oui = "2";

  /* [7] [8] [9] tranche et périodicité */
  var per = periodiciteEtancheite(m);
  if(per && per.tranche) x["Case_" + per.tranche] = true;
  if(per && per.tranche && estNb(per.mois) && per.mois > 0){
    x[(c.detectionPerm === "oui" ? "Case_Avec_" : "Case_Sans_") + per.mois + "m"] = true;
  }

  /* [10] fuites */
  if(c.fuite === "oui"){
    x.Case_Fuite_Oui = true;
    v.Fuite_Loca_1 = txt(c.loca) || "";
    if(c.repare === "réalisée") x.Case_Rep_Fuite1_realisee = true;
    else if(c.repare === "à faire") x.Case_Rep_Fuite1_AFaire = true;
  } else if(c.fuite === "non" || c.recherche === "oui" || x.Case_CtrlPerio || x.Case_CtrlNonPerio){
    x.Case_Fuite_Non = true;
  }

  /* [11] quantités, en kg sur le formulaire */
  var qA = nb(c.vierge)||0, qB = nb(c.recycle)||0, qC = nb(c.regenere)||0, qD = nb(c.traitement)||0, qE = nb(c.reutil)||0;
  if(qA+qB+qC > 0){ v["11_Quantite"] = kg(qA+qB+qC); v["11_QA"] = kg(qA); v["11_QB"] = kg(qB); v["11_QC"] = kg(qC); }
  if(qD+qE > 0){ v["11_QDE"] = kg(qD+qE); v["11_QD"] = kg(qD); v["11_QE"] = kg(qE); }
  v["11_BSFF"] = txt(c.bsff) || "";
  v["11_Contenant_ID"] = txt(c.contenant) || "";

  /* [12] déchets : seulement si du fluide a été récupéré */
  if(qD+qE > 0){
    var inflam = /^R(32|290|454|455|1234|600|1270)/i.test(fl);
    x[inflam ? "Case_12_UN3161" : "Case_12_UN1078"] = true;
  }

  /* [14] observations */
  var obs = [];
  if(txt(c.obs)) obs.push(txt(c.obs));
  if(P.requis_motif) obs.push("Fiche établie au titre de : " + P.requis_motif + ".");
  if(txt(m.mes && m.mes.mode)) obs.push("Essai en mode " + m.mes.mode + ".");
  obs.push("Relevé sur tablette - application fiche terrain KA-RÉ v" + VERSION + ", visite " + V.id.slice(-6) + ".");
  v["14_Observations"] = obs.join(" ");

  /* signatures */
  var lieu = txt(V.ville) || (typeof communeDe === "function" ? communeDe(V.adresse) : null) || "";
  v.Sign_Operateur_Nom = cfg.technicien || "Rémi KATA";
  v.Sign_Operateur_Qualite = "Gérant, SARL KA-RÉ - attestation de capacité " + CERFA_CAPACITE;
  v.Sign_Operateur_Date = (lieu ? lieu + ", le " : "Le ") + dateFr(V.date);
  v.Sign_Detenteur_Nom = txt(V.signQui) || txt(V.present) || txt(V.client) || "";
  v.Sign_Detenteur_Qualite = "Détenteur de l'équipement";
  v.Sign_Detenteur_Date = V.signClient ? "Signé sur tablette le " + dateFr(V.date)
                        : (V.signRefus ? "Client absent - fiche remise par voie électronique" : "");
  return {textes:v, cases:x};
}

/* -- écriture -- */
function pdfEchappe(s){
  return pdfNettoie(s).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
}
/* La valeur du champ (/V) est lue par les lecteurs qui redessinent eux-mêmes
   les champs, en PDFDocEncoding : les tirets et guillemets typographiques de
   WinAnsi (0x80-0x9F) y deviennent d'autres lettres. On les ramène à l'ASCII,
   et on garde les retours à la ligne, qu'un champ multiligne respecte. */
function pdfValeur(s){
  s = String(s===null||s===undefined ? "" : s);
  var lignes = s.split("\n").map(function(l){
    return pdfNettoie(l).replace(/[\x80-\x9F]/g, function(c){
      var k = c.charCodeAt(0);
      if(k === 150 || k === 151 || k === 149) return "-";
      if(k === 145 || k === 146) return "'";
      if(k === 147 || k === 148) return '"';
      if(k === 133) return "...";
      if(k === 128) return "EUR";
      return "?";
    });
  });
  return lignes.join("\\n").replace(/\\(?!n)/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
}
function cerfaApparence(rect, texte, multiligne, align, image){
  var l = rect[2]-rect[0], h = rect[3]-rect[1];
  var taille = multiligne ? 7 : (h < 11 ? 6.5 : 7.5);
  var lignes = [];
  String(texte||"").split("\n").forEach(function(par){
    pdfCouper(par, l - 4, taille, false).forEach(function(x){ lignes.push(x); });
  });
  if(!multiligne) lignes = lignes.slice(0, 1);
  var inter = taille * 1.15;
  var ops = ["/Tx BMC q 1 1 " + (l-2).toFixed(2) + " " + (h-2).toFixed(2) + " re W n BT /He " + taille + " Tf 0 g"];
  var y0 = multiligne ? (h - 2 - taille) : Math.max(2, (h - taille) / 2 + 1);
  lignes.forEach(function(ln, i){
    var y = y0 - i*inter;
    if(y < 0) return;
    var w = pdfLargeur(ln, taille, false), xx = 2;
    if(align === 1) xx = Math.max(2, (l - w) / 2);
    else if(align === 2) xx = Math.max(2, l - w - 2);
    ops.push("1 0 0 1 " + xx.toFixed(2) + " " + y.toFixed(2) + " Tm (" + pdfEchappe(ln) + ") Tj");
  });
  ops.push("ET");
  if(image){
    /* signature : dessinée à droite de la date, dans la hauteur du champ */
    var hi = h - 2, li = hi * image.l / image.h;
    if(li > l * 0.55){ li = l * 0.55; hi = li * image.h / image.l; }
    ops.push("q " + li.toFixed(2) + " 0 0 " + hi.toFixed(2) + " " + (l - li - 2).toFixed(2) + " 1 cm /ImS Do Q");
  }
  ops.push("Q EMC");
  return ops.join("\n");
}
/* Fabrique le PDF rempli. Renvoie un Uint8Array, ou null si le formulaire manque. */
function cerfaPDF(m, images){
  var base = cerfaBase(); if(!base) return null;
  images = images || {};
  var val = cerfaValeurs(m), objs = base.objs, champs = base.champs;
  var nouveaux = [], next = base.size;        /* objets ajoutés (apparences, images) */
  var modifies = {};                           /* n° -> texte d'objet réécrit */
  function ajoute(texte, binaire){ var n = next++; nouveaux.push({n:n, t:texte, b:binaire||null}); return n; }

  var imgObj = {};
  Object.keys(images).forEach(function(k){
    var im = images[k]; if(!im) return;
    var oct = b64Octets(im.b64);
    imgObj[k] = ajoute("<< /Type /XObject /Subtype /Image /Width " + im.l + " /Height " + im.h +
      " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + oct.length + " >>", oct);
  });

  Object.keys(val.textes).forEach(function(nom){
    var n = champs[nom]; if(!n) return;
    var o = objs[n], texte = val.textes[nom];
    var rect = (o.match(/\/Rect\s*\[([^\]]*)\]/)||[])[1];
    if(!rect) return;
    rect = rect.trim().split(/\s+/).map(parseFloat);
    var multi = /\/Ff\s+4096/.test(o), q = parseInt((o.match(/\/Q\s+(\d)/)||[])[1]||"0", 10);
    var imgCle = (nom === "Sign_Operateur_Date") ? "technicien" : (nom === "Sign_Detenteur_Date") ? "client" : null;
    var img = imgCle && images[imgCle] ? images[imgCle] : null;
    if(!texte && !img) return;
    var flux = cerfaApparence(rect, texte, multi, q, img);
    var res = "<< /Font << /He 25 0 R >>" + (img ? " /XObject << /ImS " + imgObj[imgCle] + " 0 R >>" : "") + " >>";
    var ap = ajoute("<< /Type /XObject /Subtype /Form /BBox [0 0 " + (rect[2]-rect[0]).toFixed(3) + " " + (rect[3]-rect[1]).toFixed(3) +
                    "] /Resources " + res + " /Length " + flux.length + " >>", pdfOctets(flux));
    var no = o.replace(/\/V\s*\([^)]*\)/, "/V (" + pdfValeur(texte||"") + ")")
              .replace(/\/AP\s*<<\s*\/N\s+\d+\s+0\s+R\s*>>/, "/AP << /N " + ap + " 0 R >>");
    if(no.indexOf("/V (") < 0) no = no.replace(/>>\s*$/, " /V (" + pdfValeur(texte||"") + ") >>");
    modifies[n] = no;
  });

  Object.keys(val.cases).forEach(function(nom){
    var n = champs[nom]; if(!n) return;
    var o = objs[n], etat = val.cases[nom];
    if(/\/Kids\s*\[/.test(o)){
      /* bouton radio : le parent porte /V, chaque enfant son /AS */
      var kids = (o.match(/\/Kids\s*\[([^\]]*)\]/)||[])[1].trim().split(/\s+0\s+R\s*/).filter(Boolean);
      modifies[n] = o.replace(/\/V\s*\/\w+/, "/V /" + etat);
      kids.forEach(function(k){
        var ko = objs[k]; if(!ko) return;
        var etats = (ko.match(/\/N\s*<<([^>]*)>>/)||[])[1] || "";
        var on = (etats.match(/\/(\w+)\s+\d+\s+0\s+R/)||[])[1];
        modifies[k] = ko.replace(/\/AS\s*\/\w+/, "/AS /" + (on === etat ? etat : "Off"));
      });
      return;
    }
    var etats = (o.match(/\/N\s*<<([^>]*)>>/)||[])[1] || "";
    var on = (etats.match(/\/(\w+)\s+\d+\s+0\s+R/)||[])[1] || "Yes";
    modifies[n] = o.replace(/\/AS\s*\/\w+/, "/AS /" + on).replace(/\/V\s*\/\w+/, "/V /" + on);
  });

  /* -- assemblage de la mise à jour incrémentale -- */
  var morceaux = [], pos = 0, offsets = {};
  function pousse(u8){ morceaux.push(u8); pos += u8.length; }
  pousse(pdfOctets(base.bin));
  pousse(pdfOctets("\n"));
  Object.keys(modifies).forEach(function(n){
    offsets[n] = pos;
    pousse(pdfOctets(n + " 0 obj\n" + modifies[n] + "\nendobj\n"));
  });
  nouveaux.forEach(function(x){
    offsets[x.n] = pos;
    pousse(pdfOctets(x.n + " 0 obj\n" + x.t + "\nstream\n"));
    pousse(x.b);
    pousse(pdfOctets("\nendstream\nendobj\n"));
  });
  var nums = Object.keys(offsets).map(Number).sort(function(a,b){ return a-b; });
  var debutXref = pos;
  var xref = "xref\n0 1\n0000000000 65535 f \n";
  /* sous-sections de numéros consécutifs */
  var i = 0;
  while(i < nums.length){
    var j = i; while(j+1 < nums.length && nums[j+1] === nums[j]+1) j++;
    xref += nums[i] + " " + (j-i+1) + "\n";
    for(var k=i;k<=j;k++) xref += ("0000000000" + offsets[nums[k]]).slice(-10) + " 00000 n \n";
    i = j+1;
  }
  xref += "trailer\n<< /Size " + next + " /Root " + base.root + " 0 R /Prev " + base.prev + " >>\nstartxref\n" + debutXref + "\n%%EOF\n";
  pousse(pdfOctets(xref));
  var total = morceaux.reduce(function(a,x){ return a+x.length; }, 0);
  var out = new Uint8Array(total), p = 0;
  morceaux.forEach(function(x){ out.set(x, p); p += x.length; });
  return out;
}
/* Version asynchrone : convertit d'abord les signatures en JPEG. */
function cerfaPDFAsync(m){
  if(typeof cerfaRequis !== "function" || !cerfaRequis(m)) return Promise.resolve(null);
  if(!cerfaBase()) return Promise.resolve(null);
  var conv = (typeof versJpeg === "function") ? versJpeg : function(){ return Promise.resolve(null); };
  return Promise.all([
    cfg.signature ? conv(cfg.signature) : Promise.resolve(null),
    V.signClient ? conv(V.signClient) : Promise.resolve(null)
  ]).then(function(im){
    return cerfaPDF(m, {technicien: im[0], client: im[1]});
  });
}
function nomCERFA(m){
  /* même forme que l'attestation : la date en tête, tirets conservés */
  return [txt(V.date) || slug(V.date), "CERFA_15497-04", slug(V.client||"client"), slug((techDe(m)||{}).court || m.tech)].join("_") + ".pdf";
}
