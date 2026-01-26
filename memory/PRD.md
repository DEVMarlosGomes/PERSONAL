# FitMaster - Personal Trainer App

## Problem Statement
Aplicativo web de personal trainer para cliente final com dois perfis bem definidos:
- **PERSONAL**: Login próprio, painel administrativo, criar alunos, upload de planilha .xls/.xlsx, associar planilha a aluno, editar/versionar treinos, visualizar progresso
- **CLIENTE/ALUNO**: Login simples, visualiza apenas o próprio treino organizado por dias da semana com exercícios, séries, repetições, carga e observações

## Architecture

### Backend (FastAPI + MongoDB)
- **Auth**: JWT com bcrypt para senha
- **Models**: User (Personal/Student), Workout, Progress, Notification
- **Endpoints**:
  - `/api/auth/*` - Autenticação
  - `/api/students/*` - CRUD de alunos (Personal only)
  - `/api/workouts/*` - Upload XLS e gerenciamento de treinos
  - `/api/progress/*` - Tracking de progresso e evolução
  - `/api/notifications/*` - Sistema de notificações
  - `/api/stats/*` - Estatísticas do dashboard

### Frontend (React + Tailwind + Shadcn)
- **Pages**: Login, Register, PersonalDashboard, StudentDashboard, StudentsPage, WorkoutsPage, ProgressPage, NotificationsPage
- **Components**: MainLayout, ExerciseCard, SetTracker

## User Personas

### Personal Trainer
- Gerencia múltiplos alunos
- Cria treinos via upload de planilha XLS/XLSX
- Acompanha evolução dos alunos
- Recebe notificações de progresso

### Aluno
- Visualiza treino organizado por dias
- Registra progresso por série (carga + reps)
- Acompanha própria evolução via gráficos
- Usa no celular durante treino

## Core Requirements (Static)
- [x] Autenticação JWT
- [x] Perfis separados (Personal/Aluno)
- [x] Upload de planilha XLS/XLSX
- [x] Parsing automático da planilha
- [x] Visualização de treino por dia
- [x] Cards de exercício com imagem
- [x] Tracking de séries/reps/carga
- [x] Gráficos de evolução
- [x] Sistema de notificações
- [x] Histórico de treinos
- [x] Versionamento de treinos

## What's Been Implemented (26/01/2026)

### Backend
- Sistema completo de autenticação JWT
- CRUD de alunos (criar, listar, editar, remover)
- Upload e parsing de planilhas XLS/XLSX
- Associação de treino a aluno
- Registro de progresso por exercício
- API de evolução para gráficos
- Sistema de notificações automáticas
- Estatísticas do dashboard

### Frontend
- Tela de login e registro (design moderno escuro)
- Dashboard do Personal com estatísticas
- Gerenciamento de alunos com modal de criação
- Upload de treinos com preview
- Dashboard do aluno com treino por abas (dias)
- Cards de exercício com imagem
- Modal de tracking de séries (SetTracker)
- Página de evolução com gráficos
- Página de notificações
- Navegação responsiva

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Auth flow completo
- [x] Upload de planilha
- [x] Visualização de treino
- [x] Tracking de progresso

### P1 - Important
- [ ] Upload de imagens customizadas para exercícios
- [ ] Integração com API externa de exercícios (ExerciseDB)
- [ ] Timer de descanso entre séries
- [ ] Notificações push

### P2 - Nice to Have
- [ ] Vídeos demonstrativos
- [ ] Chat entre personal e aluno
- [ ] Exportar relatórios PDF
- [ ] Tema claro/escuro

## Next Tasks
1. Implementar upload de imagens para exercícios
2. Adicionar timer de descanso no SetTracker
3. Integrar API de exercícios para sugestões
4. Melhorar gráficos de evolução com comparativos
