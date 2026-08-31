/* Rappels courants pour la prochaine visite — un appui vaut mieux qu'une phrase tapée. */
var RAPPELS = ["Prévoir plus de temps","Matériel à emporter","Pièce à commander",
               "Devis à faire","Accès difficile","Prévenir le client avant"];

/* Mesures mises en avant sur l'écran machine : celles qu'on relève à chaque
   visite. Les autres restent accessibles, repliées sous « Autres mesures ».
   Une technologie absente de cette table affiche tout, à plat. */
var ESSENTIELLES = {
  chaudiere_gaz: ["co_amb","co_fum","tfum","co2","o2","rdt_mes","pcirc","pvase","emboue","isol","dimension","tirage"],
  chaudiere_fioul:["co_amb","co_fum","tfum","co2","o2","indice","rdt_mes","pcirc","pvase","p_pulve","emboue","isol"],
  pac_air_eau:   ["t_ext","t_dep","t_ret","tstat","tdyn","intens","bp","hp","pcirc","pvase","emboue","isol"],
  clim_air_air:  ["text","mode","ue_rep","ue_souf","tstat","tdyn","intens","voyant","etanch"],
  adoucisseur:   ["th_brut","th_adouci","pression","sel","index","regen_ok","regen_fin"],
  vmc_df:        ["debit_ext","debit_souf","equilibrage","t_ext","t_souf","t_rep","t_rej","filtres_etat","filtres_ref","siphon"],
  cet:           ["consigne","antilegio","t_puisage","groupe_secu","anode_etat","appoint"]
};
/* Mesures conservées au catalogue mais jamais proposées à la saisie. */
var MASQUEES = {};

/* ============================================================
   CATALOGUE DES TECHNOLOGIES — KA-RÉ
   Chaque technologie décrit : son cadre réglementaire, ses champs
   d'identification, ses points de contrôle par type d'intervention,
   ses mesures avec seuils, ses conseils obligatoires.
   Sources et réserves : voir la page "Sources" de l'application.
   ============================================================ */
var TECHNOS = {};

/* ---------- CLIMATISATION AIR/AIR ---------- */
TECHNOS.clim_air_air = {
  np: [
    {si:{voyant:["absent"]},
     points:["Verification du voyant de fluide frigorigene"],
     pourquoi:"pas de voyant sur ce circuit"}
  ],
  label: "Climatisation air/air",
  court: "Clim air/air",
  icone: "❄",
  famille: "thermo",
  regl: {
    obligatoire: true,
    pmin: 4, pmax: 70,
    plage: "4 à 70 kW (puissance la plus élevée entre chaud et froid)",
    cadre: "Décret n° 2020-912 du 28 juillet 2020 et arrêté du 24 juillet 2020, modifié par l'arrêté du 21 novembre 2022. Code de l'environnement, art. R224-44 et suivants.",
    periodicite: "Tous les 2 ans",
    delai: "15 jours",
    conserv: "Copie conservée 2 ans par l'entreprise",
    doc: "Attestation d'entretien",
    alerte: "Sous 4 kW, l'entretien reste utile et facturable mais N'EST PAS réglementaire : le document devient un compte rendu d'entretien contractuel."
  },
  ident: [
    {k:"marque", l:"Marque et modèle (unité extérieure)"},
    {k:"serie", l:"N° de série"},
    {k:"puiss", l:"Puissance nominale", u:"kW", type:"num", aide:"la plus élevée entre chaud et froid"},
    {k:"nbui", l:"Nombre d'unités intérieures", type:"num", opt:true},
    {k:"fluide", l:"Fluide frigorigène", type:"liste", opts:["R32","R410A","R290","R454B","R407C","autre"]},
    {k:"charge", l:"Charge de fluide", u:"kg", type:"num", opt:true},
    {k:"mes", l:"Date de mise en service", type:"date"},
    {k:"dernier", l:"Date du dernier entretien connu", type:"date"},
    {k:"local", l:"Local desservi", opt:true}
  ],
  ctrl: {
    entretien: [
      "Vérification générale du système thermodynamique et de son bon fonctionnement",
      "Relevé des températures aux unités intérieures et à l'unité extérieure",
      "Vérification de l'inversion de cycle (lorsque l'installation le permet)",
      "Vérification de l'enclenchement des appoints",
      "Mesure des tensions statique et dynamique",
      "Vérification et nettoyage de l'échangeur de l'unité extérieure",
      "Nettoyage et décrassage de l'unité intérieure et de ses filtres",
      "Désinfection de l'unité intérieure et du bac à condensats",
      "Vérification de l'écoulement des condensats et de la pompe de relevage",
      "État des gaines accessibles et fonctionnement du ventilateur (systèmes gainables)",
      "Contrôle d'étanchéité du circuit de fluide frigorigène (sauf équipements relevant du règlement UE n° 517/2014)",
      "Vérification du voyant de fluide frigorigène (lorsqu'il est présent)",
      "Relevé des pressions à l'entrée et à la sortie du compresseur",
      "Présence d'un système de commande manuelle ou de régulation automatique de la température, par pièce ou par zone",
      "Vérification du fonctionnement des sondes de température",
      "Programmation horaire cohérente avec l'usage des locaux, selon les modes disponibles",
      "Serrage et état des connexions électriques",
      "État du calorifuge et des supports de liaisons frigorifiques"
    ],
    mes: [
      "Contrôle de l'implantation de l'unité extérieure : dégagements, support antivibratile, évacuation des condensats",
      "Contrôle du raccordement électrique : section, protection différentielle, calibre, mise à la terre",
      "Tirage au vide et contrôle d'étanchéité des liaisons frigorifiques réalisées sur site",
      "Complément de charge selon la longueur de liaison (g/m de la notice constructeur)",
      "Contrôle du sens de rotation et du bon fonctionnement des ventilateurs",
      "Essai du dégivrage et de l'inversion de cycle",
      "Réglage des consignes, de la programmation et des modes disponibles",
      "Relevé complet des mesures de mise en service, à archiver comme point zéro",
      "Fiche d'intervention fluides frigorigènes (CERFA 15497*04) si manipulation de fluide",
      "Remise de la notice, formation de l'utilisateur, démarrage de la garantie"
    ],
    dep: [
      "Relevé du symptôme, de l'historique et du code défaut affiché",
      "Contrôle de l'alimentation électrique et des protections",
      "Contrôle de l'encrassement des échangeurs et des filtres",
      "Contrôle du circuit frigorifique : pressions, surchauffe, sous-refroidissement",
      "Recherche de fuite (détecteur électronique, bulleur, traceur)",
      "Contrôle des sondes de température et de leur valeur",
      "Contrôle de l'écoulement des condensats et de la pompe de relevage",
      "Fiche d'intervention fluides frigorigènes si manipulation de fluide",
      "Relevé des mesures avant et après intervention"
    ]
  },
  mes: [
    {k:"text", l:"Température extérieure", u:"°C", type:"num"},
    {k:"mode", l:"Mode d'essai", type:"liste", opts:["froid","chaud"]},
    {k:"ue_rep", l:"Unité extérieure — reprise", u:"°C", type:"num"},
    {k:"ue_souf", l:"Unité extérieure — soufflage", u:"°C", type:"num"},
    {k:"bp", l:"Pression BP (aspiration)", u:"bar", type:"num"},
    {k:"hp", l:"Pression HP (refoulement)", u:"bar", type:"num"},
    {k:"sh", l:"Surchauffe", u:"K", type:"num", ref:{min:5, max:8}, nature:"professionnel", aide:"5 à 8 K en froid, 5 à 10 K en chaud"},
    {k:"sr", l:"Sous-refroidissement", u:"K", type:"num", ref:{min:3, max:8}, nature:"professionnel"},
    {k:"tstat", l:"Tension statique", u:"V", type:"num", min:207, max:253, nature:"réglementaire", aide:"230 V ±10 % — mesure exigée par l'annexe 1"},
    {k:"tdyn", l:"Tension dynamique", u:"V", type:"num", min:207, max:253, nature:"réglementaire", aide:"une chute de plus de 5 % révèle une section de câble insuffisante"},
    {k:"intens", l:"Intensité absorbée", u:"A", type:"num", nature:"professionnel", aide:"comparer à l'intensité de plaque"},
    {k:"voyant", l:"Voyant de fluide frigorigène", type:"liste", opts:["absent","clair","bullage"]},
    {k:"etanch", l:"Contrôle d'étanchéité", type:"liste", opts:["réalisé, aucune fuite","fuite localisée","non réalisé"]}
  ],
  sousMachines: {
    label: "Unités intérieures",
    singulier: "unité",
    champs: [
      {k:"piece", l:"Repère / pièce"},
      {k:"rep", l:"Reprise", u:"°C", type:"num"},
      {k:"souf", l:"Soufflage", u:"°C", type:"num"},
      {k:"dt", l:"ΔT", u:"K", type:"calc", calc:"absdiff:rep,souf"},
      {k:"f", l:"Filtres nettoyés", type:"case"},
      {k:"d", l:"Désinfection", type:"case"},
      {k:"c", l:"Condensats testés", type:"case"}
    ]
  },
  conseils: [
    "Bon usage du système thermodynamique et réglage des consignes",
    "Fluide frigorigène : obligations d'étanchéité et suivi",
    "Régulation et contrôle de la température des locaux",
    "État et entretien du réseau de distribution d'air",
    "Adéquation entre les émetteurs et le générateur",
    "Réduction des besoins de chauffage et de refroidissement du bâtiment",
    "Améliorations possibles de l'installation",
    "Opportunité d'un remplacement du système ou de composants"
  ]
};

