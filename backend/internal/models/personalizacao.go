package models

import "time"

// Personalizacao representa as configurações de personalização do sistema
type Personalizacao struct {
	ID int `json:"id"`

	// Esquema de Cores
	CorPrimaria    string `json:"cor_primaria"`    // Cor principal do sistema (ex: #0D7CA4)
	CorSecundaria  string `json:"cor_secundaria"`  // Cor secundária
	CorDestaque    string `json:"cor_destaque"`    // Cor de destaque/accent
	CorHeader      string `json:"cor_header"`      // Cor do cabeçalho
	CorTexto       string `json:"cor_texto"`       // Cor do texto principal
	CorTextoClaro  string `json:"cor_texto_claro"` // Cor do texto em fundos escuros

	// Tipografia
	FonteFamilia string `json:"fonte_familia"` // Família da fonte (ex: Inter, Poppins)
	FonteTamanho string `json:"fonte_tamanho"` // Tamanho base da fonte (ex: 16px)

	// Logos
	LogoEscuro string `json:"logo_escuro"` // URL ou base64 da logo para fundo escuro
	LogoClaro  string `json:"logo_claro"`  // URL ou base64 da logo para fundo claro
	Favicon    string `json:"favicon"`     // URL ou base64 do favicon

	// Banner/Hero da Home
	BannerImagem    string `json:"banner_imagem"`    // URL ou base64 da imagem de fundo
	BannerTitulo    string `json:"banner_titulo"`    // Título do banner
	BannerSubtitulo string `json:"banner_subtitulo"` // Subtítulo do banner
	BannerAltura    string `json:"banner_altura"`    // Altura: pequeno, medio, grande

	// Redes Sociais e Contatos
	WhatsApp       string `json:"whatsapp"`        // Número do WhatsApp (5561999999999)
	WhatsAppMsg    string `json:"whatsapp_msg"`    // Mensagem padrão
	WhatsAppFloat  bool   `json:"whatsapp_float"`  // Mostrar botão flutuante
	Instagram      string `json:"instagram"`       // @usuario ou URL
	Facebook       string `json:"facebook"`        // URL completa
	TikTok         string `json:"tiktok"`          // @usuario ou URL
	YouTube        string `json:"youtube"`         // URL do canal
	GoogleMaps     string `json:"google_maps"`     // URL do Google Maps
	Email          string `json:"email"`           // Email de contato
	Telefone       string `json:"telefone"`        // Telefone fixo
	EnderecoFisico string `json:"endereco_fisico"` // Endereço completo

	// Horário de Funcionamento
	HorarioSegSex      string `json:"horario_seg_sex"`      // Ex: "09:00 - 18:00"
	HorarioSabado      string `json:"horario_sabado"`       // Ex: "09:00 - 13:00"
	HorarioDomingoFer  string `json:"horario_domingo_fer"`  // Ex: "Fechado"
	ExibirHorarioHome  bool   `json:"exibir_horario_home"`  // Mostrar na home
	ExibirRedesSociais bool   `json:"exibir_redes_sociais"` // Mostrar ícones de redes sociais

	// Textos Personalizados
	TituloSite      string `json:"titulo_site"`       // Título da aba do navegador
	DescricaoSEO    string `json:"descricao_seo"`     // Meta description
	PalavrasChave   string `json:"palavras_chave"`    // Keywords SEO
	TituloHome      string `json:"titulo_home"`       // Título principal da home
	TextoSobre      string `json:"texto_sobre"`       // Texto "Sobre Nós"
	Slogan          string `json:"slogan"`            // Slogan da barbearia
	MensagemRodape  string `json:"mensagem_rodape"`   // Texto do rodapé
	TextoBotaoAgendar string `json:"texto_botao_agendar"` // Texto do botão de agendamento

	// Configurações de Agendamento
	IntervaloHorarios   int  `json:"intervalo_horarios"`   // Minutos (15, 30, 60)
	AntecedenciaMinima  int  `json:"antecedencia_minima"`  // Horas mínimas de antecedência
	AntecedenciaMaxima  int  `json:"antecedencia_maxima"`  // Dias máximos no futuro
	PermitirForaHorario bool `json:"permitir_fora_horario"` // Permitir agendamentos fora do horário
	ConfirmacaoAuto     bool `json:"confirmacao_auto"`     // Confirmar automaticamente ou manual

	// Política de Cancelamento
	TempoMinimoCancelar     int    `json:"tempo_minimo_cancelar"`     // Horas mínimas antes do horário
	MensagemCancelamento    string `json:"mensagem_cancelamento"`     // Mensagem personalizada
	PenalidadeCancelamento  string `json:"penalidade_cancelamento"`   // Descrição da penalidade

	// Programa de Fidelidade
	FidelidadeAtivo        bool   `json:"fidelidade_ativo"`         // Sistema ativo/inativo
	FidelidadeQtdCortes    int    `json:"fidelidade_qtd_cortes"`    // Quantidade de cortes para ganhar (padrão: 10)
	FidelidadeTipoBrinde   string `json:"fidelidade_tipo_brinde"`   // corte, barba, desconto, valor
	FidelidadeValorBrinde  string `json:"fidelidade_valor_brinde"`  // Valor do desconto (ex: "R$ 35,00" ou "50%")
	FidelidadeValidadeDias int    `json:"fidelidade_validade_dias"` // Dias de validade dos pontos (0 = sem validade)
	FidelidadeResetarTroca bool   `json:"fidelidade_resetar_troca"` // Resetar pontos ao trocar de barbeiro

	// Tema
	TemaDefault       string `json:"tema_default"`        // escuro, claro, auto
	PermitirTrocaTema bool   `json:"permitir_troca_tema"` // Permitir que usuário mude

	// Promoções
	PromocoesAtivas bool `json:"promocoes_ativas"` // Sistema de promoções ativo

	// Galeria
	ExibirGaleria bool `json:"exibir_galeria"` // Mostrar galeria de trabalhos na home

	// Notificações
	NotifEmailAtivo     bool   `json:"notif_email_ativo"`      // Notificações por email ativas
	NotifEmailDestino   string `json:"notif_email_destino"`    // Email para receber notificações
	NotifNovoAgendamento bool   `json:"notif_novo_agendamento"` // Notificar novo agendamento
	NotifCancelamento   bool   `json:"notif_cancelamento"`     // Notificar cancelamento
	NotifHorarioProximo bool   `json:"notif_horario_proximo"`  // Notificar horário próximo

	// Metadados
	CriadoEm     time.Time `json:"criado_em"`
	AtualizadoEm time.Time `json:"atualizado_em"`
}

