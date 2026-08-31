/* ============================================================
   Le même document, dessiné dans un PDF A4.
   Lit modeleDocument() : rien n'est ressaisi ici, donc l'écran,
   l'impression et le fichier disent forcément la même chose.
   ============================================================ */
var PDF_MARGE_G = 42, PDF_MARGE_D = 42, PDF_HAUT = 40, PDF_BAS = 52;

/* Un PDF n'avale directement que le JPEG : on repasse toute image
   par un canvas sur fond blanc (les signatures sont transparentes). */
function versJpeg(src, qualite){
  return new Promise(function(ok, ko){
    var im = new Image();
    im.onload = function(){
      var c = document.createElement("canvas");
      c.width = im.naturalWidth || im.width; c.height = im.naturalHeight || im.height;
      var x = c.getContext("2d");
      x.fillStyle = "#FFFFFF"; x.fillRect(0,0,c.width,c.height);
      x.drawImage(im, 0, 0);
      var d = c.toDataURL("image/jpeg", qualite || 0.92);
      ok({b64: d.split(",")[1], l: c.width, h: c.height});
    };
    im.onerror = function(){ ok(null); };
    im.src = src;
  });
}

function documentPDF(m, idx){
  var mo = modeleDocument(m, idx);
  return Promise.all([
    logoKare() ? versJpeg(logoKare(), 0.95) : Promise.resolve(null),
    mo.signatures.technicien.image ? versJpeg(mo.signatures.technicien.image) : Promise.resolve(null),
    (mo.signatures.client && mo.signatures.client.image) ? versJpeg(mo.signatures.client.image) : Promise.resolve(null)
  ]).then(function(im){
    return dessinerPDF(mo, {logo:im[0], signTech:im[1], signCli:im[2]});
  });
}

