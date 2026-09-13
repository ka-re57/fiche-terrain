/* ============================================================
   Écriture PDF, sans bibliothèque extérieure.
   Polices standard PDF (Helvetica) en encodage WinAnsi : tous les
   accents français passent. Images en JPEG (DCTDecode), converties
   à la volée depuis le PNG par un canvas — c'est le seul format
   qu'un PDF sait avaler tel quel sans décodeur.
   ============================================================ */

/* -- largeurs Helvetica (AFM Adobe), en millièmes de cadratin -- */
var W_REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,
  556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,
  667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,
  278,278,278,469,556,333,
  556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,
  334,260,334,584];
var W_GRAS = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,
  556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,
  722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,
  333,278,333,584,556,333,
  556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,
  389,280,389,584];

/* Un caractère accenté a la largeur de sa lettre de base. */
var BASE_ACCENT = {
  "à":"a","â":"a","ä":"a","á":"a","ã":"a","å":"a","é":"e","è":"e","ê":"e","ë":"e",
  "î":"i","ï":"i","í":"i","ì":"i","ô":"o","ö":"o","ó":"o","ò":"o","õ":"o",
  "ù":"u","û":"u","ü":"u","ú":"u","ç":"c","ñ":"n","ÿ":"y",
  "À":"A","Â":"A","Ä":"A","Á":"A","É":"E","È":"E","Ê":"E","Ë":"E",
  "Î":"I","Ï":"I","Ô":"O","Ö":"O","Ù":"U","Û":"U","Ü":"U","Ç":"C","Ñ":"N"
};
/* Ce que WinAnsi ne sait pas écrire, on le remplace par un équivalent lisible. */
var REMPLACE = {
  "✓":"oui","✗":"NON","⚠":"!","→":"->","≥":">=","≤":"<=","…":"...",
  "œ":"oe","Œ":"OE","≈":"~","²":"2","³":"3","–":"-","‑":"-"," ":" "," ":" "," ":" "
};
var WINANSI = {"€":128,"‚":130,"ƒ":131,"„":132,"…":133,"†":134,"‡":135,"ˆ":136,"‰":137,
  "Š":138,"‹":139,"Œ":140,"Ž":142,"‘":145,"’":146,"“":147,"”":148,"•":149,"–":150,"—":151,
  "˜":152,"™":153,"š":154,"›":155,"œ":156,"ž":158,"Ÿ":159};

function pdfNettoie(s){
  s = String(s===null||s===undefined ? "" : s);
  var out = "";
  for(var i=0;i<s.length;i++){
    var c = s[i];
    if(REMPLACE[c] !== undefined && WINANSI[c] === undefined){ out += REMPLACE[c]; continue; }
    if(WINANSI[c] !== undefined){ out += String.fromCharCode(WINANSI[c]); continue; }
    var code = c.charCodeAt(0);
    if(code === 10 || code === 13){ out += " "; continue; }
    if(code < 32){ continue; }
    if(code > 255 && REMPLACE[c] !== undefined){ out += REMPLACE[c]; continue; }
    if(code > 255){ out += "?"; continue; }
    out += c;
  }
  return out;
}
function pdfLargeur(s, taille, gras){
  var t = gras ? W_GRAS : W_REG, tot = 0;
  s = pdfNettoie(s);
  for(var i=0;i<s.length;i++){
    var c = s[i];
    if(BASE_ACCENT[c]) c = BASE_ACCENT[c];
    var code = WINANSI[c] !== undefined ? WINANSI[c] : c.charCodeAt(0);
    var w;
    if(code >= 32 && code <= 126) w = t[code-32];
    else if(code === 149) w = 350;          /* puce */
    else if(code === 151) w = 1000;         /* tiret cadratin */
    else if(code === 150) w = 556;          /* tiret demi-cadratin */
    else if(code === 133) w = 1000;         /* points de suspension */
    else if(code === 176) w = 400;          /* degré */
    else if(code === 183) w = 278;          /* point médian */
    else if(code === 146 || code === 145) w = gras ? 238 : 191;
    else w = 556;
    tot += w;
  }
  return tot * taille / 1000;
}
/* Coupe un texte en lignes qui tiennent dans la largeur donnée. */
function pdfCouper(texte, largeur, taille, gras){
  var mots = pdfNettoie(texte).split(/\s+/).filter(function(x){return x!=="";});
  var lignes = [], cur = "";
  mots.forEach(function(mot){
    var essai = cur ? cur+" "+mot : mot;
    if(pdfLargeur(essai, taille, gras) <= largeur){ cur = essai; return; }
    if(cur){ lignes.push(cur); cur = mot; return; }
    /* mot plus long que la ligne : on le casse */
    var bout = "";
    for(var i=0;i<mot.length;i++){
      if(pdfLargeur(bout+mot[i], taille, gras) > largeur){ lignes.push(bout); bout = mot[i]; }
      else bout += mot[i];
    }
    cur = bout;
  });
  if(cur) lignes.push(cur);
  return lignes.length ? lignes : [""];
}

/* -- octets -- */
function pdfOctets(s){
  var a = new Uint8Array(s.length);
  for(var i=0;i<s.length;i++) a[i] = s.charCodeAt(i) & 0xFF;
  return a;
}
function pdfChaine(s){
  return "(" + pdfNettoie(s).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)") + ")";
}
function b64Octets(b64){
  var bin = atob(b64), a = new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) a[i] = bin.charCodeAt(i);
  return a;
}

