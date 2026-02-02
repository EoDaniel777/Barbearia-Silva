package handlers

import (
	"backend/internal/database"
	"backend/internal/models"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// PersonalizacaoHandler gerencia as operações de personalização
type PersonalizacaoHandler struct{}

// NewPersonalizacaoHandler cria uma nova instância do handler
func NewPersonalizacaoHandler() *PersonalizacaoHandler {
	return &PersonalizacaoHandler{}
}

// GetPersonalizacao retorna todas as configurações de personalização
func (h *PersonalizacaoHandler) GetPersonalizacao(c *gin.Context) {
	log.Println("[PERSONALIZACAO] Buscando configurações...")

	var p models.Personalizacao

	query := `
		SELECT
			id, cor_primaria, cor_secundaria, cor_destaque, cor_header, cor_texto, cor_texto_claro,
			fonte_familia, fonte_tamanho,
			logo_escuro, logo_claro, favicon,
			banner_imagem, banner_titulo, banner_subtitulo, banner_altura,
			whatsapp, whatsapp_msg, whatsapp_float, instagram, facebook, tiktok, youtube,
			google_maps, email, telefone, endereco_fisico,
			horario_seg_sex, horario_sabado, horario_domingo_fer, exibir_horario_home, exibir_redes_sociais,
			titulo_site, descricao_seo, palavras_chave, titulo_home, texto_sobre, slogan,
			mensagem_rodape, texto_botao_agendar,
			intervalo_horarios, antecedencia_minima, antecedencia_maxima, permitir_fora_horario, confirmacao_auto,
			tempo_minimo_cancelar, mensagem_cancelamento, penalidade_cancelamento,
			fidelidade_ativo, fidelidade_qtd_cortes, fidelidade_tipo_brinde, fidelidade_valor_brinde,
			fidelidade_validade_dias, fidelidade_resetar_troca,
			tema_default, permitir_troca_tema,
			promocoes_ativas, exibir_galeria,
			notif_email_ativo, notif_email_destino, notif_novo_agendamento, notif_cancelamento, notif_horario_proximo,
			criado_em, atualizado_em
		FROM personalizacao
		WHERE id = 1
	`

	err := database.DB.QueryRow(query).Scan(
		&p.ID, &p.CorPrimaria, &p.CorSecundaria, &p.CorDestaque, &p.CorHeader, &p.CorTexto, &p.CorTextoClaro,
		&p.FonteFamilia, &p.FonteTamanho,
		&p.LogoEscuro, &p.LogoClaro, &p.Favicon,
		&p.BannerImagem, &p.BannerTitulo, &p.BannerSubtitulo, &p.BannerAltura,
		&p.WhatsApp, &p.WhatsAppMsg, &p.WhatsAppFloat, &p.Instagram, &p.Facebook, &p.TikTok, &p.YouTube,
		&p.GoogleMaps, &p.Email, &p.Telefone, &p.EnderecoFisico,
		&p.HorarioSegSex, &p.HorarioSabado, &p.HorarioDomingoFer, &p.ExibirHorarioHome, &p.ExibirRedesSociais,
		&p.TituloSite, &p.DescricaoSEO, &p.PalavrasChave, &p.TituloHome, &p.TextoSobre, &p.Slogan,
		&p.MensagemRodape, &p.TextoBotaoAgendar,
		&p.IntervaloHorarios, &p.AntecedenciaMinima, &p.AntecedenciaMaxima, &p.PermitirForaHorario, &p.ConfirmacaoAuto,
		&p.TempoMinimoCancelar, &p.MensagemCancelamento, &p.PenalidadeCancelamento,
		&p.FidelidadeAtivo, &p.FidelidadeQtdCortes, &p.FidelidadeTipoBrinde, &p.FidelidadeValorBrinde,
		&p.FidelidadeValidadeDias, &p.FidelidadeResetarTroca,
		&p.TemaDefault, &p.PermitirTrocaTema,
		&p.PromocoesAtivas, &p.ExibirGaleria,
		&p.NotifEmailAtivo, &p.NotifEmailDestino, &p.NotifNovoAgendamento, &p.NotifCancelamento, &p.NotifHorarioProximo,
		&p.CriadoEm, &p.AtualizadoEm,
	)

	if err != nil {
		log.Printf("[PERSONALIZACAO] Erro ao buscar: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar personalização"})
		return
	}

	log.Println("[PERSONALIZACAO] ✓ Configurações retornadas")
	c.JSON(http.StatusOK, p)
}

