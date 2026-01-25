# Build stage
FROM golang:1.25.4-alpine AS builder

# Instalar dependências necessárias
RUN apk add --no-cache git gcc musl-dev

# Definir diretório de trabalho
WORKDIR /app

# Copiar go.mod e go.sum primeiro (cache de dependências)
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copiar código fonte
COPY backend/ ./

# Build da aplicação
RUN CGO_ENABLED=1 GOOS=linux go build -tags netgo -ldflags '-s -w -extldflags "-static"' -o app cmd/api/main.go

# Runtime stage
FROM alpine:latest

# Instalar ca-certificates para HTTPS
RUN apk --no-cache add ca-certificates tzdata

# Criar diretório de trabalho
WORKDIR /app

# Copiar binário do stage de build
COPY --from=builder /app/app .

# Copiar banco de dados (se existir)
COPY --from=builder /app/cmd/api/data ./cmd/api/data

# Criar diretório de dados se não existir
RUN mkdir -p /app/cmd/api/data

# Expor porta
EXPOSE 8080

# Definir variáveis de ambiente padrão
ENV PORT=8080
ENV GIN_MODE=release
ENV DATABASE_PATH=./cmd/api/data/barbearia.db

# Executar aplicação
CMD ["./app"]
