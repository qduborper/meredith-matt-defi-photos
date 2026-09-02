# Déploiement sur le VPS OVH

Cible : `https://mm.dubprod.fr`, port local **3100**, à côté d'un autre projet
Next déjà en place sur son propre port. Les deux cohabitent sans se gêner :
chacun écoute sur la boucle locale, et le reverse proxy aiguille par nom de
domaine.

```
Internet ──► :443 reverse proxy ──┬─► 127.0.0.1:3000  autre projet
             (Caddy ou nginx)     └─► 127.0.0.1:3100  défi photo
```

---

## 1. DNS

Chez votre registrar, un enregistrement A sur le sous-domaine :

| Type | Nom | Valeur |
|------|-----|--------|
| A | `mm` | l'IPv4 de votre VPS |
| AAAA | `mm` | l'IPv6, si vous en avez une |

À faire **en premier** : le certificat HTTPS ne peut pas être émis avant que le
nom résolve. Comptez de quelques minutes à quelques heures de propagation.

```bash
dig +short mm.dubprod.fr
```

## 2. Dossiers sur le serveur

```bash
sudo mkdir -p /var/www/defi-photo /var/lib/defi-photo
sudo chown -R www-data:www-data /var/www/defi-photo /var/lib/defi-photo
```

`/var/lib/defi-photo` contient la base SQLite, les photos et les miniatures.
Il est **hors du dossier de build** : un redéploiement ne peut pas l'écraser.
C'est le seul dossier à sauvegarder.

## 3. Secrets

```bash
sudo tee /etc/defi-photo.env > /dev/null <<'EOF'
ADMIN_PASSWORD=choisissez-un-mot-de-passe-solide
ADMIN_SESSION_SECRET=collez-ici-la-sortie-de-openssl-rand-base64-32
EOF
sudo chmod 600 /etc/defi-photo.env
```

Le secret de session :

```bash
openssl rand -base64 32
```

Le mot de passe admin est **le seul identifiant du témoin** — pas de compte, pas
d'e-mail. Changer `ADMIN_PASSWORD` puis redémarrer le service invalide
instantanément toutes les sessions ouvertes.

## 4. Service systemd

```bash
sudo cp deploy/defi-photo.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now defi-photo
systemctl status defi-photo
```

Vérifier `User`, `WorkingDirectory` et le chemin de `npm` dans le fichier avant
de l'installer.

## 5. Reverse proxy

**Si vous êtes en Caddy** — ajoutez le bloc de `deploy/Caddyfile.snippet` à
votre `Caddyfile` existant, puis :

```bash
sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy
```

Le certificat Let's Encrypt est obtenu et renouvelé automatiquement.

**Si vous êtes en nginx** — utilisez `deploy/nginx.conf.snippet` puis certbot.
Le fichier contient la marche à suivre. Caddy et nginx ne peuvent pas coexister
sur les ports 80/443 : gardez celui que votre autre projet utilise déjà.

> **Le point à ne pas manquer** : les en-têtes `X-Forwarded-For` / `X-Real-IP`.
> Sans eux, la limitation des tentatives de connexion admin voit toutes les
> requêtes arriver de `127.0.0.1` et bloquerait tous les visiteurs d'un coup au
> sixième essai raté de n'importe qui. Les deux configurations fournies les
> posent déjà.

## 6. Premier déploiement

```bash
./deploy/deployer.sh
```

Le script envoie les sources par rsync (en excluant `data/` et `.env`),
installe les dépendances, applique les migrations, construit et redémarre.

Le build tourne **sur le serveur**, volontairement : c'est le seul moyen d'avoir
`better-sqlite3` et `sharp` compilés pour la bonne architecture, la CLI Prisma
présente pour les migrations et `tsx` pour le script de purge. Prévoyez ~1,5 Go
de RAM disponible ; si le VPS est juste, ajoutez temporairement du swap.

Puis, une seule fois, charger les 22 défis de base :

```bash
cd /var/www/defi-photo && DATA_DIR=/var/lib/defi-photo npm run db:seed
```

Le seed est idempotent : le relancer ne duplique rien et n'écrase pas les
modifications faites depuis la console admin.

## 7. QR code

```bash
npm run qr https://mm.dubprod.fr
```

Trois fichiers dans `qr/` :

| Fichier | Usage |
|---------|-------|
| `qr-noir.svg` | **À privilégier pour l'impression.** Noir sur blanc, le plus fiable à scanner. |
| `qr-charte.svg` | Sapin sur crème, aux couleurs du mariage. Contraste 8:1, largement suffisant. |
| `qr-noir.png` | 2048 px, pour un outil de mise en page. |

