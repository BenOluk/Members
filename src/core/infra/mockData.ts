import type {
  User,
  Course,
  CourseCategory,
  Post,
  Space,
  LiveEvent,
  Badge,
  AppNotification,
  Enrollment,
  Certificate,
} from '../domain/entities';

// =============================================================================
// Mock data — escala pensada para stress-test visual (Hotmart-like catálogo
// + Circle-like comunidade + The Members-like gamificação).
// Toda referência a IDs é consistente para que use cases resolvam joins.
// =============================================================================

// ---------- Categorias -----------------------------------------------------

export const mockCategories: CourseCategory[] = [
  { id: 'hermetismo',   label: 'Hermetismo',    description: 'Kybalion, alquimia interior e magia prática.',        accent: '#d4af37' },
  { id: 'high-thinking', label: 'High Thinking', description: 'Pensar em sistemas, superar autossabotagem.',         accent: '#e6c866' },
  { id: 'ia',            label: 'IA & Tecnologia', description: 'Engenharia de prompts, agentes, workflows.',        accent: '#7bb3ff' },
  { id: 'copy',          label: 'Copywriting',  description: 'Narrativa, persuasão ética e voz autêntica.',         accent: '#d98a5c' },
  { id: 'astrologia',    label: 'Astrologia',   description: 'Arquétipos, mapa natal e sincronicidade.',            accent: '#a076d9' },
  { id: 'livre',         label: 'Mente Livre',  description: 'Autonomia intelectual e desescolarização.',           accent: '#88c9a1' },
];

// ---------- Badges ---------------------------------------------------------

export const mockBadges: Badge[] = [
  { id: 'b_primeiro_passo', name: 'Primeiro Passo',     description: 'Completou a primeira aula.',                  icon: 'footprints',     rarity: 'common' },
  { id: 'b_constante',       name: 'Ritmo Constante',    description: 'Estudou 7 dias seguidos.',                    icon: 'flame',          rarity: 'common' },
  { id: 'b_ordem',           name: 'Da Ordem',           description: 'Publicou seu primeiro post na comunidade.',   icon: 'book-open',      rarity: 'common' },
  { id: 'b_iluminado',       name: 'Iluminado',          description: 'Concluiu uma trilha inteira.',                icon: 'sparkles',       rarity: 'rare' },
  { id: 'b_catalisador',     name: 'Catalisador',        description: 'Recebeu 50 curtidas em um único post.',       icon: 'zap',            rarity: 'rare' },
  { id: 'b_quiron',          name: 'Quiron',             description: 'Respondeu a 10 dúvidas de outros alunos.',    icon: 'life-buoy',      rarity: 'rare' },
  { id: 'b_grao_mestre',     name: 'Grão-Mestre',        description: 'Convite direto do Polímata.',                 icon: 'crown',          rarity: 'legendary' },
];

// ---------- Usuários ------------------------------------------------------

