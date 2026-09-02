# Défi Photo — Mérédith & Matthieu

Web app mobile de « jeu défi photo » pour un mariage. Les invités scannent un QR
code, s'identifient d'un prénom, relèvent des défis photo avec leur téléphone, et
alimentent une galerie commune, un classement et un diaporama projeté sur place.

Aucune application à installer, aucun compte à créer.

Aix-les-Bains, 5 septembre 2026.

---

## Les cinq écrans

| Rôle | Écran | Chemin |
|------|-------|--------|
| Invité | Accueil, consentement RGPD, prénom | `/` |
| Invité | Défis groupés par catégorie, progression | `/defis` |
| Invité | Réalisation : photo ou galerie, envoi | `/defis/[id]` |
| Invité | Galerie commune et classement | `/galerie`, `/classement` |
| Écran | Diaporama projeté, lecture seule | `/ecran` |
| Témoin | Tableau de bord, modération, défis, invités | `/admin` |

## Stack

- **Next.js 16** (App Router, TypeScript) — front, API et admin dans un projet
- **SQLite** via **Prisma 7** avec l'adaptateur `better-sqlite3`
- **sharp** pour les miniatures, le retrait des métadonnées EXIF et la rotation
- **Tailwind CSS 4**, tokens de la charte du mariage en variables CSS
- Photos stockées sur le disque, **hors du bundle**, servies par une route API
- Derrière **Caddy** ou **nginx**, HTTPS obligatoire (accès à l'appareil photo)

## Démarrer

```bash
npm install
cp .env.example .env      # renseigner ADMIN_PASSWORD et ADMIN_SESSION_SECRET
npm run db:migrate
npm run db:seed           # charge les 22 défis de base
npm run dev               # http://localhost:3100
```

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de développement, port 3100 |
| `npm run build` | Migrations, génération du client Prisma, build |
| `npm run db:seed` | Charge les défis de base — idempotent |
| `npm run qr <url>` | Génère les QR codes dans `qr/` |
| `npm run purge` | Aperçu de la purge RGPD (`-- --confirmer` pour exécuter) |
| `npm run typecheck` / `npm run lint` | Contrôles |

## Partis pris

**Le réseau de la salle est la contrainte n°1.** Les photos sont compressées sur
le téléphone avant l'envoi (~1600 px, qualité 0,7 : une photo d'iPhone passe de
4 Mo à ~300 ko). L'upload affiche sa progression et se reprend automatiquement
— 4 tentatives espacées de 2, 5 puis 10 secondes, avec compte à rebours visible.
Chaque envoi porte un `clientUploadId` généré avant le premier essai, ce qui rend
les reprises idempotentes : une réponse perdue ne crée jamais de doublon.

**Le diaporama fonctionne en polling**, pas en websocket. Sur un wifi de salle,
une socket qui tombe demande une logique de reconnexion ; une requête ratée est
simplement rejouée six secondes plus tard. Les boucles de rafraîchissement et de
défilement sont séparées : une requête lente ne fige jamais l'image projetée.

**Un défi rapporte ses points une seule fois**, à la première photo visible.
Rejouer un défi enrichit l'album sans rapporter de points. Masquer ou supprimer
une photo retire les points correspondants : la modération est aussi l'anti-triche
du classement.

**Les photos ne portent aucune métadonnée.** sharp réécrit chaque image côté
serveur, ce qui supprime l'EXIF — donc la géolocalisation des invités — et
applique la rotation pour que les portraits ne s'affichent pas couchés.

**Le contraste s'écarte volontairement des maquettes.** Leurs gris secondaires
descendaient à 2,1:1 sur fond crème, illisibles en soirée sur un téléphone. Les
valeurs retenues tiennent toutes au-dessus du seuil AA (4,5:1), et les
sous-textes sont passés de la graisse 300 à 400 sous 16 px.

## Données personnelles

Un invité, c'est un prénom et un jeton aléatoire. Pas d'e-mail, pas de compte,
pas de mot de passe. Les photos restent privées à l'événement et sont supprimées
environ trois semaines après le mariage — `npm run purge`, ou la suppression du
dossier de données, qui contient tout.

## Déploiement

Voir [DEPLOIEMENT.md](DEPLOIEMENT.md) : DNS, systemd, reverse proxy (Caddy et
nginx), QR code, vérifications avant le jour J et purge après coup.
