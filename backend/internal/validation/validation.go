package validation

import (
	"fmt"
	"regexp"
	"strings"
)

// ValidationError representa um erro de validação
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func (e ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// ValidationErrors é uma lista de erros de validação
type ValidationErrors []ValidationError

func (e ValidationErrors) Error() string {
	var messages []string
	for _, err := range e {
		messages = append(messages, err.Error())
	}
	return strings.Join(messages, "; ")
}

// HasErrors verifica se há erros
func (e ValidationErrors) HasErrors() bool {
	return len(e) > 0
}

// Validator é o validador principal
type Validator struct {
	Errors ValidationErrors
}

// NewValidator cria um novo validador
func NewValidator() *Validator {
	return &Validator{
		Errors: ValidationErrors{},
	}
}

// AddError adiciona um erro de validação
func (v *Validator) AddError(field, message string) {
	v.Errors = append(v.Errors, ValidationError{
		Field:   field,
		Message: message,
	})
}

// HasErrors verifica se há erros
func (v *Validator) HasErrors() bool {
	return len(v.Errors) > 0
}

// GetErrors retorna os erros
func (v *Validator) GetErrors() ValidationErrors {
	return v.Errors
}

// ===================================
// VALIDADORES ESPECÍFICOS
// ===================================

// Required valida campo obrigatório
func (v *Validator) Required(field, value, fieldName string) {
	if strings.TrimSpace(value) == "" {
		v.AddError(field, fmt.Sprintf("%s é obrigatório", fieldName))
	}
}

// Email valida formato de email
func (v *Validator) Email(field, value string) {
	if value == "" {
		return // Se vazio, usar Required()
	}

	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(value) {
		v.AddError(field, "Email inválido")
	}
}

// MinLength valida tamanho mínimo
func (v *Validator) MinLength(field, value string, min int, fieldName string) {
	if value == "" {
		return // Se vazio, usar Required()
	}

	if len(value) < min {
		v.AddError(field, fmt.Sprintf("%s deve ter no mínimo %d caracteres", fieldName, min))
	}
}

// MaxLength valida tamanho máximo
func (v *Validator) MaxLength(field, value string, max int, fieldName string) {
	if len(value) > max {
		v.AddError(field, fmt.Sprintf("%s deve ter no máximo %d caracteres", fieldName, max))
	}
}

// In valida se valor está em lista permitida
func (v *Validator) In(field, value string, allowed []string, fieldName string) {
	if value == "" {
		return
	}

	for _, item := range allowed {
		if value == item {
			return
		}
	}

	v.AddError(field, fmt.Sprintf("%s deve ser um dos valores: %s", fieldName, strings.Join(allowed, ", ")))
}

// Phone valida formato de telefone brasileiro
func (v *Validator) Phone(field, value string) {
	if value == "" {
		return
	}

	// Remove caracteres não numéricos
	digits := regexp.MustCompile(`\D`).ReplaceAllString(value, "")

	// Valida: deve ter 10 ou 11 dígitos (com DDD)
	if len(digits) < 10 || len(digits) > 11 {
		v.AddError(field, "Telefone inválido (use formato: (XX) XXXXX-XXXX)")
	}
}

// Match valida se dois valores são iguais
func (v *Validator) Match(field1, value1, field2, value2, fieldName string) {
	if value1 != value2 {
		v.AddError(field2, fmt.Sprintf("%s não coincide", fieldName))
	}
}

// ===================================
// VALIDADORES DE NEGÓCIO
// ===================================

// ValidateBarbeiro valida dados de um barbeiro
func ValidateBarbeiro(nome, email, sexo string) ValidationErrors {
	v := NewValidator()

	v.Required("nome", nome, "Nome")
	v.Required("email", email, "Email")
	v.Required("sexo", sexo, "Sexo")

	v.Email("email", email)
	v.MinLength("nome", nome, 3, "Nome")
	v.MaxLength("nome", nome, 100, "Nome")
	v.In("sexo", sexo, []string{"M", "F", "Outro"}, "Sexo")

	return v.Errors
}

// ValidateServico valida dados de um serviço
func ValidateServico(nome, tipo string, preco float64) ValidationErrors {
	v := NewValidator()

	v.Required("nome", nome, "Nome")
	v.Required("tipo", tipo, "Tipo")

	v.MinLength("nome", nome, 3, "Nome")
	v.MaxLength("nome", nome, 100, "Nome")
	v.In("tipo", tipo, []string{"servico", "produto"}, "Tipo")

	if preco <= 0 {
		v.AddError("preco", "Preço deve ser maior que zero")
	}

	return v.Errors
}

// ValidateUsuario valida dados de um usuário
func ValidateUsuario(nome, email string) ValidationErrors {
	v := NewValidator()

	v.Required("nome", nome, "Nome")
	v.Required("email", email, "Email")

	v.Email("email", email)
	v.MinLength("nome", nome, 3, "Nome")
	v.MaxLength("nome", nome, 100, "Nome")

	return v.Errors
}

// ValidateSenha valida uma senha
func ValidateSenha(senha string) ValidationErrors {
	v := NewValidator()

	v.Required("senha", senha, "Senha")
	v.MinLength("senha", senha, 6, "Senha")

	return v.Errors
}

// ValidateSenhaMatch valida se senhas coincidem
func ValidateSenhaMatch(senha, confirmar string) ValidationErrors {
	v := NewValidator()

	v.Match("senha", senha, "confirmar", confirmar, "Confirmação de senha")

	return v.Errors
}