export const mockUsers: User[] = [
  {
    id: 'user_1',
    name: 'Lucas Bueno',
    handle: 'polimata',
    avatar: 'https://i.pravatar.cc/150?u=polimata',
    role: 'admin',
    bio: 'Explorador dos mistérios da mente e do universo. Criador de O Polímata Hermético.',
    location: 'Florianópolis, BR',
    joinedAt: '2024-11-01T00:00:00Z',
    xp: 18420,
    streak: { current: 47, longest: 82, lastActivityAt: new Date().toISOString() },
    badgeIds: ['b_primeiro_passo', 'b_constante', 'b_iluminado', 'b_catalisador', 'b_grao_mestre'],
    completedLessonIds: ['lesson_1', 'lesson_2', 'lesson_3', 'lesson_4', 'lesson_5', 'lesson_6'],
    enrolledCourseIds: ['course_1', 'course_2', 'course_3'],
    followingUserIds: [],
  },
  {
    id: 'user_2',
    name: 'Helena Kaliman',
    handle: 'helena.k',
    avatar: 'https://i.pravatar.cc/150?u=helena',
    role: 'moderator',
    bio: 'Leitora obsessiva de Jung. Gêmeos asc. Escorpião.',
    location: 'Lisboa, PT',
    joinedAt: '2025-02-12T00:00:00Z',
    xp: 4210,
    streak: { current: 12, longest: 40, lastActivityAt: new Date(Date.now() - 3600_000).toISOString() },
    badgeIds: ['b_primeiro_passo', 'b_constante', 'b_ordem', 'b_quiron'],
    completedLessonIds: ['lesson_1', 'lesson_2', 'lesson_3'],
    enrolledCourseIds: ['course_1', 'course_2'],
    followingUserIds: ['user_1'],
  },
  {
    id: 'user_3',
    name: 'Rafael Vance',
    handle: 'rafa.v',
    avatar: 'https://i.pravatar.cc/150?u=rafael',
    role: 'student',
    bio: 'Engenheiro de software buscando o lado oculto do código.',
    location: 'Porto Alegre, BR',
    joinedAt: '2025-05-03T00:00:00Z',
    xp: 1870,
    streak: { current: 5, longest: 18, lastActivityAt: new Date(Date.now() - 14 * 3600_000).toISOString() },
    badgeIds: ['b_primeiro_passo', 'b_ordem'],
    completedLessonIds: ['lesson_1'],
    enrolledCourseIds: ['course_1', 'course_3'],
    followingUserIds: ['user_1', 'user_2'],
  },
  {
    id: 'user_4',
    name: 'Clara Aymoré',
    handle: 'clara.a',
    avatar: 'https://i.pravatar.cc/150?u=clara',
    role: 'student',
    bio: 'Copywriter em transição para narrativa esotérica.',
    location: 'São Paulo, BR',
    joinedAt: '2025-08-20T00:00:00Z',
    xp: 730,
    streak: { current: 3, longest: 9, lastActivityAt: new Date(Date.now() - 2 * 86400_000).toISOString() },
    badgeIds: ['b_primeiro_passo'],
    completedLessonIds: [],
    enrolledCourseIds: ['course_4', 'course_1'],
    followingUserIds: ['user_1'],
  },
  {
    id: 'user_5',
    name: 'Tobias Herrmann',
    handle: 'tobias',
    avatar: 'https://i.pravatar.cc/150?u=tobias',
    role: 'student',
    bio: 'Astrofísico curioso — onde ciência e mistério se tocam.',
    location: 'Berlim, DE',
    joinedAt: '2025-09-15T00:00:00Z',
    xp: 2940,
    streak: { current: 21, longest: 21, lastActivityAt: new Date(Date.now() - 5 * 3600_000).toISOString() },
    badgeIds: ['b_primeiro_passo', 'b_constante'],
    completedLessonIds: ['lesson_1', 'lesson_4'],
    enrolledCourseIds: ['course_5', 'course_3'],
    followingUserIds: [],
  },
  {
    id: 'user_6',
    name: 'Iara Moraes',
    handle: 'iara.m',
    avatar: 'https://i.pravatar.cc/150?u=iara',
    role: 'student',
    bio: 'Mãe, psicóloga, buscadora. Peixes solar.',
    location: 'Fortaleza, BR',
    joinedAt: '2026-01-11T00:00:00Z',
    xp: 260,
    streak: { current: 2, longest: 4, lastActivityAt: new Date().toISOString() },
    badgeIds: ['b_primeiro_passo'],
    completedLessonIds: [],
    enrolledCourseIds: ['course_1'],
    followingUserIds: ['user_1', 'user_2'],
  },
  {
    id: 'user_7',
    name: 'Danilo Pessoa',
    handle: 'danilo',
    avatar: 'https://i.pravatar.cc/150?u=danilo',
    role: 'student',
    bio: 'Trader que descobriu que mercado é astrologia mal disfarçada.',
    location: 'Rio de Janeiro, BR',
    joinedAt: '2025-06-02T00:00:00Z',
    xp: 3410,
    streak: { current: 8, longest: 33, lastActivityAt: new Date(Date.now() - 6 * 3600_000).toISOString() },
    badgeIds: ['b_primeiro_passo', 'b_constante', 'b_ordem'],
    completedLessonIds: ['lesson_1', 'lesson_2'],
    enrolledCourseIds: ['course_2', 'course_5'],
    followingUserIds: ['user_1'],
  },
  {
    id: 'user_8',
    name: 'Sophia Larsen',
    handle: 'sophia',
    avatar: 'https://i.pravatar.cc/150?u=sophia',
    role: 'student',
    bio: 'Aprendendo a ouvir o que ainda não foi dito.',
    location: 'Montevideo, UY',
    joinedAt: '2025-11-28T00:00:00Z',
    xp: 1120,
    streak: { current: 7, longest: 14, lastActivityAt: new Date(Date.now() - 18 * 3600_000).toISOString() },
    badgeIds: ['b_primeiro_passo', 'b_constante'],
    completedLessonIds: ['lesson_1'],
    enrolledCourseIds: ['course_6', 'course_1'],
    followingUserIds: [],
  },
];

