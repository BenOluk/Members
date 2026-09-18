import type { CourseDraft } from './entities';
import { safeUrl } from './validation';
import { videoSource } from './media';

export function validateCourseDraft(draft: CourseDraft): string | null {
  const bounded = (value: unknown, max: number, required = false): value is string => typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
  if (!draft || !bounded(draft.title, 200, true) || !bounded(draft.subtitle, 500) || !bounded(draft.description, 30000)) return 'Confira título, subtítulo e descrição.';
  if (!['introdutorio', 'intermediario', 'avancado'].includes(draft.level) || !['open', 'enrollment'].includes(draft.access ?? 'enrollment')) return 'Nível ou modalidade de acesso inválidos.';
  if (!safeUrl(draft.thumbnail, true) || !safeUrl(draft.coverImage, true)) return 'Use URLs HTTPS válidas para as imagens.';
  if (draft.checkoutUrl && !safeUrl(draft.checkoutUrl)) return 'O link de inscrição deve usar HTTPS.';
  if (!Array.isArray(draft.tags) || draft.tags.length > 20 || draft.tags.some((tag) => !bounded(tag, 60, true))) return 'Use até 20 tags de até 60 caracteres.';
  if (!Array.isArray(draft.modules) || draft.modules.length > 100) return 'Use até 100 módulos por trilha.';
  const ids = new Set<string>();
  let count = 0;
  for (const mod of draft.modules) {
    if (!mod || !bounded(mod.title, 200, true) || !Array.isArray(mod.lessons)) return 'Todo módulo precisa de título e lista de aulas.';
    if (mod.id && (ids.has(mod.id) || !bounded(mod.id, 100, true))) return 'Identificador de módulo inválido ou duplicado.';
    if (mod.id) ids.add(mod.id);
    for (const lesson of mod.lessons) {
      if (++count > 1000) return 'Use até 1.000 aulas por trilha.';
      if (!lesson || !bounded(lesson.title, 200, true) || !bounded(lesson.description, 30000) || !bounded(lesson.videoUrl, 2000)) return 'Confira os dados de cada aula.';
      if (lesson.id && (ids.has(lesson.id) || !bounded(lesson.id, 100, true))) return 'Identificador de aula inválido ou duplicado.';
      if (lesson.id) ids.add(lesson.id);
      if (lesson.videoUrl && !videoSource(lesson.videoUrl)) return 'Vídeo: use YouTube, Vimeo ou URL HTTPS de arquivo MP4/WebM/OGG.';
      if (!Number.isInteger(lesson.duration) || lesson.duration < 0 || lesson.duration > 86400 || !Number.isInteger(lesson.xpReward) || lesson.xpReward < 0 || lesson.xpReward > 10000) return 'Duração ou XP fora do limite.';
      if (lesson.resources !== undefined) {
        if (!Array.isArray(lesson.resources) || lesson.resources.length > 30) return 'Use até 30 materiais por aula.';
        for (const resource of lesson.resources) {
          if (!resource || !bounded(resource.title, 200, true) || !safeUrl(resource.url) || !['pdf', 'audio', 'link', 'exercise'].includes(resource.kind)) return 'Material inválido: confira título, tipo e URL HTTPS.';
        }
      }
    }
  }
  return null;
}