/* -- le document -- */
function PdfDoc(){
  this.L = 595.28; this.H = 841.89;           /* A4 en points */
  this.pages = []; this.images = [];
  this.nouvellePage();
}
PdfDoc.prototype.nouvellePage = function(){
  this.flux = []; this.pages.push(this.flux); return this;
};
PdfDoc.prototype.texte = function(x, y, s, o){
  o = o || {};
  var taille = o.taille || 9, gras = !!o.gras, g = o.gris;
  s = pdfNettoie(s); if(!s) return;
  var f = gras ? "/F2" : "/F1";
  var couleur = (g===undefined) ? "0 g" : (g+" "+g+" "+g+" rg");
  this.flux.push("BT "+couleur+" "+f+" "+taille+" Tf 1 0 0 1 "+x.toFixed(2)+" "+(this.H-y).toFixed(2)+" Tm "+pdfChaine(s)+" Tj ET");
};
PdfDoc.prototype.trait = function(x1, y1, x2, y2, ep, g){
  if(g===undefined) g = 0.75;
  this.flux.push((ep||0.5).toFixed(2)+" w "+g+" "+g+" "+g+" RG "+
    x1.toFixed(2)+" "+(this.H-y1).toFixed(2)+" m "+x2.toFixed(2)+" "+(this.H-y2).toFixed(2)+" l S");
};
PdfDoc.prototype.pave = function(x, y, l, h, g){
  this.flux.push(g+" "+g+" "+g+" rg "+x.toFixed(2)+" "+(this.H-y-h).toFixed(2)+" "+l.toFixed(2)+" "+h.toFixed(2)+" re f");
};
/* jpeg : {b64, l, h} — renvoie le nom de la ressource */
PdfDoc.prototype.image = function(jpeg, x, y, l, h){
  var nom = "/Im" + (this.images.length + 1);
  this.images.push(jpeg);
  this.flux.push("q "+l.toFixed(2)+" 0 0 "+h.toFixed(2)+" "+x.toFixed(2)+" "+(this.H-y-h).toFixed(2)+" cm "+nom+" Do Q");
  return nom;
};
PdfDoc.prototype.octets = function(){
  var objets = [], self = this;
  function ajoute(s){ objets.push(s); return objets.length; }   /* renvoie le numéro d'objet */

  var nCatalogue = ajoute(null), nPages = ajoute(null);
  var nF1 = ajoute("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  var nF2 = ajoute("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  var nImages = this.images.map(function(im, i){
    return ajoute({flux:"<< /Type /XObject /Subtype /Image /Width "+im.l+" /Height "+im.h+
      " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+b64Octets(im.b64).length+" >>",
      binaire: b64Octets(im.b64)});
  });
  var ressImages = nImages.map(function(n, i){ return "/Im"+(i+1)+" "+n+" 0 R"; }).join(" ");

  var nPage = [], nFlux = [];
  this.pages.forEach(function(flux){
    var contenu = flux.join("\n");
    var nc = ajoute({flux:"<< /Length "+contenu.length+" >>", texte: contenu});
    nFlux.push(nc);
    nPage.push(ajoute(null));
  });
  this.pages.forEach(function(_, i){
    objets[nPage[i]-1] = "<< /Type /Page /Parent "+nPages+" 0 R /MediaBox [0 0 "+
      self.L.toFixed(2)+" "+self.H.toFixed(2)+"] /Resources << /Font << /F1 "+nF1+" 0 R /F2 "+nF2+
      " 0 R >> /XObject << "+ressImages+" >> >> /Contents "+nFlux[i]+" 0 R >>";
  });
  objets[nPages-1] = "<< /Type /Pages /Count "+nPage.length+" /Kids ["+
    nPage.map(function(n){return n+" 0 R";}).join(" ")+"] >>";
  objets[nCatalogue-1] = "<< /Type /Catalog /Pages "+nPages+" 0 R >>";

  var morceaux = [], pos = 0, decalages = [];
  function pousse(u8){ morceaux.push(u8); pos += u8.length; }
  pousse(pdfOctets("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"));
  objets.forEach(function(o, i){
    decalages[i] = pos;
    pousse(pdfOctets((i+1)+" 0 obj\n"));
    if(typeof o === "string"){ pousse(pdfOctets(o+"\nendobj\n")); return; }
    pousse(pdfOctets(o.flux+"\nstream\n"));
    pousse(o.binaire ? o.binaire : pdfOctets(o.texte));
    pousse(pdfOctets("\nendstream\nendobj\n"));
  });
  var debutXref = pos;
  var xref = "xref\n0 "+(objets.length+1)+"\n0000000000 65535 f \n";
  decalages.forEach(function(d){ xref += ("0000000000"+d).slice(-10)+" 00000 n \n"; });
  xref += "trailer\n<< /Size "+(objets.length+1)+" /Root "+nCatalogue+" 0 R >>\nstartxref\n"+debutXref+"\n%%EOF\n";
  pousse(pdfOctets(xref));

  var total = morceaux.reduce(function(a,x){return a+x.length;},0);
  var out = new Uint8Array(total), k = 0;
  morceaux.forEach(function(x){ out.set(x, k); k += x.length; });
  return out;
};