// PersonalizacaoInput para criação/atualização
type PersonalizacaoInput struct {
	// Apenas os campos que podem ser atualizados via API
	CorPrimaria         *string `json:"cor_primaria,omitempty"`
	CorSecundaria       *string `json:"cor_secundaria,omitempty"`
	CorDestaque         *string `json:"cor_destaque,omitempty"`
	CorHeader           *string `json:"cor_header,omitempty"`
	FonteFamilia        *string `json:"fonte_familia,omitempty"`
	FonteTamanho        *string `json:"fonte_tamanho,omitempty"`
	WhatsApp            *string `json:"whatsapp,omitempty"`
	WhatsAppMsg         *string `json:"whatsapp_msg,omitempty"`
	WhatsAppFloat       *bool   `json:"whatsapp_float,omitempty"`
	Instagram           *string `json:"instagram,omitempty"`
	Facebook            *string `json:"facebook,omitempty"`
	TituloSite          *string `json:"titulo_site,omitempty"`
	Slogan              *string `json:"slogan,omitempty"`
	FidelidadeAtivo     *bool   `json:"fidelidade_ativo,omitempty"`
	FidelidadeQtdCortes *int    `json:"fidelidade_qtd_cortes,omitempty"`
	TemaDefault         *string `json:"tema_default,omitempty"`
	// ... outros campos conforme necessário
}