/* ---------- PAC AIR/EAU ---------- */
TECHNOS.pac_air_eau = {
  label: "Pompe à chaleur air/eau",
  court: "PAC air/eau",
  icone: "♨",
  famille: "thermo",
  regl: {
    obligatoire: true,
    pmin: 4, pmax: 70,
    plage: "4 à 70 kW",
    cadre: "Décret n° 2020-912 du 28 juillet 2020 et arrêté du 24 juillet 2020, modifié par l'arrêté du 21 novembre 2022. Code de l'environnement, art. R224-44 et suivants.",
    periodicite: "Tous les 2 ans",
    delai: "15 jours",
    conserv: "Copie conservée 2 ans par l'entreprise",
    doc: "Attestation d'entretien",
    alerte: "L'obligation légale est BIENNALE, pas annuelle. Un contrat d'entretien annuel se vend très bien, mais comme prestation contractuelle : le présenter comme une obligation réglementaire serait une pratique commerciale trompeuse."
  },
  ident: [
    {k:"marque", l:"Marque et modèle (unité extérieure)"},
    {k:"modele_ui", l:"Module hydraulique / unité intérieure", opt:true},
    {k:"serie", l:"N° de série"},
    {k:"puiss", l:"Puissance nominale", u:"kW", type:"num"},
    {k:"fluide", l:"Fluide frigorigène", type:"liste", opts:["R32","R410A","R290","R454C","autre"]},
    {k:"charge", l:"Charge de fluide", u:"kg", type:"num", opt:true},
    {k:"circuit", l:"Circuit frigorifique", type:"liste", opts:["préchargé et scellé en usine","réalisé sur site"], opt:true},
    {k:"mes", l:"Date de mise en service", type:"date"},
    {k:"emetteurs", l:"Émetteurs", type:"multi", opts:["plancher chauffant","radiateurs basse température","radiateurs haute température","ventilo-convecteurs"], opt:true},
    {k:"appoint", l:"Appoint", type:"liste", opts:["résistance électrique","chaudière (relève)","aucun"], opt:true},
    {k:"ecs", l:"Production ECS", type:"liste", opts:["ballon intégré","ballon séparé","aucune"], opt:true},
    {k:"regulateur", l:"Régulateur (marque, modèle, classe)", opt:true},
    {k:"dernier", l:"Date du dernier entretien connu", type:"date"}
  ],
  ctrl: {
    entretien: [
      "Relevé des températures de l'unité intérieure et de l'unité extérieure, vérification du bon fonctionnement",
      "Vérification du fonctionnement de l'inversion de cycle (lorsque c'est possible)",
      "Vérification de l'enclenchement des appoints",
      "Mesure des tensions électriques statique et dynamique",
      "Vérification de l'échangeur de l'unité extérieure et nettoyage si nécessaire",
      "Nettoyage et décrassage de l'unité intérieure et du filtre",
      "Vérification du voyant de fluide frigorigène, le cas échéant",
      "Relevé des pressions à l'entrée et à la sortie du compresseur, le cas échéant",
      "Boucle d'eau : contrôle de l'embouement lié au phénomène d'hydrolyse",
      "Boucle d'eau : purge des bulles d'air lorsque le purgeur est fonctionnel et accessible",
      "Boucle d'eau : contrôle de la pression",
      "Boucle d'eau : vérification du fonctionnement des circulateurs",
      "Boucle d'eau : vérification et nettoyage du filtre si nécessaire",
      "Boucle d'eau : contrôle de la pression de gonflage du vase d'expansion, regonflage si nécessaire",
      "Boucle d'eau : contrôle de la présence et de l'état de l'isolation des réseaux situés hors du volume chauffé",
      "Pilotage : présence et bon fonctionnement d'une régulation automatique de la température, par pièce ou par zone",
      "Pilotage : commande manuelle et programmation des allures confort, réduit, hors gel et arrêt",
      "Pilotage : régulateur relevant des classes IV à VIII (communication 2014/C 207/02, règlement UE 813/2013)",
      "Pilotage : vérification de la température de départ d'eau sur l'affichage de l'installation",
      "Pilotage : vérification du fonctionnement des sondes de température",
      "Pilotage : positionnement et fonctionnement des robinets thermostatiques",
      "Pilotage : cohérence de la température de départ d'eau selon les modes disponibles",
      "Ballon à accumulation : vérification des anodes et des accessoires fournis par le constructeur"
    ],
    mes: [
      "Contrôle de l'implantation de l'unité extérieure et de l'évacuation des condensats hors gel",
      "Contrôle du raccordement électrique : section, protection, terre, délestage",
      "Tirage au vide et contrôle d'étanchéité du circuit frigorifique (liaisons sur site)",
      "Rinçage, désembouage préventif et contrôle de la qualité d'eau (pH, TH) selon NF EN 12828",
      "Pose d'un pot à boues magnétique et d'un filtre",
      "Purge complète, réglage de la pression de service et du vase d'expansion",
      "Contrôle du débit d'eau et du volume minimal du circuit, besoin d'un ballon tampon",
      "Équilibrage des émetteurs",
      "Paramétrage de la loi d'eau, des consignes chauffage et ECS, de la programmation",
      "Vérification que le régulateur relève des classes IV à VIII",
      "Isolation des réseaux situés hors volume chauffé",
      "Essais : cycle chauffage, cycle ECS, dégivrage, enclenchement et coupure des appoints",
      "Relevé complet des mesures de mise en service, à archiver comme point zéro",
      "Fiche d'intervention fluides frigorigènes si manipulation de fluide",
      "Remise du dossier technique et formation de l'utilisateur"
    ],
    dep: [
      "Relevé des codes défaut et de l'historique des alarmes",
      "Contrôle de l'alimentation électrique, des tensions et de l'intensité absorbée",
      "Contrôle hydraulique : pression, air, circulateur, filtre ou pot à boues colmaté, débit insuffisant",
      "Contrôle de l'échangeur extérieur : encrassement, givrage anormal, ventilateur, sonde de dégivrage",
      "Contrôle frigorifique : pressions HP et BP, surchauffe, sous-refroidissement, détendeur",
      "Recherche de fuite",
      "Contrôle des sondes (extérieure, départ, retour, ballon, ambiance) et de leur valeur ohmique",
      "Contrôle du fonctionnement des appoints et de la logique de relève",
      "Contrôle de la régulation : loi d'eau, consignes, court-cyclage du compresseur",
      "Fiche d'intervention fluides frigorigènes si manipulation de fluide"
    ]
  },
  mes: [
    {k:"text", l:"Température extérieure", u:"°C", type:"num", aide:"indispensable pour interpréter toutes les autres mesures"},
    {k:"tdep", l:"Température de départ d'eau", u:"°C", type:"num", ref:{max:55}, nature:"professionnel", aide:"30-35 °C plancher, 40-50 °C radiateurs BT. Au-delà de 55 °C le COP s'effondre"},
    {k:"tret", l:"Température de retour d'eau", u:"°C", type:"num"},
    {k:"dt_eau", l:"ΔT départ / retour", u:"K", type:"calc", calc:"absdiff:tdep,tret", ref:{min:4, max:10}, nature:"professionnel", aide:"4-6 K plancher, 5-8 K radiateurs. Trop faible : débit excessif. Trop élevé : débit insuffisant, filtre colmaté, circuit embouè"},
    {k:"ue_rep", l:"Unité extérieure — air aspiré", u:"°C", type:"num"},
    {k:"ue_souf", l:"Unité extérieure — air soufflé", u:"°C", type:"num"},
    {k:"pcirc", l:"Pression du circuit à froid", u:"bar", type:"num", ref:{min:1, max:2}, nature:"professionnel"},
    {k:"pvase", l:"Pression de gonflage du vase", u:"bar", type:"num", ref:{min:0.8, max:1.5}, nature:"professionnel", aide:"pression statique moins 0,3 bar, vase isolé et vidé côté eau"},
    {k:"bp", l:"Pression BP", u:"bar", type:"num", aide:"le cas échéant : ne jamais percer un circuit scellé"},
    {k:"hp", l:"Pression HP", u:"bar", type:"num", aide:"le cas échéant"},
    {k:"sh", l:"Surchauffe", u:"K", type:"num", ref:{min:4, max:8}, nature:"professionnel"},
    {k:"sr", l:"Sous-refroidissement", u:"K", type:"num", ref:{min:3, max:8}, nature:"professionnel"},
    {k:"tstat", l:"Tension statique", u:"V", type:"num", min:207, max:253, nature:"réglementaire"},
    {k:"tdyn", l:"Tension dynamique", u:"V", type:"num", min:207, max:253, nature:"réglementaire"},
    {k:"intens", l:"Intensité absorbée", u:"A", type:"num", nature:"professionnel"},
    {k:"ph", l:"pH de l'eau du circuit", u:"pH", type:"num", ref:{min:8.2, max:10}, nature:"professionnel", aide:"NF EN 12828, installations sans aluminium"},
    {k:"th", l:"Dureté de l'eau (TH)", u:"°f", type:"num", ref:{max:15}, nature:"professionnel"},
    {k:"emboue", l:"Embouement constaté", type:"liste", opts:["non","léger","marqué"]},
    {k:"classe_reg", l:"Classe du régulateur", type:"liste", opts:["IV","V","VI","VII","VIII","inférieure ou absente"], nature:"réglementaire", aide:"doit relever des classes IV à VIII"},
    {k:"isol", l:"Isolation des réseaux hors volume chauffé", type:"liste", opts:["présente et en bon état","dégradée","absente","sans objet"], nature:"réglementaire"}
  ],
  sousMachines: null,
  conseils: [
    "Bon usage du système et réglage des consignes ; ne pas couper la PAC en période de gel",
    "Fluide frigorigène : nature, PRG, conduite à tenir en cas de suspicion de fuite",
    "Régulation et contrôle de la température des locaux, mise à niveau du régulateur",
    "Réseau de distribution : désembouage, rééquilibrage, pot à boues, traitement d'eau",
    "Isolation des réseaux situés hors volume chauffé",
    "Adéquation entre les émetteurs et le générateur : abaisser la température de départ améliore le rendement",
    "Gestion des apports solaires et internes",
    "Réduction des besoins de chauffage du bâtiment",
    "Améliorations possibles de l'installation",
    "Opportunité d'un remplacement du système ou de composants"
  ]
};
/* ---------- CHAUDIÈRE GAZ ---------- */
TECHNOS.chaudiere_gaz = {
  /* Points sans objet selon l'appareil : ils passent en NP tout seuls plutôt
     que d'attendre qu'on les décoche un par un. Une règle ne s'applique
     jamais tant que le champ qu'elle lit n'est pas renseigné. */
  np: [
    {si:{evac:["C etanche"]},
     points:["Chaudiere de type B : mesure de la teneur en CO"],
     mesures:["co_amb"],
     pourquoi:"appareil étanche : l'air de combustion ne vient pas du local"},
    {sauf:{evac:["VMC gaz"]},
     points:["VMC gaz :"],
     pourquoi:"installation sans VMC gaz"},
    {sauf:{bruleur:["air souffle"]},
     points:["Bruleur a air souffle"],
     pourquoi:"brûleur non soufflé : mesures propres au brûleur soufflé sans objet"},
    {si:{ecs:["aucune"]},
     points:["Ballon a accumulation"],
     pourquoi:"pas de production d'eau chaude sur cet appareil"}
  ],
  label: "Chaudière gaz",
  court: "Chaudière gaz",
  icone: "🔥",
  famille: "combustion",
  regl: {
    obligatoire: true,
    pmin: 4, pmax: 400,
    plage: "4 à 400 kW",
    cadre: "Code de l'environnement, art. R224-41-4 à R224-41-9. Arrêté du 15 septembre 2009 modifié (arrêtés du 12 juin 2014, du 24 juillet 2020 et du 21 novembre 2022). L'annexe 1 renvoie au § 3.1 de la norme NF X 50-010.",
    periodicite: "Annuelle, par année civile",
    delai: "15 jours",
    conserv: "2 ans par le commanditaire",
    doc: "Attestation d'entretien",
    alerte: "Au-delà de 70 kW en tertiaire s'ajoute l'inspection périodique du système de chauffage et la vérification de la GTB."
  },
  ident: [
    {k:"marque", l:"Marque et modèle"},
    {k:"serie", l:"N° de série"},
    {k:"puiss", l:"Puissance nominale utile", u:"kW", type:"num"},
    {k:"combustible", l:"Combustible", type:"liste", opts:["gaz naturel","propane","butane"]},
    {k:"techno", l:"Technologie", type:"liste", opts:["condensation","basse température","standard","atmosphérique ancienne"],
     aide:"technologie de combustion, à ne pas confondre avec le brûleur : « standard » = chaudière traditionnelle haute température, sans condensation ni basse température. Une chaudière standard peut très bien avoir un brûleur atmosphérique."},
    {k:"bruleur", l:"Type de brûleur", type:"liste", opts:["prémélange total","prémélange partiel","atmosphérique","air soufflé"],
     aide:"le brûleur, pas la technologie. C'est lui qui donne la valeur forfaitaire des NOx (annexe 3) et qui décide si les mesures de combustion s'appliquent : elles ne sont obligatoires que sur les brûleurs à air soufflé. Repris d'une visite à l'autre."},
    {k:"evac", l:"Type et évacuation", type:"liste", opts:["C étanche ventouse","B1 raccordé non étanche","B22 / B23 raccordé sans coupe-tirage","VMC gaz"],
     aide:"norme NF EN 1749. B = l'air de combustion est pris dans la pièce ; C = circuit étanche (ventouse). B1 a un coupe-tirage, B2 n'en a pas : B22 ventilateur en aval de la chambre de combustion, B23 en amont (brûleur prémix). Le suffixe P signale un conduit en surpression. Renseigné une fois, repris ensuite : c'est lui qui fait disparaître les points sans objet (VMC gaz, CO d'ambiance sur étanche)."},
    {k:"annee", l:"Année de fabrication", type:"num", aide:"sert au calcul du rendement forfaitaire"},
    {k:"mes", l:"Date de mise en service", type:"date"},
    {k:"ecs", l:"Production ECS", type:"liste", opts:["instantanée","micro-accumulée","ballon (anode à vérifier)","aucune"],
     aide:"« aucune » retire le point sur le ballon à accumulation"},
    {k:"ramonage", l:"Date du dernier ramonage", type:"date", opt:true},
    {k:"dernier", l:"Date du dernier entretien connu", type:"date"}
  ],
  ctrl: {
    entretien: [
      "Nettoyage du corps de chauffe, de la veilleuse et de l'extracteur lorsqu'il est présent dans l'appareil",
      "Démontage et nettoyage du brûleur",
      "Vérification du dispositif d'anti-refoulement des fumées, lorsqu'il est présent dans l'appareil",
      "Vérification fonctionnelle du circulateur de chauffage incorporé à l'appareil",
      "Vérification du fonctionnement du circulateur du circuit hydraulique, lorsqu'il est extérieur à l'appareil",
      "Vérification et réglage des organes de régulation incorporés",
      "Vérification des dispositifs de sécurité de l'appareil",
      "Vérification de l'état, de la nature et de la géométrie du conduit de raccordement",
      "Vérification des débits de gaz et réglage éventuel selon la procédure du fabricant",
      "Remplacement des joints des raccords mécaniques rendus nécessaires",
      "VMC gaz : vérification fonctionnelle de la sécurité individuelle et nettoyage du conduit de raccordement",
      "Ballon à accumulation : vérification des anodes et des accessoires du constructeur",
      "Brûleur à air soufflé : mesure de la température des fumées",
      "Brûleur à air soufflé : mesure de la teneur en CO2 ou en O2",
      "Chaudière de type B : mesure de la teneur en CO dans l'ambiance, à proximité de l'appareil",
      "Contrôle de l'embouement du circuit hydraulique de distribution",
      "Purge des bulles d'air du circuit hydraulique",
      "Vérification de la pression du circuit hydraulique",
      "Vérification de la pression de gonflage du vase d'expansion, regonflage si nécessaire",
      "Évaluation du dimensionnement de la chaudière au regard des besoins du bâtiment",
      "Détermination de la classe énergétique et des principales solutions de remplacement",
      "Présence et bon fonctionnement d'une régulation automatique de la température, par pièce ou par zone, avec allures confort, réduit, hors gel et arrêt",
      "Présence et état de l'isolation des réseaux de distribution situés hors du volume chauffé",
      "Rappel au client de son obligation de ramonage annuel du conduit, et report de la date du dernier ramonage si elle est communiquée",
      "Évaluation du rendement et comparaison au rendement de référence",
      "Évaluation des émissions de NOx et comparaison à la valeur de référence"
    ],
    mes: [
      "Contrôle d'étanchéité de l'installation gaz après travaux",
      "Vérification de l'adéquation puissance / besoins et du dimensionnement",
      "Vérification de l'amenée d'air et de la ventilation du local (appareils de type B)",
      "Vérification du conduit d'évacuation : nature, section, longueur, pente, terminal, compatibilité 3CE",
      "Rinçage ou désembouage du circuit avant raccordement, mise en eau, purge, réglage de la pression",
      "Contrôle du vase d'expansion (volume, pression de gonflage)",
      "Réglage de la pression gaz à l'entrée et au brûleur, contrôle du débit au compteur, adaptation au gaz distribué",
      "Réglage de la combustion et analyse des fumées",
      "Mesure du CO ambiant",
      "Réglage de la régulation : courbe de chauffe, sonde extérieure, programmation, allures",
      "Réglage de la température d'ECS (consigne 60 °C maximum)",
      "Contrôle des sécurités : surchauffe, manque d'eau, contrôle de flamme, pressostat fumées",
      "Remise de la notice et explication du fonctionnement",
      "Établissement du certificat de conformité gaz modèle 2",
      "Procès-verbal de mise en service et démarrage de la garantie"
    ],
    dep: [
      "Recueil du symptôme, de l'historique et du code défaut",
      "Contrôle de l'alimentation électrique, du raccordement gaz et de la pression d'alimentation",
      "Contrôle de la pression du circuit hydraulique et du vase d'expansion",
      "Contrôle du circuit d'évacuation des fumées, de l'amenée d'air et du siphon de condensats",
      "Contrôle de la chaîne d'allumage et du contrôle de flamme (électrodes, courant d'ionisation)",
      "Contrôle des organes de sécurité et de régulation",
      "Contrôle du circulateur, des vannes et du corps de chauffe",
      "Mesure du CO ambiant à l'arrivée et après remise en service",
      "Analyse de combustion après réparation",
      "En cas de danger grave et immédiat : arrêt et consignation de l'appareil, information écrite du client"
    ]
  },
  mes: [
    {k:"co_amb", l:"CO ambiant", u:"ppm", type:"num", max:10, nature:"réglementaire", paliers:"co", aide:"appareil en fonctionnement, autres appareils à combustion arrêtés, balayage lent à 50 cm"},
    {k:"co_fum", l:"CO dans les fumées (à 0 % O2)", u:"ppm", type:"num", ref:{max:100}, nature:"professionnel", aide:"aucun seuil réglementaire — repère d'usage, à faire valider par la CAPEB"},
    {k:"tfum", l:"Température des fumées", u:"°C", type:"num", nature:"réglementaire",
     ref:function(m){ return estCondensation(m) ? {min:30, max:90} : {min:110, max:200, note:"sous 160 °C, risque de condensation dans un conduit maçonné"}; },
     aide:"mesure obligatoire sur brûleur à air soufflé, après les opérations de réglage"},
    {k:"tamb", l:"Température ambiante", u:"°C", type:"num", nature:"réglementaire", aide:"relevée en même temps que la température des fumées, sur brûleur à air soufflé"},
    {k:"co2", l:"Teneur en CO2 des fumées", u:"%", type:"num", nature:"professionnel",
     ref:function(m){ return estAtmospherique(m) ? {min:5, max:8} : {min:8, max:10}; },
     aide:"gaz naturel : CO2 maximal théorique 11,7 %. La plage usuelle découle d'un excès d'air de 20 à 40 %"},
    {k:"o2", l:"Teneur en O2 des fumées", u:"%", type:"num", nature:"professionnel",
     ref:function(m){ return estAtmospherique(m) ? {min:8, max:11} : {min:3.5, max:6}; },
     aide:"l'O2 et le CO2 disent la même chose : l'excès d'air"},
    {k:"rdt_mes", l:"Rendement de combustion lu à l'analyseur", u:"%", type:"num",
     ref:function(m){ return estCondensation(m) ? {min:98, max:107, note:"au-dessus de 100 % dès qu'il y a condensation réelle"} : {min:88, max:94}; },
     aide:"valeur de réglage — ce n'est PAS le rendement à porter sur l'attestation"},
    {k:"rdt", l:"Rendement à porter sur l'attestation", u:"% PCI", type:"calc", calc:"rendement_gaz", nature:"réglementaire",
     besoin:[{k:"techno", l:"type de chaudière"},{k:"annee", l:"année de mise en service"},{k:"puiss", l:"puissance"}],
     aide:"valeur forfaitaire calculée à partir de la technologie, de l'année et de la puissance"},
    {k:"rdt_ref", l:"Rendement de référence", u:"% PCI", type:"calc", calc:"rendement_ref_gaz", nature:"réglementaire",
     besoin:[{k:"puiss", l:"puissance"}]},
    {k:"nox", l:"NOx évalués", u:"mg/kWh", type:"calc", calc:"nox_gaz", nature:"réglementaire",
     besoin:[{k:"bruleur", l:"type de brûleur"}],
     aide:"valeur forfaitaire de l'annexe 3, déduite du type de brûleur. Les NOx ne se mesurent pas en entretien courant : aucun analyseur d'entretien ne les donne."},
    {k:"nox_ref", l:"NOx de référence", u:"mg/kWh", type:"fixe", valeur:35, nature:"réglementaire",
     aide:"valeur imprimée sur le modèle d'attestation : niveau d'émissions atteint par les meilleures technologies présentes sur le marché depuis 2009. À ne pas confondre avec le plafond d'éco-conception de 56 mg/kWh."},
    {k:"classe_nox", l:"Classe NOx de l'appareil", type:"liste", opts:["1","2","3","4","5","6","non déterminée"],
     aide:"plaque signalétique ou notice, souvent « NOx class 5 ». Facultatif : depuis le 26 septembre 2018 le règlement UE 813/2013 plafonne les chaudières gaz à 56 mg/kWh, et c'est cette valeur que l'appli retient d'office. Rien à relever sur place.", opt:true},
    {k:"classe_ener", l:"Classe énergétique", type:"calc", calc:"classe_energie", nature:"réglementaire",
     besoin:[{k:"techno", l:"type de chaudière"},{k:"annee", l:"année de mise en service"}],
     aide:"calculée d'après la technologie et l'année, selon la table du modèle d'attestation (standard ou basse température : D avant 2005, C après ; condensation : B avant 2005, A après). Cette table ne vaut que pour les appareils mis sur le marché avant septembre 2015 ; au-delà, c'est l'étiquette ErP du fabricant qui fait foi."},
    {k:"tirage", l:"Dépression / tirage du conduit", u:"Pa", type:"num", nature:"professionnel",
     ref:{min:3, max:20, note:"en valeur absolue"}, absRef:true},
    {k:"pcirc", l:"Pression du circuit à froid", u:"bar", type:"num", ref:{min:1, max:1.5}, nature:"professionnel"},
    {k:"pvase", l:"Pression de gonflage du vase", u:"bar", type:"num", ref:{min:0.5, max:1, note:"souvent 0,7 bar sortie d'usine"}, nature:"professionnel", aide:"régler 0,2 à 0,5 bar sous la pression de remplissage à froid, vase isolé et vidangé côté eau. Règle : hauteur d'eau au-dessus du vase divisée par 10, minimum 0,5 bar"},
    {k:"emboue", l:"Embouement constaté", type:"liste", opts:["non","léger","marqué"], nature:"réglementaire"},
    {k:"isol", l:"Isolation des réseaux hors volume chauffé", type:"liste", opts:["présente et en bon état","dégradée","absente","sans objet"], nature:"réglementaire"},
    {k:"dimension", l:"Dimensionnement au regard des besoins", type:"liste", opts:["adapté","surdimensionné","sous-dimensionné"], nature:"réglementaire"}
  ],
  sousMachines: null,
  conseils: [
    "Bon usage : entretien annuel et ventilation permanente du local, ne jamais obstruer les entrées d'air",
    "Bon usage : programmer la température selon l'occupation (confort, réduit, hors gel)",
    "Bon usage : régler l'eau chaude sanitaire sans dépasser 60 °C",
    "Bon usage : le ramonage annuel du conduit est à votre initiative en tant qu'occupant (art. R.1331-21 du code de la santé publique) ; conservez l'attestation deux ans",
    "Bon usage : surveiller la pression du circuit et signaler tout appoint d'eau répété",
    "Améliorations : calorifuger les réseaux situés hors du volume chauffé",
    "Améliorations : désembouage et rééquilibrage du réseau si embouement constaté",
    "Améliorations : installer ou compléter la régulation automatique de la température",
    "Améliorations : optimiser la courbe de chauffe pour permettre la condensation",
    "Améliorations : remplacer un circulateur non modulant par un circulateur à vitesse variable",
    "Remplacement : écart entre le rendement évalué et le rendement de référence",
    "Remplacement : classe énergétique de l'appareil et des solutions de remplacement"
  ],
  /* Quand donner le conseil — et surtout quand se taire. Un conseil
     d'amélioration sur un point qu'on vient de valider conforme décrédibilise
     tout le document. */
  conseilsSi: {
    "Bon usage : entretien annuel et ventilation permanente du local, ne jamais obstruer les entrées d'air":
      {sauf:{evac:["C etanche"]}},
    "Bon usage : le ramonage annuel du conduit est à votre initiative en tant qu'occupant (art. R.1331-21 du code de la santé publique) ; conservez l'attestation deux ans":
      {sauf:{evac:["C etanche"]}},
    "Améliorations : calorifuger les réseaux situés hors du volume chauffé":
      {siPointNonOk:"isolation des reseaux de distribution"},
    "Améliorations : désembouage et rééquilibrage du réseau si embouement constaté":
      {siPointNonOk:"embouement du circuit hydraulique"},
    "Améliorations : installer ou compléter la régulation automatique de la température":
      {siPointNonOk:"regulation automatique de la temperature"},
    "Améliorations : optimiser la courbe de chauffe pour permettre la condensation":
      {si:{techno:["condensation"]}}
  },
  sortie: {certificat:"Certificat de conformité gaz modèle 2 (arrêté du 23 février 2018) en cas de pose neuve, de modification ou de remplacement de la chaudière."}
};

