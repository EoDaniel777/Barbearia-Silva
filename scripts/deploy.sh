#!/bin/bash
# Script para trigger manual de deploy no Render
# Uso: ./scripts/deploy.sh

set -e

echo "🚀 Iniciando deploy manual no Render..."
echo ""

# Verificar se o RENDER_DEPLOY_HOOK_URL está configurado
if [ -z "$RENDER_DEPLOY_HOOK_URL" ]; then
    echo "❌ Erro: RENDER_DEPLOY_HOOK_URL não está configurado!"
    echo ""
    echo "Para configurar:"
    echo "1. Acesse: https://dashboard.render.com/"
    echo "2. Vá em Settings > Deploy Hook"
    echo "3. Copie a URL"
    echo "4. Execute: export RENDER_DEPLOY_HOOK_URL='sua-url-aqui'"
    echo ""
    echo "Ou adicione no seu ~/.bashrc:"
    echo "export RENDER_DEPLOY_HOOK_URL='sua-url-aqui'"
    exit 1
fi

# Confirmar deploy
echo "Repositório: $(git remote get-url origin)"
echo "Branch atual: $(git branch --show-current)"
echo "Último commit: $(git log -1 --oneline)"
echo ""
read -p "Confirma deploy? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Deploy cancelado."
    exit 0
fi

# Trigger deploy
echo "📡 Enviando requisição para Render..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$RENDER_DEPLOY_HOOK_URL")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Deploy iniciado com sucesso!"
    echo ""
    echo "Acompanhe o progresso em:"
    echo "https://dashboard.render.com/"
    echo ""
    echo "Quando finalizar, acesse:"
    echo "https://barbearia-silva-api.onrender.com"
else
    echo "❌ Erro ao iniciar deploy! HTTP Code: $HTTP_CODE"
    exit 1
fi
