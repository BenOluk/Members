# SPEC: Polímata Hermético — Área de Membros (core)

> Aplica o template Spec-Driven Development (§2 do compass_artifact). A spec é
> fonte-de-verdade; código é artefato derivado. Modelos de referência:
> Hotmart (catálogo + progresso), Circle (spaces + feed), The Members (gamificação).

## 1. Context

- **System**: plataforma de área de membros para cursos + comunidade + gamificação
  do Polímata Hermético. Único tenant (a marca), muitos usuários.
- **Prior decisions**:
  - Stack: Next.js 16 (App Router), React 19, TypeScript 5, TailwindCSS 4.
  - Clean Architecture (§15 do doc) — `src/core/domain` puro, `src/core/application`
    com use cases, `src/core/infra` para adaptadores. UI em `src/app` e
    `src/components` chama apenas `application/`.
  - Server Components por padrão; Client Components só onde há interatividade real.
  - Paleta dark + dourado/cobre, tipografia Outfit (display) + Inter (body).
- **Non-goals (MVP atual)**:
  - Autenticação real com OAuth (usamos mock de sessão — substituível via adapter).
  - Persistência real em DB (mock in-memory em `infra/mockData.ts`).
  - Pagamento, assinatura, webhooks Hotmart (fora do escopo desta sprint).
  - Video hosting próprio (usamos URLs externas; estrutura aceita Mux/Cloudflare no futuro).

## 2. Outcomes (Goals)

- **Business outcome**: aluno do Polímata entra, reconhece a marca no primeiro
  segundo, encontra "onde parei" em 1 clique, e sente que *pertence a uma Ordem* —
  não a um portal de cursos genérico.
- **Measurable success** (MVP visual + arquitetura):
  - Navegação cliente < 100ms entre rotas (Server Components + link prefetch).
  - LCP < 2s no hero do dashboard.
  - Zero imports de `next/*` ou React em `src/core/domain`.
  - Zero chamadas diretas da UI a `mockData`; sempre via `application/`.
  - `npm run build` e `npm run lint` passam sem erro.

## 3. Constraints

- **Language/runtime**: TypeScript 5.x strict, Node 22, React 19, Tailwind 4.
- **SLOs (MVP)**: p95 interativo < 150ms; CLS < 0.05.
- **Security**: nenhuma credencial em cliente; futuramente httpOnly cookies para
  sessão; OWASP Top 10 seguido nas bordas (entrada de usuário sempre validada).
- **Acessibilidade**: contraste WCAG AA; `aria-label` em ícones clicáveis;
  foco visível.
- **Design system**:
  - Dark obrigatório. `--background: #05050a`, `--primary: #d4af37` (dourado
    hermético), `--secondary: #5a3e85` (roxo esotérico).
  - Cantos sutis (`rounded-sm`/`rounded-md`), sombras leves, sem glassmorphism
    pesado.
  - Copy em pt-BR; vocabulário próprio da marca: "trilha" (curso), "Ordem"
    (comunidade), "Grão-Mestre" (admin), "Iniciado/Aprendiz/Adepto/Mestre"
    (níveis), "espaço" (subforum tipo Circle).

## 4. Interface / API Contract

### Entidades (`src/core/domain/entities.ts`)

```ts
User              { id, name, handle, avatar, role, bio?, xp, streak, badgeIds[],
                    completedLessonIds[], enrolledCourseIds[], followingUserIds[] }
Course            { id, title, subtitle, description, thumbnail, coverImage,
                    categoryId, instructorId, modules[], tags[], level,
                    featured, ratingAverage, totalEnrollments }
Module / Lesson   { id, title, order, lessons[] | videoUrl, duration, xpReward,
                    resources[] }
LessonResource    { id, kind: 'pdf'|'audio'|'link'|'exercise', title, url }
Enrollment        { id, userId, courseId, enrolledAt, lastWatchedLessonId?,
                    lastWatchedAt?, completedAt? }
Certificate       { id, userId, courseId, issuedAt, credentialCode }
Space             { id, name, slug, description, icon, visibility, memberCount,
                    categoryLabel, pinnedPostIds[] }
Post              { id, spaceId, authorId, title?, content, likes,
                    likedByUserIds[], createdAt, pinned, comments[] }
Comment           { id, postId, authorId, content, createdAt, likes }
LiveEvent         { id, title, kind: 'live'|'workshop'|'mentoria'|'ritual',
                    hostUserId, startsAt, durationMinutes, joinUrl, attendeeCount }
AppNotification   { id, userId, kind, title, body, href?, read, createdAt }
Badge             { id, name, description, icon, rarity }
```

