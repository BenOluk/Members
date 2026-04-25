'use client';

import { useState } from 'react';
import type { Course, CourseCategory, Module, Lesson } from '@/core/domain/entities';

interface Props {
  course: Course;
  categories: CourseCategory[];
}

export function CourseEditorClient({ course: initial, categories }: Props) {
  const [course, setCourse] = useState<Course>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // --- Módulo/Aula state ---
  const [newModTitle, setNewModTitle] = useState('');
  const [expandedMod, setExpandedMod] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState<Record<string, Partial<Lesson>>>({});

  async function saveCourse() {
    setSaving(true);
    try {
      await fetch(`/api/admin/cursos/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function addModule() {
    if (!newModTitle.trim()) return;
    const mod: Module = {
      id: `mod_${Date.now()}`,
      title: newModTitle.trim(),
      order: course.modules.length + 1,
      lessons: [],
    };
    setCourse((c) => ({ ...c, modules: [...c.modules, mod] }));
    setNewModTitle('');
  }

  function removeModule(modId: string) {
    setCourse((c) => ({ ...c, modules: c.modules.filter((m) => m.id !== modId) }));
  }

  function addLesson(modId: string) {
    const draft = newLesson[modId] ?? {};
    if (!draft.title?.trim()) return;
    const mod = course.modules.find((m) => m.id === modId)!;
    const lesson: Lesson = {
      id: `lesson_${Date.now()}`,
      title: draft.title.trim(),
      description: draft.description ?? '',
      videoUrl: draft.videoUrl ?? '',
      duration: Number(draft.duration ?? 0),
      order: mod.lessons.length + 1,
      resources: [],
      xpReward: Number(draft.xpReward ?? 50),
    };
    setCourse((c) => ({
      ...c,
      modules: c.modules.map((m) => m.id === modId ? { ...m, lessons: [...m.lessons, lesson] } : m),
    }));
    setNewLesson((prev) => ({ ...prev, [modId]: {} }));
  }

  function removeLesson(modId: string, lessonId: string) {
    setCourse((c) => ({
      ...c,
      modules: c.modules.map((m) =>
        m.id === modId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
      ),
    }));
  }

  const totalLessons = course.modules.reduce((a, m) => a + m.lessons.length, 0);

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Quick stats */}
      <div className="flex gap-6 text-sm text-foreground-muted">
        <span><strong className="text-foreground">{course.modules.length}</strong> módulos</span>
        <span><strong className="text-foreground">{totalLessons}</strong> aulas</span>
        <span><strong className="text-primary">{course.isFree ? 'Gratuito' : formatPrice(course.price)}</strong></span>
      </div>

      {/* Detalhes do curso */}
      <fieldset className="border border-border rounded-sm p-6 space-y-4">
        <legend className="text-[10px] uppercase tracking-widest text-foreground-muted px-1">Detalhes</legend>

        <Field label="Título">
          <input value={course.title} onChange={(e) => setCourse((c) => ({ ...c, title: e.target.value }))}
            className="input-field" />
        </Field>
        <Field label="Subtítulo">
          <input value={course.subtitle} onChange={(e) => setCourse((c) => ({ ...c, subtitle: e.target.value }))}
            className="input-field" />
        </Field>
        <Field label="Descrição">
          <textarea value={course.description} onChange={(e) => setCourse((c) => ({ ...c, description: e.target.value }))}
            className="input-field min-h-[80px] resize-y" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Categoria">
            <select value={course.categoryId} onChange={(e) => setCourse((c) => ({ ...c, categoryId: e.target.value as Course['categoryId'] }))}
              className="input-field">
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
            </select>
          </Field>
          <Field label="Nível">
            <select value={course.level} onChange={(e) => setCourse((c) => ({ ...c, level: e.target.value as Course['level'] }))}
              className="input-field">
              <option value="introdutorio">Introdutório</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </Field>
        </div>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={course.isPublished} onChange={(e) => setCourse((c) => ({ ...c, isPublished: e.target.checked }))}
              className="w-4 h-4 accent-primary" />
            Publicado
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={course.featured} onChange={(e) => setCourse((c) => ({ ...c, featured: e.target.checked }))}
              className="w-4 h-4 accent-primary" />
            Em destaque
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={course.isFree} onChange={(e) => setCourse((c) => ({ ...c, isFree: e.target.checked, price: 0 }))}
              className="w-4 h-4 accent-primary" />
            Gratuito
          </label>
        </div>

        {!course.isFree && (
          <Field label="Preço (R$)">
            <input type="number" min="0" step="0.01" value={(course.price / 100).toFixed(2)}
              onChange={(e) => setCourse((c) => ({ ...c, price: Math.round(parseFloat(e.target.value || '0') * 100) }))}
              className="input-field max-w-[160px]" />
          </Field>
        )}
      </fieldset>

      {/* Módulos e aulas */}
      <fieldset className="border border-border rounded-sm p-6 space-y-5">
        <legend className="text-[10px] uppercase tracking-widest text-foreground-muted px-1">Módulos e aulas</legend>

        {course.modules.length === 0 && (
          <p className="text-sm text-foreground-muted">Nenhum módulo criado ainda.</p>
        )}

        {course.modules.map((mod) => (
          <div key={mod.id} className="border border-border rounded-sm overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 bg-surface-hover cursor-pointer"
              onClick={() => setExpandedMod(expandedMod === mod.id ? null : mod.id)}
            >
              <div>
                <span className="font-medium text-sm">{mod.title}</span>
                <span className="text-xs text-foreground-muted ml-2">({mod.lessons.length} aulas)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-foreground-dim text-xs">{expandedMod === mod.id ? '▲' : '▼'}</span>
                <button onClick={(e) => { e.stopPropagation(); removeModule(mod.id); }}
                  className="text-xs text-foreground-dim hover:text-red-400 transition-colors">Remover</button>
              </div>
            </div>

            {expandedMod === mod.id && (
              <div className="p-4 space-y-3">
                {mod.lessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-start gap-3 p-3 border border-border-subtle rounded-sm bg-surface text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{lesson.title}</p>
                      <p className="text-xs text-foreground-muted mt-0.5">
                        {lesson.videoUrl ? '🎬 Vídeo configurado' : '⚠ Sem vídeo'} · {Math.floor(lesson.duration / 60)}min · {lesson.xpReward} XP
                      </p>
                    </div>
                    <button onClick={() => removeLesson(mod.id, lesson.id)}
                      className="text-xs text-foreground-dim hover:text-red-400 transition-colors flex-shrink-0">×</button>
                  </div>
                ))}

                {/* Adicionar aula */}
                <div className="border border-dashed border-border rounded-sm p-4 space-y-3">
                  <p className="text-[11px] uppercase tracking-widest text-foreground-muted">Nova aula</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input placeholder="Título da aula" value={newLesson[mod.id]?.title ?? ''}
                      onChange={(e) => setNewLesson((prev) => ({ ...prev, [mod.id]: { ...prev[mod.id], title: e.target.value } }))}
                      className="input-field text-sm" />
                    <VideoUrlField
                      value={newLesson[mod.id]?.videoUrl ?? ''}
                      onChange={(val) => setNewLesson((prev) => ({ ...prev, [mod.id]: { ...prev[mod.id], videoUrl: val } }))}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input placeholder="Descrição (opcional)" value={newLesson[mod.id]?.description ?? ''}
                      onChange={(e) => setNewLesson((prev) => ({ ...prev, [mod.id]: { ...prev[mod.id], description: e.target.value } }))}
                      className="input-field text-sm" />
                    <div className="flex gap-3">
                      <input type="number" placeholder="Duração (seg)" value={newLesson[mod.id]?.duration ?? ''}
                        onChange={(e) => setNewLesson((prev) => ({ ...prev, [mod.id]: { ...prev[mod.id], duration: Number(e.target.value) } }))}
                        className="input-field text-sm flex-1" />
                      <input type="number" placeholder="XP" value={newLesson[mod.id]?.xpReward ?? ''}
                        onChange={(e) => setNewLesson((prev) => ({ ...prev, [mod.id]: { ...prev[mod.id], xpReward: Number(e.target.value) } }))}
                        className="input-field text-sm w-20" />
                    </div>
                  </div>
                  <button onClick={() => addLesson(mod.id)}
                    className="bg-surface hover:bg-surface-hover border border-border text-foreground text-sm py-1.5 px-4 rounded-sm transition-colors">
                    + Adicionar aula
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Adicionar módulo */}
        <div className="flex gap-3">
          <input value={newModTitle} onChange={(e) => setNewModTitle(e.target.value)}
            placeholder="Nome do novo módulo"
            className="input-field flex-1 text-sm"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addModule(); } }}
          />
          <button onClick={addModule}
            className="bg-surface hover:bg-surface-hover border border-border text-foreground text-sm py-2 px-4 rounded-sm transition-colors whitespace-nowrap">
            + Módulo
          </button>
        </div>
      </fieldset>

      {/* Salvar */}
      <div className="flex items-center gap-4">
        <button onClick={saveCourse} disabled={saving}
          className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-semibold py-2.5 px-7 rounded-sm text-sm transition-colors">
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
        {saved && <span className="text-sm text-green-400">✓ Salvo</span>}
      </div>

      <style>{`
        .input-field {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 2px;
          padding: 7px 11px;
          font-size: 13px;
          color: var(--foreground);
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field:focus { border-color: rgba(201,162,39,0.5); }
        .input-field::placeholder { color: var(--foreground-muted); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] text-foreground-muted uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function VideoUrlField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <input
        placeholder="URL do vídeo (Cloudflare Stream, Vimeo...)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field text-sm pr-20"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-foreground-dim bg-surface-hover px-1.5 py-0.5 rounded uppercase tracking-wider">
        URL
      </span>
    </div>
  );
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
