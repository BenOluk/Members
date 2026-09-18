# Sanctum — ativação no Netlify

## Em 30 segundos

A área de membros é sua: código, banco exportável e domínio sob suas contas. A entrega inclui cursos, membros, comunidade, progresso, caderno, certificados e Hotmart. Para publicar: **banco Turso → Netlify → primeira conta → cursos e produtos Hotmart → teste de compra**. E-mail automático é opcional; sem ele, o administrador envia um link individual de acesso.

O pacote é **código de aplicação Next.js**, não um site estático. Não arraste o ZIP para o Netlify Drop: ele precisa ser compilado com o adaptador Next.js. Não envie `data/`, `.env.local`, backups ou senhas ao GitHub.

Não foi feito deploy nas suas contas, cobrança real ou envio real de e-mail. As páginas públicas e a documentação oficial foram consultadas em 17/09/2026. Os painéis autenticados não estavam acessíveis; os nomes de menus abaixo são os documentados, não uma afirmação de que a sua tela foi inspecionada. Se aparecer algo diferente, use um print sem segredos para conferir o passo.

## 1. Prepare suas contas e o banco

Use suas próprias contas de GitHub, Netlify e Turso. Para e-mails, a implementação oferece Resend. A Hotmart continua como checkout; não há assinatura de uma plataforma de membros.

