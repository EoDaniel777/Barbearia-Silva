# 💈 System-Barbearia-AS

<div align="center">

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-green)

**Sistema Web Full-Stack para Gestão e Agendamento de Serviços em Barbearias**

[Sobre](#-sobre) • [Funcionalidades](#-funcionalidades) • [Tecnologias](#-tecnologias) • [Instalação](#-instalação) • [Estrutura](#-estrutura-do-projeto) • [Roadmap](#-roadmap)

</div>

---

## 📋 Sobre

O **System-Barbearia-AS** é uma aplicação web completa desenvolvida para otimizar a gestão de barbearias, oferecendo uma experiência moderna e profissional tanto para clientes quanto para administradores. O sistema visa facilitar o agendamento de serviços, gerenciamento de profissionais e fidelização de clientes.

### 🎯 Objetivo

Criar uma plataforma integrada que simplifique a rotina das barbearias, permitindo:
- Agendamento online de serviços
- Gestão de profissionais e horários
- Programa de fidelidade automatizado
- Interface responsiva e intuitiva
- Experiência otimizada em dispositivos móveis e desktop

---

## ✨ Funcionalidades

### 🌓 Tema Claro/Escuro
- Alternância entre modo claro e escuro
- Persistência de preferência do usuário via LocalStorage
- Aplicação automática do tema escolhido
- Design otimizado para ambos os modos

### 📱 Design Responsivo
- Layout adaptativo para todos os dispositivos
- 7 breakpoints responsivos (380px até 1920px)
- Menu de navegação desktop e mobile
- Otimização para experiência móvel

### 💼 Catálogo de Serviços
- **Corte**: R$ 35,00 (30 minutos)
- **Barba**: R$ 35,00 (30 minutos)
- **Kids**: R$ 35,00 (30 minutos)
- Cards interativos com imagens e descrições
- Layout em grid responsivo

### 🎁 Programa de Fidelidade
- "Complete 10 visitas e ganhe seu próximo corte"
- Banner promocional com call-to-action
- Incentivo ao retorno de clientes

### 👨‍💼 Perfil de Barbeiros
- Destaque para profissionais
- Foto e apresentação do barbeiro (Alison Silva)
- Design elegante e profissional

### 📞 Informações de Contato
- Telefone: 61 00000-0000
- Instagram: @Silva_barbearia
- Endereço: Morro Azul - Quadra 11 Conjunto A
- CNPJ: 00.000.000/0001-00

---

## 🚀 Tecnologias

### Frontend
- **HTML5** - Estrutura semântica e acessível
- **CSS3** - Estilização moderna com Flexbox
- **JavaScript (ES6+)** - Interatividade e manipulação do DOM

### Design
- **Google Fonts** - Poppins e Secular One
- **SVG Icons** - Ícones vetoriais escaláveis
- **Responsive Design** - Mobile-first approach

### Ferramentas
- LocalStorage API para persistência de dados
- Media Queries para responsividade
- CSS Transitions para animações suaves

---

## 📦 Instalação

### Pré-requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor local (opcional: Live Server, http-server)

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/System-Barbearia-AS.git
```

2. **Navegue até o diretório**
```bash
cd System-Barbearia-AS-prod/Front-Barbearia-home
```

3. **Abra o projeto**
- Opção 1: Abra `home.html` diretamente no navegador
- Opção 2: Use um servidor local
```bash
# Com Live Server (VSCode)
# Clique com botão direito em home.html > Open with Live Server

# Ou use http-server
npx http-server -p 8080
```

4. **Acesse no navegador**
```
http://localhost:8080/home.html
```

---

## 📁 Estrutura do Projeto

```
System-Barbearia-AS-prod/
│
├── README.md                          # Documentação do projeto
│
└── Front-Barbearia-home/              # Frontend da aplicação
    │
    ├── home.html                      # Página principal
    ├── blackMode.js                   # Gerenciador de temas
    │
    ├── css/                           # Folhas de estilo
    │   ├── desktopHome.css           # Estilos desktop (principal)
    │   ├── desktopHomeBlackMode.css  # Estilos modo escuro
    │   ├── fontStyleHome.css         # Fontes e animações
    │   ├── responsivo.css            # Media queries (modo claro)
    │   └── responsivoBlack.css       # Media queries (modo escuro)
    │
    ├── icons/                         # Ícones da interface
    │   ├── calendar2.svg             # Ícone de agendamento
    │   ├── home.svg                  # Ícone de início
    │   ├── moon.png                  # Ícone modo escuro
    │   ├── sun.svg                   # Ícone modo claro
    │   ├── person.svg                # Ícone de perfil
    │   └── servico.svg               # Ícone de serviços
    │
    └── img/                           # Imagens e logos
        ├── alissonFt.png             # Foto do barbeiro
        ├── barba.png                 # Serviço de barba
        ├── kids.jpg                  # Serviço kids
        ├── logoDark.jpeg             # Logo modo escuro
        ├── logoWhite.jpeg            # Logo modo claro
        ├── maquina.jpg               # Background fidelidade
        └── meta.jpg                  # Serviço de corte
```

---

## 🎨 Paleta de Cores

### Modo Claro
```css
--background-primary: #090A0C     /* Fundo escuro */
--background-secondary: #F0F0F0   /* Cards (cinza claro) */
--accent-color: #0D7CA4           /* Azul (botões/CTAs) */
--text-primary: #FFFFFF           /* Texto branco */
--text-secondary: #CBCBCB         /* Cinza claro */
```

### Modo Escuro
```css
--background-primary: #18191C     /* Cinza escuro */
--background-secondary: #282828   /* Cards (cinza médio) */
--accent-color: #0D7CA4           /* Azul (botões/CTAs) */
--text-primary: #FFFFFF           /* Texto branco */
--text-secondary: #F4F4F4         /* Texto cinza claro */
```

---

## 📱 Breakpoints Responsivos

| Dispositivo | Largura | Características |
|------------|---------|-----------------|
| Desktop XL | 1920px+ | Layout máximo |
| Desktop L  | 1600px  | Containers reduzidos |
| Desktop M  | 1350px  | Navegação ajustada |
| Desktop S  | 1225px  | Cards em 2 colunas |
| Tablet     | 1150px  | Menu mobile ativo |
| Mobile L   | 800px   | Layout vertical |
| Mobile M   | 580px   | Cards reduzidos |
| Mobile S   | 380px   | Telas pequenas |

---

## 🗂️ Componentes

### Header
- Logo da barbearia
- Menu de navegação (Início, Serviços, Agendar, Barbeiros)
- Botão de acesso/login
- Toggle de tema claro/escuro

### Main
- **Seção Logo**: Apresentação visual da marca
- **Seção Fidelidade**: Banner promocional com CTA
- **Seção Barbeiro**: Destaque do profissional
- **Seção Catálogo**: Grid de cards com serviços

### Footer
- Logo da barbearia
- Informações de contato
- Redes sociais
- Dados da empresa (CNPJ)

---

## 🔧 Funcionalidades Técnicas

### Theme Switcher (blackMode.js)
```javascript
// Alterna entre temas claro e escuro
// Persiste preferência em localStorage
// Atualiza classes CSS dinamicamente
// Troca ícones (sol/lua)
```

### Responsividade
- Flexbox para layouts fluidos
- Media queries em cascata
- Mobile-first approach
- Touch-friendly (botões grandes)

### Performance
- CSS modular (5 arquivos separados)
- Imagens otimizadas
- JavaScript minimalista
- Carregamento rápido

---

## 🛣️ Roadmap

### ✅ Fase 1 - Frontend Base (Concluído)
- [x] Design da página inicial
- [x] Sistema de temas claro/escuro
- [x] Layout responsivo completo
- [x] Catálogo de serviços
- [x] Seção de barbeiros

### 🚧 Fase 2 - Backend (Em Desenvolvimento)
- [ ] API REST para agendamentos
- [ ] Banco de dados (PostgreSQL/MySQL)
- [ ] Sistema de autenticação
- [ ] Painel administrativo
- [ ] Gerenciamento de horários

### 📋 Fase 3 - Funcionalidades Avançadas (Planejado)
- [ ] Sistema de agendamento online
- [ ] Notificações por email/SMS
- [ ] Integração com calendário
- [ ] Dashboard de métricas
- [ ] Sistema de avaliações

### 🎯 Fase 4 - Otimizações (Futuro)
- [ ] PWA (Progressive Web App)
- [ ] Pagamentos online
- [ ] Chatbot de atendimento
- [ ] App mobile nativo
- [ ] Analytics e relatórios

---

## 👥 Equipe

**Barbearia Silva**
- Barbeiro Principal: Alison Silva

**Desenvolvimento**
- Frontend Developer: [Seu Nome]
- UI/UX Design: [Seu Nome]

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Contato

- **Telefone**: 61 00000-0000
- **Instagram**: [@Silva_barbearia](https://instagram.com/Silva_barbearia)
- **Endereço**: Morro Azul - Quadra 11 Conjunto A
- **CNPJ**: 00.000.000/0001-00

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Changelog

### [1.0.0] - 2025-11-23
#### Adicionado
- Página inicial completa
- Sistema de temas claro/escuro
- Design responsivo (7 breakpoints)
- Catálogo de serviços
- Seção de fidelidade
- Perfil de barbeiro
- Footer com informações de contato

#### Corrigido
- Caminhos de imagens de background
- Compatibilidade com diferentes navegadores

---

<div align="center">

**Desenvolvido com ❤️ para Barbearia Silva**

[⬆ Voltar ao topo](#-system-barbearia-as)

</div>
