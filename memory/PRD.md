# FitMaster - Personal Trainer App

## Problem Statement
Aplicativo web de personal trainer para cliente final com dois perfis bem definidos:
- **PERSONAL**: Login próprio, painel administrativo, criar alunos, upload de planilha .xls/.xlsx, associar planilha a aluno, editar/versionar treinos, visualizar progresso
- **CLIENTE/ALUNO**: Login simples, visualiza apenas o próprio treino organizado por dias da semana com exercícios, séries, repetições, carga e observações

## Architecture

### Backend (FastAPI + MongoDB)
- **Auth**: JWT com bcrypt para senha
- **Models**: User, Workout, Progress, Notification, Message
- **Endpoints**:
  - `/api/auth/*` - Autenticação
  - `/api/students/*` - CRUD de alunos
  - `/api/workouts/*` - Upload XLS e gerenciamento de treinos
  - `/api/progress/*` - Tracking de progresso
  - `/api/notifications/*` - Notificações
  - `/api/chat/*` - Mensagens entre personal e aluno
  - `/api/exercises/*` - Busca e vídeos de exercícios
  - `/api/reports/*` - Relatórios para PDF
  - `/api/gamification/*` - Badges, recordes e ranking

### Frontend (React + Tailwind + Shadcn)
- **Pages**: Login, Register, Dashboard, Students, Workouts, Progress, Notifications, Chat, Gamification
- **Components**: MainLayout, ExerciseCard, SetTracker, ExerciseVideoModal, ExerciseImageUpload

## What's Been Implemented

### Fase 1 - MVP (26/01/2026)
- Sistema completo de autenticação JWT
- CRUD de alunos e treinos
- Upload de planilhas XLS/XLSX
- Dashboard do Personal e Aluno
- Tracking de séries/reps/carga
- Gráficos de evolução
- Sistema de notificações

### Fase 2 - Refinamentos (26/01/2026)
- Banco de imagens automático (40+ exercícios)
- Timer de descanso configurável (30s-3min)
- Upload de imagem customizada para exercícios

### Fase 3 - Recursos Avançados (26/01/2026)
- Chat em tempo real entre personal e aluno
- Vídeos demonstrativos (YouTube embeds)
- Exportação PDF de relatórios
- Modo claro/escuro com persistência

### Fase 4 - Gamificação (26/01/2026)
- **9 Badges** disponíveis:
  - Primeiro Treino, Consistente (3 dias), Dedicado (7 dias), Imparável (30 dias)
  - Força +10 (aumento de 10kg), Força +25 (aumento de 25kg)
  - Variado (10 exercícios diferentes)
  - Veterano (50 treinos), Lenda (100 treinos)
- **Recordes Pessoais** por exercício
- **Ranking de Alunos** com sistema de pontos
- Pontuação: treinos × 10 + sequência × 5 + badges × 20

## Core Features
- [x] Autenticação JWT
- [x] Perfis separados (Personal/Aluno)
- [x] Upload de planilha XLS/XLSX
- [x] Visualização de treino por dia
- [x] Cards de exercício com imagem
- [x] Tracking de séries/reps/carga
- [x] Timer de descanso
- [x] Gráficos de evolução
- [x] Sistema de notificações
- [x] Chat entre personal e aluno
- [x] Vídeos demonstrativos
- [x] Exportação PDF
- [x] Modo claro/escuro
- [x] Sistema de badges
- [x] Recordes pessoais
- [x] Ranking de alunos

## Credenciais de Teste
- **Personal**: test_personal@test.com / test123
- **Aluno**: joao@test.com / aluno123

## Next Tasks
1. PWA com notificações push
2. Sistema de metas por exercício
3. Histórico de versões de treino
4. App mobile nativo