// UpdatePersonalizacao atualiza as configurações de personalização
func (h *PersonalizacaoHandler) UpdatePersonalizacao(c *gin.Context) {
	log.Println("[PERSONALIZACAO] Atualizando configurações...")

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// Construir query dinamicamente baseado nos campos enviados
	query := "UPDATE personalizacao SET atualizado_em = CURRENT_TIMESTAMP"
	args := []interface{}{}

	// Lista de campos permitidos
	allowedFields := map[string]bool{
		"cor_primaria": true, "cor_secundaria": true, "cor_destaque": true, "cor_header": true,
		"cor_texto": true, "cor_texto_claro": true,
		"fonte_familia": true, "fonte_tamanho": true,
		"logo_escuro": true, "logo_claro": true, "favicon": true,
		"banner_imagem": true, "banner_titulo": true, "banner_subtitulo": true, "banner_altura": true,
		"whatsapp": true, "whatsapp_msg": true, "whatsapp_float": true,
		"instagram": true, "facebook": true, "tiktok": true, "youtube": true,
		"google_maps": true, "email": true, "telefone": true, "endereco_fisico": true,
		"horario_seg_sex": true, "horario_sabado": true, "horario_domingo_fer": true,
		"exibir_horario_home": true, "exibir_redes_sociais": true,
		"titulo_site": true, "descricao_seo": true, "palavras_chave": true,
		"titulo_home": true, "texto_sobre": true, "slogan": true,
		"mensagem_rodape": true, "texto_botao_agendar": true,
		"intervalo_horarios": true, "antecedencia_minima": true, "antecedencia_maxima": true,
		"permitir_fora_horario": true, "confirmacao_auto": true,
		"tempo_minimo_cancelar": true, "mensagem_cancelamento": true, "penalidade_cancelamento": true,
		"fidelidade_ativo": true, "fidelidade_qtd_cortes": true, "fidelidade_tipo_brinde": true,
		"fidelidade_valor_brinde": true, "fidelidade_validade_dias": true, "fidelidade_resetar_troca": true,
		"tema_default": true, "permitir_troca_tema": true,
		"promocoes_ativas": true, "exibir_galeria": true,
		"notif_email_ativo": true, "notif_email_destino": true,
		"notif_novo_agendamento": true, "notif_cancelamento": true, "notif_horario_proximo": true,
	}

	for field, value := range input {
		if allowedFields[field] {
			query += ", " + field + " = ?"
			args = append(args, value)
		}
	}

	query += " WHERE id = 1"

	log.Printf("[PERSONALIZACAO] Query: %s\n", query)
	log.Printf("[PERSONALIZACAO] Args: %v\n", args)

	_, err := database.DB.Exec(query, args...)
	if err != nil {
		log.Printf("[PERSONALIZACAO] Erro ao atualizar: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar personalização"})
		return
	}

	log.Println("[PERSONALIZACAO] ✓ Configurações atualizadas")
	c.JSON(http.StatusOK, gin.H{"message": "Personalização atualizada com sucesso"})
}

// ResetPersonalizacao restaura as configurações padrão
func (h *PersonalizacaoHandler) ResetPersonalizacao(c *gin.Context) {
	log.Println("[PERSONALIZACAO] Restaurando configurações padrão...")

	_, err := database.DB.Exec("DELETE FROM personalizacao WHERE id = 1")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao resetar"})
		return
	}

	_, err = database.DB.Exec("INSERT INTO personalizacao (id) VALUES (1)")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar configurações padrão"})
		return
	}

	log.Println("[PERSONALIZACAO] ✓ Configurações restauradas")
	c.JSON(http.StatusOK, gin.H{"message": "Configurações restauradas para o padrão"})
}
