import type { getDb } from './db';
import { mockBadges, mockCategories } from './catalog';

/** Catálogo estrutural. Nunca cria contas, cursos, comentários ou métricas fictícias. */
export async function seedCatalog(db: ReturnType<typeof getDb>): Promise<void> {
  await db.batch([
    ...mockCategories.map((c, i) => ({ sql: 'INSERT OR IGNORE INTO categories (id,label,description,accent,sort) VALUES (?,?,?,?,?)', args: [c.id, c.label, c.description, '#C49840', i] })),
    ...mockBadges.map((b) => ({ sql: 'INSERT OR IGNORE INTO badges (id,name,description,icon,rarity) VALUES (?,?,?,?,?)', args: [b.id, b.name, b.description, b.icon, b.rarity] })),
  ]);
}