### Use cases (`src/core/application/`)

| módulo          | funções principais |
|-----------------|--------------------|
| `session`       | `getCurrentUser`, `isAdmin`, `isModerator` |
| `users`         | `getUserById`, `getUserProgress`, `topLearners`, `getBadgesForUser` |
| `courses`       | `listCourses`, `getCourseById`, `getCourseProgress`, `getContinueWatching`, `getLesson`, `getNextLesson`, `getPreviousLesson`, `searchCourses` |
| `community`     | `listSpaces`, `getSpaceById`, `groupedSpaces`, `listPosts`, `canUserAccessSpace`, `countPostsBySpace` |
| `events`        | `listUpcomingEvents`, `timeUntilEvent` |
| `notifications` | `listNotifications`, `countUnread` |
| `certificates`  | `listCertificates`, `getCertificate` |
| `search`        | `globalSearch` → `{ courses, users, spaces, posts }` |
| `dashboard`     | `getDashboardSnapshot` → view-model completo do home |

Todos são síncronos hoje (mock). O shape é compatível com a futura versão
assíncrona — migração substitui impl sem tocar em chamadas.

## 5. Acceptance Criteria (Given/When/Then)

**AC-1 — Home Netflix-style**
*Given* um aluno autenticado com matrícula ativa,
*When* ele abre `/`,
*Then* vê um hero com o curso mais recente em andamento, carrossel "Sua jornada"
com progresso, "Em destaque" com featured, e uma faixa por categoria.

**AC-2 — Continuar assistindo preciso**
*Given* o aluno tem `lastWatchedLessonId` em uma matrícula não concluída,
*When* ele clica em "Continuar assistindo" no hero,
*Then* abre `/course/:id?l=:lessonId` com exatamente essa aula selecionada.

**AC-3 — Gamificação visível**
*Given* o aluno tem XP > 0,
*When* ele abre `/` ou `/profile/:id`,
*Then* vê: nível atual, barra de progresso até o próximo nível, XP total,
streak em dias, badges recentes.

**AC-4 — Comunidade multi-espaço**
*Given* existem ≥ 2 spaces de categorias distintas,
*When* o aluno abre `/community`,
*Then* vê sidebar com spaces agrupados por categoria e feed global; clicando
em um space, vai para `/space/:id` com feed filtrado.

**AC-5 — Space premium bloqueado**
*Given* um space com `visibility: 'premium'` e o aluno é `student`,
*When* ele abre `/space/:id`,
*Then* vê tela de restrição explicando que o acesso é por convite; o composer
e os posts ficam ocultos.

**AC-6 — Navegação entre aulas**
*Given* o aluno está em uma aula intermediária,
*When* ele clica em "Aula anterior" ou "Próxima aula",
*Then* a URL atualiza para `?l=:lessonId` correspondente e o vídeo recarrega.

**AC-7 — Busca global**
*Given* o aluno digita "kybalion" no header,
*When* envia o form,
*Then* `/search?q=kybalion` lista resultados agrupados em Trilhas, Pessoas,
Espaços, Posts.

**AC-8 — Perfil público**
*Given* qualquer usuário da plataforma,
*When* o aluno abre `/profile/:userId`,
*Then* vê avatar, bio, nível, XP, streak, todas as badges, trilhas em andamento
com progresso, posts recentes.

