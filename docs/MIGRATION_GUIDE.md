# Guia de Migração - Nova Estrutura do Projeto

## Mudanças Realizadas

O projeto foi completamente reestruturado para seguir as melhores práticas de desenvolvimento profissional.

## Estrutura Antiga vs Nova

### Antiga
```
System-Barbearia-AS-prod/
├── backend-barber-github/
│   └── main.go
├── Front-Barbearia-home/
└── Dashboard/
```

### Nova (Profissional)
```
BarbeariaSilva/
├── backend/                          # Backend Go
│   ├── cmd/
│   │   └── api/
│   │       └── main.go              # Entry point
│   ├── internal/
│   │   ├── handlers/                # HTTP handlers (routes)
│   │   │   ├── health.go
│   │   │   └── router.go
│   │   ├── services/                # Business logic
│   │   ├── repositories/            # Data access layer
│   │   ├── models/                  # Data models
│   │   └── middleware/              # Auth, CORS, etc
│   ├── config/                      # Configuration
│   │   └── config.go
│   ├── pkg/                         # Public packages
│   ├── go.mod
│   ├── go.sum
│   ├── Makefile                     # Dev commands
│   ├── README.md                    # Backend docs
│   └── .env.example                 # Environment variables example
│
├── frontend/                         # Frontend (separado)
│   ├── customer/                    # Portal do cliente
│   │   ├── index.html              # (era home.html)
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   │       ├── icons/
│   │       └── images/
│   │
│   └── dashboard/                   # Admin dashboard
│       ├── index.html              # (era dashboard.html)
│       ├── css/
│       ├── js/
│       └── assets/
│           ├── icons/
│           └── images/
│
├── docs/                            # Documentação
├── .gitignore                       # Arquivos ignorados pelo git
└── README.md                        # Docs principal do projeto
```

## Como Executar o Backend

### Opção 1: Usando Make (Recomendado)
```bash
cd backend
make run
```

### Opção 2: Comando Go direto
```bash
cd backend
go run cmd/api/main.go
```

### Opção 3: Build e executar
```bash
cd backend
make build
./bin/api
```

## Endpoints Disponíveis

A nova estrutura criou os seguintes endpoints:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/health` | GET | Health check da API |
| `/teste` | GET | Endpoint de teste (mantido da versão anterior) |
| `/api/v1/ping` | GET | Ping endpoint para API v1 |

## Arquitetura em Camadas

### 1. Handlers (internal/handlers/)
- Responsáveis por receber requisições HTTP
- Validação de entrada
- Retornar respostas HTTP

### 2. Services (internal/services/)
- Lógica de negócio
- Regras da aplicação
- Orquestração entre repositories

### 3. Repositories (internal/repositories/)
- Acesso a dados
- Queries ao banco de dados
- Integração com APIs externas

### 4. Models (internal/models/)
- Estruturas de dados
- DTOs (Data Transfer Objects)
- Entidades do domínio

### 5. Middleware (internal/middleware/)
- Autenticação JWT
- CORS
- Logging
- Rate limiting

## Comandos Úteis do Makefile

```bash
make run              # Executar aplicação
make build            # Compilar
make test             # Rodar testes
make test-coverage    # Testes com coverage
make clean            # Limpar build artifacts
make install          # Instalar dependências
make fmt              # Formatar código
```

## Configuração de Ambiente

1. Copie o arquivo `.env.example`:
```bash
cd backend
cp .env.example .env
```

2. Edite o `.env` com suas configurações:
```env
PORT=8080
GIN_MODE=debug
DB_HOST=localhost
DB_PORT=5432
# ... etc
```

## Migrando do Código Antigo

### Se você estava executando:
```bash
cd backend-barber-github
go run main.go
```

### Agora execute:
```bash
cd backend
make run
# ou
go run cmd/api/main.go
```

## Frontend

Os arquivos do frontend foram reorganizados:

### Customer Portal
- **Antes**: `Front-Barbearia-home/home.html`
- **Agora**: `frontend/customer/index.html`

### Dashboard
- **Antes**: `Dashboard/dashboard.html`
- **Agora**: `frontend/dashboard/index.html`

## Próximos Passos Recomendados

1. **Configurar banco de dados**
   - Criar migrations
   - Implementar repositories

2. **Adicionar autenticação**
   - JWT middleware
   - Login/Register endpoints

3. **Implementar CRUDs**
   - Clientes
   - Agendamentos
   - Serviços
   - Barbeiros

4. **Adicionar testes**
   - Testes unitários
   - Testes de integração

5. **Documentação API**
   - Swagger/OpenAPI
   - Postman collection

6. **CI/CD**
   - GitHub Actions
   - Docker
   - Deploy automático

## Limpeza (Opcional)

Após verificar que tudo está funcionando, você pode remover as pastas antigas:

```bash
# ATENÇÃO: Só faça isso após verificar que tudo está funcionando!
cd /home/daniel/Documentos/Barbearia/Barber/BarbeariaSilva
rm -rf backend-barber-github
rm -rf Front-Barbearia-home
rm -rf Dashboard
```

## Suporte

Se encontrar algum problema:
1. Verifique se está no diretório correto
2. Execute `go mod tidy` no diretório backend
3. Verifique se a porta 8080 está livre
4. Consulte o README.md do backend

## Benefícios da Nova Estrutura

✅ Separação clara entre backend e frontend
✅ Arquitetura em camadas (Clean Architecture)
✅ Fácil manutenção e escalabilidade
✅ Testes mais simples de implementar
✅ Melhor organização de código
✅ Seguindo padrões da comunidade Go
✅ Pronto para crescer (adicionar features, microsserviços, etc)