// ---------- Cursos ---------------------------------------------------------
// Catálogo gerenciado pelo admin. Vazio por padrão — adicione via /admin/cursos.
// Em produção: substituir por query ao Supabase.

export let mockCourses: Course[] = [];

// ---------- Spaces (Circle-style) -----------------------------------------

export const mockSpaces: Space[] = [
  { id: 'sp_geral',        name: 'Feed Geral',           slug: 'geral',           description: 'O ponto de encontro da Ordem.',              icon: '⚫',  visibility: 'members',  memberCount: 3240, categoryLabel: 'Principal', pinnedPostIds: ['post_1'] },
  { id: 'sp_avisos',       name: 'Avisos Oficiais',      slug: 'avisos',          description: 'Comunicados do Polímata. Leitura obrigatória.', icon: '📣', visibility: 'members', memberCount: 3240, categoryLabel: 'Principal', pinnedPostIds: [] },
  { id: 'sp_sincro',       name: 'Sincronicidades',      slug: 'sincronicidades', description: 'Relate eventos significativos. Discussão aberta.', icon: '🜏',  visibility: 'members', memberCount: 1890, categoryLabel: 'Estudos', pinnedPostIds: [] },
  { id: 'sp_kybalion',     name: 'Práticas do Kybalion', slug: 'kybalion',        description: 'Aplicação dos 7 princípios na rotina.',      icon: '📜', visibility: 'members',  memberCount: 1210, categoryLabel: 'Estudos', pinnedPostIds: ['post_3'] },
  { id: 'sp_high',         name: 'High Thinking',        slug: 'high-thinking',   description: 'Mental models, foco e execução.',            icon: '🧠', visibility: 'members',  memberCount: 980,  categoryLabel: 'Estudos', pinnedPostIds: [] },
  { id: 'sp_duvidas',      name: 'Dúvidas & Suporte',    slug: 'duvidas',         description: 'Alunos ajudando alunos. Mods de plantão.',   icon: '❓', visibility: 'members',  memberCount: 2140, categoryLabel: 'Suporte', pinnedPostIds: [] },
  { id: 'sp_eventos',      name: 'Eventos & Lives',      slug: 'eventos',         description: 'Anúncios e replays de encontros ao vivo.',   icon: '🎙️', visibility: 'members',  memberCount: 2980, categoryLabel: 'Eventos', pinnedPostIds: [] },
  { id: 'sp_premium',      name: 'Mesa Redonda',         slug: 'mesa-redonda',    description: 'Círculo restrito. Acesso por convite.',      icon: '🗝️', visibility: 'premium',  memberCount: 120,  categoryLabel: 'Premium',  pinnedPostIds: [] },
];

// ---------- Posts ---------------------------------------------------------

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const daysAgo  = (d: number) => new Date(now - d * 86400_000).toISOString();

