# 🚀 Quick Start - Deploy Automático

Guia rápido para deploy automático do projeto Barbearia Silva.

---

## ⚡ TL;DR - Configuração Rápida

### Método Mais Simples (RECOMENDADO):

1. **Ativar Auto-Deploy no Render:**
   ```
   https://dashboard.render.com/
   → Seu serviço
   → Settings
   → Auto-Deploy: YES
   ```

2. **Dar push e pronto:**
   ```bash
   git add .
   git commit -m "feat: nova funcionalidade"
   git push origin master
   ```

**✅ Deploy acontece automaticamente!**

---

## 📦 Comandos Úteis

### Deploy Manual (via script)

```bash
# 1. Configure a URL do deploy hook (só precisa fazer uma vez)
export RENDER_DEPLOY_HOOK_URL='https://api.render.com/deploy/srv-xxxxx?key=yyyyy'

# 2. Execute o script
./scripts/deploy.sh
```

### Desenvolvimento Local

```bash
# Rodar servidor local
cd backend/cmd/api
go run main.go

# Acesse: http://localhost:8080
```

### Build Local

```bash
# Build com script existente
./build.sh

# Ou build manual
cd backend
go build -o cmd/api/app cmd/api/main.go
```

### Docker

```bash
# Build da imagem
docker build -t barbearia-silva .

# Rodar container
docker run -p 8080:8080 barbearia-silva

# Acesse: http://localhost:8080
```

### Git Workflow

```bash
# Atualizar do remoto
git pull origin master

# Adicionar mudanças
git add .

# Commit
git commit -m "feat: descrição da mudança"

# Push (trigger auto-deploy)
git push origin master
```

---

## 🔧 Configuração GitHub Actions (Opcional)

Se você quer mais controle e rodar testes antes do deploy:

### 1. Obter Deploy Hook URL

```
https://dashboard.render.com/
→ Seu serviço
→ Settings
→ Deploy Hook
→ Copiar URL
```

### 2. Adicionar Secret no GitHub

```
https://github.com/SEU_USER/SEU_REPO/settings/secrets/actions
→ New repository secret
→ Name: RENDER_DEPLOY_HOOK_URL
→ Secret: <cole a URL>
→ Add secret
```

### 3. Push do workflow

```bash
git add .github/workflows/
git commit -m "ci: adiciona GitHub Actions"
git push origin master
```

**✅ Workflows ativos:**
- `ci.yml` - Build e testes (em todos os pushes)
- `deploy-render.yml` - Deploy automático (só em master/prod)

---

## 📊 Monitoramento

### Ver logs em tempo real (Render)

```
https://dashboard.render.com/
→ Seu serviço
→ Logs (ou Events)
```

### Ver execução do GitHub Actions

```
https://github.com/SEU_USER/SEU_REPO/actions
```

### Health Check

```bash
# Verificar se API está online
curl https://barbearia-silva-api.onrender.com/health

# Deve retornar: {"status":"ok"}
```

---

## 🐛 Troubleshooting Rápido

### Deploy não está automático

1. Render Dashboard → Settings → Auto-Deploy deve estar **YES**
2. Branch configurado deve ser **master** (ou a que você usa)
3. Repositório conectado ao GitHub

### GitHub Actions falha

1. Verificar que secret `RENDER_DEPLOY_HOOK_URL` está criado
2. Ver logs em: https://github.com/SEU_REPO/actions
3. Re-run do workflow se necessário

### API não responde (Cold Start)

Render Free Tier "dorme" após 15 min de inatividade.

**Primeira requisição demora 30-60s** - é normal!

Soluções:
- Upgrade para plano pago
- Usar serviço de keep-alive (UptimeRobot)

### Build falha

```bash
# Testar build localmente antes de dar push
cd backend
go build -o cmd/api/app cmd/api/main.go

# Se funcionar local, problema é no Render
```

Verificar:
- `render.yaml` está na raiz do projeto
- Build command correto nas Settings do Render

---

## 📚 Documentação Completa

- **Configuração detalhada:** `GITHUB_ACTIONS_SETUP.md`
- **Deploy no Render:** `DEPLOY.md`
- **Documentação do projeto:** `README.md`

---

## 🆘 Suporte

Problemas? Verifique:
1. Logs do Render: https://dashboard.render.com/
2. Logs do GitHub Actions: https://github.com/SEU_REPO/actions
3. Abra issue no repositório

---

**Última atualização:** 28/01/2026
