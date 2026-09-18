# SPEC: Sanctum — autonomia e prontidão para produção

## 1. Context

Revisão solicitada em 17/09/2026. O projeto já possui Next.js 16, React 19,
TypeScript, SQLite, autenticação, trilhas, comunidade e administração. A entrega
deve tornar a operação publicável, com domínio sobre código e dados e sem comissão
da plataforma por venda. Hospedagem, domínio, processamento de pagamentos e vídeo
podem ter custos próprios; gratuidade ilimitada não é uma premissa.

Pedido consolidado: revisar o produto existente, corrigir falhas de acesso e
persistência, completar os fluxos de operação, melhorar a experiência de estudo e
administração, testar os caminhos críticos e entregar o projeto com instalação,
ativação, backup e recuperação documentados.

Non-goals: inventar cursos, membros ou depoimentos reais; contratar serviços;
publicar dados de demonstração como produção; prometer proteção absoluta contra
cópia de vídeos; assumir preços, planos de assinatura ou credenciais do titular.

## 2. Outcomes

- Primeira instalação sem senha pública, alunos ou cursos fictícios.
- Acesso a aulas controlado no servidor por matrícula e estado da conta.
- Administração utilizável, inclusive em celular.
- Dados persistentes e procedimento verificável de backup/restauração.
- Build, lint, tipos e testes dos controles críticos aprovados.
- Guia de ativação distingue o que foi testado localmente do que exige conta externa.

## 3. Constraints

Preservar o código e os dados existentes. Clean Architecture: UI chama application;
domain não importa framework. Copy pt-BR. Identidade conforme
`../../../_SISTEMA-IA/brands/polimata-hermetico.md` e filtro de identidade.
Credenciais somente no servidor. Sessões revogáveis. Dados reais fora do git e dos
artefatos de deploy. Destino escolhido: Netlify com Turso/libSQL; SQLite local apenas
para desenvolvimento. Nenhuma contratação ou publicação externa automática.

## 4. Interface / API Contract

```ts
export type CourseAccess = 'open' | 'enrollment';
export type AccountStatus = 'active' | 'suspended';
export interface WebhookResult {
  status: number;
  outcome: string;
  userId?: string;
  newMember?: boolean;
}
```

Contratos concretos estão em domain/entities.ts, domain/hotmart.ts e application/.

### Decisão de hospedagem e operação

Decisão do usuário: Netlify + banco externo com faixa gratuita; Hotmart para compras
avulsas e assinaturas. Adaptador libSQL assíncrono (Turso em produção; arquivo local
apenas para desenvolvimento/testes). Todas as leituras de banco passam a Promise;
transações isoladas por AsyncLocalStorage. Next.js atualizado para versão corrigida
verificada no registro npm. Nenhum banco de produção é criado no disco efêmero.
Webhook Hotmart autenticado por Hottok, idempotente, com mapeamento produto/oferta
para trilhas e direitos de acesso por compra/assinatura. Cancelamento de renovação
respeita o período já pago; reembolso e chargeback removem o direito da transação.
Sem contratação ou publicação externa nesta etapa; configuração de contas/segredos
é separada da entrega do software. Matrícula manual continua disponível.

```ts
interface InstallationInput { key: string; name: string; email: string; password: string }
interface MemberAccess { userId: string; courseId: string; expiresAt?: string }
interface LessonNote { userId: string; lessonId: string; content: string; updatedAt: string }
interface PasswordReset { tokenHash: string; userId: string; expiresAt: string }
// installAdmin(input: InstallationInput): Promise<boolean> — chave externa, uso único.
// finishLesson(userId, courseId, lessonId): Promise<boolean> — transacional/idempotente.
// saveNote(userId, courseId, lessonId, content): Promise<boolean>.
// issuePasswordReset(actorId, userId): Promise<string | null> — token de uso único, 1h.
// resetPassword(token, password): Promise<boolean> — invalida sessões e tokens.
// requestAccessEmail(email): Promise<void> — resposta genérica, Resend opcional.
```

Extras de operação: suspensão de contas, recuperação por link entregue manualmente
pelo administrador, edição de perfil/senha, anotações privadas, materiais por aula,
player para MP4/YouTube/Vimeo, certificado imprimível, exportação pessoal e backup.
Com Resend configurado, compradores novos recebem primeiro acesso; contas ativas
podem solicitar recuperação. Sem provedor, o administrador entrega o link manual.
Envios de teste nesta sessão são simulados, nunca enviados a terceiros reais.

## 5. Acceptance Criteria

- AC1: banco novo inicia sem credenciais compartilhadas nem conteúdo fictício.
- AC2: cookie inválido ou expirado permite voltar ao login sem loop.
- AC3: aluno sem matrícula não recebe URL de aula restrita nem consegue concluir aula.
- AC4: revogação de matrícula impede novas conclusões e acesso restrito.
- AC5: mudança de senha revoga sessões anteriores.
- AC6: tentativa repetida de login é limitada no servidor.
- AC7: concluir a mesma aula repetidamente não duplica XP ou certificados.
- AC8: celular oferece navegação para estudo, comunidade, eventos e administração.
- AC9: build de produção não inclui o banco local nem inicializa dados fictícios.
- AC10: instruções de hospedagem respeitam o modelo real de persistência.
- AC11: Hotmart deduplica eventos, isola direitos por compra e preserva período pago.
- AC12: restauração preserva dados e recusa sobrescrever banco não vazio.
- AC13: busca/feed/perfil não expõem posts de espaços restritos.
- AC14: reset por e-mail é de uso único; falha de envio é auditada sem afetar compras.

## 6. Examples

Cookie expirado → login utilizável; curso vazio → estado vazio; matrícula revogada
→ conteúdo restrito; senha incorreta → mensagem genérica; banco indisponível →
falha explícita, sem criar banco substituto silenciosamente.

## 7. Task breakdown

- [x] Ler instruções, specs, arquitetura e estado do git.
- [x] Auditoria funcional, de segurança e publicação.
- [x] Definir hospedagem e configuração de produção.
- [x] Corrigir autenticação, autorização e consistência.
- [x] Completar operação administrativa e experiência de estudo.
- [x] Preparar entrega, backup e guia de ativação.
- [x] Executar e registrar verificação.

## 8. Verification

Testes automatizados para autorização, sessões, conclusão idempotente e persistência.
Build, lint e typecheck. Smoke de primeiro acesso, login, aluno, administrador e
rotas protegidas. Verificação de navegação em larguras desktop e celular quando
houver ferramenta de navegador disponível.

Resultado desta rodada: lint, tipos, 15 testes, build independente de banco e smoke
Chrome desktop/mobile aprovados. Evidências em `../qa/VERIFICACAO.md`.
Ativação nas contas externas e homologação de eventos reais seguem o checklist de
`../ATIVACAO.md`; não foram executadas nem declaradas concluídas.
