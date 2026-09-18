# Sanctum — registro do projeto

## 18/09/2026 — redesign “Biblioteca ritual contemporânea”

Direção visual aprovada por Lucas antes da alteração da versão publicada. O Sanctum
deixou a composição de dashboard genérico e passou a operar como biblioteca editorial:
moldura interna, espaço negativo, títulos display em EB Garamond, leitura em Source
Serif, microtexto em Cinzel e ouro limitado a sinais de hierarquia.

Redesenhados: header e navegação móvel; abertura da biblioteca; frontispícios
tipográficos distintos para as trilhas; Meus estudos; player, mapa de módulos e
caderno; superfícies da comunidade, eventos e admin. Capas genéricas deixaram de
simular imagens: enquanto não houver acervo próprio aprovado, cada curso usa número
romano e sigilo. Nenhuma imagem de IA foi gerada e nenhuma copy, matrícula, permissão
ou regra de negócio foi alterada.

Spec: `docs/specs/redesign-visual-sanctum.md`. Verificação pré-deploy: lint, tipos,
16 testes, build de produção e smoke Chrome em desktop/mobile aprovados; sem overflow
em 390 px e sem erro JavaScript. Screenshots em `docs/qa/desktop.png` e
`docs/qa/mobile.png`.

## 18/09/2026 — catálogo real de cursos no Turso

O acervo foi inventariado antes de tocar a produção. Entraram seis estruturas
canônicas em modo rascunho: `DE VOLTA AO EIXO`, `PNEUMA`, `O Fogo Interior`,
`AUREUM`, `Fundamentos do Hermetismo` e `IMPULSO`. O antigo `Desafio Super-Homem`
não entrou porque foi substituído por `DE VOLTA AO EIXO`; esboços com gates,
serviços e materiais sem fonte relocalizada também ficaram fora.

O comando `npm run sync:courses` sincroniza títulos, módulos e aulas sem duplicar,
preservando vídeos, capas, checkout e estado de publicação já editados no admin.
Nenhuma trilha foi publicada automaticamente, nenhuma matrícula foi modificada e
nenhum documento integral do vault foi enviado ao deploy. AUREUM recebeu apenas
estrutura editorial e aviso de que não substitui orientação médica.

Spec: `docs/specs/catalogo-inicial-de-cursos.md`. Verificação antes do deploy:
lint, tipos e 16 testes passaram; duas sincronizações consecutivas criaram e depois
atualizaram as mesmas seis trilhas no Turso.

## 18/09/2026 — correção da inicialização no Turso

O site `sanctumone.netlify.app` respondia `503` em `/api/health`. A inspeção dos
logs da função confirmou conexão com o Turso, mas rejeição do comando remoto
`PRAGMA user_version = 1` (`SQL_PARSE_ERROR`). O versionamento do esquema foi
migrado para a tabela portável `schema_migrations`; backup e restauração também
deixaram de gravar pragmas. Bancos locais existentes continuam recebendo a
migração idempotente na primeira abertura.

Verificação local após a correção: lint, tipos e 15 testes passaram; build de
produção para Netlify passou. Nenhum valor secreto foi impresso durante a
inspeção das variáveis do projeto.

## 18/09/2026 — publicação no GitHub autorizada

Lucas solicitou atualizar o repositório existente para acionar o Netlify. Antes do
envio foram confirmados o remoto `https://github.com/BenOluk/Members.git`, a branch
`main` e as exclusões de `.env.local`, bancos, backups, pacotes, dependências e build.
A chave local exibida no IDE não constava do commit. Autenticação foi feita pelo
fluxo oficial de dispositivo do GitHub CLI, sem compartilhar senha ou token.

Commit funcional publicado: `3293007` (`feat: prepara Sanctum para Netlify, Turso e
Hotmart`). Após o push, `HEAD` e `origin/main` foram comparados e estavam idênticos.
O push pode acionar o deploy automático do site conectado, mas o estado do painel
Netlify e suas variáveis não foi inspecionado nesta sessão; verificar no Netlify.

## 17/09/2026 — entrega local concluída; ativação externa pendente

**Resumo de 30 segundos:** versão 1.0.0 preparada para Netlify + Turso/libSQL,
Hotmart avulso/assinatura e Resend opcional. Guia em `docs/ATIVACAO.md`. Código,
documentação e testes prontos; publicação nas contas do titular não foi realizada.

Verificações concluídas: `npm run check` (lint, tipos, **15 testes**),
`npm run build` com NETLIFY=true e endereço de banco inválido (passou sem acesso
ao banco), `npm run smoke` no Chrome desktop 1440px/mobile 390px (fluxos reais de
formulário, compra via HTTP simulado, notas, certificado e negação de acesso),
`npm audit` (**0 vulnerabilidades conhecidas**). Detalhes em `docs/qa/VERIFICACAO.md`.

