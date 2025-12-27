package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

// InitSQLite inicializa a conexão com o banco de dados SQLite
func InitSQLite() error {
	// Criar diretório data se não existir
	dataDir := filepath.Join(".", "data")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return err
	}

	// Conectar ao banco de dados
	dbPath := filepath.Join(dataDir, "barbearia.db")
	var err error
	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}

	// Testar conexão
	if err := DB.Ping(); err != nil {
		return err
	}

	log.Println("✓ Conectado ao banco de dados SQLite")

	// Criar tabelas
	if err := createTables(); err != nil {
		return err
	}

	// Executar migrações
	if err := runMigrations(); err != nil {
		return err
	}

	// Inserir usuários padrão
	if err := insertDefaultUsers(); err != nil {
		return err
	}

	return nil
}

// createTables cria as tabelas necessárias
func createTables() error {
	schema := `
	CREATE TABLE IF NOT EXISTS usuarios (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		nome TEXT NOT NULL,
		email TEXT UNIQUE NOT NULL,
		senha TEXT NOT NULL,
		telefone TEXT,
		tipo TEXT NOT NULL CHECK(tipo IN ('cliente', 'admin')),
		criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
		atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS horarios (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		barbeiro_id INTEGER NOT NULL,
		cliente_nome TEXT NOT NULL,
		telefone TEXT NOT NULL,
		servico_id INTEGER NOT NULL,
		data_hora TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente', 'confirmado', 'cancelado', 'concluido')),
		criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS notificacoes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		usuario_id INTEGER NOT NULL,
		tipo TEXT NOT NULL,
		titulo TEXT,
		mensagem TEXT NOT NULL,
		lida INTEGER DEFAULT 0,
		horario_id INTEGER,
		criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
		FOREIGN KEY (horario_id) REFERENCES horarios(id)
	);

	CREATE INDEX IF NOT EXISTS idx_horarios_barbeiro ON horarios(barbeiro_id);
	CREATE INDEX IF NOT EXISTS idx_horarios_data ON horarios(data_hora);
	CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
	CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
	`

	_, err := DB.Exec(schema)
	if err != nil {
		return err
	}

	log.Println("✓ Tabelas criadas com sucesso")
	return nil
}

// runMigrations executa migrações de banco de dados
func runMigrations() error {
	// Adicionar coluna titulo à tabela notificacoes se não existir
	_, err := DB.Exec(`
		ALTER TABLE notificacoes ADD COLUMN titulo TEXT
	`)
	// Ignorar erro se a coluna já existir
	if err != nil && err.Error() != "duplicate column name: titulo" {
		// Verificar se é erro de coluna duplicada (já existe)
		// SQLite não tem IF NOT EXISTS para ALTER TABLE ADD COLUMN
		// então tentamos adicionar e ignoramos se já existir
	}

	log.Println("✓ Migrações executadas com sucesso")
	return nil
}

// insertDefaultUsers insere usuários padrão para testes
func insertDefaultUsers() error {
	// Verificar se já existem usuários
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM usuarios").Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		log.Println("✓ Usuários padrão já existem")
		return nil
	}

	// Inserir admin (senha: admin123)
	_, err = DB.Exec(`
		INSERT INTO usuarios (nome, email, senha, telefone, tipo)
		VALUES (?, ?, ?, ?, ?)
	`, "Alison Silva", "admin@barbearia.com", "admin123", "(61) 99999-9999", "admin")
	if err != nil {
		return err
	}

	// Inserir cliente de teste (senha: cliente123)
	_, err = DB.Exec(`
		INSERT INTO usuarios (nome, email, senha, telefone, tipo)
		VALUES (?, ?, ?, ?, ?)
	`, "Cliente Teste", "cliente@teste.com", "cliente123", "(61) 88888-8888", "cliente")
	if err != nil {
		return err
	}

	log.Println("✓ Usuários padrão criados:")
	log.Println("  Admin: admin@barbearia.com / admin123")
	log.Println("  Cliente: cliente@teste.com / cliente123")

	return nil
}

// Close fecha a conexão com o banco de dados
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