export const mockPosts: Post[] = [
  {
    id: 'post_1', spaceId: 'sp_geral', authorId: 'user_1',
    title: 'Bem-vindos à nova Ordem',
    content: 'Este espaço é para discutirmos as sincronicidades diárias e a aplicação do High Thinking. Regra 1: argumente; não apenas sinta.',
    likes: 142, likedByUserIds: ['user_2', 'user_3', 'user_4', 'user_7'],
    createdAt: daysAgo(3), pinned: true,
    comments: [
      { id: 'c_1a', postId: 'post_1', authorId: 'user_2', content: 'Incrível! Já sinto a diferença na minha percepção.',        createdAt: daysAgo(3), likes: 12 },
      { id: 'c_1b', postId: 'post_1', authorId: 'user_5', content: 'Adorei a regra. Vou tentar aplicar sem virar cético chato.', createdAt: daysAgo(2), likes: 8 },
    ],
  },
  {
    id: 'post_2', spaceId: 'sp_sincro', authorId: 'user_2',
    content: 'Alguém mais teve insights estranhos após a aula 2 do módulo 1? Sonhei três noites seguidas com a mesma imagem de uma chave.',
    likes: 54, likedByUserIds: ['user_3', 'user_4', 'user_7', 'user_8'],
    createdAt: hoursAgo(18), pinned: false,
    comments: [
      { id: 'c_2a', postId: 'post_2', authorId: 'user_7', content: 'Sim. Em duas das noites vi uma porta também. Vou anotar.', createdAt: hoursAgo(14), likes: 3 },
    ],
  },
  {
    id: 'post_3', spaceId: 'sp_kybalion', authorId: 'user_1',
    title: 'Exercício da semana: correspondência',
    content: 'Observe três padrões de sua vida externa esta semana. Para cada um, identifique o padrão interno análogo. Publique suas observações aqui.',
    likes: 88, likedByUserIds: ['user_2', 'user_3', 'user_5', 'user_7'],
    createdAt: daysAgo(2), pinned: true,
    comments: [
      { id: 'c_3a', postId: 'post_3', authorId: 'user_3', content: 'Top. Começando hoje.', createdAt: daysAgo(2), likes: 1 },
      { id: 'c_3b', postId: 'post_3', authorId: 'user_8', content: 'Esperei um exercício assim há meses.', createdAt: daysAgo(1), likes: 2 },
    ],
  },
  {
    id: 'post_4', spaceId: 'sp_high', authorId: 'user_5',
    content: 'Minha maior insight do High Thinking até agora: "ver o sistema" não é ver mais coisas, é ver menos coisas bem.',
    likes: 71, likedByUserIds: ['user_1', 'user_2', 'user_7'],
    createdAt: hoursAgo(6), pinned: false,
    comments: [
      { id: 'c_4a', postId: 'post_4', authorId: 'user_1', content: 'Exato. O ruído é o inimigo.', createdAt: hoursAgo(5), likes: 14 },
    ],
  },
  {
    id: 'post_5', spaceId: 'sp_duvidas', authorId: 'user_4',
    content: 'Dúvida: existe uma ordem recomendada entre "Sincronicidade" e "High Thinking"? Estou dividindo meu tempo entre os dois e sinto dispersão.',
    likes: 19, likedByUserIds: ['user_6'],
    createdAt: hoursAgo(30), pinned: false,
    comments: [
      { id: 'c_5a', postId: 'post_5', authorId: 'user_2', content: 'Comece pelo Sincronicidade. High Thinking pede a base.', createdAt: hoursAgo(28), likes: 7 },
      { id: 'c_5b', postId: 'post_5', authorId: 'user_1', content: 'Helena tá certa.', createdAt: hoursAgo(20), likes: 11 },
    ],
  },
  {
    id: 'post_6', spaceId: 'sp_eventos', authorId: 'user_1',
    title: 'Live desta sexta: Mapa Natal ao vivo',
    content: 'Vou ler o mapa de 3 alunos escolhidos. Inscrições abertas por 48h no link abaixo.',
    likes: 203, likedByUserIds: ['user_2', 'user_3', 'user_4', 'user_5', 'user_6', 'user_7', 'user_8'],
    createdAt: hoursAgo(12), pinned: false,
    comments: [],
  },
  {
    id: 'post_7', spaceId: 'sp_geral', authorId: 'user_7',
    content: 'Semana pesada de mercado. Curioso que sempre que a Lua cheia bate em Áries meus trades ficam impulsivos. Coincidência? Hermetismo? Dopamina?',
    likes: 34, likedByUserIds: ['user_5', 'user_2'],
    createdAt: hoursAgo(4), pinned: false,
    comments: [
      { id: 'c_7a', postId: 'post_7', authorId: 'user_5', content: 'As três — e isso é o ponto.', createdAt: hoursAgo(3), likes: 9 },
    ],
  },
  {
    id: 'post_8', spaceId: 'sp_geral', authorId: 'user_6',
    content: 'Primeira semana aqui e já estou mais disciplinada do que fui em meses. Obrigada, Polímata.',
    likes: 47, likedByUserIds: ['user_1', 'user_2', 'user_4', 'user_8'],
    createdAt: hoursAgo(2), pinned: false,
    comments: [],
  },
];

