# Généalogie du management — Design

Date : 2026-08-02 (révisé : dépôt dédié `MgtTree`)
Statut : validé par l'utilisateur, en attente de plan d'implémentation

## 1. Objectif

Créer un site interactif qui retrace la généalogie des grands courants du
management : filiations entre écoles de pensée, influences régionales,
évolution des « écoles », et événements/facteurs ayant provoqué la
séparation ou l'évolution des branches.

Deux vues sur un même jeu de données :
- **Arbre généalogique** — filiations entre écoles, dans le temps.
- **Carte du monde** — localisation géographique des écoles et mouvements.

Objectif visuel explicite : ne pas ressembler à un site généré par IA (pas
de dashboard bleu-violet générique). Direction retenue : **herbier
scientifique** (planche botanique XIXe, papier crème, encre sépia).

## 2. Emplacement et intégration

- Dépôt GitHub dédié : `Kazafk/MgtTree` (public), avec GitHub Pages activé
  sur la branche `master`, racine du dépôt.
- URL publique : `https://kazafk.github.io/MgtTree/`.
- Une carte de projet est ajoutée à la page d'accueil du portfolio existant
  (`Kazafk.github.io`) pointant vers cette URL — lien externe, pas
  d'intégration de fichiers dans ce dépôt.
- Stack : vanilla JS + D3.js (`d3-hierarchy`, `d3-geo`) chargé par CDN, sans
  étape de build.
- Les fichiers vivent à la racine du dépôt `MgtTree` (`index.html`,
  `style.css`, `data.json`, `js/`) — pas de sous-dossier, puisque le dépôt
  entier est dédié à ce projet.

## 3. Modèle de données (`data.json`)

Trois entités :

### 3.1 Écoles / mouvements (~45-50 nœuds)

```
{
  "id": "taylorisme",
  "nom": "Organisation scientifique du travail",
  "periode": { "debut": 1911, "fin": null },
  "region": "États-Unis",
  "coords": { "lat": 40.7, "lon": -74.0 },
  "auteurs": ["Frederick Winslow Taylor"],
  "categorie": "industriel",           // pilote le générateur SVG
  "logique": "texte de synthèse (2-4 phrases)",
  "citation_cle": "citation ou principe emblématique",
  "sources": ["référence bibliographique 1", "..."]
}
```

Catégories prévues (déterminent la grammaire visuelle du générateur) :
`industriel`, `humain`, `systemique`, `qualite`, `strategique`, `agile`,
`organisationnel-emergent`. Liste ajustable en implémentation.

### 3.2 Filiations

```
{ "de": "taylorisme", "vers": "fordisme", "type": "continuite" | "rupture" | "synthese" }
```

Le `type` détermine le style du trait dans l'arbre (plein/continu vs.
pointillé/anguleux pour une rupture).

