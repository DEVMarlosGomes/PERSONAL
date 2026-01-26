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
  - `/api/workouts/{id}/upload-image` - Upload de imagem para exercício
  - `/api/progress/*` - Tracking de progresso e evolução
  - `/api/notifications/*` - Sistema de notificações
  - `/api/stats/*` - Estatísticas do dashboard
  - `/api/exercises/search` - Busca de exercícios

### Frontend (React + Tailwind + Shadcn)
- **Pages**: Login, Register, PersonalDashboard, StudentDashboard, StudentsPage, WorkoutsPage, ProgressPage, NotificationsPage
- **Components**: MainLayout, ExerciseCard, SetTracker (com Timer), ExerciseImageUpload

## User Personas

### Personal Trainer
- Gerencia múltiplos alunos
- Cria treinos via upload de planilha XLS/XLSX
- Acompanha evolução dos alunos
- Adiciona imagens customizadas aos exercícios

### Aluno
- Visualiza treino organizado por dias
- Registra progresso por série (carga + reps)
- Usa timer de descanso entre séries
- Acompanha própria evolução via gráficos

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

### Fase 1 - MVP
- Sistema completo de autenticação JWT
- CRUD de alunos
- Upload e parsing de planilhas XLS/XLSX
- Dashboard do Personal com estatísticas
- Dashboard do aluno com treino por abas (dias)
- Cards de exercício com imagem
- Modal de tracking de séries
- Página de evolução com gráficos
- Sistema de notificações

### Fase 2 - Refinamentos (26/01/2026)
- **Banco de imagens automático**: Exercícios recebem imagens automaticamente baseado no nome
- **Timer de descanso**: Cronômetro configurável (30s a 3min) com alerta sonoro
- **Upload de imagem customizada**: Personal pode adicionar imagem própria para exercícios
- **Tempo de descanso por exercício**: Configuração de rest_time para cada exercício

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Auth flow completo
- [x] Upload de planilha
- [x] Visualização de treino
- [x] Tracking de progresso

### P1 - Important (Done)
- [x] Banco de imagens automático para exercícios
- [x] Timer de descanso entre séries
- [x] Upload de imagens customizadas

### P2 - Nice to Have
- [ ] Vídeos demonstrativos
- [ ] Chat entre personal e aluno
- [ ] Exportar relatórios PDF
- [ ] Notificações push
- [ ] Tema claro/escuro toggle

## Next Tasks
1. Adicionar vídeos demonstrativos dos exercícios
2. Implementar chat entre personal e aluno
3. Criar exportação de relatórios em PDF
4. Adicionar notificações push

