# SPEC: Sanctum — Plataforma funcional (persistência + auth + admin)

> Sucede `core-platform.md` (MVP visual). A spec é fonte de verdade; código é
> artefato derivado. Metodologia: `_SISTEMA-IA/docs/metodologia-specs.md`.

## 1. Context

- **System**: área de membros Sanctum (Next.js 16 App Router, React 19, TS 5
  strict, Tailwind 4) com Clean Architecture já estabelecida:
  `core/domain` puro → `core/application` (única camada que a UI chama) →
  `core/infra` (hoje `mockData.ts` in-memory). UI 100% Server Components,
  botões de ação ainda decorativos.
- **Prior decisions**:
  - Projeto canônico consolidado em `polimata-members/` (raiz do workspace),
    fora do vault Obsidian. As duas cópias anteriores foram unificadas
    (UI refinada da raiz do vault + conceito de admin da cópia de abril).
  - **Zero dependências novas**: persistência via `node:sqlite` (DatabaseSync,
    nativo no Node ≥ 22.5; estável no Node 24), hash de senha via
    `node:crypto` scrypt. Sem NextAuth, sem ORM.
  - Leituras da application layer permanecem **síncronas** (DatabaseSync é
    sync) — as páginas existentes não mudam de shape. Sessão e mutações são
    async (cookies + Server Actions).
  - Mutações via **Server Actions** + `<form>` — sem API routes, mínimo de
    client components (apenas o editor de curso do admin).
- **Non-goals desta entrega**:
  - Pagamento, Stripe, webhook Hotmart (matrícula = self-enroll ou concessão
    do admin).
  - Video hosting próprio (URLs externas continuam).
  - E-mail real, recuperação de senha, cadastro público (contas criadas pelo
    admin ou seed).
  - Migração a Postgres (a camada repo isola; trocar depois).
  - Testes E2E Playwright (verificação manual + build/lint nesta sprint).

## 2. Outcomes (Goals)

- **Business outcome**: a plataforma deixa de ser vitrine e passa a funcionar:
  aluno loga, estuda, ganha XP/streak/badges/certificado, participa da Ordem;
  o Grão-Mestre administra cursos, alunos, espaços e eventos sem tocar código.
- **Measurable success**:
  - `npm run build` e `npm run lint` passam sem erros.
  - Toda ação visível na UI executa de verdade (zero botões mortos).
  - Dados sobrevivem a restart do servidor (SQLite em `data/sanctum.db`).
  - Zero imports de `@/core/infra/*` na UI; domain segue puro.
  - Rotas de membro inacessíveis sem sessão; `/admin` inacessível sem
    `role=admin` (verificável por curl/navegação anônima).

## 3. Constraints

- **Language/runtime**: TypeScript 5 strict, Node ≥ 22.5 (node:sqlite),
  React 19, Next 16, Tailwind 4. Zero `any`.
- **Security**: senha com scrypt (salt aleatório, timingSafeEqual); cookie de
  sessão httpOnly + sameSite=lax; token de sessão guardado como SHA-256 no DB;
  toda Server Action revalida sessão/role no servidor; input validado nas
  bordas (length/required); nada de segredo em client.
- **Acessibilidade**: contraste AA, foco visível, `aria-label` em ícones,
  botões reais (`<button>`/`<form>`) em vez de divs clicáveis.
- **Design system**: paleta e vocabulário existentes (`globals.css` oklch,
  "trilha", "Ordem", "Grão-Mestre", níveis Iniciado→Grão-Mestre). Identidade:
  `_SISTEMA-IA/brands/polimata-hermetico.md`. Admin usa a mesma linguagem
  visual (dark, dourado, sem clichês místicos).

## 4. Interface / API Contract

### Domain (mudanças em `core/domain/entities.ts`)

```ts
interface User {
  // ... campos existentes, mais:
  email: string;            // login (único)
}
interface Course {
  // ... campos existentes, mais:
  isPublished: boolean;     // só publicado aparece para aluno
}
// PasswordHash e Session NÃO entram no domain — são infra.
```

### Infra (`core/infra/`) — só a application importa

