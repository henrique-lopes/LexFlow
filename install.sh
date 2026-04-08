#!/bin/bash
# ════════════════════════════════════════════════════════════════
# LexFlow — Script de instalação local
# Requisitos: PHP 8.2+, Composer, Node 18+, MySQL
# ════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ██╗     ███████╗██╗  ██╗███████╗██╗      ██████╗ ██╗    ██╗"
echo "  ██║     ██╔════╝╚██╗██╔╝██╔════╝██║     ██╔═══██╗██║    ██║"
echo "  ██║     █████╗   ╚███╔╝ █████╗  ██║     ██║   ██║██║ █╗ ██║"
echo "  ██║     ██╔══╝   ██╔██╗ ██╔══╝  ██║     ██║   ██║██║███╗██║"
echo "  ███████╗███████╗██╔╝ ██╗██║     ███████╗╚██████╔╝╚███╔███╔╝"
echo "  ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝"
echo -e "${NC}"
echo ""

# ── Passo 1: Criar banco MySQL ───────────────────────────────────
echo -e "${YELLOW}[1/7] Configurando banco de dados MySQL...${NC}"
read -p "    Usuário MySQL [root]: " DB_USER
DB_USER=${DB_USER:-root}
read -s -p "    Senha MySQL: " DB_PASS
echo ""
read -p "    Nome do banco [lexflow]: " DB_NAME
DB_NAME=${DB_NAME:-lexflow}

mysql -u"$DB_USER" ${DB_PASS:+-p"$DB_PASS"} -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null \
    && echo -e "    ${GREEN}✓ Banco '$DB_NAME' criado/verificado${NC}" \
    || echo -e "    ⚠️  Não foi possível criar o banco. Crie manualmente: CREATE DATABASE $DB_NAME;"

# ── Passo 2: .env ────────────────────────────────────────────────
echo -e "${YELLOW}[2/7] Configurando .env...${NC}"
cp .env.example .env

sed -i "s/DB_DATABASE=lexflow/DB_DATABASE=$DB_NAME/" .env
sed -i "s/DB_USERNAME=root/DB_USERNAME=$DB_USER/" .env
sed -i "s/DB_PASSWORD=/DB_PASSWORD=$DB_PASS/" .env

echo -e "    ${GREEN}✓ .env configurado${NC}"

# ── Passo 3: Composer ────────────────────────────────────────────
echo -e "${YELLOW}[3/7] Instalando dependências PHP (Composer)...${NC}"
composer install --no-interaction --prefer-dist --optimize-autoloader
echo -e "    ${GREEN}✓ Dependências PHP instaladas${NC}"

# ── Passo 4: App key ─────────────────────────────────────────────
echo -e "${YELLOW}[4/7] Gerando APP_KEY...${NC}"
php artisan key:generate --ansi
echo -e "    ${GREEN}✓ APP_KEY gerada${NC}"

# ── Passo 5: Migrations + Seed ───────────────────────────────────
echo -e "${YELLOW}[5/7] Rodando migrations e seed...${NC}"
php artisan migrate --force
php artisan db:seed --force
echo -e "    ${GREEN}✓ Banco populado com dados de demonstração${NC}"

# ── Passo 6: NPM ─────────────────────────────────────────────────
echo -e "${YELLOW}[6/7] Instalando dependências JS (NPM)...${NC}"
npm install
npm run build
echo -e "    ${GREEN}✓ Assets compilados${NC}"

# ── Passo 7: Storage link ────────────────────────────────────────
echo -e "${YELLOW}[7/7] Configurando storage...${NC}"
php artisan storage:link
php artisan config:cache
php artisan route:cache
echo -e "    ${GREEN}✓ Storage configurado${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅  LexFlow instalado com sucesso!         ${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "  📧  Login: ${CYAN}admin@lexflow.test${NC}"
echo -e "  🔑  Senha: ${CYAN}password${NC}"
echo ""
echo -e "  Para iniciar o servidor:"
echo -e "  ${YELLOW}php artisan serve${NC}"
echo ""
echo -e "  Acesse: ${CYAN}http://localhost:8000${NC}"
echo ""
