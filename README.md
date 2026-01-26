# 🏋️ FitMaster - Personal Trainer App

![FitMaster](https://img.shields.io/badge/FitMaster-Personal%20Trainer-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?style=flat-square&logo=mongodb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38B2AC?style=flat-square&logo=tailwind-css)

Aplicativo web completo para Personal Trainers gerenciarem seus alunos e treinos. Os alunos visualizam seus treinos de forma organizada, registram progresso e acompanham sua evolução.

---

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Como Usar](#-como-usar)
- [API Reference](#-api-reference)
- [Credenciais de Teste](#-credenciais-de-teste)
- [Screenshots](#-screenshots)

---

## ✨ Funcionalidades

### 👨‍🏫 Personal Trainer
| Funcionalidade | Descrição |
|----------------|-----------|
| **Dashboard** | Visão geral com estatísticas de alunos, treinos e progresso |
| **Gestão de Alunos** | Criar, editar, remover alunos com credenciais de acesso |
| **Upload de Treinos** | Importar planilhas XLS/XLSX com treinos completos |
| **Imagens de Exercícios** | Upload de imagens customizadas ou automáticas |
| **Chat** | Comunicação direta com cada aluno |
| **Ranking** | Visualizar ranking de engajamento dos alunos |
| **Exportar PDF** | Gerar relatórios de progresso dos alunos |
| **Evolução** | Gráficos de progresso por exercício |

### 🏃 Aluno
| Funcionalidade | Descrição |
|----------------|-----------|
| **Treino do Dia** | Visualização organizada por dias da semana |
| **Cards de Exercício** | Imagem, séries, repetições, carga e observações |
| **Tracker de Séries** | Registrar carga e reps de cada série |
| **Timer de Descanso** | Cronômetro configurável (30s a 3min) com alerta sonoro |
| **Vídeos Demonstrativos** | Vídeos do YouTube para cada exercício |
| **Evolução** | Gráficos de progresso pessoal |
| **Conquistas** | Sistema de badges e recordes pessoais |
| **Chat** | Comunicação com o personal trainer |

### 🎮 Sistema de Gamificação

#### Badges Disponíveis
| Badge | Nome | Descrição |
|-------|------|-----------|
| 🏆 | Primeiro Treino | Completou seu primeiro treino |
| 🔥 | Consistente | 3 dias seguidos de treino |
| 🔥 | Dedicado | 7 dias seguidos de treino |
| ⚡ | Imparável | 30 dias seguidos de treino |
| 📈 | Força +10 | Aumentou 10kg em um exercício |
| 🏅 | Força +25 | Aumentou 25kg em um exercício |
| 📊 | Variado | Progresso em 10 exercícios diferentes |
| 🎖️ | Veterano | 50 treinos registrados |
| 👑 | Lenda | 100 treinos registrados |

#### Sistema de Pontuação
```
Score = (Treinos × 10) + (Dias Consecutivos × 5) + (Badges × 20)
```

---

## 🛠 Tecnologias

### Backend
- **FastAPI** - Framework web Python de alta performance
- **MongoDB** - Banco de dados NoSQL
- **Motor** - Driver assíncrono para MongoDB
- **JWT** - Autenticação com tokens
- **bcrypt** - Hash de senhas
- **pandas** - Processamento de planilhas XLS/XLSX

### Frontend
- **React 18** - Biblioteca UI
- **Tailwind CSS** - Framework de estilos
- **Shadcn/UI** - Componentes UI modernos
- **Recharts** - Gráficos interativos
- **React Router** - Navegação SPA
- **Axios** - Cliente HTTP
- **jsPDF** - Geração de PDFs

---

## 📁 Estrutura do Projeto

```
/app
├── backend/
│   ├── server.py           # API FastAPI completa
│   ├── requirements.txt    # Dependências Python
│   ├── uploads/            # Imagens de exercícios
│   └── .env                # Variáveis de ambiente
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # Componentes Shadcn
│   │   │   ├── MainLayout.jsx
│   │   │   ├── ExerciseCard.jsx
│   │   │   ├── SetTracker.jsx
│   │   │   ├── ExerciseImageUpload.jsx
│   │   │   └── ExerciseVideoModal.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── PersonalDashboard.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── StudentsPage.jsx
│   │   │   ├── WorkoutsPage.jsx
│   │   │   ├── ProgressPage.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   └── GamificationPage.jsx
│   │   │
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   │
│   │   ├── lib/
│   │   │   └── api.js      # Cliente Axios
│   │   │
│   │   ├── utils/
│   │   │   └── pdfGenerator.js
│   │   │
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   │
│   ├── package.json
│   └── .env
│
└── memory/
    └── PRD.md              # Documentação do produto
```

---

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- Python 3.10+
- MongoDB 6.0+

### 1. Clone o repositório
```bash
git clone <repository-url>
cd app
```

### 2. Instalar dependências do Backend
```bash
cd backend
pip install -r requirements.txt
```

### 3. Instalar dependências do Frontend
```bash
cd frontend
yarn install
```

---

## ⚙️ Configuração

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=fitmaster
JWT_SECRET=sua-chave-secreta-aqui
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## 📖 Como Usar

### Iniciando os Serviços

#### Backend (Terminal 1)
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

#### Frontend (Terminal 2)
```bash
cd frontend
yarn start
```

Acesse: **http://localhost:3000**

---

### Fluxo de Uso

#### 1️⃣ Cadastro do Personal Trainer
1. Acesse `/register`
2. Preencha nome, email e senha
3. Clique em "Criar Conta"

#### 2️⃣ Criar Alunos
1. Vá para "Alunos" no menu
2. Clique em "Novo Aluno"
3. Preencha nome, email e senha do aluno
4. O aluno receberá uma notificação de boas-vindas

#### 3️⃣ Fazer Upload de Treino
1. Vá para "Treinos" no menu
2. Selecione o aluno
3. Faça upload de uma planilha XLS/XLSX

##### Formato da Planilha
| Dia | Grupo Muscular | Exercício | Séries | Repetições | Carga | Observações |
|-----|----------------|-----------|--------|------------|-------|-------------|
| Segunda | Peito | Supino Reto | 4 | 8-12 | 60kg | Manter cotovelos 45° |
| Segunda | Peito | Supino Inclinado | 4 | 10-12 | 40kg | Foco na parte superior |
| Segunda | Tríceps | Tríceps Pulley | 3 | 12-15 | 25kg | Controlar descida |
| Terça | Costas | Puxada Frontal | 4 | 8-12 | 50kg | Puxar até o peito |

#### 4️⃣ Aluno Acessa o Treino
1. Aluno faz login com credenciais fornecidas
2. Visualiza treino organizado por dias
3. Clica no exercício para registrar séries
4. Usa o timer de descanso entre séries

#### 5️⃣ Acompanhar Evolução
- **Personal**: Vê gráficos de todos os alunos em "Evolução"
- **Aluno**: Vê próprio progresso em "Evolução"

#### 6️⃣ Chat
- Ambos podem trocar mensagens em tempo real

#### 7️⃣ Conquistas e Ranking
- **Aluno**: Vê badges conquistados e recordes
- **Personal**: Vê ranking de engajamento dos alunos

---

## 📡 API Reference

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar personal |
| POST | `/api/auth/login` | Login (personal ou aluno) |
| GET | `/api/auth/me` | Dados do usuário logado |

### Alunos (Personal Only)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/students` | Listar alunos |
| POST | `/api/students` | Criar aluno |
| GET | `/api/students/{id}` | Detalhes do aluno |
| PUT | `/api/students/{id}` | Atualizar aluno |
| DELETE | `/api/students/{id}` | Remover aluno |

### Treinos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/workouts` | Listar treinos |
| POST | `/api/workouts/upload` | Upload de planilha XLS |
| GET | `/api/workouts/{id}` | Detalhes do treino |
| DELETE | `/api/workouts/{id}` | Remover treino |
| POST | `/api/workouts/{id}/upload-image` | Upload de imagem |

### Progresso
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/progress` | Listar progresso |
| POST | `/api/progress` | Registrar progresso |
| GET | `/api/progress/evolution` | Dados para gráfico |

### Chat
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/chat/conversations` | Listar conversas |
| GET | `/api/chat/messages/{user_id}` | Mensagens com usuário |
| POST | `/api/chat/messages` | Enviar mensagem |

### Gamificação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/gamification/badges` | Badges do aluno |
| GET | `/api/gamification/records` | Recordes pessoais |
| GET | `/api/gamification/ranking` | Ranking (personal) |

### Notificações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/notifications` | Listar notificações |
| PUT | `/api/notifications/{id}/read` | Marcar como lida |
| PUT | `/api/notifications/read-all` | Marcar todas como lidas |

### Relatórios
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/reports/student/{id}` | Dados para PDF |

---

## 🔑 Credenciais de Teste

### Personal Trainer
```
Email: test_personal@test.com
Senha: test123
```

### Aluno
```
Email: joao@test.com
Senha: aluno123
```

---

## 📸 Screenshots

### Tela de Login
- Design moderno com tema escuro
- Background com imagem de academia
- Formulário centralizado

### Dashboard do Personal
- Cards de estatísticas (alunos, treinos, progresso)
- Lista de alunos recentes
- Ações rápidas (upload, novo aluno)

### Dashboard do Aluno
- Estatísticas pessoais
- Treino organizado por dias (abas)
- Cards de exercício com imagem

### Tracker de Séries
- Imagem do exercício
- Timer de descanso configurável
- Tabela de séries com +/- para ajustar valores
- Botão de confirmar série

### Página de Conquistas
- Barra de progresso de badges
- Cards de badges conquistados
- Lista de recordes pessoais

### Ranking (Personal)
- Top 3 com destaque visual
- Score, treinos, sequência e badges

---

## 🎨 Temas

O app suporta **modo claro** e **escuro**. Clique no ícone ☀️/🌙 no header para alternar.

---

## 📱 Responsividade

O app é **mobile-first** e funciona perfeitamente em:
- 📱 Smartphones
- 📱 Tablets
- 💻 Desktops

---

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- Autenticação via JWT com expiração
- Rotas protegidas por role (personal/student)
- Validação de propriedade de recursos

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 👨‍💻 Desenvolvido com

Desenvolvido com ❤️ usando **Emergent AI**

---

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato através do chat interno do app ou abra uma issue no repositório.
