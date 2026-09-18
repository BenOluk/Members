# SPEC: Sanctum — redesign “Biblioteca ritual contemporânea”

## 1. Context

- **System**: plataforma funcional em produção, com autenticação, cursos, estudo, comunidade e administração.
- **Diagnóstico**: cores e fontes já estão próximas da marca, mas a composição ainda é de dashboard genérico: cards uniformes, pouca hierarquia, excesso de bordas, curso sem identidade e player com aparência de SaaS.
- **Prior decisions**: preservar arquitetura, copy aprovada, dados, rotas e comportamento; usar o acervo real antes de gerar imagens.
- **Non-goals**: mudar regras de acesso, reescrever cursos, criar imagens de IA nesta fase, alterar Hotmart/Turso ou publicar cursos.

## 2. Outcomes

- O Sanctum é reconhecido como uma casa de estudos do Polímata no primeiro olhar.
- Biblioteca, meus estudos e player criam uma sequência visual coerente.
- Admin fica mais legível sem competir esteticamente com a experiência do aluno.
- Desktop e celular mantêm contraste, foco e navegação clara.

## 3. Constraints

- **Stack**: Next.js 16, React 19, Tailwind 4 e Server Components existentes.
- **Marca**: `_SISTEMA-IA/brands/polimata-hermetico.md` e filtro de identidade.
- **Tipografia**: EB Garamond 400 em display ≥40px; Source Serif 4 ≥17px em leitura; Cinzel apenas em micro/eyebrows.
- **Paleta**: obsidiana, creme, bege e ouro; dourado limitado a até três acentos por composição.
- **Acessibilidade**: WCAG AA, foco visível, alvos ≥44px, reduced motion, corpo nunca abaixo de 17px em conteúdo de leitura.
- **Performance**: sem bibliotecas visuais novas; imagens responsivas; animações somente CSS e discretas.

## 4. Interface / Design Contract

```ts
type VisualSurface = 'page' | 'folio' | 'inset' | 'control';
type CourseVisualKey =
  | 'de-volta-ao-eixo' | 'pneuma' | 'fogo-interior'
  | 'aureum' | 'fundamentos-hermetismo' | 'impulso';

interface CourseVisual {
  key: CourseVisualKey;
  sigil: string;
  numeral: string;
  position: string;
}
```

Primitivos CSS: `.sanctum-frame`, `.folio`, `.section-heading`, `.ornament-divider`,
`.course-plate`, `.study-progress` e `.admin-surface`. Nenhum componente depende de
cor específica fora dos tokens globais.

## 5. Acceptance Criteria

- **AC1** — Given a biblioteca, When abre em desktop ou celular, Then existe uma hierarquia inequívoca: abertura → retomada → acervo → encontros.
- **AC2** — Given seis cursos com a mesma capa provisória, When exibidos, Then continuam distinguíveis por título, numeração, sigilo e composição sem inventar imagem.
- **AC3** — Given uma aula, When abre o player, Then vídeo, mapa da trilha, ação principal, texto e caderno têm ordem de leitura clara e responsiva.
- **AC4** — Given navegação por teclado, When percorre controles, Then foco é visível e a ordem acompanha a leitura.
- **AC5** — Given telas administrativas, When usadas no celular, Then tabelas/formulários não transbordam e ações continuam acessíveis.
- **AC6** — Given prefers-reduced-motion, When ativo, Then nenhuma animação decorativa é executada.
- **AC7** — Given o projeto após mudanças, When roda check/build/smoke, Then todos passam sem alteração de regras de negócio.

## 6. Examples

- Curso sem imagem própria → frontispício tipográfico, nunca banco de imagem genérico.
- Curso sem aulas → estado editorial simples, sem card vazio com aparência de erro.
- Aula sem vídeo → “mesa em preparação” dentro do mesmo enquadramento do player.
- Nome longo → quebra controlada, sem reduzir fonte até ficar ilegível.

## 7. Task breakdown

- [x] Consolidar tokens, superfícies e moldura global.
- [x] Redesenhar header e navegação móvel.
- [x] Redesenhar biblioteca, cards e meus estudos.
- [x] Redesenhar página da trilha/player/caderno.
- [x] Harmonizar comunidade, eventos, conta e estados vazios.
- [x] Harmonizar admin sem torná-lo ornamental demais.
- [x] Testar desktop/mobile, acessibilidade, build e fluxos críticos.
- [ ] Registrar, versionar e publicar no Netlify.

## 8. Verification

- `npm run check`, `npm run build` e `npm run smoke`.
- Screenshots em 1440×900 e 390×844 das rotas críticas.
- Inspeção manual de foco, overflow, contraste, estados vazios e reduced motion.
- Produção: `/api/health` 200 e login 200 após deploy.