// ---------- Eventos ao vivo -----------------------------------------------

const inDays = (d: number, h = 20) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(h, 0, 0, 0);
  return dt.toISOString();
};

export const mockEvents: LiveEvent[] = [
  { id: 'ev_1', title: 'Mapa Natal ao Vivo',            description: 'Leitura aprofundada de 3 mapas escolhidos.',              kind: 'live',     coverImage: 'https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?q=80&w=1200&auto=format&fit=crop', hostUserId: 'user_1', startsAt: inDays(2, 20),  durationMinutes: 90, joinUrl: '#', attendeeCount: 312, maxAttendees: 500 },
  { id: 'ev_2', title: 'Mentoria High Thinking',        description: 'Revisão dos exercícios da semana.',                       kind: 'mentoria', coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop', hostUserId: 'user_1', startsAt: inDays(5, 19),  durationMinutes: 60, joinUrl: '#', attendeeCount: 87,  maxAttendees: 100 },
  { id: 'ev_3', title: 'Ritual de Lua Nova',            description: 'Prática guiada de intenção e anotação de sonhos.',        kind: 'ritual',   coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop', hostUserId: 'user_2', startsAt: inDays(9, 21),  durationMinutes: 75, joinUrl: '#', attendeeCount: 140 },
  { id: 'ev_4', title: 'Workshop: Copy Arquetípica',    description: 'Estudo de caso ao vivo com reescrita coletiva.',          kind: 'workshop', coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop', hostUserId: 'user_1', startsAt: inDays(14, 20), durationMinutes: 120, joinUrl: '#', attendeeCount: 52, maxAttendees: 80 },
  { id: 'ev_5', title: 'Q&A do Polímata',               description: 'Pergunte qualquer coisa.',                                 kind: 'live',     coverImage: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1200&auto=format&fit=crop', hostUserId: 'user_1', startsAt: inDays(22, 20), durationMinutes: 90, joinUrl: '#', attendeeCount: 410, maxAttendees: 1000 },
];

// ---------- Notificações ---------------------------------------------------

export const mockNotifications: AppNotification[] = [
  { id: 'n_1', userId: 'user_1', kind: 'comment_reply',     title: 'Helena respondeu ao seu post', body: '"Incrível! Já sinto a diferença..."',           href: '/space/sp_geral',       read: false, createdAt: hoursAgo(1) },
  { id: 'n_2', userId: 'user_1', kind: 'event_soon',        title: 'Mapa Natal ao Vivo em 2 dias', body: 'Prepare perguntas e o mapa dos alunos.',        href: '/events',                read: false, createdAt: hoursAgo(3) },
  { id: 'n_3', userId: 'user_1', kind: 'badge_earned',      title: 'Nova conquista: Catalisador', body: 'Seu post passou de 50 curtidas.',                href: '/profile/user_1',        read: true,  createdAt: daysAgo(1) },
  { id: 'n_4', userId: 'user_1', kind: 'lesson_released',   title: 'Nova aula: Mercúrio e Vênus', body: 'Mapa Natal para Adultos • Módulo 1 • Aula 2.',   href: '/course/course_5',       read: true,  createdAt: daysAgo(2) },
  { id: 'n_5', userId: 'user_1', kind: 'certificate_issued', title: 'Certificado emitido',         body: 'Trilha "Arquitetura da Sincronicidade" concluída.', href: '/certificates',      read: true,  createdAt: daysAgo(4) },
];

// ---------- Matrículas + Certificados ------------------------------------
// Em produção: gerenciados via Stripe webhook → Supabase.

export let mockEnrollments: Enrollment[] = [];

export let mockCertificates: Certificate[] = [];
