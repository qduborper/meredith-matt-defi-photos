#!/usr/bin/env bash
#
# Envoie les sources sur le VPS, construit sur place et redémarre le service.
#
#   ./deploy/deployer.sh
#
# Le build se fait sur le serveur, à dessein : c'est le seul moyen d'avoir
# better-sqlite3 et sharp compilés pour la bonne architecture, la CLI Prisma
# disponible pour les migrations, et `tsx` pour le script de purge.

set -euo pipefail

SSH_HOST="${SSH_HOST:-votre-vps}"          # entrée correspondante dans ~/.ssh/config
REMOTE_DIR="${REMOTE_DIR:-/var/www/defi-photo}"
SERVICE="${SERVICE:-defi-photo}"

cd "$(dirname "$0")/.."

echo "→ Envoi des sources"
# --delete nettoie les fichiers supprimés, mais data/ et .env sont exclus :
# ils vivent sur le serveur et ne doivent jamais être écrasés par la machine
# de développement.
rsync -az --delete \
	--exclude '.git' \
	--exclude 'node_modules' \
	--exclude '.next' \
	--exclude 'data' \
	--exclude '.env' \
	--exclude 'qr' \
	./ "$SSH_HOST:$REMOTE_DIR/"

echo "→ Dépendances, migrations et build"
ssh "$SSH_HOST" "cd $REMOTE_DIR && npm ci && npm run build"

echo "→ Redémarrage du service"
ssh "$SSH_HOST" "sudo systemctl restart $SERVICE && sleep 3 && systemctl is-active $SERVICE"

echo "→ Vérification"
curl -sf -o /dev/null -w "  https://mm.dubprod.fr → %{http_code}\n" https://mm.dubprod.fr

echo "✓ Déployé"
