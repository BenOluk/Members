import { ready, getDb } from '../src/core/infra/db.ts';
import { initialCourseCatalog } from '../src/core/infra/course-catalog.ts';
import * as courses from '../src/core/infra/repos/courses.ts';

const admin = await getDb().prepare("SELECT id FROM users WHERE role='admin' ORDER BY joined_at LIMIT 1").get();
if (!admin) throw new Error('Crie a conta administradora antes de sincronizar o catálogo.');

const existing = await courses.list({ includeUnpublished: true });
for (const item of initialCourseCatalog) {
  const current = existing.find((course) => course.title === item.title);
  await courses.save({
    id: current?.id,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    thumbnail: current?.thumbnail || '/course-cover.svg',
    coverImage: current?.coverImage || '/course-cover.svg',
    categoryId: item.categoryId,
    instructorId: String(admin.id),
    tags: [...new Set([...(current?.tags || []), item.sourceKey])],
    level: item.level,
    featured: current?.featured || false,
    isPublished: current?.isPublished || false,
    access: current?.access || 'enrollment',
    checkoutUrl: current?.checkoutUrl || '',
    modules: item.modules.map((module, mi) => ({
      id: current?.modules[mi]?.id,
      title: module.title,
      lessons: module.lessons.map((lesson, li) => ({
        id: current?.modules[mi]?.lessons[li]?.id,
        title: lesson.title,
        description: lesson.description,
        videoUrl: current?.modules[mi]?.lessons[li]?.videoUrl || '',
        duration: current?.modules[mi]?.lessons[li]?.duration || 0,
        xpReward: current?.modules[mi]?.lessons[li]?.xpReward || 50,
        resources: current?.modules[mi]?.lessons[li]?.resources || [],
      })),
    })),
  });
  process.stdout.write(`${current ? 'atualizado' : 'criado'}: ${item.title}\n`);
}

process.stdout.write(`catálogo sincronizado: ${initialCourseCatalog.length} trilhas em rascunho\n`);
const verified = await courses.list({ includeUnpublished: true });
const catalogTitles = new Set(initialCourseCatalog.map((course) => course.title));
const imported = verified.filter((course) => catalogTitles.has(course.title));
process.stdout.write(`verificação: ${imported.length} trilhas canônicas; ${imported.filter((course) => course.isPublished).length} publicadas\n`);
(await ready()).close();
