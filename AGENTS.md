# Sanctum — Build & Convenções

## Build
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- DB local: SQLite em `data/sanctum.db` (gitignored). Criado e populado
  automaticamente no primeiro acesso. Para resetar: apague a pasta `data/`.

## Login (seed)
- Admin: `lucas@polimata.com` / senha `sanctum123` (constante `SEED_PASSWORD`
  em `src/core/infra/seed.ts`).
- Os demais usuários seed (`helena@sanctum.app`, etc.) usam a mesma senha.

## Arquitetura (Clean Architecture)

```
src/core/domain/      → entidades + regras puras (streak, níveis). Zero framework.
src/core/application/ → use cases (leituras síncronas) — única camada que a UI consome.
src/core/application/actions/ → Server Actions ('use server'): auth, learning,
                        community, notifications, admin. Toda mutação passa aqui.
src/core/infra/       → db.ts (node:sqlite, schema embutido), seed.ts, crypto.ts,
                        repos/* (queries tipadas por agregado).
src/app/              → rotas App Router. Server Components por padrão.
src/components/       → componentes reutilizáveis (admin/CourseEditor é o único client).
src/middleware.ts     → redireciona anônimos para /login (validação real em requireUser).
docs/specs/           → specs versionadas. Vigente: plataforma-funcional.md.
```

Regras de ouro:
- **UI nunca importa `@/core/infra/*`** — sempre via `application/`.
- **Domain nunca importa framework.**
- Mutações **sempre** via Server Action com `requireUser()`/`requireAdmin()`
  no início — nunca confiar só no middleware.
- Leituras da application são **síncronas** (DatabaseSync); sessão e actions
  são async.

## Auth
- Sessão: cookie httpOnly `sanctum_session`; DB guarda SHA-256 do token
  (tabela `sessions`, 30 dias). Senhas: scrypt (`infra/crypto.ts`).
- `requireUser()` redireciona para `/login`; `requireAdmin()` para `/`.
- Não há cadastro público: contas criadas em `/admin/alunos`.

## Rotas

| Rota | Acesso | Função |
|------|--------|--------|
| `/login` | pública | login |
| `/` | membro | dashboard Netflix-style |
| `/meus-cursos` | membro | trilhas matriculadas + progresso |
| `/course/[courseId]?l=` | membro | player; concluir aula dá XP/streak/badge |
| `/community`, `/space/[spaceId]` | membro | Ordem: posts, likes, comentários |
| `/events`, `/notifications`, `/certificates`, `/profile/[userId]`, `/search` | membro | — |
| `/admin` + subrotas | admin | trilhas (CRUD + editor), membros, espaços, eventos |

## Padrões de código
- TailwindCSS 4 — tokens oklch em `globals.css` (`--background`, `--primary`...).
- Fontes: Outfit (`font-heading`), Inter (`font-sans`).
- Copy pt-BR. Vocabulário: "trilha", "Ordem", "espaço", "Grão-Mestre",
  níveis Iniciado/Aprendiz/Adepto/Mestre/Grão-Mestre.
- `"use client"` só com state/event handler real (hoje: só CourseEditor e error.tsx).
- Zero `any`. Formulários server-first (`<form action={serverAction}>`).

## Gotchas
- `node:sqlite` exige Node ≥ 22.5 (estável no 24).
- Singleton do DB vive em `globalThis.__sanctumDb` (sobrevive ao hot-reload).
- `listCourses()` devolve só publicadas; admin usa `{ includeUnpublished: true }`.
- Curso despublicado continua acessível a quem já está matriculado.
- `completeLesson` é idempotente — o XP nunca duplica.
- Gamificação: regras puras em `domain/streak.ts` e `domain/levels.ts`;
  orquestração em `actions/learning.ts`.

## Próximos passos (fora do MVP)
- Vídeo: Cloudflare Stream/Mux no lugar das URLs externas.
- Pagamento: Stripe/Hotmart webhook → criar Enrollment.
- Postgres: trocar implementação de `infra/repos/*` (interfaces preservadas).
- E-mail transacional (convite, recuperação de senha).
