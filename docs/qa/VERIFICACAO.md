# Verificação da entrega — 17/09/2026

## Resumo de 30 segundos

Verificação local com Node 24, libSQL e Chrome real. A comunicação externa com as
contas do titular ainda requer ativação: Netlify, Turso, Hotmart e remetente Resend.
Não houve cobrança, publicação remota ou envio de e-mail real.

## Evidências concluídas

- `npm run check`: lint e TypeScript aprovados; **15 testes passaram**.
- `npm audit`: **0 vulnerabilidades conhecidas**, incluindo dependências de desenvolvimento.
- Build Next.js 16.3.5 aprovado **com NETLIFY=true e URL de banco propositalmente inválida**, comprovando que não depende de consulta/migração durante compilação. Rotas privadas dinâmicas; sem avisos do compilador.
- Restauração testada em banco novo; tentativa de sobrescrever banco existente recusada.
- `npm run backup` executado também no banco local existente; cópia privada em `backups/`.
- Código anterior preservado em `releases/sanctum-original-6c83864.zip`.
- `npm run smoke`: **aprovado** em Chrome, usando o build de produção. Instalação, login, criação de curso no editor, navegação administrativa, backup autenticado, negação ao aluno, webhook HTTP autenticado, anotação persistida, certificado, cookie inválido sem loop e ausência de erros JavaScript.
- Desktop 1440px e celular 390px verificados. Todas as páginas administrativas principais e os fluxos principais do membro sem rolagem horizontal indesejada.
- Arquivos de rastreamento do build conferidos: sem banco local, backups ou `.env.local`.
- Data de modificação do banco local permaneceu igual após o último build e smoke; os testes usaram bancos isolados.

Capturas com **conteúdo fictício de teste**, que não acompanha o banco de produção:
[desktop](desktop.png) e [celular](mobile.png).

## Cobertura automatizada

1. Instalação vazia sem pessoas/cursos de demonstração, chave obrigatória e uso único.
2. Matrícula, conclusão e notas recusadas sem direito de acesso.
3. Conclusão idempotente, XP, certificado e separação de anotações por usuário.
4. Rollback transacional.
5. Limitação persistente de tentativas e expiração.
6. Recuperação exclusiva por link válido, expiração, uso único e revogação de sessões.
7. URLs de mídia, tipos de conteúdo e limites de formulários.
8. Hottok, contrato 2.0.0, produto mapeado e evento duplicado.
9. Reembolso/chargeback isolado por transação e proteção contra evento antigo.
10. Assinatura com vencimento obrigatório, cancelamento e renovação.
11. Backup/restauração sem reutilizar sessões e sem sobrescrever destino não vazio.
12. Conteúdo de espaços restritos ausente da busca/feed de aluno.
13. E-mail simulado, token utilizável, resposta genérica e falha auditada.
14. Reembolso recebido antes da aprovação não ressuscita a compra.
15. Exclusão de módulo respeita cascata de aulas e materiais.

Fixtures usam endereços `example.test`, bancos temporários e chaves exclusivas de teste.
O aviso do Node sobre detecção de módulos TypeScript é informativo; não é falha de teste.

## O que a evidência não afirma

Não é auditoria independente, pentest, teste de carga, homologação em produção,
garantia de entrega de e-mails, de privacidade dos vídeos externos ou de custo zero.
Não foi validado um pagamento real nem o payload específico de uma conta Hotmart.
Não há comparação visual aprovada pelo titular; há aplicação da identidade canônica
e verificação funcional/responsiva da interface entregue.

## Preservação

O banco antigo não foi apagado. Um build inicial acionou a migração **aditiva** da
estrutura local (novas colunas/tabelas, sem remover cursos/cadastros); foram verificados
8 usuários e 6 cursos existentes após a migração. O layout agora força execução
dinâmica para impedir leitura/migração durante compilação. O backup local guarda
o estado preservado após essa atualização de estrutura; não é uma cópia anterior
à migração. Ele não acompanha o pacote de publicação.