No [Turso](https://app.turso.tech/), crie um banco **libSQL** vazio e obtenha a URL `libsql://...` e o token de leitura/escrita. Não escolha outro motor sem validar a compatibilidade. Como o painel exige login, não invento aqui o nome de seus botões internos. O [guia oficial](https://docs.turso.tech/quickstart) confirma a alternativa por CLI: no Windows, dentro do WSL e após instalar o CLI conforme o guia:

```sh
turso auth login
turso db create sanctum
turso db show sanctum --url
turso db tokens create sanctum
```

Guarde o token em gerenciador de senhas; não cole no chat. O aplicativo cria as tabelas no primeiro acesso, sem contas de demonstração. Escolha uma região próxima da execução da aplicação, quando disponível.

**Banco antigo:** `data/sanctum.db` foi preservado, mas não foi importado automaticamente para a nuvem. A versão antiga continha dados de demonstração e senhas conhecidas; não publique esse banco sem uma revisão. Para levar dados reais, faça primeiro uma cópia, remova contas fictícias nessa cópia, redefina as senhas e use o fluxo de backup/restauração abaixo. Nunca apague o original para “reiniciar”.

## 2. Publique pelo Netlify

1. Extraia o pacote em uma pasta nova ou use este projeto atualizado. Suba apenas o código para um repositório seu. O repositório local já aponta para `BenOluk/Members`, mas **nenhum push foi feito nesta entrega**.
2. Abra [Netlify](https://app.netlify.com/start). Fluxo documentado: **Add new project → Import an existing project → GitHub**. Autorize e selecione o repositório.
3. Use Node **24**, comando `npm run build`, diretório publicado `.next`. Isso já está em `netlify.toml`. Se o repositório contiver somente este projeto, deixe a base vazia. Se contiver o workspace inteiro, use `polimata-members` como base — nunca envie o workspace inteiro só por isso.
4. Configure as variáveis abaixo no ambiente de **produção**, disponíveis para **Builds e Functions**. Caminho documentado: **Project configuration → Environment variables**. Não use prefixo `NEXT_PUBLIC_`.
5. Confirme a publicação com **Publish**, conforme o fluxo oficial. Se o projeto ficar privado por padrão, torne o site acessível ao público antes de testar a Hotmart. O login do Sanctum continuará protegendo os membros.
6. Use o endereço HTTPS definitivo em `APP_URL` e publique novamente depois de qualquer mudança de variável. Domínio próprio é opcional; o endereço `netlify.app` funciona.

Referências: [publicar repositório](https://docs.netlify.com/start/quickstarts/deploy-from-repository/), [Next.js no Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [variáveis de ambiente](https://docs.netlify.com/build/environment-variables/get-started/).

| Variável | Valor / finalidade |
| --- | --- |
| `TURSO_DATABASE_URL` | URL `libsql://...` do banco de produção. Obrigatória no Netlify. |
| `TURSO_AUTH_TOKEN` | Token do banco com leitura e escrita. |
| `SETUP_KEY` | Chave aleatória de 64 caracteres hexadecimais. Só cria o primeiro administrador. |
| `APP_URL` | Endereço HTTPS definitivo, por exemplo `https://seu-projeto.netlify.app`. |
| `HOTMART_HOTTOK` | Token Hottok da sua configuração de webhook Hotmart. |
| `RESEND_API_KEY` | Opcional: chave de envio de e-mails do Resend. |
| `EMAIL_FROM` | Opcional: remetente em domínio verificado, por exemplo `Sanctum <acesso@seu-dominio.com>`. |

Para gerar a chave de instalação localmente, execute `npm run configure`. Ele cria `.env.local` com uma chave aleatória **sem sobrescrever um arquivo existente**. Abra o arquivo e transfira somente os valores pertinentes ao painel do Netlify. Não envie esse arquivo para o repositório. `DATABASE_PATH` é apenas para desenvolvimento local e não deve ser usado como banco no Netlify.

**Separação de ambientes:** não disponibilize credenciais de produção em Deploy Previews ou builds de contribuições externas. Para testar uma alteração, use outro banco e outro Hottok. A aplicação recusa gravar em SQLite local no Netlify.

## 3. Abra a plataforma e publique suas trilhas

1. Visite `https://SEU-ENDERECO/api/health`: o esperado é `{"status":"ok"}`. Um `503` indica configuração/conexão a resolver.
2. Abra `/setup`, informe a chave de instalação e crie sua conta. Use senha única de pelo menos 12 caracteres. Não existe senha padrão. Depois da primeira conta, `/setup` fica indisponível. Remova `SETUP_KEY` do ambiente e publique novamente após concluir a instalação.
3. Entre em `/login` e abra **Administração → Trilhas → Nova trilha**. Cadastre título, módulos, aulas, vídeos e materiais. Salve como rascunho até conferir.
4. Em **Acesso**, escolha matrícula concedida para produtos pagos; “Aberta a todos os membros” permite que qualquer conta ativa se matricule. Isso não cria cadastro público.
5. Em **Membros**, você pode criar contas, conceder acesso por prazo ou sem vencimento, gerar link individual de senha, suspender contas e bloquear matrículas.
6. Crie espaços da comunidade e eventos quando houver conteúdo real. A instalação começa sem posts, alunos, vendas ou cursos fictícios.

Vídeos aceitos: YouTube, Vimeo e links HTTPS diretos MP4/WebM/OGG. Materiais: links HTTPS para PDF, áudio, exercícios e outros recursos. Vídeo/arquivo é servido pelo provedor escolhido, **não pelo banco nem pelas funções do Netlify**. Proteção do player não é DRM: links externos podem ser compartilhados; restrição de domínio ou URLs assinadas exigem um serviço de mídia apropriado. Não coloque aulas pagas em `public/`, pois essa pasta é pública.

## 4. Conecte a Hotmart — avulso e assinatura

No Sanctum, abra **Administração → Hotmart** (`/admin/integracoes`):

1. Cadastre o **ID numérico do produto**, a trilha e, opcionalmente, o código da oferta. Para um produto liberar várias trilhas, crie uma regra para cada trilha.
2. Para compra única, defina os dias de acesso; `0` significa sem vencimento. Para assinatura, o sistema usa **a próxima cobrança informada pela Hotmart**, não esse campo.
3. Cadastre o webhook na Hotmart com URL `https://SEU-ENDERECO/api/webhooks/hotmart`, versão **2.0.0** e o Hottok correspondente à variável `HOTMART_HOTTOK`. A autenticação ocorre pelo cabeçalho `X-HOTMART-HOTTOK`, não por um parâmetro na URL.
4. Ative os eventos: `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`, `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`, `PURCHASE_CANCELED`, `PURCHASE_EXPIRED`, `PURCHASE_DELAYED`, `PURCHASE_PROTEST` e `SUBSCRIPTION_CANCELLATION`.
5. Configure no produto a entrega pela sua área externa e informe `/primeiro-acesso` aos compradores. Preserve o checkout existente. Confira o [guia Hotmart de área externa](https://help.hotmart.com/en/article/215827858/how-do-i-integrate-my-external-members-area-with-hotmart-) e o [guia de webhook](https://help.hotmart.com/en/article/360001491352/how-do-i-set-up-my-product-s-api-using-the-webhook-postback-). Não alterei produtos nem ofertas na sua conta.
6. Faça um teste de evento com produto mapeado e um e-mail seu. Um payload genérico com produto desconhecido pode responder `422`: isso é recusa intencional, não liberação indiscriminada. Confira o resultado e a matrícula no Sanctum.

| Situação | Comportamento implementado |
| --- | --- |
| Compra aprovada/concluída | Cria a conta se necessário e libera as trilhas mapeadas. Usa o e-mail da compra. |
| Mesmo evento reenviado | Não duplica conta, acesso ou concessão. |
| Reembolso/chargeback | Revoga os direitos daquela transação; preserva outras compras e concessões manuais. |
| Assinatura aprovada | Usa `data.purchase.date_next_charge`; sem essa data, recusa a concessão com `422`. Não inventa um prazo. |
| Renovação | A nova transação concede o novo período pago. |
| Cancelamento da assinatura | Mantém o período pago já concedido, limitado pela data informada no cancelamento. Não libera tempo adicional. |
| Atraso | Não estende o período; a expiração é conferida ao acessar aulas. |
| Evento antigo após reembolso | Não ressuscita a mesma compra reembolsada. |
| Bloqueio administrativo | Prevalece sobre a compra; somente uma nova liberação administrativa remove esse bloqueio. |

Uma oferta específica prevalece sobre a regra geral **para a mesma trilha**. Outras trilhas da regra geral continuam válidas. Alterar uma regra não reprocessa compras antigas: o operador precisa reenviar o evento correto pela Hotmart ou conceder acesso manualmente após conferir o pagamento.

Antes de vender: teste compra avulsa, assinatura, renovação e cancelamento com o contrato efetivamente entregue pela **sua** conta Hotmart. Não foi possível homologar essa comunicação externa sem suas credenciais. Histórico de pedidos antigos não é importado automaticamente. Mudança de plano, trial e parcelamentos especiais devem ser verificados antes de oferecer essas modalidades; não assuma que uma compra parcelada é uma assinatura.

## 5. Ative o primeiro acesso por e-mail

Em [Resend](https://resend.com/), verifique um domínio seu e configure o remetente. Consulte [domínios](https://resend.com/docs/dashboard/domains/introduction) e [envio de e-mail](https://resend.com/docs/api-reference/emails/send-email). Adicione `RESEND_API_KEY`, `EMAIL_FROM` e `APP_URL` HTTPS ao Netlify e publique novamente.

Compradores novos recebem um link para definir a senha. Quem já tem conta continua com a senha existente. `/primeiro-acesso` também permite pedir recuperação; a resposta não revela se um e-mail está cadastrado. Links valem uma hora, só funcionam uma vez e a redefinição encerra sessões antigas.

Se o envio falhar, a compra continua registrada. O membro pode pedir outro link e o administrador pode gerar um link manual em **Membros**. A falha aparece em **Operação → Atividade administrativa** como `email.access_failed`. A confirmação da API de e-mail não garante que a mensagem chegou à caixa de entrada: teste entrega/spam. Não há fila de reenvio automático nesta versão.

## 6. Custos e independência — sem promessa impossível

A plataforma não cobra taxa por aluno ou venda. **A Hotmart continua cobrando o checkout conforme seu contrato.** O objetivo é começar com baixo custo, não prometer infraestrutura infinita gratuita.

Em 17/09/2026, as páginas oficiais mostravam: Netlify Free com limite de 300 créditos/mês; Turso Free com 5 GB; Resend Free com 3.000 e-mails/mês e 100/dia. São cotas do serviço, não capacidade garantida deste aplicativo. Confira uso, limites e eventuais mudanças antes de contratar. Fontes: [Netlify](https://www.netlify.com/pricing/), [Turso](https://turso.tech/pricing/), [Resend](https://resend.com/pricing).

Domínio próprio, streaming privado e crescimento além das cotas podem ter custo. Não habilite recargas ou excedentes automáticos sem querer. O código e os backups permitem trocar de hospedagem/banco, mas você continua dependendo dos serviços escolhidos para a operação atual.

## 7. Backup, restauração e manutenção

Faça backup antes de excluir conteúdos/atualizar o sistema e com frequência proporcional às vendas. Em **Administração → Operação**, use **Baixar backup do banco**. Para uso local, após configurar o banco em `.env.local`:

```sh
npm run backup
```

O arquivo vai para `backups/`, com nome único. Contém dados pessoais, hashes de senha e anotações privadas; guarde criptografado e com acesso restrito. Não contém sessões, links de redefinição, vídeos nem arquivos de outros provedores. Para bancos grandes, prefira a exportação/restauração nativa do Turso: a exportação JSON desta versão é integral, em memória, sujeita aos limites de duração/tamanho da função e do banco.

Restaure **somente um backup seu e confiável**, em um banco novo e vazio. Exemplo PowerShell local:

```powershell
$env:RESTORE_DATABASE_URL = 'file:./data/restaurado.db'
npm run restore -- 'backups/NOME-DO-BACKUP.json'
```

Para Turso, use a URL do novo banco em `RESTORE_DATABASE_URL` e seu token em `RESTORE_AUTH_TOKEN`, sem expô-lo no histórico do terminal (prefira arquivo de ambiente protegido). O script recusa banco não vazio e não apaga o original. Valide login, aulas e compras no banco restaurado antes de mudar as variáveis de produção. Após a troca, todos entram novamente.

Teste local em uma pasta limpa, com Node 24:

```sh
npm ci
npm run configure
npm run dev
```

Abra `http://localhost:3000`. Verificação técnica: `npm run check`, `npm run build`, `npm run smoke`. O smoke usa Chrome instalado no caminho padrão do Windows ou `CHROME_PATH`; em outros ambientes, instale o navegador do Playwright. Testes criam bancos temporários e não enviam mensagens reais.

## 8. Checklist de abertura

- [ ] Site HTTPS público; `/api/health` responde `ok`.
- [ ] Banco remoto conectado; backup guardado fora do site.
- [ ] Primeiro administrador criado; chave de instalação removida do ambiente.
- [ ] Nenhuma conta/senha de demonstração foi importada.
- [ ] Curso real publicado, vídeos e materiais conferidos no celular.
- [ ] Produtos/ofertas mapeados e webhook autenticado testado.
- [ ] Compra avulsa e assinatura testadas; renovação, reembolso e período pago conferidos.
- [ ] Primeiro acesso testado com e-mail próprio, ou procedimento manual informado aos compradores.
- [ ] Contato de suporte, política de privacidade e condições de acesso reais comunicados aos compradores. Este software não declara conformidade jurídica automática.
- [ ] Limites de gastos, cotas, monitoramento e rotina de backup definidos.

**Limites deliberados:** sem aplicativo nativo, DRM, transmissão própria, fórum público indexável, importação automática de compras anteriores, fila de e-mail, múltiplos níveis pagos de comunidade ou promessa de escala ilimitada. Espaços “premium” do legado são reservados a administradores/moderadores; não são um plano pago integrado à Hotmart. Eventos são para contas ativas; restrições por produto se aplicam às trilhas. Certificados são registros internos de conclusão, não diplomas reconhecidos.
