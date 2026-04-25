# Sanctum — Build & Convenções

## Build
- Dev: `npm run dev`
- Build: `npm run build`
- Lint + typecheck: `npm run lint`

## Arquitetura (Clean Architecture)

```
src/core/domain/      → entidades puras (Course, User, Lesson...). Zero framework.
src/core/application/ → use cases. Única camada que a UI consome.
src/core/infra/       → mockData.ts (substituir por Supabase em prod)
src/app/              → rotas App Router (Next.js). Server Components por padrão.
src/components/       → componentes reutilizáveis.
```

Regra: **UI nunca importa `@/core/infra/*`** — sempre via `application/`.

## Rotas principais

| Rota | Função |
|------|--------|
| `/` | Dashboard do aluno (cursos em andamento) |
| `/catalog` | Vitrine pública — todos os cursos publicados, locked/unlocked |
| `/course/[courseId]` | Player + sidebar de módulos. Gate de acesso integrado |
| `/meus-cursos` | Painel do aluno — trilhas matriculadas + progresso |
| `/admin` | Painel admin (só role=admin) |
| `/admin/cursos` | CRUD de cursos |
| `/admin/cursos/novo` | Criar nova trilha |
| `/admin/cursos/[id]` | Editar trilha, módulos e aulas |
| `/admin/alunos` | Lista de membros |
| `/api/admin/cursos` | POST para criar curso |
| `/api/admin/cursos/[id]` | PATCH/DELETE curso |

## Stack de produção recomendado (plug-in)

- **DB + Auth**: Supabase (substituir `mockData.ts` + `session.ts`)
- **Vídeo**: Cloudflare Stream — upload direto do browser via signed URL em `/api/video/upload-url`
- **Pagamentos**: Stripe — Checkout Session → webhook → criar Enrollment no Supabase
- **Storage** (thumbnails/PDFs): Supabase Storage

## Padrões de código

- TailwindCSS 4 — variáveis em `globals.css` (`--background`, `--primary`...)
- Paleta: `--background #06060c`, `--primary #c9a227` (ouro), `--secondary #4e3578` (roxo)
- Fontes: Outfit (`font-heading`), Inter (`font-sans`)
- Copy: pt-BR. Vocabulário: "trilha" (curso), "Ordem" (comunidade)
- `"use client"` só quando há state/event handler/browser API
- Zero `any`. Tipos fortes no domain.

## Gotchas

- `mockCourses` é um `let []` mutável — as write ops funcionam na sessão Node (não persistem em Vercel serverless; plug Supabase para persistência real).
- `getCurrentUser()` retorna `mockUsers[0]` (admin). Trocar apenas em `application/session.ts`.
- Controle de acesso por curso: `canAccessCourse(user, course)` em `application/courses.ts`.
- Course precisa de `isPublished: true` para aparecer no catálogo público.
