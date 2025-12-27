# Backend - Sistema de Barbearia

API REST para sistema de gestão de barbearia desenvolvida em Go com Gin framework.

## Estrutura do Projeto

```
backend/
├── cmd/
│   └── api/
│       └── main.go           # Entry point da aplicação
├── internal/
│   ├── handlers/             # HTTP handlers/controllers
│   ├── services/             # Lógica de negócio
│   ├── repositories/         # Acesso a dados
│   ├── models/               # Modelos de dados
│   └── middleware/           # Middlewares (auth, cors, etc)
├── config/                   # Configurações
├── pkg/                      # Pacotes públicos reutilizáveis
├── go.mod                    # Dependências Go
└── Makefile                  # Comandos úteis
```

## Requisitos

- Go 1.25.4 ou superior
- PostgreSQL (opcional, para produção)

## Instalação

1. Instale as dependências:
```bash
make install
```

2. Copie o arquivo de exemplo de variáveis de ambiente:
```bash
cp .env.example .env
```

3. Configure as variáveis de ambiente no arquivo `.env`

## Executando o Projeto

### Modo Development
```bash
make run
```

### Build para Produção
```bash
make build
./bin/api
```

### Com Hot Reload (requer air)
```bash
# Instalar air
go install github.com/air-verse/air@latest

# Executar com hot reload
make dev
```

## Endpoints Disponíveis

### Health Check
```
GET /health
```

Resposta:
```json
{
  "status": "OK",
  "message": "API is running"
}
```

### Test Endpoint
```
GET /teste
```

Resposta:
```json
{
  "message": "testado"
}
```

### API v1
```
GET /api/v1/ping
```

## Comandos Makefile

- `make run` - Executa a aplicação
- `make build` - Compila a aplicação
- `make test` - Executa os testes
- `make test-coverage` - Executa testes com coverage
- `make clean` - Remove arquivos de build
- `make install` - Instala dependências
- `make fmt` - Formata o código
- `make lint` - Executa linter (requer golangci-lint)

## Estrutura de Camadas

### Handlers
Responsáveis por receber requisições HTTP e retornar respostas.

### Services
Contém a lógica de negócio da aplicação.

### Repositories
Gerencia o acesso aos dados (banco de dados, APIs externas, etc).

### Models
Define as estruturas de dados utilizadas na aplicação.

### Middleware
Funções intermediárias para autenticação, logging, CORS, etc.

## Próximos Passos

- [ ] Implementar autenticação JWT
- [ ] Adicionar conexão com banco de dados
- [ ] Criar endpoints para agendamentos
- [ ] Implementar CRUD de clientes
- [ ] Implementar CRUD de serviços
- [ ] Adicionar middleware de CORS
- [ ] Implementar testes unitários
- [ ] Adicionar documentação Swagger

## Tecnologias

- **Framework**: Gin Web Framework
- **Language**: Go 1.25.4
- **Architecture**: Clean Architecture / Layered Architecture