/* ---------- CHAUDIÈRE FIOUL ---------- */
TECHNOS.chaudiere_fioul = {
  np: [
    {si:{cuve_type:["aucune","sans cuve"]},
     points:["Cuve :"],
     pourquoi:"pas de cuve sur cette installation"}
  ],
  label: "Chaudière fioul",
  court: "Chaudière fioul",
  icone: "🛢",
  famille: "combustion",
  regl: {
    obligatoire: true,
    pmin: 4, pmax: 400,
    plage: "4 à 400 kW",
    cadre: "Code de l'environnement, art. R224-41-4 à R224-41-9. Arrêté du 15 septembre 2009 modifié (arrêtés du 12 juin 2014, du 24 juillet 2020 et du 21 novembre 2022).",
    periodicite: "Annuelle",
    delai: "15 jours",
    conserv: "2 ans par le commanditaire",
    doc: "Attestation d'entretien",
    alerte: "L'entretien et la réparation d'une chaudière fioul existante restent autorisés. Le décret 2022-8 interdit l'installation d'un équipement neuf émettant plus de 300 gCO2/kWh PCI, ce qui exclut le fioul domestique classique — mais il n'existe aucune obligation de dépose."
  },
  ident: [
    {k:"marque", l:"Marque et modèle de la chaudière"},
    {k:"serie", l:"N° de série"},
    {k:"puiss", l:"Puissance nominale", u:"kW", type:"num"},
    {k:"techno", l:"Type", type:"liste", opts:["condensation","basse température","standard"]},
    {k:"combustible", l:"Combustible", type:"liste", opts:["FOD","biofioul F10","biofioul F30"]},
    {k:"annee", l:"Année de mise en service", type:"num"},
    {k:"bruleur", l:"Marque et modèle du brûleur", opt:true},
    {k:"flamme", l:"Technologie du brûleur", type:"liste",
     opts:["ancienne (avant 1990)","flamme jaune","flamme jaune à recirculation","flamme bleue","radiant"],
     aide:"c'est cette ligne-là qui donne les NOx forfaitaires de l'annexe 3 : le texte classe les brûleurs fioul par type de flamme, pas par nombre d'allures"},
    {k:"gicleur", l:"Gicleur : débit, angle, type", aide:"ex. 0,60 gal/h — 60° — S", opt:true},
    {k:"emetteurs", l:"Émetteurs", type:"multi", opts:["plancher chauffant","radiateurs basse température","radiateurs haute température","ventilo-convecteurs"], opt:true},
    {k:"cuve_type", l:"Cuve", type:"liste", opts:["aérienne simple paroi","aérienne double paroi","enterrée double paroi","enterrée simple paroi"], opt:true},
    {k:"cuve_vol", l:"Volume de la cuve", u:"L", type:"num", opt:true},
    {k:"ramonage", l:"Date du dernier ramonage", type:"date", opt:true},
    {k:"dernier", l:"Date du dernier entretien connu", type:"date"}
  ],
  ctrl: {
    entretien: [
      "Démontage et nettoyage complet du brûleur (gueulard, tête de combustion, turbine, volet d'air)",
      "Contrôle et remplacement du gicleur, relevé du débit, de l'angle et du type",
      "Mesure et réglage de la pression de pulvérisation de la pompe fioul",
      "Réglage de la tête de combustion et du débit d'air comburant",
      "Nettoyage ou remplacement du pré-filtre fioul, sinon nettoyage du filtre de pompe",
      "Contrôle et réglage des électrodes, du transformateur d'allumage et de la cellule photorésistante",
      "Nettoyage du corps de chauffe et des surfaces d'échange (turbulateurs)",
      "Condensation : nettoyage du siphon de condensats et contrôle du neutralisateur",
      "Vérification des dispositifs de sécurité (coffret, aquastat, thermostat de sécurité, soupape, manomètre)",
      "Vérification du conduit de raccordement, du conduit de fumée, du débouché et du tirage",
      "Vérification de l'amenée d'air et de la ventilation du local chaufferie",
      "Mesure du CO dans l'ambiance pour les chaudières non étanches",
      "Mesures de combustion : température des fumées, CO2 ou O2, CO, indice de noircissement",
      "Évaluation du rendement et comparaison aux valeurs de référence, classement énergétique",
      "Évaluation des émissions de NOx",
      "Évaluation du dimensionnement par rapport aux besoins du bâtiment",
      "Circuit hydraulique : pression, vase d'expansion, circulateurs, purge, filtre, embouement",
      "Présence et état de l'isolation des réseaux situés hors volume chauffé",
      "Présence et bon fonctionnement d'une régulation automatique de la température, par pièce ou par zone",
      "Cuve : état apparent, jaugeage, évent, limiteur de remplissage, rétention, eau ou boues en fond"
    ],
    mes: [
      "Contrôle de la conformité hydraulique et du raccordement fioul (clapets, vanne de barrage, coupe-feu)",
      "Rinçage, remplissage, mise en pression, purge, contrôle de la qualité d'eau",
      "Contrôle du conduit de fumée et du tubage, du débouché et du tirage",
      "Vérification de la ventilation haute et basse du local",
      "Amorçage et purge de la ligne fioul, contrôle d'étanchéité",
      "Réglage initial du brûleur : gicleur, pression de pompe, tête de combustion, volet d'air",
      "Réglage de la combustion et relevé des mesures de référence",
      "Paramétrage de la régulation, des courbes de chauffe et des consignes ECS",
      "Essai des sécurités",
      "Vérification de la cuve, du limiteur de remplissage et de la rétention",
      "Remise du dossier technique et formation de l'utilisateur"
    ],
    dep: [
      "Relevé du code défaut et de l'historique du coffret de sécurité",
      "Contrôle de l'alimentation électrique et des sécurités",
      "Contrôle de l'alimentation fioul : niveau, filtre colmaté, prise d'air, dépression, amorçage",
      "Contrôle du gicleur, de la pression de pompe et de la pulvérisation",
      "Contrôle des électrodes, du transformateur et de la cellule photorésistante",
      "Contrôle du corps de chauffe, du conduit et du tirage",
      "Contrôle hydraulique : pression, circulateur, vase, purge, vanne 3 voies, sonde extérieure",
      "Mesure du CO ambiant en cas de suspicion de refoulement",
      "Mesures de combustion après réparation"
    ]
  },
  mes: [
    {k:"co_amb", l:"CO ambiant", u:"ppm", type:"num", max:10, nature:"réglementaire", paliers:"co"},
    {k:"co_fum", l:"CO dans les fumées (à 0 % O2)", u:"ppm", type:"num", ref:{max:100}, nature:"professionnel", aide:"viser moins de 50 ppm sur un brûleur bien réglé"},
    {k:"noircissement", l:"Indice de noircissement (Bacharach)", type:"liste", opts:["0","1","2","3","4","5","6","7","8","9"], ref:{max:2, note:"objectif de réglage : 0 ou 1"}, nature:"professionnel", aide:"détermination obligatoire, sans seuil réglementaire en France. Certains brûleurs demandent de ne pas descendre sous 1 pour tenir les démarrages à froid"},
    {k:"tfum", l:"Température des fumées", u:"°C", type:"num", nature:"professionnel",
     ref:function(m){ return estCondensation(m) ? {min:45, max:90} : {min:160, max:250}; },
     aide:"sous 160 °C sans condensation, risque de condensation dans le conduit"},
    {k:"co2", l:"Teneur en CO2 des fumées", u:"%", type:"num", ref:{min:12, max:13.5, note:"cible usuelle 12,5 %"}, nature:"professionnel"},
    {k:"o2", l:"Teneur en O2 des fumées", u:"%", type:"num", ref:{min:3, max:5}, nature:"professionnel"},
    {k:"rdt_mes", l:"Rendement de combustion lu à l'analyseur", u:"%", type:"num", nature:"professionnel",
     ref:function(m){ return estCondensation(m) ? {min:96, max:103} : {min:88, max:93}; }},
    {k:"nox", l:"NOx évalués", u:"mg/kWh", type:"calc", calc:"nox_fioul", nature:"réglementaire",
     besoin:[{k:"flamme", l:"technologie du brûleur"}],
     aide:"forfait de l'annexe 3 selon le type de flamme, et selon la puissance au-delà de 150 kW. RÉSERVE : deux reproductions de l'annexe divergent d'une ligne sur cette table — voir Réglages, Sources et réserves."},
    {k:"nox_ref", l:"NOx de référence", u:"mg/kWh", type:"fixe", valeur:90, nature:"réglementaire",
     aide:"valeur pré-imprimée sur le modèle d'attestation fioul du COSTIC. À ne pas confondre avec un plafond à respecter."},
    {k:"classe_ener", l:"Classe énergétique", type:"calc", calc:"classe_energie", nature:"réglementaire",
     besoin:[{k:"techno", l:"type de chaudière"},{k:"annee", l:"année de mise en service"}],
     aide:"table du modèle d'attestation, version fioul : standard ou basse température D avant 2000, C ensuite ; condensation B, sans A possible. Ne vaut que pour un appareil antérieur à 2015 et de moins de 70 kW."},
    {k:"ppulv", l:"Pression de pulvérisation", u:"bar", type:"num", ref:{min:10, max:14, note:"12 bar en sortie d'usine"}, nature:"professionnel", aide:"suivre d'abord la plaque du brûleur et le tableau du gicleur"},
    {k:"tirage", l:"Dépression au foyer / tirage", u:"Pa", type:"num", ref:{min:10, max:30}, nature:"professionnel"},
    {k:"pcirc", l:"Pression du circuit à froid", u:"bar", type:"num", ref:{min:1, max:2}, nature:"professionnel"},
    {k:"pvase", l:"Pression de gonflage du vase", u:"bar", type:"num", ref:{min:0.5, max:1, note:"souvent 0,7 bar sortie d'usine"}, nature:"professionnel"},
    {k:"tdep", l:"Température de départ d'eau", u:"°C", type:"num"},
    {k:"tret", l:"Température de retour d'eau", u:"°C", type:"num", aide:"en condensation, un retour au-delà de 55 °C empêche la condensation"},
    {k:"cuve_etat", l:"État de la cuve et de la rétention", type:"liste", opts:["conforme","à surveiller","non conforme"]},
    {k:"cuve_eau", l:"Eau ou boues en fond de cuve", type:"liste", opts:["non","traces","présence"]},
    {k:"emboue", l:"Embouement constaté", type:"liste", opts:["non","léger","marqué"], nature:"réglementaire"},
    {k:"isol", l:"Isolation des réseaux hors volume chauffé", type:"liste", opts:["présente et en bon état","dégradée","absente","sans objet"], nature:"réglementaire"}
  ],
  sousMachines: null,
  conseils: [
    "Bon usage : réglage des consignes, programmation, allures réduit et hors gel, aération quotidienne",
    "Améliorations : équilibrage et désembouage du réseau, isolation des réseaux hors volume chauffé",
    "Améliorations : régulation automatique par pièce ou par zone, robinets thermostatiques, sonde extérieure",
    "Remplacement : rendement, classement énergétique et dimensionnement au regard des besoins réels",
    "Autres modes de chauffage et recours aux énergies renouvelables",
    "Risque d'intoxication au monoxyde de carbone : ne jamais obstruer les grilles, intérêt d'un détecteur de CO",
    "Rappel du caractère annuel et obligatoire de l'entretien, conservation de l'attestation 2 ans",
    "Cuve : maintenir la rétention en état, faire vérifier le limiteur de remplissage et l'évent",
    "Cuve hors service : ne jamais la laisser en place sans dégazage et neutralisation"
  ],
  sortie: {certificat:"Certificat de ramonage si le ramonage est réalisé au cours de la même intervention. En cas de mise hors service d'une cuve : attestation de dégazage et de neutralisation."}
};
/* ---------- ADOUCISSEUR ---------- */
TECHNOS.adoucisseur = {
  sansAppareils: true,
  label: "Adoucisseur d'eau",
  court: "Adoucisseur",
  icone: "💧",
  famille: "eau",
  regl: {
    obligatoire: false,
    plage: "Toutes tailles",
    cadre: "Aucun texte n'impose l'entretien d'un adoucisseur. Le cadre porte sur la qualité de l'eau et la conformité du matériel : code de la santé publique art. R1321-1 et suivants et R1321-57 ; arrêté du 29 mai 1997 modifié (attestation de conformité sanitaire, résines de l'annexe IV) ; arrêté du 11 janvier 2007 (sodium 200 mg/L, équilibre calcocarbonique).",
    periodicite: "Contractuelle — 1 visite complète par an en pratique",
    delai: "Remis sur place ou par mail",
    conserv: "Copie conservée 2 ans par l'entreprise",
    doc: "Compte rendu d'entretien contractuel",
    alerte: "ENTRETIEN NON RÉGLEMENTAIRE. Le document ne doit jamais se présenter comme une attestation réglementaire. La garantie constructeur, elle, conditionne très souvent sa validité à un entretien annuel tracé : c'est le vrai argument de vente."
  },
  ident: [
    {k:"marque", l:"Marque et modèle"},
    {k:"serie", l:"N° de série"},
    {k:"annee", l:"Année de pose", type:"num", opt:true},
    {k:"resine", l:"Volume de résine", u:"L", type:"num", opt:true},
    {k:"bypass", l:"By-pass présent et manœuvrable", type:"liste", opts:["oui","non","grippé"], opt:true},
    {k:"protection", l:"Protection anti-retour amont", type:"liste", opts:["clapet EA","disconnecteur CA","absente"], opt:true},
    {k:"eau_boisson", l:"Point d'eau froide non adoucie pour la boisson", type:"liste", opts:["oui","non"], aide:"obligatoire en installation collective (art. R.1321-53 du code de la santé publique) ; recommandé en maison individuelle", opt:true},
    {k:"dernier", l:"Date du dernier entretien connu", type:"date"}
  ],
  ctrl: {
    entretien: [
      "Entretien avec le client : goût et odeur de l'eau, traces de calcaire, consommation de sel, incidents depuis la dernière visite",
      "Relevé de l'index du compteur volumétrique et calcul du volume traité depuis la dernière visite",
      "Examen visuel : corrosion, fuites aux raccords, état des flexibles, propreté du local",
      "Contrôle du by-pass : manœuvre complète des vannes, vérification que le client sait s'en servir",
      "Contrôle de la protection contre les retours d'eau en amont",
      "Contrôle et nettoyage ou remplacement du filtre amont",
      "Mesure du TH de l'eau brute au piquage amont",
      "Mesure du TH de l'eau adoucie au point de puisage le plus proche en aval",
      "Mesure du TH en sortie de colonne avant mélange (doit être proche de 0 °f)",
      "Réglage de la vanne de mélange pour viser un TH résiduel de 8 à 15 °f",
      "Mesure de la pression d'entrée et contrôle du réducteur de pression",
      "Bac à sel : niveau, recherche de pont de sel, présence de boue saline ou d'insolubles",
      "Nettoyage du bac à sel, du puits à saumure et de la crépine ; contrôle du flotteur et du clapet de sécurité",
      "Démontage, nettoyage et remontage de l'injecteur (venturi) et de son filtre",
      "Contrôle du corps de vanne et des joints de piston, recherche d'une fuite interne vers l'égout",
      "Régénération manuelle complète : détassage, aspiration de saumure, rinçage lent, renvoi d'eau, rinçage rapide",
      "Contrôle de l'écoulement à l'égout et de la garde d'air",
      "Nouvelle mesure du TH après régénération",
      "Désinfection des résines et du bac à sel avec un produit compatible eau de consommation, puis rinçage complet",
      "Contrôle du paramétrage : dureté d'entrée, dureté de sortie, volume, heure, régénération forcée tous les 4 à 7 jours",
      "Contrôle de la pile de sauvegarde, remise à l'heure, effacement des alarmes",
      "Vérification qu'un point d'eau froide non adoucie reste disponible pour la boisson",
      "Alerte écrite si un membre du foyer suit un régime pauvre en sodium (environ 8 mg/L de sodium par °f éliminé)",
      "Contrôle de la température de l'ECS en aval et recherche de bras morts",
      "Recharge en sel, remise en service, purge, contrôle final d'absence de fuite"
    ],
    mes: [
      "Vérification préalable : TH du réseau, pression et débit disponibles, dimensionnement selon le nombre d'occupants",
      "Contrôle du local : hors gel, ventilé, évacuation à l'égout avec garde d'air, accessibilité",
      "Vérification que le matériel dispose d'une attestation de conformité sanitaire",
      "Pose du by-pass, du filtre amont et de la protection contre les retours d'eau",
      "Pose ou contrôle d'un réducteur de pression si le réseau dépasse 5 bar",
      "Conservation ou création d'un piquage d'eau froide non adoucie pour l'évier de cuisine",
      "Raccordement de l'évacuation et du trop-plein avec garde d'air, sans contre-pente",
      "Mise en eau, purge, contrôle d'étanchéité",
      "Remplissage du bac, première désinfection des résines et rinçage complet",
      "Programmation complète et régénération de mise en service",
      "Mesure du TH en sortie et réglage du mélange",
      "Explication au client : sel, by-pass, absence prolongée, entretien annuel"
    ],
    dep: [
      "Relevé du symptôme : eau redevenue dure, sel non consommé, écoulement permanent à l'égout, débordement, alarme",
      "Contrôle de l'alimentation électrique et de la pile de sauvegarde",
      "Mesure du TH brut et du TH adouci pour situer le défaut",
      "Contrôle de l'injecteur et de son filtre (première cause d'aspiration de saumure défaillante)",
      "Recherche de pont de sel dans le bac",
      "Contrôle du corps de vanne, du piston et des joints",
      "Contrôle du compteur volumétrique et de la turbine",
      "Contrôle du paramétrage et de la cohérence de la dureté programmée",
      "Régénération manuelle de diagnostic avec chronométrage des phases"
    ]
  },
  mes: [
    {k:"th_brut", l:"TH eau brute", u:"°f", type:"num"},
    {k:"th_adouci", l:"TH eau adoucie", u:"°f", type:"num", ref:{min:8, max:15}, nature:"professionnel", aide:"cible professionnelle : une eau totalement adoucie devient agressive (équilibre calcocarbonique)"},
    {k:"pression", l:"Pression d'entrée", u:"bar", type:"num", ref:{max:5}, nature:"professionnel"},
    {k:"sel", l:"Niveau de sel", type:"liste", opts:["correct","bas","pont de sel","boue saline"]},
    {k:"index", l:"Index du compteur volumétrique", u:"m³", type:"num", aide:"permet de calculer le volume traité depuis la dernière visite"},
    {k:"regen_ok", l:"Régénération de contrôle", type:"liste", opts:["cycle complet conforme","aspiration de saumure faible","fuite permanente à l'égout","cycle incomplet"]},
    {k:"regen_fin", l:"TH après régénération de contrôle", u:"°f", type:"num", ref:{max:15}, nature:"professionnel", aide:"vérifie que la régénération a bien rendu sa capacité à la résine"}
  ],
  sousMachines: null,
  conseils: [
    "Contrôler le niveau de sel toutes les 4 à 8 semaines et n'utiliser que du sel en pastilles NF EN 973 type A",
    "Manœuvrer le by-pass en cas d'absence prolongée et faire une régénération manuelle au retour",
    "L'eau adoucie reste potable : l'échange remplace le calcaire par du sodium, elle n'est pas salée. Le signaler en cas de régime pauvre en sel",
    "Conserver un point d'eau froide non adoucie pour la boisson : obligatoire en installation collective, recommandé en maison individuelle",
    "Éviter les arrêts prolongés sans by-pass : la stagnation dans la résine favorise le développement bactérien, bien plus que la température",
    "Faire réaliser l'entretien : aucune obligation légale, mais la garantie constructeur en dépend le plus souvent"
  ]
};

