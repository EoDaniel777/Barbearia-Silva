# Configuração do Firebase Authentication

Este guia explica como configurar o Firebase Authentication no projeto Barbearia Silva.

## Passo 1: Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite o nome do projeto (ex: "barbearia-silva")
4. Siga os passos e clique em "Criar projeto"

## Passo 2: Registrar Aplicação Web

1. No console do Firebase, clique no ícone `</>` (Web)
2. Digite um apelido para o app (ex: "Barbearia Silva Web")
3. **NÃO** marque "Firebase Hosting" por enquanto
4. Clique em "Registrar app"
5. Copie as configurações fornecidas

## Passo 3: Configurar o Arquivo de Configuração

Edite o arquivo `frontend/config/firebase-config.js` e substitua os valores de exemplo pelas suas credenciais:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "barbearia-silva.firebaseapp.com",
    projectId: "barbearia-silva",
    storageBucket: "barbearia-silva.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456ghi789",
    measurementId: "G-XXXXXXXXXX"
};
```

## Passo 4: Ativar Métodos de Autenticação

1. No Firebase Console, vá em **Authentication** > **Sign-in method**
2. Ative os métodos desejados:
   - **Email/Password** - Recomendado
   - **Google** - Opcional

### Para ativar Email/Password:
1. Clique em "Email/Password"
2. Ative o botão de alternância
3. Clique em "Salvar"

### Para ativar Google Sign-In:
1. Clique em "Google"
2. Ative o botão de alternância
3. Escolha um email de suporte
4. Clique em "Salvar"

## Passo 5: Adicionar Scripts do Firebase ao HTML

Adicione os seguintes scripts no `<head>` das páginas que usarão autenticação:

```html
<!-- Firebase App (core) -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<!-- Firebase Authentication -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>

<!-- Configuração do Firebase -->
<script src="/config/firebase-config.js"></script>
<!-- Módulo de autenticação -->
<script src="/config/firebase-auth.js"></script>
```

**Exemplo completo** para a página de login (`frontend/shared/login/index.html`):

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Barbearia Silva</title>

    <!-- Firebase Scripts -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>

    <!-- Configuração Firebase -->
    <script src="/config/firebase-config.js"></script>
    <script src="/config/firebase-auth.js"></script>

    <link rel="stylesheet" href="/shared/login/css/login.css">
</head>
<body>
    <!-- Conteúdo da página -->
</body>
</html>
```

## Passo 6: Inicializar Firebase na Página

No seu JavaScript da página de login, inicialize o Firebase:

```javascript
// Inicializar Firebase quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Firebase
    const initialized = FirebaseAuth.initFirebase(firebaseConfig);

    if (!initialized) {
        console.error('Erro ao inicializar Firebase');
        return;
    }

    // Observar mudanças no estado de autenticação
    FirebaseAuth.onAuthStateChanged((user) => {
        if (user) {
            console.log('Usuário logado:', user.email);
            // Redirecionar para dashboard ou home
        } else {
            console.log('Usuário não logado');
        }
    });
});
```

## Passo 7: Implementar Login

Exemplo de uso no formulário de login:

```javascript
// Login com email e senha
async function handleLogin(email, password) {
    const result = await FirebaseAuth.loginWithEmail(email, password);

    if (result.success) {
        console.log('Login realizado com sucesso');
        // Salvar dados do usuário no localStorage
        localStorage.setItem('user', JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            nome: result.user.displayName || 'Usuário',
            foto: result.user.photoURL || null
        }));

        // Redirecionar
        window.location.href = '/dashboard';
    } else {
        console.error('Erro no login:', result.error);
        alert(result.error);
    }
}

// Login com Google
async function handleGoogleLogin() {
    const result = await FirebaseAuth.loginWithGoogle();

    if (result.success) {
        console.log('Login com Google realizado');
        // Salvar dados e redirecionar
        window.location.href = '/dashboard';
    } else {
        console.error('Erro:', result.error);
    }
}
```

## Passo 8: Implementar Registro

```javascript
async function handleRegister(email, password, nome) {
    const result = await FirebaseAuth.registerWithEmail(email, password);

    if (result.success) {
        // Atualizar perfil com nome
        await FirebaseAuth.updateUserProfile({
            displayName: nome
        });

        console.log('Registro realizado com sucesso');
        window.location.href = '/dashboard';
    } else {
        console.error('Erro no registro:', result.error);
        alert(result.error);
    }
}
```

## Passo 9: Implementar Logout

```javascript
async function handleLogout() {
    const result = await FirebaseAuth.logout();

    if (result.success) {
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
}
```

## Funções Disponíveis

O módulo `FirebaseAuth` oferece as seguintes funções:

- `initFirebase(config)` - Inicializa o Firebase
- `registerWithEmail(email, password)` - Registra novo usuário
- `loginWithEmail(email, password)` - Login com email/senha
- `loginWithGoogle()` - Login com Google
- `logout()` - Faz logout
- `resetPassword(email)` - Envia email de redefinição de senha
- `getCurrentUser()` - Retorna o usuário atual
- `onAuthStateChanged(callback)` - Observa mudanças de autenticação
- `updateUserProfile(profile)` - Atualiza perfil do usuário

## Segurança

### Regras do Firestore (se usar Firestore)

Configure as regras de segurança no Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita apenas para usuários autenticados
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Barbeiros - leitura pública, escrita apenas para admins
    match /barbeiros/{barbeiroId} {
      allow read: if true;
      allow write: if request.auth != null &&
                      get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
    }
  }
}
```

## Solução de Problemas

### Erro: "Firebase SDK não carregado"
- Verifique se os scripts do Firebase estão carregados antes do `firebase-auth.js`
- Verifique a conexão com internet

### Erro: "apiKey is invalid"
- Verifique se copiou corretamente as credenciais do Firebase Console
- Certifique-se de não ter espaços extras nas strings

### Popup de login do Google não abre
- Verifique se ativou o método no Firebase Console
- Certifique-se de que o domínio está autorizado em "Authorized domains"

## Recursos Adicionais

- [Documentação Firebase Auth](https://firebase.google.com/docs/auth)
- [Guia de Início Rápido](https://firebase.google.com/docs/auth/web/start)
- [Exemplos de Código](https://github.com/firebase/snippets-web)

## Próximos Passos

1. Integrar com o backend Go para sincronizar usuários
2. Adicionar upload de fotos de perfil no Firebase Storage
3. Implementar recuperação de senha
4. Adicionar autenticação de dois fatores (opcional)
