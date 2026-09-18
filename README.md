# Sanctum · O Polímata Hermético

Área de membros própria, preparada para **Netlify + Turso/libSQL + Hotmart**.
Compras únicas e assinaturas; sem comissão cobrada por este software.

**Comece pelo [guia de ativação](docs/ATIVACAO.md).** Ele reúne publicação, variáveis,
Hotmart, primeiro acesso, custos, backup e checklist de abertura.
Não é um ZIP estático para arrastar no Netlify Drop.

## O que está incluído

- Instalação protegida, login, contas suspensas, sessões revogáveis e recuperação.
- Trilhas, módulos, aulas, player externo e materiais complementares.
- Acesso pago/manual ou trilhas abertas aos membros; vencimento preserva progresso.
- Progresso, XP, conquistas, caderno privado e certificados imprimíveis.
- Comunidade, moderação, busca, perfis, notificações e encontros.
- Administração responsiva, mapeamento de produtos/ofertas e eventos Hotmart.
- Primeiro acesso por Resend opcional; links manuais quando não houver e-mail.
- Exportação pessoal, backup/restauração e painel de operação.
- Identidade obsidiana, creme e ouro; fontes locais; navegação móvel.

Sem alunos, cursos ou métricas de demonstração na primeira instalação.
O arquivo `seedData.ts` é legado inativo e não é carregado pela aplicação.

## Rodar localmente

Node 24 e npm. Em uma pasta limpa:

```sh
npm ci
npm run configure
npm run dev
```

Abra `http://localhost:3000`. A chave de instalação está em `.env.local`.
Nenhuma senha de administrador é fornecida ou pré-cadastrada.
Banco local é só para desenvolvimento; no Netlify configure Turso.

## Verificar

```sh
npm run check
npm run build
npm run smoke
npm audit
```

Smoke: Chrome real, servidor de produção e banco temporário. No Windows usa Chrome
instalado; em outro ambiente defina `CHROME_PATH` ou instale Chromium pelo Playwright.
Nenhum teste exige Hotmart/Resend reais ou envia e-mail externo.

## Manter

`npm run backup` exporta o banco configurado para `backups/`.
`npm run restore -- arquivo.json` exige `RESTORE_DATABASE_URL` apontando para um
**banco novo, vazio**. Leia as restrições e os cuidados no guia.

Pacote de código no Windows: `powershell -NoProfile -File scripts/package.ps1`.
A lista de inclusão recusa bancos, credenciais, backups e dependências instaladas.

## Documentação

- [Ativação e operação](docs/ATIVACAO.md)
- [Spec vigente e pedido consolidado](docs/specs/prontidao-producao.md)
- [Verificação da entrega](docs/qa/VERIFICACAO.md)
- [Registro do projeto](REGISTRO.md)
- [Convenções para futuras alterações](AGENTS.md)

A publicação e a homologação com contas reais são etapas de ativação.
Serviços externos têm cotas e podem cobrar; a Hotmart mantém suas taxas.