/* ---------- VMC DOUBLE FLUX ---------- */
TECHNOS.vmc_df = {
  label: "VMC double flux",
  court: "VMC double flux",
  icone: "🌀",
  famille: "air",
  regl: {
    obligatoire: false,
    plage: "Logement individuel et collectif",
    cadre: "Aucun texte n'impose l'entretien périodique d'une VMC double flux en logement. L'arrêté du 24 mars 1982 fixe des débits à la conception, pas une maintenance. L'obligation de vérification et d'entretien annuels de l'arrêté du 25 avril 1985 ne vise QUE les VMC-gaz collectives.",
    periodicite: "Contractuelle — filtres 2 fois par an, visite complète annuelle",
    delai: "Remis sur place ou par mail",
    conserv: "Copie conservée 2 ans par l'entreprise",
    doc: "Compte rendu d'entretien contractuel",
    alerte: "ENTRETIEN NON RÉGLEMENTAIRE en logement. Deux obligations à ne pas confondre : en locaux de travail, le code du travail impose un contrôle au moins annuel ; en construction neuve, la RE2020 impose une vérification unique à l'achèvement par un opérateur reconnu compétent — c'est un contrôle de réception, pas un entretien."
  },
  ident: [
    {k:"marque", l:"Marque et modèle de la centrale"},
    {k:"serie", l:"N° de série"},
    {k:"annee", l:"Année de pose", type:"num", opt:true},
    {k:"echangeur", l:"Type d'échangeur", type:"liste", opts:["à flux croisés","à contre-courant","rotatif","enthalpique"], opt:true},
    {k:"filtres", l:"Classe des filtres", type:"liste", opts:["ISO Coarse (G4)","ePM10 (M5)","ePM1 (F7)","ePM1 (F9)"], opt:true},
    {k:"bypass", l:"By-pass d'été", type:"liste", opts:["présent automatique","présent manuel","absent"], opt:true},
    {k:"prechauffe", l:"Préchauffage antigel", type:"liste", opts:["électrique","hydraulique","puits climatique","absent"], opt:true},
    {k:"bouches", l:"Nombre de bouches (extraction / soufflage)", opt:true},
    {k:"local", l:"Local d'implantation de la centrale", opt:true},
    {k:"dernier", l:"Date du dernier entretien connu", type:"date"}
  ],
  ctrl: {
    entretien: [
      "Entretien avec le client : bruit, courants d'air froid, condensation ou moisissures, odeurs, date du dernier changement de filtres",
      "Contrôle de l'accessibilité et de l'état du caisson : fixation, suspension antivibratile, calorifuge, trappe d'accès",
      "Mise hors tension et consignation avant ouverture du caisson",
      "Filtres : relevé de la classe et de l'encrassement, remplacement systématique, pose dans le bon sens, référence et date notées",
      "Contrôle de l'alarme filtre et remise à zéro du compteur",
      "Échangeur : extraction, contrôle de l'encrassement et de l'étanchéité entre les deux flux, nettoyage et séchage complet",
      "Contrôle du joint périphérique et du calorifuge de l'échangeur",
      "Ventilateurs de soufflage et de reprise : propreté des roues, balourd, jeu et bruit de roulement, resserrage",
      "Bac et siphon de condensats : nettoyage, amorçage, contrôle de la pente et de la garde d'air",
      "By-pass d'été : manœuvre complète, contrôle du clapet, du servomoteur et des seuils programmés",
      "Préchauffage antigel : fonctionnement, sécurité thermique et réarmement, cohérence du seuil",
      "Réseau de gaines : écrasement, percement, déboîtement, étanchéité des raccords, calorifuge sur air neuf, rejet et volumes non chauffés",
      "Pièges à son : présence, position, absence d'affaissement",
      "Bouches d'extraction et de soufflage : dépose, nettoyage, contrôle du repérage et du réglage, remise en place",
      "Prise d'air neuf et rejet extérieur : grilles dégagées, grillage anti-rongeurs, absence de recyclage entre rejet et prise d'air",
      "Mesure des débits à chaque bouche au cône et anémomètre, en petite et en grande vitesse",
      "Comparaison des débits mesurés aux valeurs de référence et, s'il existe, au rapport de vérification du chantier",
      "Contrôle de l'équilibrage entre insufflation et extraction (écart cible 10 % maximum)",
      "Relevé des températures air extérieur, soufflage, reprise et rejet ; calcul du rendement apparent de l'échangeur",
      "Contrôle du transit d'air : détalonnage des portes, absence d'entrée d'air ajoutée en menuiserie",
      "Régulation et télécommande : horloges, programmes, cohérence des sondes hygro, CO2 ou COV, essai des modes"
    ],
    mes: [
      "Contrôle de l'implantation de la centrale : hors gel, accessible, suspension antivibratile",
      "Contrôle du réseau : sections, longueurs, calorifuge sur air neuf, rejet et volumes non chauffés",
      "Contrôle de la prise d'air neuf et du rejet : distance, orientation, absence de recyclage",
      "Contrôle de l'évacuation des condensats avec siphon amorçable et garde d'air",
      "Raccordement électrique et mise à la terre",
      "Réglage et mesure des débits bouche par bouche, en petite et grande vitesse",
      "Équilibrage insufflation / extraction",
      "Relevé des températures et calcul du rendement de l'échangeur",
      "Paramétrage de la régulation, des modes et des seuils de by-pass",
      "Contrôle du détalonnage des portes et du transit d'air",
      "Remise du dossier, de la notice et formation du client au changement des filtres",
      "Le cas échéant : vérification RE2020 à l'achèvement par un opérateur reconnu compétent (prestation distincte)"
    ],
    dep: [
      "Relevé du symptôme : bruit, condensation, odeurs, débit faible, arrêt",
      "Contrôle de l'alimentation électrique et des sécurités",
      "Contrôle de l'encrassement des filtres et de l'échangeur",
      "Contrôle des ventilateurs : roulements, balourd, condensateur, variateur",
      "Contrôle du siphon de condensats (désamorçage = odeurs et reflux)",
      "Contrôle du réseau : gaine écrasée, déboîtée, percée, obstruée",
      "Contrôle du by-pass et du préchauffage antigel",
      "Mesure des débits pour situer la perte de charge",
      "Contrôle des sondes et de la régulation"
    ]
  },
  mes: [
    {k:"t_ext", l:"Température air extérieur", u:"°C", type:"num"},
    {k:"t_souf", l:"Température air soufflé", u:"°C", type:"num"},
    {k:"t_rep", l:"Température air repris", u:"°C", type:"num"},
    {k:"t_rej", l:"Température air rejeté", u:"°C", type:"num"},
    {k:"rdt_ech", l:"Rendement apparent de l'échangeur", u:"%", type:"calc", calc:"rendement_echangeur", ref:{min:70}, nature:"professionnel", aide:"(soufflé − extérieur) / (repris − extérieur). Comparer à la valeur certifiée du fabricant"},
    {k:"debit_ext", l:"Débit total extrait", u:"m³/h", type:"num"},
    {k:"debit_souf", l:"Débit total soufflé", u:"m³/h", type:"num"},
    {k:"equilibrage", l:"Écart d'équilibrage", u:"%", type:"calc", calc:"equilibrage", ref:{max:10}, nature:"professionnel", aide:"au-delà de 10 %, le logement est mis en surpression ou en dépression"},
    {k:"filtres_etat", l:"État des filtres à la dépose", type:"liste", opts:["propres","encrassés","colmatés"]},
    {k:"filtres_ref", l:"Référence des filtres posés"},
    {k:"siphon", l:"Siphon de condensats", type:"liste", opts:["amorcé et écoulement correct","désamorcé","contre-pente","bouché"]},
    {k:"calorifuge", l:"Calorifuge air neuf et rejet", type:"liste", opts:["présent et continu","incomplet","absent"], aide:"première cause de condensation dans les combles"}
  ],
  sousMachines: {
    label: "Bouches",
    singulier: "bouche",
    champs: [
      {k:"piece", l:"Pièce"},
      {k:"sens", l:"Sens", type:"liste", opts:["extraction","soufflage"]},
      {k:"debit_mes", l:"Débit mesuré", u:"m³/h", type:"num"},
      {k:"debit_att", l:"Débit attendu", u:"m³/h", type:"num"},
      {k:"nett", l:"Nettoyée", type:"case"}
    ]
  },
  conseils: [
    "Ne jamais arrêter la ventilation, même en hiver ou en cas d'absence",
    "Ne jamais obstruer une bouche d'extraction ou de soufflage",
    "Ne pas ajouter d'entrée d'air en menuiserie : elle court-circuite l'échangeur",
    "Maintenir le détalonnage des portes intérieures pour le transit d'air",
    "Faire changer les filtres deux fois par an, ou dès l'alarme filtre",
    "Utiliser le by-pass d'été pour rafraîchir la nuit",
    "Signaler toute condensation, odeur ou bruit inhabituel sans attendre la visite annuelle"
  ]
};

