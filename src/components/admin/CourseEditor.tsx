'use client';

import { useState, useTransition } from 'react';
import type { Course, CourseCategory, CourseDraft } from '@/core/domain/entities';
import { saveCourse } from '@/core/application/actions/admin';

interface CourseEditorProps {
  categories: CourseCategory[];
  instructorId: string;
  course?: Course; // ausente = criação
}

type DraftModule = CourseDraft['modules'][number];
type DraftLesson = DraftModule['lessons'][number];

function emptyLesson(): DraftLesson {
  return { title: '', description: '', videoUrl: '', duration: 600, xpReward: 50 };
}

const inputCls =
  'w-full bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary/60';
const labelCls = 'block text-[11px] uppercase tracking-widest font-bold text-foreground-muted mb-1.5';

export function CourseEditor({ categories, instructorId, course }: CourseEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(course?.title ?? '');
  const [subtitle, setSubtitle] = useState(course?.subtitle ?? '');
  const [description, setDescription] = useState(course?.description ?? '');
  const [thumbnail, setThumbnail] = useState(course?.thumbnail ?? '');
  const [coverImage, setCoverImage] = useState(course?.coverImage ?? '');
  const [categoryId, setCategoryId] = useState(course?.categoryId ?? categories[0]?.id ?? 'livre');
  const [level, setLevel] = useState<Course['level']>(course?.level ?? 'introdutorio');
  const [tags, setTags] = useState(course?.tags.join(', ') ?? '');
  const [featured, setFeatured] = useState(course?.featured ?? false);
  const [isPublished, setIsPublished] = useState(course?.isPublished ?? false);
  const [modules, setModules] = useState<DraftModule[]>(
    course?.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        videoUrl: l.videoUrl,
        duration: l.duration,
        xpReward: l.xpReward,
      })),
    })) ?? [{ title: 'Módulo 1', lessons: [emptyLesson()] }],
  );

  const updateModule = (mi: number, patch: Partial<DraftModule>) =>
    setModules((ms) => ms.map((m, i) => (i === mi ? { ...m, ...patch } : m)));

  const updateLesson = (mi: number, li: number, patch: Partial<DraftLesson>) =>
    setModules((ms) =>
      ms.map((m, i) =>
        i === mi
          ? { ...m, lessons: m.lessons.map((l, j) => (j === li ? { ...l, ...patch } : l)) }
          : m,
      ),
    );

  const submit = () => {
    const draft: CourseDraft = {
      id: course?.id,
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      thumbnail: thumbnail.trim() || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
      coverImage: coverImage.trim() || thumbnail.trim() || 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1920&auto=format&fit=crop',
      categoryId,
      instructorId: course?.instructorId ?? instructorId,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      level,
      featured,
      isPublished,
      modules: modules
        .filter((m) => m.title.trim())
        .map((m) => ({
          ...m,
          lessons: m.lessons.filter((l) => l.title.trim()),
        })),
    };
    startTransition(() => saveCourse(draft));
  };

  return (
    <div className="space-y-8">
      {/* Dados da trilha */}
      <section className="bg-surface border border-border rounded-md p-6 space-y-4">
        <h2 className="text-sm font-heading font-bold uppercase tracking-widest text-foreground-muted">Dados da trilha</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls} htmlFor="ce-title">Título *</label>
            <input id="ce-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls} htmlFor="ce-subtitle">Subtítulo</label>
            <input id="ce-subtitle" className={inputCls} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls} htmlFor="ce-desc">Descrição</label>
            <textarea id="ce-desc" className={inputCls} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="ce-cat">Categoria</label>
            <select id="ce-cat" className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value as Course['categoryId'])}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="ce-level">Nível</label>
            <select id="ce-level" className={inputCls} value={level} onChange={(e) => setLevel(e.target.value as Course['level'])}>
              <option value="introdutorio">Introdutório</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="ce-thumb">Thumbnail (URL)</label>
            <input id="ce-thumb" className={inputCls} value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className={labelCls} htmlFor="ce-cover">Capa do hero (URL)</label>
            <input id="ce-cover" className={inputCls} value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls} htmlFor="ce-tags">Tags (separadas por vírgula)</label>
            <input id="ce-tags" className={inputCls} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="kybalion, jung, arquetipos" />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-[var(--primary)]" />
            Em destaque
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="accent-[var(--primary)]" />
            Publicada (visível para alunos)
          </label>
        </div>
      </section>

      {/* Módulos e aulas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-heading font-bold uppercase tracking-widest text-foreground-muted">Módulos e aulas</h2>
          <button
            type="button"
            onClick={() => setModules((ms) => [...ms, { title: `Módulo ${ms.length + 1}`, lessons: [emptyLesson()] }])}
            className="text-xs border border-border px-3 py-1.5 rounded-sm hover:border-primary/50 transition-colors"
          >
            + Módulo
          </button>
        </div>

        {modules.map((mod, mi) => (
          <div key={mod.id ?? `new-${mi}`} className="bg-surface border border-border rounded-md p-5 space-y-4">
            <div className="flex items-center gap-3">
              <input
                className={`${inputCls} font-semibold`}
                value={mod.title}
                onChange={(e) => updateModule(mi, { title: e.target.value })}
                placeholder="Título do módulo"
                aria-label={`Título do módulo ${mi + 1}`}
              />
              <button
                type="button"
                onClick={() => setModules((ms) => ms.filter((_, i) => i !== mi))}
                className="text-xs text-destructive border border-destructive/40 px-3 py-2 rounded-sm hover:bg-destructive/10 transition-colors flex-shrink-0"
              >
                Remover
              </button>
            </div>

            <div className="space-y-3">
              {mod.lessons.map((lesson, li) => (
                <div key={lesson.id ?? `new-${li}`} className="border border-border rounded-sm p-4 bg-background/40 grid md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Título da aula *</label>
                    <input className={inputCls} value={lesson.title} onChange={(e) => updateLesson(mi, li, { title: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>URL do vídeo</label>
                    <input className={inputCls} value={lesson.videoUrl} onChange={(e) => updateLesson(mi, li, { videoUrl: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Descrição</label>
                    <input className={inputCls} value={lesson.description} onChange={(e) => updateLesson(mi, li, { description: e.target.value })} />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className={labelCls}>Duração (min)</label>
                      <input
                        type="number"
                        min={1}
                        className={inputCls}
                        value={Math.round(lesson.duration / 60)}
                        onChange={(e) => updateLesson(mi, li, { duration: Math.max(1, Number(e.target.value)) * 60 })}
                      />
                    </div>
                    <div className="flex-1">
                      <label className={labelCls}>XP</label>
                      <input
                        type="number"
                        min={0}
                        className={inputCls}
                        value={lesson.xpReward}
                        onChange={(e) => updateLesson(mi, li, { xpReward: Math.max(0, Number(e.target.value)) })}
                      />
                    </div>
                  </div>
                  <div className="flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => updateModule(mi, { lessons: mod.lessons.filter((_, j) => j !== li) })}
                      className="text-xs text-foreground-muted hover:text-destructive transition-colors"
                    >
                      Remover aula
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateModule(mi, { lessons: [...mod.lessons, emptyLesson()] })}
                className="text-xs text-primary hover:text-primary-hover transition-colors"
              >
                + Adicionar aula
              </button>
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-3 pb-10">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !title.trim()}
          className="bg-primary text-background font-bold px-8 py-2.5 rounded-sm hover:bg-primary-hover transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Salvando...' : course ? 'Salvar alterações' : 'Criar trilha'}
        </button>
        <p className="text-xs text-foreground-muted">
          {isPublished ? 'A trilha ficará visível para os alunos.' : 'A trilha será salva como rascunho.'}
        </p>
      </div>
    </div>
  );
}