Implementado: banco assíncrono e lotes de consultas/escritas; setup sem senha padrão;
sessões/reset/suspensão/rate limits; autorização de trilhas; conclusão atômica;
notas privadas; certificados imprimíveis com nomes preservados na emissão;
editor de aulas/materiais; busca/feed sem vazamento de espaços restritos;
admin responsivo, confirmações de exclusão, horários de Brasília;
Hotmart autenticado/idempotente e direitos separados por transação;
e-mail de primeiro acesso/recuperação com fallback manual; perfil/exportação;
operação/backup/restauração/health; identidade canônica com fontes locais.

Preservação: código original está no commit `6c83864` e no ZIP
`releases/sanctum-original-6c83864.zip`. O banco antigo não foi apagado. Um build
inicial acionou migração aditiva de esquema antes da detecção de rota dinâmica;
isso foi corrigido com `dynamic='force-dynamic'` no layout raiz. Conferidos 8
usuários e 6 cursos existentes. Backup pós-migração em
`backups/sanctum-2026-09-17T21-53-01.542Z.json` (dados privados; **fora do pacote**).
Não afirmar que o banco permaneceu byte a byte intacto. Último build e smoke
não o modificaram. Arquivos temporários de QA foram encerrados/removidos pelo teste.

Artefato: `scripts/package.ps1` produz ZIP de código/documentação em `releases/`,
com lista explícita de inclusão e SHA256. Não inclui banco, credenciais, backups,
node_modules ou build da máquina. O pacote precisa de compilação Next.js no Netlify,
não de upload estático via Drop.

Para ativar: configurar Turso libSQL, variáveis no Netlify, conta inicial e cursos,
IDs de produto/oferta/Hottok da Hotmart e remetente Resend se desejado. O operador
precisa homologar compra/assinatura/cancelamento reais e conferir cotas de serviço.
Não pedir segredos no chat. Nenhum push, deploy, cobrança ou e-mail real foi feito.

Limites deliberados documentados: mídia externa sem DRM; sem importação automática
de vendas antigas, fila de e-mail ou tiers pagos de comunidade; eventos para contas
ativas; backup JSON integral para bancos pequenos/médios, sujeito aos limites dos
serviços; nenhuma promessa de gratuidade ilimitada ou conformidade jurídica.

## Histórico — checkpoint inicial da revisão

Pedido de 17/09/2026: revisar o projeto, enriquecer os requisitos e entregar a área
de membros pronta para ativação, com autonomia e custo baixo.

Decisões explícitas durante a sessão: **Netlify + banco externo com faixa gratuita**;
**Hotmart, compras avulsas e assinaturas**. Arquitetura atualizada para libSQL/Turso.
Não retomar o plano anterior de Docker como destino principal.

Base original preservada no commit `6c83864`; árvore estava limpa no início. Banco
local existente não foi apagado. A entrega não deve incluir esse banco.

Concluído até aqui: auditoria de código/specs/identidade; spec de produção;
atualização Next 16.3.5/React 19.3.0; adaptador libSQL com transação por contexto;
propagação assíncrona da infra até páginas; remoção do seed automático de pessoas;
setup protegido por chave; correção de loop de cookie inválido; autorização de
aulas; conclusão atômica; limitação de login; revogação de sessões; recuperação por
token; perfil; caderno privado; materiais no editor; player MP4/YouTube/Vimeo.

Em andamento: webhook Hotmart (docs oficiais 2.0.0 conferidas via page-data Gatsby),
mapeamento de produtos, direitos por transação, navegação/visual, scripts de backup,
configuração Netlify, testes e entrega. **Ainda não chamar esta versão de pronta.**

Fonte Hotmart: `https://developers.hotmart.com/docs/en/2.0.0/webhook/purchase-webhook/`
e `cancel-subscription-webhook/`. HTML renderiza via JS; dados oficiais disponíveis
em `/docs/page-data/en/2.0.0/webhook/<slug>/page-data.json`.
Confirmado: header `X-HOTMART-HOTTOK`, evento `id`, `creation_date` em ms,
`data.purchase.transaction`, `data.purchase.date_next_charge`,
`data.subscription.subscriber.code`; cancelamento usa `data.subscriber.code` e
`data.date_next_charge`, preservando período pago.

Verificação parcial: primeira migração assíncrona deixou apenas dois erros TS,
ambos corrigidos; verificação completa e testes de execução pendentes. Nenhum deploy
externo ou envio de e-mail real realizado. Segredos não solicitados no chat.
