# 🚀 Instruções de Configuração - Barbearia Silva

### 📦 Instalação Completa:

1. **Instale as dependências atualizadas:**
```bash
npm install
```

2. **Renomeie o arquivo do servidor:**
```bash
# Windows
ren server.js server-old.js
ren server-sqlite.js server.js

# Linux/Mac
mv server.js server-old.js
mv server-sqlite.js server.js
```

3. **Crie a pasta para uploads:**
```bash
mkdir -p public/uploads
mkdir -p public/images
```

4. **Adicione sua logo:**
   - Coloque seu arquivo `logo.png` na pasta `public/images/`
   - Tamanho recomendado: 400x400px

5. **Inicie o servidor:**
```bash
npm start
```

## 🔐 Como Acessar o Admin:

1. Vá para a tela de login
2. Clique **7 vezes** no canto superior esquerdo (área invisível)
3. Confirme que é administrador
4. Use as credenciais:
   - **Email:** admin@barbearia.com
   - **Senha:** admin123

## 📊 Banco de Dados SQLite:

### Vantagens:
- ✅ Arquivo único (`barbershop.db`)
- ✅ Sem necessidade de servidor separado
- ✅ Perfeito para Hostinger
- ✅ Backup fácil (copiar arquivo)
- ✅ Suporta milhares de usuários

### Estrutura:
- **users** - Usuários do sistema
- **admins** - Administradores
- **barbers** - Barbeiros
- **services** - Serviços oferecidos
- **appointments** - Agendamentos

## 🌐 Deploy na Hostinger:

1. **Faça upload de todos os arquivos** via FTP
2. **Configure o Node.js** no painel da Hostinger
3. **Defina as variáveis de ambiente:**
   ```
   NODE_ENV=production
   PORT=3000
   ```
4. **Execute o comando de start**

## 📱 Funcionalidades Novas:

### Para Usuários:
- **Perfil completo** com foto
- **Navegação melhorada** com bottom nav
- **Agendamentos organizados** (próximos/passados)
- **Interface 100% em português**

### Para Admin:
- **Notificações automáticas** de novos agendamentos
- **Dashboard com estatísticas reais**
- **Gestão completa** via banco de dados

## 🔧 Personalização:

### Cores (em `styles.css`):
```css
--primary-color: #6366F1;  /* Roxo principal */
--background-dark: #1F2937; /* Fundo escuro */
```

### Logo:
- Adicione `logo.png` em `public/images/`
- Formato: PNG com fundo transparente
- Tamanho: 400x400px recomendado

## 🚨 Solução de Problemas:

### Erro de módulo não encontrado:
```bash
npm install sqlite3 multer
```

### Erro de permissão:
```bash
chmod 755 public/uploads
chmod 755 public/images
```

### Banco de dados não criado:
- O arquivo `barbershop.db` é criado automaticamente
- Verifique permissões de escrita na pasta

## 📞 Próximos Passos:

1. **Sistema de notificações** por email/SMS
2. **Integração com WhatsApp**
3. **Relatórios avançados**
4. **Sistema de avaliações**
5. **Múltiplas unidades**

O sistema está 100% funcional e pronto para produção!#   B a r b e a r i a - S i l v a  
 #   B a r b e a r i a - S i l v a  
 