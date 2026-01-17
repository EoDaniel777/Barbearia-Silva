# Deploy no Render - Barbearia Silva

## 📋 Pré-requisitos

1. Conta no [Render](https://render.com)
2. Repositório GitHub: https://github.com/EoDaniel777/Barbearia-Silva

## 🚀 Deploy Automático com render.yaml

### Opção 1: Deploy via Dashboard do Render (Recomendado)

1. **Acesse o Render Dashboard**
   - Vá para: https://dashboard.render.com

2. **Novo Web Service**
   - Clique em "New +" → "Blueprint"
   - Conecte seu repositório GitHub: `EoDaniel777/Barbearia-Silva`
   - O Render detectará automaticamente o arquivo `render.yaml`

3. **Configurar Variáveis de Ambiente** (opcional)
   - Já estão definidas no `render.yaml`:
     - `PORT=8080`
     - `GIN_MODE=release`
     - `DATABASE_PATH=./cmd/api/data/barbearia.db`

4. **Deploy**
   - Clique em "Apply"
   - O Render fará o deploy automaticamente

### Opção 2: Deploy Manual (sem render.yaml)

1. **Novo Web Service**
   - Clique em "New +" → "Web Service"
   - Conecte o repositório: `EoDaniel777/Barbearia-Silva`

2. **Configurações:**
   ```
   Name: barbearia-silva-api
   Region: Oregon (US West)
   Branch: master
   Root Directory: (deixe vazio)
   Runtime: Go
   Build Command: cd backend && go build -o bin/server cmd/api/main.go
   Start Command: cd backend && ./bin/server
   ```

3. **Variáveis de Ambiente:**
   ```
   PORT=8080
   GIN_MODE=release
   DATABASE_PATH=./cmd/api/data/barbearia.db
   ```

4. **Plan:**
   - Selecione: **Free**

5. **Deploy:**
   - Clique em "Create Web Service"

## 🔧 Configurações Importantes

### Banco de Dados
O projeto usa SQLite. No Render Free tier, o banco será **efêmero** (dados podem ser perdidos em redeploys).

**Para produção, considere:**
- Migrar para PostgreSQL (Render oferece banco PostgreSQL gratuito)
- Usar disco persistente (apenas em planos pagos)

### Domínio
Após o deploy, você receberá uma URL como:
```
https://barbearia-silva-api.onrender.com
```

### Firebase (Login com Google)
Certifique-se de adicionar o domínio do Render nas configurações do Firebase:

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Projeto: `barbeariahom`
3. **Authentication** → **Settings** → **Authorized domains**
4. Adicione: `barbearia-silva-api.onrender.com`

## 🧪 Testar o Deploy

Após o deploy, teste os endpoints:

```bash
# Health check
curl https://barbearia-silva-api.onrender.com/health

# API
curl https://barbearia-silva-api.onrender.com/api/v1/ping

# Frontend
https://barbearia-silva-api.onrender.com/
```

## 🐛 Troubleshooting

### Erro de Build
```
Error: failed to build
```
**Solução:** Verifique se o `go.mod` e `go.sum` estão commitados no repositório.

### Erro 502 Bad Gateway
```
Application failed to respond
```
**Solução:**
- Verifique os logs no Render Dashboard
- Certifique-se que a aplicação está escutando na porta `$PORT` (definida pelo Render)

### Banco de Dados não inicializa
```
Error: unable to open database file
```
**Solução:** Verifique se o diretório `backend/cmd/api/data/` existe e tem as permissões corretas.

## 📝 Notas

- **Free Tier:** O serviço entra em modo sleep após 15 minutos de inatividade
- **Cold Start:** Primeira requisição após sleep pode demorar 30-60 segundos
- **Rebuild:** Acontece automaticamente a cada push na branch `master`

## 🔄 Atualizar Deploy

Para atualizar o deploy após fazer mudanças:

```bash
git add .
git commit -m "feat: descrição da mudança"
git push origin master
```

O Render fará o redeploy automaticamente!

## 🌐 Domínio Customizado (Opcional)

Para usar um domínio próprio:
1. Vá em: **Settings** → **Custom Domain**
2. Adicione seu domínio
3. Configure os DNS records conforme instruções do Render

---

**Deploy criado com Claude Sonnet 4.5** 🚀
