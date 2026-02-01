package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"strings"

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

	// Inserir configurações padrão
	if err := insertDefaultConfig(); err != nil {
		return err
	}

	// Inserir personalização padrão
	if err := insertDefaultPersonalizacao(); err != nil {
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
		duracao INTEGER NOT NULL CHECK(duracao >= 0),
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

	CREATE TABLE IF NOT EXISTS comandas (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		cliente_nome TEXT NOT NULL,
		barbeiro_id INTEGER NOT NULL,
		data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
		data_fechamento DATETIME,
		status TEXT NOT NULL DEFAULT 'aberta' CHECK(status IN ('aberta', 'fechada', 'cancelada')),
		total REAL DEFAULT 0.0 CHECK(total >= 0),
		forma_pagamento TEXT CHECK(forma_pagamento IN ('dinheiro', 'pix', 'cartao')),
		observacoes_pgto TEXT,
		criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id)
	);

	CREATE TABLE IF NOT EXISTS itens_comanda (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		comanda_id INTEGER NOT NULL,
		tipo TEXT NOT NULL CHECK(tipo IN ('servico', 'produto')),
		item_id INTEGER NOT NULL,
		nome TEXT NOT NULL,
		quantidade INTEGER NOT NULL DEFAULT 1 CHECK(quantidade > 0),
		preco_unitario REAL NOT NULL CHECK(preco_unitario >= 0),
		subtotal REAL NOT NULL CHECK(subtotal >= 0),
		criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (comanda_id) REFERENCES comandas(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS configuracoes (
		id INTEGER PRIMARY KEY CHECK(id = 1),
		nome TEXT,
		telefone TEXT,
		whatsapp TEXT,
		endereco TEXT,
		instagram TEXT,
		email TEXT,
		criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
		atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS personalizacao (
		id INTEGER PRIMARY KEY CHECK(id = 1),
		-- Esquema de Cores
		cor_primaria TEXT DEFAULT '#0D7CA4',
		cor_secundaria TEXT DEFAULT '#0a6282',
		cor_destaque TEXT DEFAULT '#D4AF37',
		cor_header TEXT DEFAULT '#090A0C',
		cor_texto TEXT DEFAULT '#1C1C1E',
		cor_texto_claro TEXT DEFAULT '#FFFFFF',
		-- Tipografia
		fonte_familia TEXT DEFAULT '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
		fonte_tamanho TEXT DEFAULT '16px',
		-- Logos
		logo_escuro TEXT DEFAULT '',
		logo_claro TEXT DEFAULT '',
		favicon TEXT DEFAULT '',
		-- Banner/Hero
		banner_imagem TEXT DEFAULT '',
		banner_titulo TEXT DEFAULT 'Barbearia Silva',
		banner_subtitulo TEXT DEFAULT 'Estilo e Qualidade',
		banner_altura TEXT DEFAULT 'medio',
		-- Redes Sociais
		whatsapp TEXT DEFAULT '',
		whatsapp_msg TEXT DEFAULT 'Olá! Gostaria de agendar um horário.',
		whatsapp_float INTEGER DEFAULT 1,
		instagram TEXT DEFAULT '',
		facebook TEXT DEFAULT '',
		tiktok TEXT DEFAULT '',
		youtube TEXT DEFAULT '',
		google_maps TEXT DEFAULT '',
		email TEXT DEFAULT '',
		telefone TEXT DEFAULT '',
		endereco_fisico TEXT DEFAULT '',
		-- Horário de Funcionamento
		horario_seg_sex TEXT DEFAULT '09:00 - 18:00',
		horario_sabado TEXT DEFAULT '09:00 - 13:00',
		horario_domingo_fer TEXT DEFAULT 'Fechado',
		exibir_horario_home INTEGER DEFAULT 1,
		exibir_redes_sociais INTEGER DEFAULT 1,
		-- Textos Personalizados
		titulo_site TEXT DEFAULT 'Barbearia Silva - Cortes Modernos',
		descricao_seo TEXT DEFAULT 'Barbearia profissional com cortes modernos e clássicos',
		palavras_chave TEXT DEFAULT 'barbearia, corte masculino, barba, barbeiro',
		titulo_home TEXT DEFAULT 'Barbearia Silva',
		texto_sobre TEXT DEFAULT '',
		slogan TEXT DEFAULT 'Estilo e Tradição',
		mensagem_rodape TEXT DEFAULT '',
		texto_botao_agendar TEXT DEFAULT 'Agendar Horário',
		-- Configurações de Agendamento
		intervalo_horarios INTEGER DEFAULT 30,
		antecedencia_minima INTEGER DEFAULT 2,
		antecedencia_maxima INTEGER DEFAULT 30,
		permitir_fora_horario INTEGER DEFAULT 0,
		confirmacao_auto INTEGER DEFAULT 0,
		-- Política de Cancelamento
		tempo_minimo_cancelar INTEGER DEFAULT 24,
		mensagem_cancelamento TEXT DEFAULT 'Cancelamentos devem ser feitos com pelo menos 24h de antecedência.',
		penalidade_cancelamento TEXT DEFAULT '',
		-- Programa de Fidelidade
		fidelidade_ativo INTEGER DEFAULT 1,
		fidelidade_qtd_cortes INTEGER DEFAULT 10,
		fidelidade_tipo_brinde TEXT DEFAULT 'corte',
		fidelidade_valor_brinde TEXT DEFAULT 'R$ 35,00',
		fidelidade_validade_dias INTEGER DEFAULT 0,
		fidelidade_resetar_troca INTEGER DEFAULT 0,
		-- Tema
		tema_default TEXT DEFAULT 'escuro',
		permitir_troca_tema INTEGER DEFAULT 1,
		-- Outros
		promocoes_ativas INTEGER DEFAULT 0,
		exibir_galeria INTEGER DEFAULT 0,
		notif_email_ativo INTEGER DEFAULT 0,
		notif_email_destino TEXT DEFAULT '',
		notif_novo_agendamento INTEGER DEFAULT 1,
		notif_cancelamento INTEGER DEFAULT 1,
		notif_horario_proximo INTEGER DEFAULT 1,
		-- Timestamps
		criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
		atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_horarios_barbeiro ON horarios(barbeiro_id);
	CREATE INDEX IF NOT EXISTS idx_horarios_data ON horarios(data_hora);
	CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
	CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
	CREATE INDEX IF NOT EXISTS idx_horarios_trabalho_barbeiro ON horarios_trabalho(barbeiro_id);
	CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON servicos(ativo);
	CREATE INDEX IF NOT EXISTS idx_barbeiros_ativo ON barbeiros(ativo);
	CREATE INDEX IF NOT EXISTS idx_comandas_status ON comandas(status);
	CREATE INDEX IF NOT EXISTS idx_comandas_barbeiro ON comandas(barbeiro_id);
	CREATE INDEX IF NOT EXISTS idx_itens_comanda_comanda ON itens_comanda(comanda_id);
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

	// Adicionar coluna tipo à tabela servicos se não existir
	_, err = DB.Exec(`
		ALTER TABLE servicos ADD COLUMN tipo TEXT DEFAULT 'servico' CHECK(tipo IN ('servico', 'produto'))
	`)
	// Ignorar erro se a coluna já existir
	if err != nil && err.Error() != "duplicate column name: tipo" {
		// Coluna já existe, ignorar
	}

	// Atualizar coluna atualizado_em na tabela horarios_trabalho (estava faltando)
	_, err = DB.Exec(`
		ALTER TABLE horarios_trabalho ADD COLUMN atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
	`)
	if err != nil && err.Error() != "duplicate column name: atualizado_em" {
		// Coluna já existe, ignorar
	}

	// Adicionar coluna foto à tabela servicos para imagens de serviços/produtos
	_, err = DB.Exec(`
		ALTER TABLE servicos ADD COLUMN foto TEXT
	`)
	if err != nil && err.Error() != "duplicate column name: foto" {
		// Coluna já existe, ignorar
	}

	// Adicionar coluna foto à tabela usuarios para foto de perfil
	_, err = DB.Exec(`
		ALTER TABLE usuarios ADD COLUMN foto TEXT
	`)
	if err != nil && err.Error() != "duplicate column name: foto" {
		// Coluna já existe, ignorar
	}

	// Migração: Corrigir CHECK constraint de duracao em servicos (permitir duracao >= 0 para produtos)
	// Verificar se a tabela precisa ser recriada
	var checkConstraint string
	err = DB.QueryRow(`
		SELECT sql FROM sqlite_master
		WHERE type='table' AND name='servicos'
	`).Scan(&checkConstraint)

	if err == nil && strings.Contains(checkConstraint, "CHECK(duracao > 0)") {
		log.Println("⚙ Migrando tabela servicos para permitir duracao >= 0...")

		// Criar tabela temporária com nova estrutura
		_, err = DB.Exec(`
			CREATE TABLE servicos_new (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				nome TEXT NOT NULL,
				tipo TEXT DEFAULT 'servico' CHECK(tipo IN ('servico', 'produto')),
				descricao TEXT,
				preco REAL NOT NULL CHECK(preco >= 0),
				duracao INTEGER NOT NULL CHECK(duracao >= 0),
				foto TEXT,
				ativo INTEGER DEFAULT 1,
				criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
				atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`)
		if err != nil {
			log.Printf("⚠ Erro ao criar tabela temporária servicos_new: %v", err)
		} else {
			// Copiar dados da tabela antiga
			_, err = DB.Exec(`
				INSERT INTO servicos_new (id, nome, tipo, descricao, preco, duracao, foto, ativo, criado_em, atualizado_em)
				SELECT id, nome, tipo, descricao, preco, duracao, foto, ativo, criado_em, atualizado_em
				FROM servicos
			`)
			if err != nil {
				log.Printf("⚠ Erro ao copiar dados: %v", err)
				// Se falhar, tentar sem as colunas que podem não existir
				_, err = DB.Exec(`
					INSERT INTO servicos_new (id, nome, descricao, preco, duracao, ativo, criado_em, atualizado_em)
					SELECT id, nome, descricao, preco, duracao, ativo, criado_em, atualizado_em
					FROM servicos
				`)
				if err != nil {
					log.Printf("⚠ Erro ao copiar dados (segunda tentativa): %v", err)
					DB.Exec("DROP TABLE servicos_new")
				} else {
					// Sucesso - substituir tabela antiga
					DB.Exec("DROP TABLE servicos")
					DB.Exec("ALTER TABLE servicos_new RENAME TO servicos")
					DB.Exec("CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON servicos(ativo)")
					log.Println("✓ Tabela servicos migrada com sucesso")
				}
			} else {
				// Sucesso - substituir tabela antiga
				DB.Exec("DROP TABLE servicos")
				DB.Exec("ALTER TABLE servicos_new RENAME TO servicos")
				DB.Exec("CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON servicos(ativo)")
				log.Println("✓ Tabela servicos migrada com sucesso")
			}
		}
	}

	// Migração: Atualizar campos NULL para strings vazias na tabela personalizacao
	_, err = DB.Exec(`
		UPDATE personalizacao SET
			logo_escuro = COALESCE(logo_escuro, ''),
			logo_claro = COALESCE(logo_claro, ''),
			favicon = COALESCE(favicon, ''),
			banner_imagem = COALESCE(banner_imagem, ''),
			whatsapp = COALESCE(whatsapp, ''),
			instagram = COALESCE(instagram, ''),
			facebook = COALESCE(facebook, ''),
			tiktok = COALESCE(tiktok, ''),
			youtube = COALESCE(youtube, ''),
			google_maps = COALESCE(google_maps, ''),
			email = COALESCE(email, ''),
			telefone = COALESCE(telefone, ''),
			endereco_fisico = COALESCE(endereco_fisico, ''),
			texto_sobre = COALESCE(texto_sobre, ''),
			mensagem_rodape = COALESCE(mensagem_rodape, ''),
			penalidade_cancelamento = COALESCE(penalidade_cancelamento, ''),
			notif_email_destino = COALESCE(notif_email_destino, '')
		WHERE id = 1
	`)
	// Ignorar erro se não houver registros
	if err != nil && err.Error() != "no such table: personalizacao" {
		log.Printf("⚠ Aviso ao atualizar personalizacao: %v", err)
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

// insertDefaultConfig insere configurações padrão da barbearia
func insertDefaultConfig() error {
	// Verificar se já existe configuração
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM configuracoes").Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		log.Println("✓ Configurações já existem")
		return nil
	}

	// Inserir configuração padrão
	_, err = DB.Exec(`
		INSERT INTO configuracoes (id, nome, telefone, whatsapp, endereco, instagram, email)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, 1, "Barbearia Silva", "(61) 99999-9999", "5561999999999", "Brasília - DF", "@barbeariasilva", "contato@barbeariasilva.com")

	if err != nil {
		return err
	}

	log.Println("✓ Configurações padrão criadas")
	return nil
}

// insertDefaultPersonalizacao insere personalização padrão
func insertDefaultPersonalizacao() error {
	// Verificar se já existe
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM personalizacao").Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		log.Println("✓ Personalização já existe")
		return nil
	}

	// Inserir personalização padrão
	_, err = DB.Exec(`
		INSERT INTO personalizacao (id) VALUES (1)
	`)

	if err != nil {
		return err
	}

	log.Println("✓ Personalização padrão criada")
	return nil
}

// Close fecha a conexão com o banco de dados
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
