/* ============================================================
   Aide au relevé sur le circuit frigorifique.
   Rémi en fait peu, et c'est au moment de brancher qu'il doute :
   quelle vanne, quelle pression, où poser la sonde. Cette aide dit
   d'abord le geste, puis la lecture. Elle suit le mode d'essai.
   Repères de terrain : la notice du fabricant prime toujours.
   ============================================================ */
function aideReleveFrigo(m){
  var mode = (typeof modeDe === "function") ? modeDe(m) : "chaud";
  var froid = mode === "froid";
  var tech = m.tech || "";
  var pac = tech === "pac_air_eau", cet = tech === "cet";
  var fluide = txt((m.ident||{}).fluide);
  var d = el("div","aide-releve");

  function h(t){ d.appendChild(el("h4",null,t)); }
  function ul(items){
    var u = el("ul");
    items.forEach(function(x){
      var li = el("li");
      if(typeof x === "string") li.textContent = x;
      else { if(x.att) li.className = "att"; li.textContent = x.t; }
      u.appendChild(li);
    });
    d.appendChild(u);
  }

  h("Avant de brancher");
  ul([
    "Machine en marche depuis 10 à 15 min, régime stabilisé — sur un inverter, pousser la consigne ou utiliser le mode test du fabricant pour être proche de la pleine puissance.",
    "Mode d'essai : " + (froid ? "FROID" : "CHAUD") + ". Tout ce qui suit en dépend — change-le en haut de la carte si ce n'est pas le bon.",
    {t:"Brancher, c'est ouvrir le circuit : la fiche d'intervention fluides devient due. Coche « Manomètre branché » dans le volet Fluide frigorigène.", att:true}
  ]);

  if(cet){
    h("Chauffe-eau thermodynamique");
    ul([
      "Circuit scellé, sans vanne de service : on ne branche rien, on ne perce rien.",
      "Seules les températures d'air (aspiration et soufflage) et l'intensité disent si la machine fait son travail.",
      "Écart d'air usuel 4 à 8 K en régime établi. Plus faible : évaporateur ou filtre encrassé, ventilateur, ou ballon déjà chaud (compresseur à l'arrêt)."
    ]);
    return d;
  }

  h("Manomètre — mode " + (froid ? "froid" : "chaud"));
  if(froid){
    ul([
      "Vanne de service du GROS tube (gaz) = aspiration → c'est la BP.",
      "Vanne de service du PETIT tube (liquide), quand elle a une prise : côté haute pression → HP, à quelques dixièmes de bar près.",
      "Pas de prise sur le petit tube : lire la HP sur la prise interne côté refoulement dans l'unité extérieure, si le fabricant en a mis une. Sinon, HP « sans objet »."
    ]);
  } else {
    ul([
      "Le GROS tube (gaz) transporte le gaz chaud vers l'échangeur : sa vanne de service donne la HP.",
      "Le PETIT tube (liquide) est lui aussi à la haute pression, avant détente : pas de BP aux vannes en mode chaud.",
      "La BP ne se lit que sur une prise interne de l'unité extérieure, sur l'aspiration du compresseur (bouteille anti-coup de liquide). Chercher le raccord Schrader dans l'UE.",
      {t:"Pas de prise interne : ne rien percer, BP « sans objet ». Un circuit scellé le reste.", att:true}
    ]);
    if(pac) ul([
      "PAC monobloc : aucune vanne de service, tout le circuit est dans l'unité extérieure. Sans prise interne, la surchauffe n'est pas relevable — c'est prévu, le point de contrôle dit « le cas échéant »."
    ]);
  }

  h("Sondes de contact — où les poser");
  ul([
    "Surchauffe : sur le tube d'ASPIRATION, à 10-20 cm de l'entrée du compresseur, dans l'unité extérieure." +
      (froid ? " À défaut : sur le gros tube, à la vanne de service." : " À défaut, en chaud, il n'y a pas d'équivalent aux vannes : sans accès au compresseur, ne pas inventer la valeur."),
    "Sous-refroidissement : sur la ligne LIQUIDE en sortie de condenseur." +
      (froid ? " En froid, le condenseur est l'unité extérieure : petit tube à la vanne de service."
             : (pac ? " En chaud, le condenseur est l'échangeur à plaques : petit tube en sortie d'échangeur. À défaut, petit tube à l'unité extérieure, avant le détendeur."
                    : " En chaud, le condenseur est l'unité intérieure : petit tube en sortie d'unité intérieure. À défaut, petit tube à l'unité extérieure, avant le détendeur.")),
    "Contrôle de cohérence : sonde sur le REFOULEMENT à 10 cm du compresseur. Usuel 60 à 90 °C. Au-delà de 110 °C : arrêter et chercher (manque de fluide, détendeur, condenseur encrassé).",
    "Sonde serrée sur tube propre, isolée de l'air par une mousse, jamais sur un tube au soleil. Attendre 3 à 5 min qu'elle se stabilise."
  ]);

  h("Lecture");
  var sh = froid ? "5 à 8 K" : "5 à 10 K";
  ul([
    "L'appli convertit la pression en température de saturation pour le fluide renseigné" + (fluide ? " (" + fluide + ")" : "") + " et calcule surchauffe et sous-refroidissement dès que pression et sonde sont saisies.",
    "Surchauffe = T° aspiration − T° d'évaporation. Usuel " + sh + ".",
    "Sous-refroidissement = T° de condensation − T° liquide. Usuel 3 à 8 K.",
    "Surchauffe haute + sous-refroidissement bas → manque de fluide. Surchauffe basse + sous-refroidissement haut → excès de charge. Les deux hauts → détendeur ou filtre déshydrateur bouché. HP haute + sous-refroidissement haut → condenseur encrassé ou ventilateur.",
    "Pas de sonde mais un manifold électronique : saisis la valeur lue dans « Surchauffe lue » / « Sous-refroidissement lu », elle remplace le calcul."
  ]);
  if(!fluide) ul([{t:"Fluide non renseigné dans l'identification : sans lui, aucune conversion pression → température.", att:true}]);
  else if(typeof fluideConnu === "function" && !fluideConnu(fluide)) ul([{t:"Pas de table pour « " + fluide + " » : les températures de saturation ne seront pas calculées.", att:true}]);

  return d;
}
