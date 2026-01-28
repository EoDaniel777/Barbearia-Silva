# 🚀 Guia de Configuração: Deploy Automático

Este guia explica como configurar deploy automático no Render usando 2 métodos.

---

## 📋 Índice

1. [Método 1: Deploy Automático Nativo do Render (RECOMENDADO)](#método-1-deploy-automático-nativo-do-render)
2. [Método 2: GitHub Actions + Render](#método-2-github-actions--render)
3. [Troubleshooting](#troubleshooting)

---

## Método 1: Deploy Automático Nativo do Render (RECOMENDADO)

**Vantagens:**
- ✅ Mais simples de configurar
- ✅ Sem necessidade de GitHub Actions
- ✅ Deploy automático a cada push
- ✅ Usa o `render.yaml` que já existe

### Passo 1: Configurar no Render Dashboard

1. Acesse: https://dashboard.render.com/
2. Vá no seu serviço **barbearia-silva-api**
3. Clique em **"Settings"** (⚙️)

### Passo 2: Conectar GitHub Repository

4. Na seção **"Build & Deploy"**, verifique:
   - **Branch:** `master` (ou `prod` se usar essa)
   - **Auto-Deploy:** ✅ **YES** (deve estar ativado!)

5. Se não estiver conectado ao GitHub:
   - Clique em **"Connect a Git provider"**
   - Selecione **GitHub**
   - Autorize o Render
   - Escolha o repositório: `EoDaniel777/Barbearia-Silva` (público) ou `B-Evil/System-Barbearia-AS` (privado)

### Passo 3: Verificar render.yaml

6. O Render vai detectar automaticamente o arquivo `render.yaml` na raiz do projeto
7. Se perguntar "Usar render.yaml?", clique **YES**

### Passo 4: Testar Deploy Automático

```bash
# Faça uma mudança qualquer
echo "# Test deploy" >> README.md

# Commit e push
git add .
git commit -m "test: validar deploy automático"
git push origin master
```

8. O Render vai detectar o push e iniciar o deploy automaticamente!
9. Acompanhe em: https://dashboard.render.com/ > Seu serviço > **"Events"**

### ✅ Pronto! Deploy automático configurado!

Agora toda vez que você der `git push`, o Render faz deploy sozinho.

---

## Método 2: GitHub Actions + Render

**Vantagens:**
- ✅ Mais controle sobre o processo
- ✅ Rodar testes antes do deploy
- ✅ Logs no GitHub Actions
- ✅ Deploy manual quando quiser

**Use se:** Você quer testar o build antes de fazer deploy ou precisa rodar testes automatizados.

### Passo 1: Obter Deploy Hook URL do Render

1. Acesse: https://dashboard.render.com/
2. Vá no serviço **barbearia-silva-api**
3. Clique em **"Settings"** > **"Deploy Hook"**
4. Copie a URL (formato: `https://api.render.com/deploy/srv-xxxxx?key=yyyyy`)

### Passo 2: Adicionar Secret no GitHub

5. Acesse o repositório no GitHub (o público ou privado)
6. Vá em: **Settings** > **Secrets and variables** > **Actions**
7. Clique em **"New repository secret"**
8. Crie o secret:
   - **Name:** `RENDER_DEPLOY_HOOK_URL`
   - **Secret:** Cole a URL do Deploy Hook
   - Clique **"Add secret"**

### Passo 3: Ativar GitHub Actions

9. O workflow já está criado em: `.github/workflows/deploy-render.yml`
10. Faça push para ativar:

```bash
git add .github/workflows/deploy-render.yml
git commit -m "ci: adiciona GitHub Actions para deploy automático"
git push origin master
```

### Passo 4: Verificar Execução

11. Acesse: https://github.com/SEU_USUARIO/SEU_REPO/actions
12. Você verá o workflow **"Deploy to Render"** rodando
13. Clique para ver os logs em tempo real

### Passo 5: Deploy Manual (Opcional)

Se quiser fazer deploy sem dar push:

1. Vá em **Actions** no GitHub
2. Selecione **"Deploy to Render"**
3. Clique em **"Run workflow"**
4. Escolha a branch e clique **"Run workflow"**

### ✅ Pronto! GitHub Actions configurado!

---

## 🎯 Qual método escolher?

| Critério | Método 1 (Render) | Método 2 (Actions) |
|----------|-------------------|---------------------|
| **Simplicidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Controle** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Testes automatizados** | ❌ | ✅ |
| **Deploy manual** | ❌ | ✅ |
| **Logs centralizados** | Render | GitHub + Render |
| **Custo** | Grátis | Grátis |

**Recomendação:** Use **Método 1** se você só quer deploy simples e rápido.

Use **Método 2** se você precisa rodar testes ou ter mais controle.

---

## 🔧 Troubleshooting

### Problema: render.yaml não está sendo detectado

**Solução:**
1. Verifique que o arquivo está na **raiz do projeto** (não dentro de pastas)
2. Nome deve ser exatamente `render.yaml` (não `render.yml`)
3. No Render Dashboard, force re-deploy: **Manual Deploy** > **"Deploy latest commit"**

### Problema: Deploy falha no build

**Erro comum:**
```
Error: Go version 1.25.4 not found
```

**Solução:**
No `render.yaml`, o comando de build já instala Go 1.25.4:
```yaml
buildCommand: go install golang.org/dl/go1.25.4@latest && ~/go/bin/go1.25.4 download && cd backend && ~/go/bin/go1.25.4 build -tags netgo -ldflags '-s -w' -o cmd/api/app cmd/api/main.go
```

Se persistir, use o build command direto no Render Dashboard (sem render.yaml).

### Problema: GitHub Actions falha com "RENDER_DEPLOY_HOOK_URL not found"

**Solução:**
1. Verifique que o secret foi criado corretamente no GitHub
2. Nome deve ser exatamente `RENDER_DEPLOY_HOOK_URL` (case-sensitive)
3. Refaça o push após criar o secret

### Problema: Deploy está muito lento

**Causa:** Render Free Tier faz "cold start" após 15 min de inatividade.

**Soluções:**
- Upgrade para plano pago (sem cold start)
- Use serviço de "keep-alive" como UptimeRobot (ping a cada 5 min)
- Migre para Railway ou Fly.io (têm planos free melhores)

### Problema: Banco de dados SQLite é perdido após deploy

**Causa:** Render Free Tier tem filesystem efêmero.

**Solução:**
- Upgrade para plano com disco persistente
- Ou migre para PostgreSQL (Render oferece free tier com 1GB)

---

## 📚 Referências

- [Render Deploy Hooks](https://render.com/docs/deploy-hooks)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [render.yaml Specification](https://render.com/docs/infrastructure-as-code)

---

## 🆘 Precisa de ajuda?

Se tiver problemas, abra uma issue no repositório ou consulte os logs:
- **Render:** https://dashboard.render.com/ > Seu serviço > "Logs"
- **GitHub Actions:** https://github.com/SEU_REPO/actions

---

**Última atualização:** 28/01/2026