/* ---------- CHAUFFE-EAU THERMODYNAMIQUE ---------- */
TECHNOS.cet = {
  label: "Chauffe-eau thermodynamique",
  court: "CET",
  icone: "🚿",
  famille: "thermo",
  regl: {
    obligatoire: false,
    plage: "Production d'eau chaude sanitaire seule, pour un seul logement",
    cadre: "L'art. R224-44 du code de l'environnement EXCLUT expressément les systèmes thermodynamiques destinés uniquement à la production d'eau chaude pour un seul logement. L'art. R224-42 vise les systèmes qui réchauffent ou refroidissent l'air intérieur — ce qu'un CET ne fait pas. Un CET domestique est de surcroît sous le plancher de 4 kW (1,5 à 3 kW en général).",
    periodicite: "Contractuelle — 1 visite par an",
    delai: "Remis sur place ou par mail",
    conserv: "Copie conservée 2 ans par l'entreprise",
    doc: "Compte rendu d'entretien contractuel",
    alerte: "ENTRETIEN NON RÉGLEMENTAIRE. En revanche, dès qu'une machine est DOUBLE SERVICE (eau chaude ET chauffage des locaux) et atteint 4 kW, l'entretien devient obligatoire : basculer alors sur la fiche PAC air/eau."
  },
  ident: [
    {k:"marque", l:"Marque et modèle"},
    {k:"serie", l:"N° de série"},
    {k:"volume", l:"Volume du ballon", u:"L", type:"num"},
    {k:"puiss", l:"Puissance calorifique", u:"kW", type:"num", opt:true},
    {k:"config", l:"Configuration", type:"liste", opts:["sur air ambiant","sur air extérieur (gainé)","split","double service"], opt:true},
    {k:"fluide", l:"Fluide frigorigène", type:"liste", opts:["R134a","R290","R513A","R744","autre"], opt:true},
    {k:"charge", l:"Charge de fluide", u:"kg", type:"num", aide:"vérifier sur la plaque : au-delà des seuils F-Gas, contrôle d'étanchéité obligatoire", opt:true},
    {k:"anode", l:"Type d'anode", type:"liste", opts:["magnésium","titane (courant imposé)","hybride"], opt:true},
    {k:"mes", l:"Date de mise en service", type:"date"},
    {k:"dernier", l:"Date du dernier entretien connu", type:"date"}
  ],
  ctrl: {
    entretien: [
      "Entretien avec le client : confort en eau chaude, temps de chauffe, bruit, consommation, incidents",
      "Contrôle de l'implantation : volume du local, ventilation, température ambiante d'exploitation",
      "Contrôle du groupe de sécurité : manœuvre, écoulement libre, absence d'entartrage, siphon et garde d'air",
      "Vérification de l'anode et remplacement si nécessaire, ou contrôle du courant imposé",
      "Contrôle et détartrage du corps de chauffe électrique d'appoint si accessible",
      "Nettoyage du filtre à air et de l'évaporateur",
      "Contrôle de l'écoulement des condensats et nettoyage du bac",
      "Contrôle du ventilateur : propreté, bruit, débit",
      "Contrôle des gaines d'air et de leur calorifuge (configuration gainée)",
      "Contrôle du circuit frigorifique : pressions le cas échéant, absence de trace d'huile, givrage anormal",
      "Contrôle des sondes de température et de leur cohérence",
      "Contrôle du fonctionnement de l'appoint électrique et de sa logique d'enclenchement",
      "Contrôle de la température de consigne et du cycle anti-légionelle",
      "Contrôle du mitigeur thermostatique en sortie et de la limitation à 50 °C aux points de puisage des pièces destinées à la toilette",
      "Contrôle du raccordement électrique, de la terre et de la protection différentielle",
      "Contrôle du réglage horaire et de l'asservissement heures creuses ou photovoltaïque",
      "Vidange partielle et contrôle de l'état intérieur si prévu par le constructeur"
    ],
    mes: [
      "Contrôle du local : volume minimal, ventilation, température d'exploitation, hors gel",
      "Contrôle du support et de la reprise de charge (un ballon plein pèse lourd)",
      "Pose du groupe de sécurité neuf avec écoulement libre et siphon",
      "Pose d'un réducteur de pression si le réseau dépasse la pression admissible",
      "Raccordement des gaines d'air et calorifuge (configuration gainée)",
      "Raccordement de l'évacuation des condensats avec pente et garde d'air",
      "Raccordement électrique dédié, terre, protection différentielle",
      "Remplissage, purge complète, contrôle d'étanchéité",
      "Paramétrage : consigne, cycle anti-légionelle, plage horaire, mode de fonctionnement",
      "Pose et réglage du mitigeur thermostatique",
      "Cycle de chauffe complet et relevé des mesures de mise en service",
      "Explication au client et remise du dossier",
      "Le cas échéant : attestation pour la prime CEE ou MaPrimeRénov'"
    ],
    dep: [
      "Relevé du symptôme et du code défaut",
      "Contrôle de l'alimentation électrique et de l'asservissement heures creuses",
      "Contrôle de la température de consigne et du paramétrage",
      "Contrôle de l'encrassement du filtre et de l'évaporateur",
      "Contrôle du ventilateur et du débit d'air",
      "Contrôle du circuit frigorifique et recherche de fuite",
      "Contrôle des sondes et de leur valeur",
      "Contrôle de l'appoint électrique et du thermostat de sécurité",
      "Contrôle du groupe de sécurité (un écoulement permanent vide le ballon d'eau chaude)",
      "Contrôle de l'entartrage et de l'état de l'anode"
    ]
  },
  mes: [
    {k:"t_air", l:"Température de l'air à l'aspiration", u:"°C", type:"num", aide:"conditionne le COP et la plage de fonctionnement"},
    {k:"t_souf", l:"Température de l'air soufflé", u:"°C", type:"num"},
    {k:"dt_air", l:"ΔT sur l'air", u:"K", type:"calc", calc:"absdiff:t_air,t_souf", ref:{min:4, max:8}, nature:"professionnel"},
    {k:"t_ballon", l:"Température du ballon", u:"°C", type:"num"},
    {k:"consigne", l:"Température de consigne", u:"°C", type:"num", min:50, nature:"sanitaire", aide:"compromis légionelle / entartrage / brûlure"},
    {k:"antilegio", l:"Cycle anti-légionelle", type:"liste", opts:["actif et programmé","actif non programmé","désactivé","absent"], nature:"sanitaire"},
    {k:"t_puisage", l:"Température au point de puisage (salle d'eau)", u:"°C", type:"num", max:50, nature:"réglementaire", aide:"limitation à 50 °C dans les pièces destinées à la toilette"},
    {k:"pression", l:"Pression du réseau d'eau", u:"bar", type:"num"},
    {k:"groupe_secu", l:"Groupe de sécurité", type:"liste", opts:["manœuvré, écoulement correct","entartré","fuite permanente","inaccessible"]},
    {k:"anode_etat", l:"État de l'anode", type:"liste", opts:["bon","usure moyenne","à remplacer","remplacée ce jour","courant imposé conforme"]},
    {k:"appoint", l:"Enclenchement de l'appoint électrique", type:"liste", opts:["conforme","permanent (à investiguer)","inopérant"]},
    {k:"cop", l:"COP relevé ou affiché", type:"num", aide:"facultatif — non exigé, et rarement mesurable sans comptage"},
    {k:"intens", l:"Intensité absorbée", u:"A", type:"num"}
  ],
  sousMachines: null,
  conseils: [
    "Maintenir la consigne à un niveau suffisant et laisser le cycle anti-légionelle actif",
    "Ne pas obstruer les grilles d'aspiration et de rejet d'air",
    "Respecter le volume minimal du local en configuration sur air ambiant",
    "Faire contrôler l'anode chaque année : c'est elle qui protège la cuve",
    "Manœuvrer le groupe de sécurité une fois par mois",
    "Signaler tout écoulement permanent au groupe de sécurité : le ballon se vide en continu",
    "Prévoir un détartrage périodique selon la dureté de l'eau"
  ]
};