```ts
// db.ts — singleton DatabaseSync, WAL, bootstrapSchema(), seedIfEmpty()
// repos/*.ts — queries tipadas síncronas por agregado:
//   users, sessions, courses, community, events, notifications, certificates
// Tabelas: users, sessions, badges, user_badges, user_completed_lessons,
//   follows, courses, modules, lessons, lesson_resources, enrollments,
//   certificates, spaces, posts, post_likes, comments, events, notifications
```

### Application — leituras (sync, assinaturas preservadas)

Módulos existentes (`courses`, `users`, `community`, `events`,
`notifications`, `certificates`, `search`, `dashboard`) mantêm as mesmas
funções, agora lendo dos repos. Diferenças:

```ts
// session.ts (async — cookies())
getCurrentUser(): Promise<User | null>
requireUser(): Promise<User>        // redirect('/login') se anônimo
requireAdmin(): Promise<User>       // redirect('/') se não-admin
// courses.ts
listCourses(opts?: { includeUnpublished?: boolean }): Course[]
```

### Application — Server Actions (`core/application/actions/`)

```ts
// auth.ts
login(formData): Promise<{ error?: string }>   // email+senha → cookie
logout(): Promise<void>
// learning.ts
completeLesson(courseId, lessonId): Promise<void>  // idempotente
enroll(courseId): Promise<void>
// community.ts
createPost(formData): Promise<void>            // spaceId, title?, content
toggleLikePost(postId): Promise<void>
addComment(postData): Promise<void>
toggleFollow(userId): Promise<void>
// notifications.ts
markAllNotificationsRead(): Promise<void>
// admin.ts (todas com requireAdmin)
saveCourse(payload): Promise<{ id: string }>   // create/update + módulos/aulas
deleteCourse(id); togglePublishCourse(id)
saveSpace(formData); deleteSpace(id)
saveEvent(formData); deleteEvent(id)
setUserRole(userId, role); grantEnrollment(userId, courseId)
revokeEnrollment(userId, courseId); createMember(formData)  // nome+email+senha
resetMemberPassword(userId, newPassword)
```

### Regras de gamificação (completeLesson)

1. No-op se a aula já estava concluída.
2. `xp += lesson.xpReward`; cria enrollment se não existir;
   atualiza `lastWatchedLessonId/lastWatchedAt`.
3. Streak: última atividade ontem → `current+1`; hoje → mantém; antes → `1`.
   `longest = max(longest, current)`.
4. Badges: `b_primeiro_passo` (1ª aula), `b_constante` (streak ≥ 7),
   `b_iluminado` (trilha 100%). Cada badge gera notificação `badge_earned`.
5. Trilha 100% → `enrollment.completedAt`, `Certificate` com código
   `PHM-<ano>-<6 hex>`, notificação `certificate_issued`.

### Rotas

| Rota | Acesso | Novidade |
|------|--------|----------|
| `/login` | pública | form de login |
| `/`, `/course/*`, `/community`, `/space/*`, `/events`, `/profile/*`, `/search`, `/notifications`, `/certificates`, `/meus-cursos` | sessão | ações reais |
| `/admin` | admin | métricas |
| `/admin/cursos`, `/admin/cursos/novo`, `/admin/cursos/[id]` | admin | CRUD + editor módulos/aulas |
| `/admin/alunos`, `/admin/alunos/novo` | admin | membros, role, matrículas, senha |
| `/admin/espacos`, `/admin/eventos` | admin | CRUD |

Middleware (runtime nodejs): sem cookie → redirect `/login` (exceto `/login`
e estáticos). Validação real da sessão em `requireUser`.

## 5. Acceptance Criteria (Given/When/Then)

- **AC1 Login** — Given usuário seed `lucas@polimata.com` com a senha inicial,
  When submete `/login`, Then recebe cookie httpOnly e cai no dashboard;
  senha errada mostra erro sem revelar se o e-mail existe.
- **AC2 Guard** — Given visitante sem cookie, When abre qualquer rota de
  membro, Then é redirecionado a `/login`. Given aluno `role=student`, When
  abre `/admin`, Then é redirecionado a `/` (e Server Actions de admin
  lançam erro mesmo via POST direto).
