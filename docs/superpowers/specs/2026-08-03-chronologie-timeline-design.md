# Vue Chronologie (frise temporelle) — Design

## Contexte et objectif

L'utilisateur a remarqué que la vue Arbre actuelle, organisée par profondeur de filiation, ne donne aucune indication fiable sur *quand* chaque école est apparue par rapport aux autres — au point d'avoir initialement caché de vraies incohérences chronologiques dans les données (corrigées séparément, commit `073db10`). Il souhaite une vue complémentaire où la position horizontale d'une école reflète directement sa date d'apparition réelle.

**Objectif :** ajouter une troisième vue, « Chronologie », qui place chaque école sur un axe temporel réel et proportionnel, tout en conservant une lecture de la filiation (par lignée) et la cohérence visuelle avec l'Arbre et la Carte (mêmes marqueurs, mêmes styles de liens, mêmes filtres).

**Non-objectif :** cette vue ne remplace pas l'Arbre — les deux coexistent, l'utilisateur choisit son angle de lecture.

## Architecture

- Nouveau module `js/timeline.js`, suivant le même contrat que `js/tree.js`/`js/map.js` : `renderTimeline(container, { roots, index, filiations, onSelect, filters }): void`.
- `js/main.js` gagne un troisième onglet (`#tab-chronologie`) et un troisième conteneur de vue (`#timeline-view`), câblés exactement comme `tree`/`map` le sont déjà (bascule `hidden`, classes `view-tab--active`, appel à `renderTimeline` dans `renderActiveView`).
- Aucune modification de `js/tree.js`, `js/map.js`, `js/data.js`, `js/vignette.js`, `js/legend.js`, `js/panel.js` : la nouvelle vue consomme les mêmes structures déjà produites par `buildStructuralTree` (`roots`) sans changer leur forme.
- `style.css` gagne les classes propres à cette vue (`.timeline-svg`, `.timeline-band-label`, `.timeline-axis`, etc.), par analogie avec les classes déjà existantes de l'Arbre.

## Construction du layout

**Axe horizontal (temps) :**
- `d3.scaleLinear()` avec domaine `[année la plus ancienne du dataset, année la plus récente + marge]` et image `[MARGIN_LEFT, largeur disponible]`.
- Un axe gradué (`d3.axisBottom` ou tracé manuel équivalent) affiche des repères par décennie, avec les années en légende — c'est l'ancrage qui justifie toute la vue.
- La position `x` d'une école est `xScale(ecole.periode.debut)` ; `periode.fin` n'est pas utilisé pour le positionnement (cohérent avec le reste du site, qui ne s'en sert que dans le panneau de détail).

**Axe vertical (lignées) :**
- Une bande horizontale fixe par racine de `roots` (dans l'ordre où `buildStructuralTree` les produit — actuellement Taylor, Fayol, Weber, Scrum, Extreme Programming), avec un libellé de bande ancré à gauche (nom de l'école-racine).
- À l'intérieur d'une bande, l'ordre vertical des écoles suit un parcours en profondeur de la hiérarchie de cette racine (`d3.hierarchy(rootData).descendants()` dans l'ordre naturel de parcours) : un nœud garde ses descendants directement à proximité verticale, comme dans l'Arbre — seul l'axe horizontal change de sens (date plutôt que profondeur).
- Chaque école occupe une rangée de hauteur fixe (`ROW_HEIGHT`, analogue au `NODE_GAP` de l'Arbre) ; la hauteur totale d'une bande est déterminée par son nombre d'écoles — la bande Taylor (~30 écoles) sera nettement plus haute que celle de Scrum (1-2 écoles), sans gaspillage d'espace.
- Les bandes sont empilées de haut en bas avec une marge fixe entre elles et un fond légèrement alterné (teinte crème/papier) pour les distinguer visuellement, avec le libellé de la lignée à gauche de chaque bande.

**Chevauchement horizontal au sein d'une bande :** deux écoles d'une même bande peuvent avoir des dates très proches. On réutilise la technique déjà validée dans l'Arbre (v1.1, commit `1f18abe`/`65fa084`) : alternance dessus/dessous du libellé + troncature avec ellipse au-delà d'un budget de largeur, avec fond papier derrière le texte. Les constantes exactes (hauteur de rangée, budget de troncature) seront calibrées pendant l'implémentation et vérifiées par le même script de collision exhaustif (`getBoundingClientRect` pairwise) déjà utilisé pour l'Arbre, plutôt que dérivées à l'avance sur cette page de design.

## Éléments visuels

- Marqueurs : même fonction `generateVignette(categorie, size)` que l'Arbre/la Carte (losange coloré par catégorie) — aucune nouvelle forme.
- Liens de filiation : mêmes classes CSS `.tree-link[data-type]` / `.cross-link` (trait plein continuité, tirets rupture, pointillés synthèse), réutilisées telles quelles. Un lien `synthese` qui relie deux bandes différentes sera simplement une courbe qui traverse verticalement les bandes intermédiaires.
- Légende : la légende existante (types de liens + catégories) reste affichée sur cette vue, inchangée — elle explique déjà les couleurs de catégorie et les styles de lien, qui restent identiques ici. Les libellés de bande (noms des lignées) sont directement visibles sur la frise elle-même, pas besoin de les dupliquer dans la légende.

## Interactions

- Zoom/pan horizontal via `d3.zoom()`, comme l'Arbre et la Carte (la frise est probablement plus large que haute, avec défilement horizontal principalement).
- Clic sur un nœud → même panneau de détail partagé (`onSelect`), sans changement à `js/panel.js`.
- Filtres catégorie/région → même comportement d'estompage (`tree-node--dimmed` ou équivalent) que l'Arbre, piloté par `matchesFilters` déjà existant dans `js/data.js`.

## Tests et vérification

- Comme l'Arbre et la Carte, ce module est du rendu DOM/D3 pur : pas de tests unitaires Node dédiés (cohérent avec le reste du projet), vérification manuelle + script de collision en direct dans le navigateur, comme cela a été fait pour la Tâche 5 de la v1.1.
- Vérification explicite que les 46 écoles apparaissent sur la frise, qu'aucune ne tombe hors du domaine de l'axe temporel, et que l'ordre horizontal des écoles au sein d'une bande correspond bien à l'ordre croissant de leurs dates.

## Auto-revue

- Pas de placeholder « TBD » restant : chaque section a un choix concret (échelle réelle, bandes par lignée, ordre par parcours d'arbre), validés un par un avec l'utilisateur avant rédaction.
- Cohérence interne : le document ne modifie aucune interface déjà produite par les tâches précédentes (`buildStructuralTree`, `generateVignette`, `matchesFilters`, `renderPanel`) — seul un nouveau module et un nouveau point d'entrée dans `main.js`/`index.html` sont ajoutés.
- Portée : un seul sous-système cohérent (une nouvelle vue), pas de décomposition nécessaire en plusieurs specs.