Chaque nœud a exactement une filiation **structurante** (celle qui détermine
sa position dans l'arbre, `continuite` ou `rupture`). Les filiations de type
`synthese` sont secondaires : un nœud peut en recevoir plusieurs, mais elles
sont rendues comme des liens transversaux en pointillé par-dessus l'arbre,
sans influencer le calcul du layout. Ça évite de traiter la structure comme
un graphe acyclique général (non supporté nativement par `d3-hierarchy`) tout
en gardant la possibilité d'exprimer qu'une école synthétise plusieurs
courants.

### 3.3 Événements de rupture

```
{
  "id": "choc-petrolier-1973",
  "annee": 1973,
  "titre": "Choc pétrolier",
  "description": "...",
  "filiations_concernees": ["fordisme->toyotisme"]
}
```

Affichés comme marqueurs temporels sur l'arbre (« anneaux de croissance »).

### 3.4 Constitution du contenu

Recherche documentée par Claude, avec sources citées par fiche. Périmètre
brouillon (à affiner en implémentation, ~45-50 nœuds) :

Taylorisme, Fayolisme, Bureaucratie wébérienne, Fordisme → École des relations
humaines (Mayo, Hawthorne), Théorie X/Y (McGregor), Maslow, Herzberg →
Théorie des systèmes, Contingence, Sociotechnique (Tavistock) → Qualité
totale (Deming, Juran, Ishikawa), Toyotisme/Lean (Ohno), Kaizen, Six Sigma →
Management stratégique (Porter, Mintzberg, Ansoff), Organisation apprenante
(Senge), Knowledge management (Nonaka) → Reengineering (Hammer), Agile/Scrum
(Sutherland, Schwaber), Extreme Programming (Beck), Lean Startup (Ries),
Design Thinking → Holacratie (Robertson), Entreprise libérée, Organisations
téal (Laloux), Sociocratie, OKR (Grove, Doerr), Management 3.0 (Appelo),
écoles régionales (scandinave/sociotechnique, japonaise/keiretsu, allemande/
Mittelstand), culture DevOps, mouvements post-2020 (télétravail/distribué,
raison d'être/stakeholder capitalism).

L'utilisateur pourra corriger/enrichir ce dataset après la première passe.

## 4. Vue Arbre généalogique

- Calcul de layout hiérarchique via `d3-hierarchy`, à partir de la filiation
  structurante de chaque nœud (voir 3.2) ; rendu en branches courbes façon
  dessin botanique (pas de lignes droites d'organigramme). Les filiations
  `synthese` sont superposées en liens transversaux, hors calcul du layout.
- Zoom/pan libre (`d3-zoom`).
- Axe temporel en fond (1900 → aujourd'hui), traité comme des strates/anneaux
  de croissance plutôt qu'une grille technique.
- Chaque nœud = vignette générée par le système génératif paramétrique
  (section 6).
- Marqueurs d'événements de rupture positionnés sur les filiations concernées.
- Clic sur un nœud → panneau de détail (section 7).
- Filtres discrets par région, période et catégorie, pour garder l'arbre
  lisible à 45-50 nœuds.

## 5. Vue Carte du monde

- Projection cartographique de style ancien (`d3-geo`), fond mer ivoire,
  terres teintées sépia, cohérent avec l'esthétique herbier.
- Chaque école positionnée à ses coordonnées d'origine (`coords`), marqueur =
  version miniature de sa vignette botanique.
- Clic sur un marqueur → même composant de panneau de détail que l'arbre.
- Bascule entre les deux vues via deux onglets (« Arbre » / « Carte ») en
  haut de page, transition en fondu. Chaque vue occupe le plein écran.

## 6. Système génératif de vignettes SVG

Chaque nœud est représenté par une silhouette de plante générée par code
(pas d'illustration dessinée à la main, pas de bibliothèque d'icônes figées).
La forme encode la `categorie` de l'école selon une grammaire visuelle fixe :

- `industriel` → tige droite, feuilles anguleuses répétitives (rigueur,
  répétition).
- `humain` → feuilles arrondies groupées (organique, collectif).
- `systemique` → ramifications en réseau, feuilles en éventail.
- `qualite` → tiges régulières en spirale fermée (contrôle, boucle).
- `strategique` → silhouette élancée, peu de branches, feuilles pointues.
- `agile` → pousses courtes ramifiées en spirale ouverte (itératif).
- `organisationnel-emergent` → forme irrégulière, ramification libre
  (émergence, décentralisation).

Un léger facteur pseudo-aléatoire (seedé par l'`id` du nœud, donc stable
entre rendus) évite que deux nœuds de même catégorie soient identiques.
Implémenté en SVG généré en JS (pas de canvas), pour rester net à tout niveau
de zoom.

## 7. Panneau de détail

Composant partagé entre les deux vues, glissant depuis la droite au clic :

- Nom de l'école, période, région.
- Auteurs principaux.
- Logique / principes clés (texte de synthèse).
- Citation clé.
- Sources citées.
- Liens cliquables vers les écoles en filiation directe (referme le panneau
  courant, centre la vue sur le nœud choisi).

## 8. Système visuel « herbier scientifique »

- Fond papier crème texturé (`#F3ECDD`), grain léger.
- Encre sépia (`#5B3A29`) pour les traits et le texte principal, vert mousse
  (`#3F5C3F`) comme accent secondaire (feuillage, marqueurs actifs).
- Typographie : serif éditoriale (Playfair Display ou Cormorant) pour titres
  et corps de texte ; touche manuscrite/script réservée aux annotations
  courtes (dates, légendes).
- Carte du monde : rendu façon carte de navigation ancienne, pas de style
  « dashboard » (pas de tuiles satellite, pas de couleurs saturées).
- Cette identité est indépendante de tout autre projet du même auteur —
  `MgtTree` a sa propre identité de marque, cohérente en interne.
- Accessibilité : contraste suffisant sépia/crème à vérifier (WCAG AA),
  `prefers-reduced-motion` respecté pour les transitions de vue et le zoom.

## 9. Hors périmètre (pour cette itération)

- Pas de CMS ni d'interface d'édition du contenu : `data.json` est édité à la
  main.
- Pas de recherche plein texte (seulement les filtres région/période/
  catégorie).
- Pas de mode sombre dédié.
- Pas de version imprimable / export PDF.
- Pas de nom de domaine personnalisé (URL GitHub Pages par défaut).