function dessinerPDF(mo, im){
  var p = new PdfDoc();
  var L = p.L - PDF_MARGE_G - PDF_MARGE_D;     /* largeur utile */
  var x0 = PDF_MARGE_G;
  var y = PDF_HAUT;
  var page = 1;

  function placeRestante(){ return p.H - PDF_BAS - y; }
  function saut(besoin){
    if(placeRestante() >= besoin) return;
    piedDePage(false);
    p.nouvellePage(); page++; y = PDF_HAUT;
  }
  /* Le rappel réglementaire (« à remettre sous 15 jours… ») ne se justifie
     qu'une fois, au bas de la dernière page. Ailleurs : identité et pagination. */
  function piedDePage(derniere){
    var yb = p.H - PDF_BAS + 16;
    p.trait(x0, yb - 8, x0 + L, yb - 8, 0.4, 0.8);
    var lignes = (derniere ? mo.pied : mo.pied.slice(-1));
    lignes.forEach(function(t, i){ p.texte(x0, yb + i*8, t, {taille:6, gris:0.45}); });
    p.texte(x0 + L - pdfLargeur("page "+page, 6, false), yb, "page "+page, {taille:6, gris:0.45});
  }

  /* --- en-tête --- */
  if(im.logo){
    var hl = 24, ll = hl * im.logo.l / im.logo.h;
    if(ll > 150){ ll = 150; hl = ll * im.logo.h / im.logo.l; }
    p.image(im.logo, x0, y, ll, hl);
  }
  var xd = x0 + L;
  function droite(t, o){ p.texte(xd - pdfLargeur(t, o.taille, o.gras), y + (o.dy||0), t, o); }
  droite(KARE_ENTETE.slogan, {taille:8, gras:true, dy:2});
  droite(KARE_ENTETE.adresse+" · "+KARE_ENTETE.tel+" · "+KARE_ENTETE.mail, {taille:6.5, gris:0.35, dy:11});
  droite(KARE_ENTETE.siret+" · "+KARE_ENTETE.tva, {taille:6.5, gris:0.35, dy:19});
  droite(KARE_ENTETE.qualif, {taille:6.5, gris:0.35, dy:27});
  y += 38;
  p.trait(x0, y, x0 + L, y, 0.8, 0.5);
  y += 18;

  /* --- titre --- */
  p.texte(x0, y, mo.titre, {taille:14, gras:true});
  y += 14;
  pdfCouper(mo.sousTitre, L, 7, false).forEach(function(l){
    p.texte(x0, y, l, {taille:7, gris:0.35}); y += 9;
  });
  y += 8;

  /* --- sections --- */
  var LARG_CLE = 148, XV = x0 + LARG_CLE + 8, LARG_VAL = L - LARG_CLE - 8;

  function titreSection(t){
    saut(34);
    p.pave(x0, y - 8, L, 13, 0.93);
    p.texte(x0 + 4, y, t, {taille:8, gras:true});
    y += 13;
  }
  function ligne(k, v, alerte){
    var lk = pdfCouper(k, LARG_CLE - 6, 7.5, false);
    var lv = pdfCouper(v, LARG_VAL, 7.5, !!alerte);
    var h = Math.max(lk.length, lv.length) * 9.5 + 2;
    saut(h + 4);
    lk.forEach(function(l,i){ p.texte(x0 + 2, y + i*9.5, l, {taille:7.5, gris:0.4}); });
    lv.forEach(function(l,i){ p.texte(XV, y + i*9.5, l, {taille:7.5, gras:!!alerte}); });
    y += h;
  }
  function puce(t, grave){
    var ls = pdfCouper((grave?"! ":"") + t, L - 12, 7.5, !!grave);
    saut(ls.length*9.5 + 3);
    ls.forEach(function(l,i){
      if(i===0) p.texte(x0 + 2, y, "•", {taille:7.5});
      p.texte(x0 + 12, y + i*9.5, l, {taille:7.5, gras:!!grave});
    });
    y += ls.length*9.5 + 1;
  }
  function ligneTableau(lib, etat, grave){
    var LE = 96, LL = L - LE - 8;
    var ls = pdfCouper(lib, LL, 7.5, false);
    var h = ls.length * 9.5 + 5;
    saut(h + 4);
    ls.forEach(function(l,i){ p.texte(x0 + 2, y + i*9.5, l, {taille:7.5}); });
    var mot = etat==="ok" ? "contrôlé" : etat==="non" ? "NON CONTRÔLÉ" : etat==="np" ? "NP" : "—";
    p.texte(x0 + L - pdfLargeur(mot, 7.5, grave), y, mot, {taille:7.5, gras:!!grave});
    y += h;
    p.trait(x0, y - 3.5, x0 + L, y - 3.5, 0.3, 0.9);
  }

  mo.sections.forEach(function(sec){
    titreSection(sec.titre);
    if(sec.legende){ p.texte(x0 + 2, y, sec.legende, {taille:6.5, gris:0.45}); y += 11; }
    (sec.puces||[]).forEach(function(x){ puce(x.t, x.grave); });
    if(sec.puces && sec.puces.length) y += 3;
    if(sec.tableau) sec.tableau.forEach(function(r){ ligneTableau(r.lib, r.etat, r.grave); });
    (sec.lignes||[]).forEach(function(l){ ligne(l.k, l.v + (l.verdict ? "  — "+l.verdict : ""), l.alerte); });
    if(sec.sousTitre){
      saut(20); y += 4;
      p.texte(x0 + 2, y, sec.sousTitre, {taille:7.5, gras:true}); y += 11;
      (sec.sousLignes||[]).forEach(function(l){ ligne(l.k, l.v); });
    }
    if(sec.sinon && !(sec.lignes||[]).length && !(sec.puces||[]).length && !sec.tableau){
      ligne("", sec.sinon);
    }
    if(sec.mention){
      y += 3;
      pdfCouper(sec.mention, L - 4, 6.5, false).forEach(function(l){
        saut(12); p.texte(x0 + 2, y, l, {taille:6.5, gris:0.4}); y += 8;
      });
    }
    y += 9;
  });

  /* --- réserves --- */
  var lignesRes = pdfCouper("Réserves. " + mo.reserves, L - 12, 6.8, false);
  saut(lignesRes.length * 8.4 + 16);
  p.pave(x0, y - 6, L, lignesRes.length*8.4 + 12, 0.96);
  p.texte(x0 + 5, y + 2, "Réserves.", {taille:6.8, gras:true});
  lignesRes.forEach(function(l, i){
    var t = (i===0) ? l.slice("Réserves. ".length) : l;
    p.texte(x0 + 5 + (i===0 ? pdfLargeur("Réserves. ", 6.8, true) : 0), y + 2 + i*8.4, t, {taille:6.8, gris:0.15});
  });
  y += lignesRes.length*8.4 + 18;

  /* --- signatures --- */
  saut(96);
  var lc = (L - 20) / 2;
  function bloc(xg, s, image){
    if(!s) return;
    p.texte(xg, y, s.nom, {taille:7.5, gras:true});
    var yb = y + 12;
    p.trait(xg, yb + 40, xg + lc, yb + 40, 0.5, 0.6);
    if(image){
      var h = 36, l = h * image.l / image.h;
      if(l > lc - 8){ l = lc - 8; h = l * image.h / image.l; }
      p.image(image, xg + 2, yb + 40 - h, l, h);
    }
    if(s.absent) p.texte(xg, yb + 20, s.absent, {taille:7.5, gras:true});
    var sous = s.lieuDate || s.legende;
    if(sous) p.texte(xg, yb + 50, sous, {taille:6.5, gris:0.4});
  }
  bloc(x0, mo.signatures.technicien, im.signTech);
  if(mo.signatures.client) bloc(x0 + lc + 20, mo.signatures.client, im.signCli);
  y += 70;

  piedDePage(true);
  return p.octets();
}

/* Nom de fichier : ce qui sera déposé dans le dossier client. */
function nomPDF(m, idx){
  var mo = modeleDocument(m, idx);
  var quoi = mo.reglementaire ? "Attestation" : "Compte rendu";
  return [txt(V.date)||"sans-date", slug(quoi), slug(techDe(m).label), slug(V.client||"client")].join("_") + ".pdf";
}
function pdfBase64(u8){
  var s = "", pas = 0x8000;
  for(var i=0; i<u8.length; i+=pas) s += String.fromCharCode.apply(null, u8.subarray(i, i+pas));
  return btoa(s);
}
