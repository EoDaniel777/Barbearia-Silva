package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
	"golang.org/x/crypto/bcrypt"
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
	DB, err = sql.Open("sqlite", dbPath)
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

	// Inserir dados iniciais (barbeiros e servicos)
	if err := insertDefaultData(); err != nil {
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

	CREATE TABLE IF NOT EXISTS barbeiros (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		nome TEXT NOT NULL,
		email TEXT UNIQUE NOT NULL,
		telefone TEXT,
		sexo TEXT NOT NULL CHECK(sexo IN ('Masculino', 'Feminino')),
		foto TEXT,
		especialidade TEXT,
		descricao TEXT,
		ativo INTEGER DEFAULT 1,
		criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
		atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS servicos (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		nome TEXT NOT NULL,
		descricao TEXT,
		preco REAL NOT NULL CHECK(preco >= 0),
		duracao INTEGER NOT NULL CHECK(duracao > 0),
		ativo INTEGER DEFAULT 1,
		criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
		atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS horarios_trabalho (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		barbeiro_id INTEGER NOT NULL,
		dia_semana INTEGER NOT NULL CHECK(dia_semana BETWEEN 0 AND 6),
		hora_inicio TEXT NOT NULL,
		hora_fim TEXT NOT NULL,
		ativo INTEGER DEFAULT 1,
		criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_horarios_barbeiro ON horarios(barbeiro_id);
	CREATE INDEX IF NOT EXISTS idx_horarios_data ON horarios(data_hora);
	CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
	CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
	CREATE INDEX IF NOT EXISTS idx_horarios_trabalho_barbeiro ON horarios_trabalho(barbeiro_id);
	CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON servicos(ativo);
	CREATE INDEX IF NOT EXISTS idx_barbeiros_ativo ON barbeiros(ativo);
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

	// Hash das senhas
	adminPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	clientePassword, _ := bcrypt.GenerateFromPassword([]byte("cliente123"), bcrypt.DefaultCost)

	// Inserir admin (senha: admin123)
	_, err = DB.Exec(`
		INSERT INTO usuarios (nome, email, senha, telefone, tipo)
		VALUES (?, ?, ?, ?, ?)
	`, "Alison Silva", "admin@barbearia.com", string(adminPassword), "(61) 99999-9999", "admin")
	if err != nil {
		return err
	}

	// Inserir cliente de teste (senha: cliente123)
	_, err = DB.Exec(`
		INSERT INTO usuarios (nome, email, senha, telefone, tipo)
		VALUES (?, ?, ?, ?, ?)
	`, "Cliente Teste", "cliente@teste.com", string(clientePassword), "(61) 88888-8888", "cliente")
	if err != nil {
		return err
	}

	log.Println("✓ Usuários padrão criados:")
	log.Println("  Admin: admin@barbearia.com / admin123")
	log.Println("  Cliente: cliente@teste.com / cliente123")

	return nil
}

// insertDefaultData insere dados iniciais de barbeiros e servicos
func insertDefaultData() error {
	// Verificar se já existem barbeiros
	var barbeiroCount int
	err := DB.QueryRow("SELECT COUNT(*) FROM barbeiros").Scan(&barbeiroCount)
	if err != nil {
		return err
	}

	if barbeiroCount == 0 {
		// Inserir barbeiro padrão (Alison Silva)
		_, err = DB.Exec(`
			INSERT INTO barbeiros (nome, email, telefone, sexo, especialidade, descricao, ativo)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`, "Alison Silva", "alison@barbearia.com", "(61) 99999-9999", "Masculino",
		   "Cortes modernos e tradicionais",
		   "Barbeiro profissional com mais de 10 anos de experiência", 1)
		if err != nil {
			return err
		}
		log.Println("✓ Barbeiro padrão criado: Alison Silva")
	}

	// Verificar se já existem servicos
	var servicoCount int
	err = DB.QueryRow("SELECT COUNT(*) FROM servicos").Scan(&servicoCount)
	if err != nil {
		return err
	}

	if servicoCount == 0 {
		// Inserir servicos padrão
		servicos := []struct {
			nome      string
			descricao string
			preco     float64
			duracao   int
		}{
			{"Corte", "Seu corte em 30 minutos. Qualidade e agilidade que você precisa.", 35.00, 30},
			{"Barba", "Sua barba em 30 minutos. Qualidade e agilidade que você precisa.", 35.00, 30},
			{"Kids", "Seu corte kids em 30 minutos. Qualidade e agilidade que você precisa.", 35.00, 30},
			{"Corte + Barba", "Combo completo: corte e barba com desconto especial.", 60.00, 60},
		}

		for _, s := range servicos {
			_, err = DB.Exec(`
				INSERT INTO servicos (nome, descricao, preco, duracao, ativo)
				VALUES (?, ?, ?, ?, ?)
			`, s.nome, s.descricao, s.preco, s.duracao, 1)
			if err != nil {
				return err
			}
		}
		log.Println("✓ Serviços padrão criados: Corte, Barba, Kids, Corte + Barba")
	}

	// Verificar se já existem horários de trabalho
	var horarioCount int
	err = DB.QueryRow("SELECT COUNT(*) FROM horarios_trabalho").Scan(&horarioCount)
	if err != nil {
		return err
	}

	if horarioCount == 0 {
		// Inserir horários de trabalho padrão (segunda a sexta, 9h às 18h)
		// dia_semana: 0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado
		diasUteis := []int{1, 2, 3, 4, 5} // Segunda a sexta
		for _, dia := range diasUteis {
			_, err = DB.Exec(`
				INSERT INTO horarios_trabalho (barbeiro_id, dia_semana, hora_inicio, hora_fim, ativo)
				VALUES (?, ?, ?, ?, ?)
			`, 1, dia, "09:00", "18:00", 1)
			if err != nil {
				return err
			}
		}
		// Sábado com horário reduzido (9h às 14h)
		_, err = DB.Exec(`
			INSERT INTO horarios_trabalho (barbeiro_id, dia_semana, hora_inicio, hora_fim, ativo)
			VALUES (?, ?, ?, ?, ?)
		`, 1, 6, "09:00", "14:00", 1)
		if err != nil {
			return err
		}
		log.Println("✓ Horários de trabalho criados: Seg-Sex 9h-18h, Sáb 9h-14h")
	}

	return nil
}

// Close fecha a conexão com o banco de dados
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
