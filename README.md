# Fiche terrain KA-RÉ

Application de relevé d'intervention de la SARL KA-RÉ — chaudière gaz, chaudière fioul,
pompe à chaleur air/eau, climatisation air/air, adoucisseur, VMC double flux,
chauffe-eau thermodynamique.

Fonctionne **hors connexion** une fois installée sur la tablette. Plusieurs machines
peuvent être relevées au cours d'une même visite ; chaque machine part comme une fiche
distincte, mais toutes partagent le même identifiant de visite.

## Installation sur la tablette

1. Ouvrir l'adresse du site dans Chrome.
2. Menu ⋮ → **Ajouter à l'écran d'accueil**.
3. Ouvrir l'application depuis l'icône, puis **Réglages** → importer `config_KA-RE.json`.

## Ce dépôt ne contient aucune donnée

Aucun nom de client, aucune adresse d'envoi, aucune clé ne figure dans ce code.
Tout cela vit dans `config_KA-RE.json`, qui **ne doit jamais être déposé ici**
et qui reste dans le stockage local de la tablette après import.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | la coquille : en-tête, corps de page, appels des modules |
| `app.css` | la feuille de style |
| `app/*.js` | les treize modules, chargés dans l'ordre de leur numéro |
| `fiches.js` | les seize planches de la notice ventilation et le logo |
| `sw.js` | mise en cache pour le fonctionnement hors connexion |
| `manifest.webmanifest` | installation sur l'écran d'accueil |
| `icon-*.png` | icônes |

Chaque URL porte le numéro de version (`?v=3.8`). Une nouvelle version donne
donc de nouvelles adresses, et il est impossible qu'une coquille récente
charge un module périmé resté en cache.

## Réserves

Les points de contrôle et les mentions réglementaires ont été établis d'après les textes
et des sources professionnelles (CAPEB, COSTIC, AIDA/INERIS, GRDF Cegibat, SYNASAV).
Plusieurs libellés proviennent de sources secondaires. Le détail des points à faire
confirmer figure dans l'application, dans **Réglages → Sources et réserves réglementaires**.
