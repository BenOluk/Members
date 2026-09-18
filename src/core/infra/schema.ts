export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  handle        TEXT NOT NULL UNIQUE,
  avatar        TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student',
  bio           TEXT,
  location      TEXT,
  joined_at     TEXT NOT NULL,
  xp            INTEGER NOT NULL DEFAULT 0,
  streak_current  INTEGER NOT NULL DEFAULT 0,
  streak_longest  INTEGER NOT NULL DEFAULT 0,
  last_activity_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rarity TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_badges (
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TEXT NOT NULL,
  PRIMARY KEY (user_id, badge_id)
);
CREATE TABLE IF NOT EXISTS user_completed_lessons (
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (follower_id, followee_id)
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  accent TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS courses (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  subtitle    TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail   TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  instructor_id TEXT NOT NULL REFERENCES users(id),
  tags        TEXT NOT NULL DEFAULT '[]',
  level       TEXT NOT NULL,
  featured    INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT NOT NULL,
  total_enrollments INTEGER NOT NULL DEFAULT 0,
  rating_average REAL NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS modules (
  id        TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  sort      INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS lessons (
  id          TEXT PRIMARY KEY,
  module_id   TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url   TEXT NOT NULL,
  duration    INTEGER NOT NULL,
  sort        INTEGER NOT NULL,
  xp_reward   INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS lesson_resources (
  id        TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  kind      TEXT NOT NULL,
  title     TEXT NOT NULL,
  url       TEXT NOT NULL,
  size_bytes INTEGER
);
CREATE TABLE IF NOT EXISTS enrollments (
  id        TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TEXT NOT NULL,
  last_watched_lesson_id TEXT,
  last_watched_at TEXT,
  completed_at TEXT,
  UNIQUE (user_id, course_id)
);
CREATE TABLE IF NOT EXISTS certificates (
  id        TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  credential_code TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS spaces (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  visibility  TEXT NOT NULL DEFAULT 'members',
  member_count INTEGER NOT NULL DEFAULT 0,
  category_label TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS posts (
  id        TEXT PRIMARY KEY,
  space_id  TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title     TEXT,
  content   TEXT NOT NULL,
  created_at TEXT NOT NULL,
  pinned    INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);
CREATE TABLE IF NOT EXISTS comments (
  id        TEXT PRIMARY KEY,
  post_id   TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content   TEXT NOT NULL,
  created_at TEXT NOT NULL,
  likes     INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  kind        TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  host_user_id TEXT NOT NULL REFERENCES users(id),
  starts_at   TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  join_url    TEXT NOT NULL,
  attendee_count INTEGER NOT NULL DEFAULT 0,
  max_attendees INTEGER
);
CREATE TABLE IF NOT EXISTS notifications (
  id      TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind    TEXT NOT NULL,
  title   TEXT NOT NULL,
  body    TEXT NOT NULL,
  href    TEXT,
  read    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_space   ON posts(space_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notif_user    ON notifications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_enroll_user   ON enrollments(user_id);
`;
