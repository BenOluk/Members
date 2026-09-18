# SPEC: Sanctum — catálogo inicial de cursos

## 1. Context

- **System**: o Sanctum já possui CRUD de trilhas e banco Turso, mas a produção começou sem cursos fictícios.
- **Prior decisions**: o acervo do vault é a fonte; a sincronização apenas cria estrutura editorial e nunca publica automaticamente.
- **Non-goals**: copiar documentos integrais, inventar vídeos/durações, publicar orientação de saúde, cadastrar esboços futuros ou alterar matrículas.

## 2. Outcomes

- Seis produtos reais aparecem no admin como rascunhos editáveis.
- Uma nova execução atualiza o catálogo sem duplicar cursos.
- Alunos não veem as trilhas antes de uma decisão explícita de publicação.

## 3. Constraints

- Next.js 16, TypeScript strict, libSQL/Turso e Clean Architecture existentes.
- Segredos somente por variáveis de ambiente.
- Identidade: `_SISTEMA-IA/brands/polimata-hermetico.md`.
- Títulos e hierarquia vêm dos arquivos reais; vídeo e duração ficam vazios quando não verificados.

## 4. Interface / API Contract

```ts
interface CatalogCourse {
  sourceKey: string;
  title: string;
  subtitle: string;
  description: string;
  categoryId: CourseCategoryId;
  level: Course['level'];
  modules: Array<{ title: string; lessons: Array<{ title: string; description: string }> }>;
}
```

`npm run sync:courses` exige uma conta administradora e cria/atualiza por título canônico.

## 5. Acceptance Criteria

- **AC1** — Given um banco com administrador, When a sincronização roda, Then cria seis rascunhos com módulos e aulas.
- **AC2** — Given o catálogo já sincronizado, When roda novamente, Then mantém seis cursos e atualiza a estrutura sem duplicar.
- **AC3** — Given um aluno, When abre o catálogo, Then nenhum desses rascunhos é exibido.
- **AC4** — Given cursos ou matrículas alheios, When sincroniza, Then nenhum deles é removido ou alterado.

## 6. Examples

- Banco sem admin → falha explícita, sem escrita parcial.
- Aula sem vídeo confirmado → `videoUrl: ''`, `duration: 0`.
- Produto substituído (`Desafio Super-Homem`) → não é importado ao lado de `DE VOLTA AO EIXO`.

## 7. Task breakdown

- [x] Inventariar fontes e distinguir produtos canônicos, legados e esboços.
- [x] Modelar catálogo versionado.
- [x] Criar comando idempotente de sincronização.
- [x] Testar em banco temporário e sincronizar produção.
- [x] Publicar e verificar o admin/saúde.

## 8. Verification

- Unit/integration: duas sincronizações consecutivas, contagem e estado de publicação.
- Determinístico: `npm run check` e `npm run build`.
- Produção: comando concluído, `/api/health` 200 e seis títulos confirmados por consulta sem dados pessoais.