Correction d'erreur en niveau H (30 % de redondance) : un carton de table finit
taché, corné ou à moitié caché par un verre.

## 8. Vérifications avant le jour J

```bash
# Le service tourne et n'écoute que sur la boucle locale
systemctl is-active defi-photo
ss -tlnp | grep 3100          # doit afficher 127.0.0.1:3100, pas 0.0.0.0

# L'app répond en HTTPS
curl -sI https://mm.dubprod.fr | head -1

# La console admin est protégée
curl -so /dev/null -w '%{http_code}\n' https://mm.dubprod.fr/admin       # 307
curl -so /dev/null -w '%{http_code}\n' https://mm.dubprod.fr/admin/login # 200
```

Sur un téléphone, scanner le QR et faire **un envoi de photo complet**. C'est le
seul test qui valide la chaîne entière : HTTPS, accès à l'appareil photo,
compression, upload, miniature, galerie.

### Test réseau sur le lieu de réception

Le cahier des charges insiste, et c'est le vrai risque du projet. À faire
quelques jours avant, **sur place** :

1. Se connecter au wifi de la salle (ou en 4G, selon ce que les invités auront).
2. Envoyer une photo depuis deux ou trois endroits différents, dont le plus
   éloigné du point d'accès.
3. Vérifier que le diaporama se rafraîchit sur l'ordinateur du vidéoprojecteur.

Si le réseau est mauvais, la reprise automatique fait son travail (4 tentatives,
2 s / 5 s / 10 s, avec compte à rebours affiché) — mais mieux vaut le savoir
avant, et éventuellement prévoir un point d'accès 4G.

## 9. Le jour J

- **Diaporama** : ouvrir `https://mm.dubprod.fr/ecran` en plein écran (F11) sur
  l'ordinateur relié au vidéoprojecteur. Aucune identification, aucune
  interaction : la page défile seule et se rafraîchit toutes les 6 secondes.
- **Console du témoin** : `https://mm.dubprod.fr/admin`. Session de 12 heures,
  de quoi couvrir la soirée sans se reconnecter.
- Les défis restent **modifiables pendant la soirée** : en ajouter un à minuit
  fonctionne, il apparaît chez les invités au rafraîchissement suivant.

## 10. Après le mariage

Récupérer les photos, **puis** purger — dans cet ordre.

```bash
# 1. Export complet, depuis la console admin : « Télécharger toutes les photos (ZIP) »
#    Vérifier l'archive avant de continuer.

# 2. Sauvegarde du dossier de données, par précaution
sudo tar czf ~/defi-photo-sauvegarde.tar.gz -C /var/lib defi-photo

# 3. Purge, environ trois semaines après (cahier des charges §9)
cd /var/www/defi-photo
DATA_DIR=/var/lib/defi-photo npm run purge              # aperçu, ne supprime rien
DATA_DIR=/var/lib/defi-photo npm run purge -- --confirmer

# 4. Extinction
sudo systemctl disable --now defi-photo
```

La purge supprime les invités, les photos en base et les fichiers sur le
disque. Elle conserve les défis, qui ne sont pas des données personnelles.

Volontairement pas de tâche planifiée : une suppression irréversible qui part
toute seule est une mauvaise idée si personne n'a vérifié que l'export est bien
en main.

**Ou à la main**, si vous préférez ne rien exécuter : une fois le service
arrêté, tout tient dans un seul dossier.

```bash
sudo systemctl disable --now defi-photo
sudo rm -rf /var/lib/defi-photo    # base, photos et miniatures
```

C'est l'intérêt d'avoir tout regroupé sous `DATA_DIR` : il n'y a pas de données
personnelles ailleurs, ni dans le dossier de build, ni en base externe.

---

## Dépannage

| Symptôme | Cause probable |
|---|---|
| `502 Bad Gateway` | Le service ne tourne pas : `journalctl -u defi-photo -n 50` |
| L'appareil photo ne s'ouvre pas | Pas de HTTPS. Les navigateurs l'exigent pour la caméra. |
| Tout le monde bloqué sur `/admin/login` | `X-Forwarded-For` absent de la config du proxy (voir §5) |
| `Error: ADMIN_PASSWORD manquant` | `/etc/defi-photo.env` absent, illisible, ou `EnvironmentFile` mal renseigné |
| Photos disparues après un déploiement | `DATA_DIR` non défini : les données sont allées dans le dossier de build |
| Build tué par manque de mémoire | Ajouter du swap le temps du build |