- **AC3 Concluir aula** — Given aluna com aula X não concluída, When clica
  "Marcar como concluída", Then XP sobe, aula marca ✓ na sidebar, streak
  atualiza, e segundo clique não duplica XP.
- **AC4 Certificado** — Given trilha com todas as aulas menos uma concluídas,
  When conclui a última, Then enrollment ganha `completedAt`, certificado
  aparece em `/certificates` com código único e notificação é criada.
- **AC5 Post real** — Given membro em `/community`, When publica texto num
  espaço permitido, Then o post persiste (sobrevive a restart) e aparece no
  feed global e no espaço; conteúdo vazio é rejeitado.
- **AC6 Like/comentário** — When curte/comenta, Then contadores e lista
  atualizam; segundo like remove (toggle); autor do post recebe notificação
  de comentário.
- **AC7 Admin curso** — Given Grão-Mestre em `/admin/cursos/novo`, When cria
  trilha com 2 módulos e 3 aulas e publica, Then ela aparece no dashboard do
  aluno; despublicar a esconde (mas não para quem já está matriculado).
- **AC8 Admin aluno** — When admin cria membro, muda role, concede/revoga
  matrícula, Then o efeito vale no próximo request do afetado.
- **AC9 Persistência** — Given qualquer mutação acima, When o dev server
  reinicia, Then o estado permanece (SQLite, não memória).
- **AC10 Clean Arch** — grep de `@/core/infra` em `src/app` + `src/components`
  retorna vazio; domain sem imports de framework.

## 6. Examples (I/O + edge cases)

- `login('lucas@polimata.com', 'senha-certa')` → cookie + redirect `/`.
- `login('x@y.z', 'qualquer')` → `{ error: 'Credenciais inválidas.' }` (igual
  para e-mail inexistente e senha errada).
- `completeLesson` na mesma aula 2× → XP conta 1×.
- Curso sem aulas → progresso 0%, player mostra estado vazio (sem crash —
  hoje `allLessonsOfCourse(course)[0].id` explode; corrigir).
- Space premium + student → composer oculto, posts ocultos, **contadores
  também ocultos** (hoje vazam).
- Sessão expirada (> 30 dias) → próxima navegação redireciona a `/login`.
- Admin deleta curso com matrículas → enrollments/certificados ficam órfãos?
  Não: FK `ON DELETE CASCADE` em modules/lessons/enrollments; certificados
  permanecem (registro histórico) com `courseId` órfão tolerado na UI («—»).

## 7. Task breakdown

- [x] Consolidar projeto canônico em `polimata-members/` (fora do vault)
- [ ] Infra: `db.ts` (schema + WAL) + `seed.ts` (dados atuais do mock)
- [ ] Repos por agregado (users, sessions, courses, community, events,
      notifications, certificates)
- [ ] Application reads plugadas nos repos (assinaturas preservadas)
- [ ] Auth: scrypt + sessions + `/login` + middleware + logout no header
- [ ] Actions de membro: learning, community, notifications, follow
- [ ] UI de membro ligada às actions (formulários server-first)
- [ ] `/meus-cursos` + página de curso com estados vazio/não-matriculado
- [ ] Admin: layout + visão geral + cursos (lista/editor) + alunos +
      espaços + eventos
- [ ] Limpeza do vault (untrack node_modules/conteúdo; remover código
      duplicado; atualizar CLAUDE/AGENTS do workspace e do vault)
- [ ] Verificação: build, lint, golden path manual

## 8. Verification

- **Determinístico**: `npm run build`, `npm run lint`,
  `grep -r "core/infra" src/app src/components` vazio.
- **Smoke manual (golden path)**: login → dashboard → concluir aula → XP/streak
  sobem → concluir trilha → certificado → postar na Ordem → curtir/comentar →
  logout → guard → login admin → criar curso → publicar → visível como aluno.
- **Unit (futuro)**: regras de streak/badge em `core/domain` são puras e
  testáveis sem DB.
