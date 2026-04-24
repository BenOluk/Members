# Build & Test
- Dev server: `npm run dev`
- Build production: `npm run build`
- Lint + typecheck: `npm run lint`

# Architecture Overview
Next.js 16 (App Router, React 19, TypeScript) aplicando Clean Architecture:

- `src/core/domain/` — entidades, value objects, regras puras. **Não importa**
  `next/*`, `react*` nem nada de `infra/`. Deve rodar em qualquer runtime.
- `src/core/application/` — use cases que orquestram domain + infra. Única
  camada que a UI pode chamar. Futuro: se tornar async trocando só o impl.
- `src/core/infra/` — adaptadores (mock, futuramente DB/HTTP). Só a
  `application/` importa daqui.
- `src/app/` — rotas App Router. Server Components por padrão.
- `src/components/` — componentes reutilizáveis; client só com `"use client"`
  quando a interatividade for estritamente necessária.
- `docs/specs/` — specs versionadas (§2 do compass_artifact).

Regra de ouro da Clean Arch neste repo:
> **UI nunca importa `@/core/infra/*`.** Sempre via `@/core/application/*`.
> **Domain nunca importa framework.**

# Conventions & Patterns
- Estilo: TailwindCSS 4; paleta dark + dourado/cobre + roxo esotérico.
  Variáveis em `globals.css` (`--background`, `--primary`, `--secondary`...).
- Fontes: Outfit (`font-heading`) para display, Inter (`font-sans`) para body.
- Copy pt-BR, vocabulário da marca: "trilha" (curso), "Ordem" (comunidade),
  "Grão-Mestre" (admin), "Iniciado/Aprendiz/Adepto/Mestre/Grão-Mestre" (níveis),
  "espaço" (subforum estilo Circle).
- Server Components por default. Só adicione `"use client"` se houver state,
  event handler, ou API de browser.
- Tipos fortes: se um use case retorna um shape, tipá-lo no domain ou exportar
  o tipo derivado. Zero `any`.
- WOW effect visual: o MVP deve impressionar à primeira vista (hero com
  gradiente escuro, carrosséis estilo Netflix, dourado em destaques).

# Gotchas
- O MVP usa **mock** (`src/core/infra/mockData.ts`). Nunca importe isso direto
  na UI — use `src/core/application/*`.
- `getCurrentUser()` hoje devolve `mockUsers[0]` (Lucas). Troque **só** em
  `application/session.ts` quando a auth real for plugada.
- Não adicione libs sem necessidade. O stack atual cobre o MVP.
- Nunca comite `node_modules`, `.next`, ou segredos.

# Docs
- Spec vigente: `docs/specs/core-platform.md` (formato Spec-Driven do §2 do doc
  metodológico `compass_artifact_wf-*.md` na pasta pai).
