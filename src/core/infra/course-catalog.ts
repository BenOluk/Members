import type { Course, CourseCategoryId } from '@/core/domain/entities';

export interface CatalogCourse {
  sourceKey: string;
  title: string;
  subtitle: string;
  description: string;
  categoryId: CourseCategoryId;
  level: Course['level'];
  modules: Array<{ title: string; lessons: Array<{ title: string; description: string }> }>;
}

const lessons = (...titles: string[]) => titles.map((title) => ({ title, description: 'Conteúdo em preparação. Vídeo e materiais serão adicionados antes da publicação.' }));

export const initialCourseCatalog: CatalogCourse[] = [
  {
    sourceKey: 'de-volta-ao-eixo', title: 'DE VOLTA AO EIXO', subtitle: '7 dias para o homem que já teve fogo',
    description: 'Um desafio de sete dias para retirar as camadas que abafaram o corpo, a direção e a presença — e voltar ao próprio eixo sem promessa fácil.',
    categoryId: 'high-thinking', level: 'introdutorio', modules: [
      { title: 'A entrada', lessons: lessons('Saber, Querer, Ousar, Calar') },
      { title: 'Os sete dias', lessons: lessons('Dia 1 — A Mente Heróica', 'Dia 2 — O Segredo da Testosterona', 'Dia 3 — O Estoicismo Moderno', 'Dia 4 — Dopamina sob Controle', 'Dia 5 — Estrutura de Ação do Predador', 'Dia 6 — O Ingrediente Secreto', 'Dia 7 — Integração Total') },
      { title: 'Bônus', lessons: lessons('O Caderno', 'A Mesa — guia de comida de verdade', 'Depois do Sétimo Dia') },
    ],
  },
  {
    sourceKey: 'pneuma', title: 'PNEUMA', subtitle: 'A respiração como primeira magia',
    description: 'Pneuma, Qi, Prana, Ruach. Um mapa do sopro entre tradição e fisiologia, culminando numa prática diária consciente.',
    categoryId: 'hermetismo', level: 'introdutorio', modules: [
      { title: 'I — O território', lessons: lessons('A epidemia silenciosa', 'A respiração como ponte entre dois sistemas') },
      { title: 'II — As tradições', lessons: lessons('Pranayama', 'O Taoísmo e a respiração embrionária', 'Anapanasati', 'Sufismo, Kabbalah e o Nome Divino') },
      { title: 'III — A ciência', lessons: lessons('O método Buteyko', 'O método Wim Hof', 'Respiração coerente', 'O suspiro fisiológico') },
      { title: 'IV — Os tipos e suas funções', lessons: lessons('Qual respiração para cada momento') },
      { title: 'V — O protocolo diário', lessons: lessons('A arquitetura respiratória do dia') },
      { title: 'VI — A conexão hermética', lessons: lessons('Pneuma no sistema hermético') },
    ],
  },
  {
    sourceKey: 'fogo-interior', title: 'O Fogo Interior', subtitle: 'Transmutação sem tabu',
    description: 'Um estudo sobre energia sexual, direção e criação: das tradições antigas à integração consciente da força no cotidiano.',
    categoryId: 'hermetismo', level: 'avancado', modules: [
      { title: 'I — O mapa do território', lessons: lessons('O que é energia sexual', 'A neurociência das tradições') },
      { title: 'II — As tradições', lessons: lessons('O Taoísmo', 'O Tantra', 'A alquimia hermética europeia', 'A Kabbalah') },
      { title: 'III — O protocolo', lessons: lessons('Nível 0 — O mapa do próprio sistema', 'Nível 1 — A fundação corporal', 'Nível 2 — O redirecionamento', 'Nível 3 — A transmutação ativa', 'Nível 4 — Integração e maestria') },
      { title: 'IV — Integração', lessons: lessons('O Polímata Hermético no século XXI', 'Síntese — o sistema unificado') },
    ],
  },
  {
    sourceKey: 'aureum', title: 'AUREUM', subtitle: 'Shivambu: tradição, evidência e controvérsia',
    description: 'Um estudo interno e crítico de uma prática antiga e sensível, separando tradição, hipótese, evidência e incerteza. Não substitui orientação médica.',
    categoryId: 'hermetismo', level: 'avancado', modules: [
      { title: 'I — O que a urina é', lessons: lessons('O maior equívoco da fisiologia popular', 'O paradoxo farmacêutico') },
      { title: 'II — As tradições', lessons: lessons('O Shivambu Kalpa Vidhi', 'Convergências históricas') },
      { title: 'III — Os pesquisadores', lessons: lessons('John W. Armstrong', 'Martha Christy', 'Stanislaw Burzynski') },
      { title: 'IV — Evidência e incerteza', lessons: lessons('O que está confirmado, em disputa ou sem base verificável') },
      { title: 'V — A supressão', lessons: lessons('A estrutura econômica e cultural') },
      { title: 'VI — Práticas e riscos', lessons: lessons('Limites, segurança e progressões descritas nas fontes') },
      { title: 'VII — A dimensão hermética', lessons: lessons('A prima materia e o princípio do espelho') },
    ],
  },
  {
    sourceKey: 'fundamentos-hermetismo', title: 'Fundamentos do Hermetismo', subtitle: 'A gramática por trás dos sistemas simbólicos',
    description: 'Uma introdução ao poço comum de onde bebem alquimia, astrologia, cabala e parte da psicologia profunda.',
    categoryId: 'hermetismo', level: 'introdutorio', modules: [
      { title: 'Módulo 1 — Fundamentos', lessons: lessons('Introdução ao Hermetismo', 'História e origem', 'Hermes Trismegisto: mito e realidade', 'O Corpus Hermeticum e a Tábua de Esmeralda', 'Os sete princípios herméticos', 'Filosofia hermética', 'Exercícios e leituras') },
    ],
  },
  {
    sourceKey: 'impulso', title: 'IMPULSO', subtitle: 'O jeito certo de fazer arte começa quando o jeito certo termina',
    description: 'Uma trilha em formação sobre intuição, brincadeira, repertório e a coragem de retirar do processo tudo aquilo que não é seu.',
    categoryId: 'livre', level: 'introdutorio', modules: [
      { title: 'O impulso criativo', lessons: lessons('A técnica não alcança tudo', 'To play — voltar a brincar', 'Singularidade e experimentação', 'O ouvido e o frisson', 'Esmero, ambiente e repertório', 'Não existe o jeito certo; existe o seu jeito') },
    ],
  },
];
