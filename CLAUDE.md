📋 TODO List - System-Barbearia-AS (Versão 2.0.0 → Completação)
Tarefas organizadas em categorias claras, priorizando o que está bloqueando o avanço (backend funcional + banco de dados) e depois a melhoria da experiência mobile (UI/UX), já que o foco do cliente é mobile-first e o frontend já tem base sólida.
As tarefas estão divididas por área e marcadas com prioridade:

🔥 Alta (bloqueia o funcionamento principal)
⚡ Média (necessária para entrega mínima viável)
✅ Baixa (melhorias de polimento)

1. Backend (Go + Gin + SQLite)
🔥 Configuração e Estrutura Básica

 Confirmar estrutura de pastas Clean Architecture (handlers, models, repository, usecases, database)
 Criar conexão com SQLite (arquivo barbearia.db) e migrar schema inicial
 Implementar models básicas:
User (id, nome, telefone, email, password_hash, role: admin/client)
Barbeiro (id, nome, foto_url, descricao, ativo)
Servico (id, nome, descricao, preco, duracao_minutos, ativo)
HorarioTrabalho (id, barbeiro_id, dia_semana, hora_inicio, hora_fim)
Agendamento (id, cliente_id, barbeiro_id, servico_id, data_hora, status: confirmado/cancelado/concluido)


🔥 Autenticação

 Rotas de auth:
POST /api/register (cliente)
POST /api/login (retorna JWT)
Middleware de autenticação JWT para rotas protegidas
Rota GET /api/me (dados do usuário logado)

 Admin inicial (seed no banco com role admin)

🔥 CRUD Serviços (Admin)

 Rotas protegidas (admin):
GET /api/servicos
POST /api/servicos
PUT /api/servicos/:id
DELETE /api/servicos/:id

 Validar campos (nome obrigatório, preco > 0, duracao > 0)

🔥 CRUD Barbeiros (Admin)

 Rotas protegidas:
GET /api/barbeiros
POST /api/barbeiros (upload de foto)
PUT /api/barbeiros/:id
DELETE /api/barbeiros/:id


🔥 Gerenciamento de Horários (Admin)

 Rotas:
GET /api/barbeiros/:id/horarios
POST /api/barbeiros/:id/horarios
DELETE /api/barbeiros/:id/horarios/:horario_id


🔥 Agendamento (Cliente)

 Rota GET /api/disponibilidade?barbeiro_id=&data= (retorna slots livres)
 Rota POST /api/agendamentos (valida horário disponível)
 Rota GET /api/meus-agendamentos (cliente)
 Rota PUT /api/agendamentos/:id/cancelar (cliente)

⚡ Dashboard Admin Básico

 Rotas para listar tudo (serviços, barbeiros, agendamentos, usuários)
 (Futuro: filtros e busca)

2. Frontend - Conexão com API
⚡ Integração Geral

 Configurar base URL da API (ex: http://localhost:8080/api)
 Criar serviço JS para chamadas fetch + tratamento de erros + loading states
 Gerenciar token JWT no localStorage

⚡ Página de Login / Registro

 Conectar formulário de login ao POST /api/login
 Conectar formulário de registro ao POST /api/register
 Redirecionar após login (cliente → home/agendar, admin → dashboard)

⚡ Catálogo de Serviços (Home)

 Carregar serviços dinamicamente do GET /api/servicos
 Exibir cards com dados reais (preço, duração, imagem se adicionar campo)

⚡ Agendamento

 Fluxo completo:
Selecionar serviço → Selecionar barbeiro → Selecionar data → Ver slots disponíveis → Confirmar

 Implementar calendário simples (ou datepicker) + lista de horários livres
 Proteção: só permitir agendar se logado

⚡ Dashboard Admin

 Verificar role admin após login
 Telas CRUD para:
Serviços (listar, adicionar, editar, excluir)
Barbeiros (listar, adicionar, editar, excluir, upload foto)
Horários por barbeiro
Lista de agendamentos (com filtro por data/barbeiro)


3. UI/UX Mobile-First
✅ Polimento Geral Mobile

 Revisar todos os breakpoints (especialmente 380px–800px)
 Aumentar touch targets (botões ≥ 48px)
 Adicionar feedback visual em botões (hover/active states)
 Melhorar loading states e mensagens de erro

✅ Home Page

 Tornar cards de serviços mais interativos (toque para ver detalhes)
 Banner de fidelidade com CTA mais chamativo
 Seção barbeiro com swipe se houver múltiplos (futuro)

✅ Fluxo de Agendamento

 Passos claros (stepper: serviço → barbeiro → data/hora → confirmação)
 Confirmação final com resumo do agendamento
 Toast/sucesso após agendar

✅ Dashboard Admin Mobile

 Layout em lista/acordeão para telas pequenas
 Modais ou páginas separadas para formulários de cadastro
 Botões flutuantes para ações rápidas (ex: + Novo Serviço)

✅ Acessibilidade e Performance

 Adicionar alt em todas as imagens
 Lazy load de imagens
 Testar em dispositivos reais (Android/iOS)

4. Testes e Correções
⚡ Testes Funcionais

 Testar todo fluxo de agendamento (criar serviço → criar barbeiro → definir horário → agendar como cliente)
 Testar autenticação e proteção de rotas
 Verificar conflitos de horário

✅ Correções Gerais

 Corrigir caminhos de imagens/ícones quebrados (se houver)
 Padronizar nomes de classes CSS (BEM ou similar)
 Minificar CSS/JS para produção

5. Entrega e Finalização

 Atualizar README.md com:
Fase 2 marcada como concluída
Adicionar novas funcionalidades implementadas
Atualizar screenshots (desktop + mobile atualizados)
Atualizar changelog com versão 2.1.0 ou 3.0.0

### IMPORTANTE NÃO CRIAR DOCUMENTOS EXPLICATIVOS SEM PREVIO PEDIDO DO USUARIO, OU SEJA SOMENTE QUANDO FOR SOLICITADO! ###