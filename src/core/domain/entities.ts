// =============================================================================
// Domain Layer — Polímata Hermético
// Puro. Não importa React, Next, nem nenhuma infra. Entidades e value objects.
// =============================================================================

// ---------- Identidade e gamificação ---------------------------------------

export type LevelTier = 'iniciado' | 'aprendiz' | 'adepto' | 'mestre' | 'grao_mestre';

export interface Level {
  tier: LevelTier;
  label: string;        // "Iniciado", "Grão-Mestre"
  minXp: number;
  nextTierXp: number | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;         // Lucide icon name ou emoji
  rarity: 'common' | 'rare' | 'legendary';
  awardedAt?: string;   // ISO, presente apenas quando em posse do usuário
}

export interface Streak {
  current: number;      // dias consecutivos
  longest: number;
  lastActivityAt: string; // ISO
}

// ---------- Usuário --------------------------------------------------------

export type UserRole = 'student' | 'moderator' | 'admin';

export interface User {
  id: string;
  name: string;
  handle: string;               // @lucas
  email: string;                // login (único)
  avatar: string;
  role: UserRole;
  status?: 'active' | 'suspended';
  bio?: string;
  location?: string;
  joinedAt: string;             // ISO
  xp: number;
  streak: Streak;
  badgeIds: string[];
  completedLessonIds: string[];
  enrolledCourseIds: string[];
  followingUserIds: string[];
}

// ---------- Cursos (Hotmart-style) -----------------------------------------

export type CourseCategoryId = 'hermetismo' | 'high-thinking' | 'ia' | 'copy' | 'astrologia' | 'livre';

export interface CourseCategory {
  id: CourseCategoryId;
  label: string;
  description: string;
  accent: string;       // hex para destaque visual
}

export type LessonResourceKind = 'pdf' | 'audio' | 'link' | 'exercise';

export interface LessonResource {
  id: string;
  kind: LessonResourceKind;
  title: string;
  url: string;
  sizeBytes?: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;     // segundos
  order: number;
  resources: LessonResource[];
  xpReward: number;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  coverImage: string;   // cover largo para hero
  categoryId: CourseCategoryId;
  instructorId: string;
  modules: Module[];
  tags: string[];
  level: 'introdutorio' | 'intermediario' | 'avancado';
  featured: boolean;
  isPublished: boolean;  // só publicado aparece para o aluno
  access?: 'open' | 'enrollment';
  checkoutUrl?: string;
  publishedAt: string;
  totalEnrollments: number;
  ratingAverage: number; // 0..5
  ratingCount: number;
}

// Draft usado pelo editor do admin (criação/edição da trilha inteira).
// Ids presentes preservam progresso dos alunos; ausentes geram novos registros.
export interface CourseDraft {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  coverImage: string;
  categoryId: CourseCategoryId;
  instructorId: string;
  tags: string[];
  level: Course['level'];
  featured: boolean;
  isPublished: boolean;
  access?: 'open' | 'enrollment';
  checkoutUrl?: string;
  modules: Array<{
    id?: string;
    title: string;
    lessons: Array<{
      id?: string;
      title: string;
      description: string;
      videoUrl: string;
      duration: number;   // segundos
      xpReward: number;
      resources?: LessonResource[];
    }>;
  }>;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  lastWatchedLessonId?: string;
  lastWatchedAt?: string;
  completedAt?: string;
  expiresAt?: string;
}

export interface Certificate {
    recipientName?: string;
    courseTitle?: string;
  id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
  credentialCode: string; // "PHM-2026-AB12CD"
}

// ---------- Comunidade (Circle-style) --------------------------------------

export type SpaceVisibility = 'public' | 'members' | 'premium';

export interface Space {
  id: string;
  name: string;
  slug: string;             // "sincronicidades"
  description: string;
  icon: string;             // emoji
  visibility: SpaceVisibility;
  memberCount: number;
  categoryLabel: string;    // "Estudos", "Principal", "Eventos"
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface Post {
  id: string;
  spaceId: string;
  authorId: string;
  title?: string;
  content: string;
  attachments?: string[];   // URLs
  likes: number;
  likedByUserIds: string[];
  createdAt: string;
  pinned: boolean;
  comments: Comment[];
}

// ---------- Eventos e lives ------------------------------------------------

export type EventKind = 'live' | 'workshop' | 'mentoria' | 'ritual';

export interface LiveEvent {
  id: string;
  title: string;
  description: string;
  kind: EventKind;
  coverImage: string;
  hostUserId: string;
  startsAt: string;         // ISO
  durationMinutes: number;
  joinUrl: string;
  attendeeCount: number;
  maxAttendees?: number;
}

// ---------- Notificações ---------------------------------------------------

export type NotificationKind =
  | 'lesson_released'
  | 'comment_reply'
  | 'mention'
  | 'event_soon'
  | 'badge_earned'
  | 'certificate_issued';

export interface AppNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

// ---------- Tipos derivados (view models usados por use cases) -------------

export interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;       // 0..100
  nextLessonId?: string;
}

export interface DashboardSnapshot {
  user: User;
  level: Level;
  nextLevel?: Level;
  xpToNextLevel: number;
  continueWatching: Array<{ course: Course; progress: CourseProgress }>;
  featured: Course[];
  byCategory: Array<{ category: CourseCategory; courses: Course[] }>;
  recentBadges: Badge[];
  upcomingEvents: LiveEvent[];
}