**AC-9 — Certificados**
*Given* o aluno concluiu uma trilha (flag `completedAt` na enrollment) e tem
`Certificate`,
*When* abre `/certificates`,
*Then* vê o certificado com credencial única verificável.

**AC-10 — Clean Architecture preservada**
*Given* qualquer componente em `src/components` ou `src/app`,
*When* inspecionamos imports,
*Then* não há import de `@/core/infra/mockData` — sempre via `@/core/application/*`.
(regra humana + futura lint rule)

## 6. Examples (I/O de use cases)

```ts
// getCourseProgress(user, course)
{ courseId: 'course_1', totalLessons: 5, completedLessons: 3,
  percentage: 60, nextLessonId: 'lesson_4' }

// getContinueWatching(user)
[ { course: {...}, progress: { percentage: 60, nextLessonId: 'lesson_4', ... } },
  { course: {...}, progress: { percentage: 20, nextLessonId: 'lesson_8', ... } } ]

// globalSearch('kybalion')
{ courses: [course_1], users: [], spaces: [sp_kybalion],
  posts: [post_3, post_5] }

// timeUntilEvent(event startingIn 2d4h)
{ days: 2, hours: 4, minutes: 12, isLive: false }
```

Edge cases cobertos:
- Curso sem lessons concluídas → `percentage: 0`, `nextLessonId` = primeira.
- User sem enrollments → `continueWatching: []` (carrossel não renderiza).
- XP no topo da curva → `nextLevel: undefined`, `xpToNext: 0`, UI mostra "Círculo completo".
- Space premium acessado por student → view bloqueada, zero vazamento de posts.
- Pesquisa vazia → todos os arrays vazios.

## 7. Task breakdown (rastreado em TaskList)

- [x] Domain com value objects (Level, Streak, Badge, ...)
- [x] Mock data volumoso (Hotmart-scale)
- [x] Application layer (8 módulos de use cases)
- [x] Componentes reutilizáveis (AppHeader, CourseCard, PostCard, ...)
- [x] Dashboard refeito com stats + leaderboard
- [x] Community com spaces agrupados
- [x] Course player com URL lessonId + next/prev
- [x] Páginas: profile, events, certificates, space, search, notifications
- [ ] Persistência real (Postgres + Drizzle) — próxima sprint
- [ ] Autenticação (NextAuth + Hotmart webhook) — próxima sprint
- [ ] Eval suite visual (Playwright + screenshot diff) — próxima sprint

## 8. Verification

### Determinístico (roda em CI)

- `npm run build` — build production sem erros.
- `npm run lint` — ESLint + TypeScript.
- Rule humana por enquanto (futuro: ESLint custom rule):
  - `src/core/domain/**` não pode importar de `next/*`, `react*`, `@/core/infra/*`.
  - `src/app/**` e `src/components/**` não podem importar de `@/core/infra/*`.

### Visual / interativo (manual ou Playwright futuro)

Checklist golden path:
1. `/` carrega, hero com vídeo de fundo, carrosséis populados.
2. Clicar em "Continuar assistindo" leva a `/course/:id?l=:lessonId` correto.
3. Navegar entre aulas via sidebar e via botões next/prev.
4. `/community` mostra sidebar com 8 spaces agrupados em 5 categorias.
5. `/space/sp_premium` como student mostra tela bloqueada.
6. `/profile/user_1` mostra todas as badges + trilhas.
7. `/search?q=kybalion` agrupa resultados em 4 seções.
8. Header persiste em todas as páginas com busca, notificações, avatar.

---

## Referências (fonte única da verdade)

- Base metodológica: `compass_artifact_wf-45246d95-*.md` (§2 SDD, §11 Tools,
  §13.1 Web fullstack, §15 Clean Arch + SOLID com IA).
- Hotmart: catálogo, progresso, certificado.
- Circle: spaces, pinned, visibility tiers, feed por categoria.
- The Members: níveis nomeados, streak, badges raros/lendários.
