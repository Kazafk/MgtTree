# MgtTree

Arbre généalogique interactif des grandes écoles de pensée en management :
filiations, influences régionales, évolution des courants, et événements
ayant provoqué la séparation ou l'évolution des branches. Une seconde vue
localise ces écoles sur une carte du monde.

Identité visuelle : **herbier scientifique** (planche botanique, papier
crème, encre sépia) — chaque école est représentée par une silhouette de
plante générée par code, dont la forme encode sa catégorie (industrielle,
humaine, systémique, qualité, stratégique, agile, organisationnelle
émergente).

👉 **https://kazafk.github.io/MgtTree/**

## Stack

- HTML / CSS / JS **vanilla**, ES modules natifs
- [D3.js](https://d3js.org/) v7 (`d3-hierarchy`, `d3-geo`, `d3-zoom`) chargé via CDN ESM
- Aucune étape de build

## Développement local

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Tests

Modules de logique pure testés avec `node`, sans framework :

```bash
node tests/data.test.mjs
node tests/vignette.test.mjs
node tests/validate-data.mjs
```

## Structure

```
index.html      # squelette de page (onglets Arbre/Carte, filtres, panneau)
style.css       # système visuel herbier scientifique
data.json       # écoles, filiations, événements
js/
  data.js       # validation + construction de l'arbre structurant
  vignette.js   # générateur SVG paramétrique des vignettes botaniques
  tree.js       # vue arbre généalogique (D3 hierarchy)
  map.js        # vue carte du monde (D3 geo)
  panel.js      # panneau de détail partagé
  main.js       # orchestration (chargement, bascule de vue, filtres)
tests/          # tests de logique pure (Node, sans framework)
docs/superpowers/
  specs/        # spécification de conception
  plans/        # plan d'implémentation
```

## Déploiement

GitHub Pages sert la branche `master` à la racine. Tout push sur `master`
met le site à jour automatiquement.
