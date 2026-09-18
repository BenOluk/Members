# Sanctum — instruções do projeto

Leia primeiro `REGISTRO.md` e `docs/specs/prontidao-producao.md`.
A spec de prontidão prevalece sobre documentos de MVP e PRODUCT.md antigos.

## Operação

- Node 24; Next.js 16.3.5 / React 19.3.0 / libSQL.
- Desenvolvimento: `npm run configure`, `npm run dev`.
- Verificação: `npm run check`, `npm run build`, `npm run smoke`.
- Produção: Netlify + Turso (libSQL), configurados por variáveis no servidor.
- Nunca publicar SQLite, .env, backups ou dados reais junto ao código.
- Não há senha padrão, seed de usuários ou cadastro público.
- Banco novo: /setup com SETUP_KEY; depois a rota fecha.
- Nunca apagar data/ para resetar. Testes usam bancos temporários independentes.

## Arquitetura

`src/core/domain/`: regras puras e entidades.
`src/core/application/`: casos de uso **assíncronos**.
`src/core/application/actions/`: Server Actions com autorização antes de agir.
`src/core/infra/`: libSQL, esquema, criptografia, e-mail e repositórios.
`src/app/`: páginas server-first e handlers HTTP.
`src/proxy.ts`: barreira preliminar; cookie presente NÃO significa usuário válido.

Leituras de banco sempre retornam Promise. Mutações compostas usam
`transaction(async () => ...)`, com contexto isolado em AsyncLocalStorage.
Use lotes para minimizar round-trips no banco remoto. Não use BEGIN/COMMIT
manualmente dentro de transações existentes. Migração registrada em user_version;
uma migração nova deve avançar a versão e preservar os dados anteriores.

A UI consome application. Domain não importa Next.js. Toda página administrativa
faz requireAdmin antes de consultar informações; layout não substitui autorização.
Todo Server Action revalida a sessão. Handlers retornam status sem expor segredos.

## Segurança e regras de produto

- Senhas scrypt; tokens de sessão/reset armazenados apenas como SHA-256.
- Matrícula preserva progresso. Direitos são união de concessão manual e compras,
  com bloqueio administrativo prevalecendo. Conta suspensa não acessa.
- Não exibir vídeo/material sem autorização. Revalidar acesso ao concluir/anotar.
- Posts restritos: usar listVisiblePosts também no feed, busca e perfis.
- Hotmart: Hottok, Webhook 2.0.0, deduplicação e direitos por transação.
- Assinatura requer date_next_charge; não supor período mensal ou acesso perpétuo.
- Cancelamento preserva período pago; reembolso não remove outra compra válida.
- E-mail opcional por Resend; sem configuração, link manual. Não enviar teste real
  sem pedido do operador. Nunca imprimir token, corpo de webhook ou e-mail nos logs.
- Backup contém dados pessoais e hashes; restauração só em banco vazio.
- Link de vídeo não é DRM. public/ nunca deve conter conteúdo pago.
- Espaços premium legados são somente admin/moderador, não tiers pagos.
- Não declarar conformidade jurídica, alta escala ou deploy externo não verificado.

## Visual e conteúdo

pt-BR. Obsidiana #0B0906, creme #EDE5D3, ouro #C49840, texto secundário #B8AC95.
EB Garamond em títulos display, Source Serif no corpo, Cinzel em microrrótulos.
Fontes locais em public/fonts. Manter foco visível, navegação móvel, reduced-motion.
Não inventar alunos, cursos, avaliações ou números. Fixtures só em testes isolados.

## Entrega

Atualizar REGISTRO.md com decisões, evidências e pendências de ativação.
Preservar a versão anterior; não sobrescrever banco, credenciais ou artefatos alheios.
`scripts/migrate-async.mjs` é histórico de migração única; não executar novamente.
