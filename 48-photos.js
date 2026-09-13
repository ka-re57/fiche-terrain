/* ============ photos ============
   Prises sur place, réduites tout de suite, gardées avec la fiche et
   déposées dans le dossier client sur Drive — jamais sur le document
   remis au client. Chaque photo part dans son propre envoi : une fiche
   plus huit photos dans un seul appel ferait plusieurs méga-octets. */
var PHOTO_MAX = 1280, PHOTO_QUAL = 0.62, PHOTO_PAR_MACHINE = 8;
var ETIQUETTES = ["Plaque signalétique","Ticket d'analyse","Avant","Après","Anomalie","Autre"];

function reduireImage(fichier, fn){
  var lecteur = new FileReader();
  lecteur.onload = function(){
    var im = new Image();
    im.onload = function(){
      var ech = Math.min(1, PHOTO_MAX/Math.max(im.width, im.height));
      var c = document.createElement("canvas");
      c.width = Math.round(im.width*ech); c.height = Math.round(im.height*ech);
      var x = c.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0,0,c.width,c.height);
      x.drawImage(im, 0,0, c.width, c.height);
      fn(c.toDataURL("image/jpeg", PHOTO_QUAL), c.width, c.height);
    };
    im.onerror = function(){ fn(null); };
    im.src = lecteur.result;
  };
  lecteur.onerror = function(){ fn(null); };
  lecteur.readAsDataURL(fichier);
}

function ajouterPhoto(m, fichier, etiquette, apres){
  m.photos = m.photos || [];
  if(m.photos.length >= PHOTO_PAR_MACHINE){ toast("8 photos maximum par machine","att"); return; }
  reduireImage(fichier, function(data){
    if(!data){ toast("Image illisible","mal"); return; }
    m.photos.push({id:idUnique("ph"), et:etiquette||"Autre", data:data, t:Date.now()});
    if(!sauverTout()){
      m.photos.pop();
      toast("Mémoire pleine — envoie la visite en cours avant d'ajouter des photos","mal");
    }
    if(apres) apres();
  });
}

function carteMachinePhotos(root, m, connue){
  var c = el("div","carte");
  var h = el("h2",null,"Photos");
  m.photos = m.photos || [];
  h.appendChild(el("span","cpt", m.photos.length+"/"+PHOTO_PAR_MACHINE));
  c.appendChild(h);

  if(connue && !m.photos.length && !m.photosOuvert){
    var ouvre = el("button","btn","+ Photo"); ouvre.type="button"; ouvre.style.width="100%";
    ouvre.onclick = function(){ m.photosOuvert = 1; rendre(); };
    c.appendChild(ouvre);
    root.appendChild(c); return;
  }
  if(!connue && !m.photos.length){
    c.appendChild(el("div","alerte att","Matériel inconnu du parc. Photographie la plaque signalétique : j'en tirerai les caractéristiques."));
  }
  var ch = el("div","chips petit"); ch.style.marginBottom="8px";
  ETIQUETTES.forEach(function(et){
    var lab = el("label","chip mini"); lab.textContent = et;
    var inp = el("input"); inp.type="file"; inp.accept="image/*"; inp.capture="environment";
    inp.style.display="none";
    inp.addEventListener("change", function(){
      if(inp.files && inp.files[0]) ajouterPhoto(m, inp.files[0], et, rendre);
      inp.value = "";
    });
    lab.appendChild(inp);
    ch.appendChild(lab);
  });
  c.appendChild(ch);

  if(m.photos.length){
    var g = el("div","vignettes");
    m.photos.forEach(function(ph, i){
      var b = el("div","vign");
      var im = el("img"); im.src = ph.data; im.alt = ph.et; b.appendChild(im);
      b.appendChild(el("span","et", ph.et));
      var x = el("button","oter","×"); x.type="button"; x.setAttribute("aria-label","Retirer la photo");
      x.onclick = function(){ m.photos.splice(i,1); sauverTout(); rendre(); };
      b.appendChild(x);
      g.appendChild(b);
    });
    c.appendChild(g);
  } else {
    c.appendChild(el("div","mini","Touche une étiquette pour déclencher l'appareil photo. Les photos vont dans le dossier client, pas sur l'attestation."));
  }
  root.appendChild(c);
}

/* Nom du fichier déposé sur Drive : on doit retrouver la photo six mois plus tard. */
function nomPhoto(m, ph, i){
  return [txt(V.date)||"sans-date", slug(ph.et||"photo"), slug(techDe(m) ? techDe(m).label : m.tech),
          slug(V.client||"client"), String(i+1)].join("_") + ".jpg";
}
function payloadPhoto(m, ph, i, idx){
  var d = String(ph.data||"");
  var virgule = d.indexOf(",");
  return {
    secret: cfg.secret || "",
    type: "photo",
    visite_id: V.id,
    fiche_id: m.mid,
    machine_num: idx+1,
    date: V.date,
    technologie_label: techDe(m) ? techDe(m).label : m.tech,
    client: {nom: propre(V.client), adresse: propre(V.adresse)},
    notion_page_id: m.notion || null,
    etiquette: ph.et || "Autre",
    photo_nom: nomPhoto(m, ph, i),
    photo_base64: virgule > 0 ? d.slice(virgule+1) : null,
    application: "fiche-terrain KA-RÉ v"+VERSION
  };
}
