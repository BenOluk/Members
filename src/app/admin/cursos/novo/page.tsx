'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listCategories } from '@/core/application/courses';
import type { CourseCategoryId } from '@/core/domain/entities';

const categories = listCategories();

const levels = [
  { value: 'introdutorio', label: 'Introdutório' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
] as const;

export default function NovoCursoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    thumbnail: '',
    coverImage: '',
    categoryId: 'hermetismo' as CourseCategoryId,
    level: 'introdutorio' as 'introdutorio' | 'intermediario' | 'avancado',
    isFree: false,
    price: '',
    isPublished: false,
    featured: false,
    tags: '',
  });

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: form.isFree ? 0 : Math.round(parseFloat(form.price || '0') * 100),
          currency: 'BRL' as const,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          instructorId: 'user_1',
          modules: [],
        }),
      });
      if (!res.ok) throw new Error('Erro ao criar curso');
      const { id } = await res.json();
      router.push(`/admin/cursos/${id}`);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  }

  return (
    <div className="p-10 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/cursos" className="text-foreground-muted hover:text-foreground transition-colors text-sm">← Cursos</Link>
        <span className="text-foreground-dim">/</span>
        <h1 className="text-xl font-heading font-bold">Nova trilha</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações básicas */}
        <fieldset className="space-y-4 border border-border rounded-sm p-6">
          <legend className="text-[10px] uppercase tracking-widest text-foreground-muted px-1">Informações básicas</legend>

          <Field label="Título">
            <input required value={form.title} onChange={(e) => set('title', e.target.value)}
              className="input-field" placeholder="Nome da trilha" />
          </Field>

          <Field label="Subtítulo">
            <input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)}
              className="input-field" placeholder="Tagline curta" />
          </Field>

          <Field label="Descrição">
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              className="input-field min-h-[100px] resize-y" placeholder="O que o aluno vai aprender..." />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Categoria">
              <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value as CourseCategoryId)} className="input-field">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Nível">
              <select value={form.level} onChange={(e) => set('level', e.target.value as typeof form.level)} className="input-field">
                {levels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Tags (separadas por vírgula)">
            <input value={form.tags} onChange={(e) => set('tags', e.target.value)}
              className="input-field" placeholder="kybalion, jung, arquetipos" />
          </Field>
        </fieldset>

        {/* Imagens */}
        <fieldset className="space-y-4 border border-border rounded-sm p-6">
          <legend className="text-[10px] uppercase tracking-widest text-foreground-muted px-1">Imagens</legend>
          <p className="text-xs text-foreground-muted -mt-1">Cole a URL da imagem (Unsplash, CDN, etc). Upload direto via Cloudflare R2 ou Supabase Storage em breve.</p>

          <Field label="Thumbnail (cards)">
            <input value={form.thumbnail} onChange={(e) => set('thumbnail', e.target.value)}
              className="input-field" placeholder="https://..." />
          </Field>
          <Field label="Cover (hero)">
            <input value={form.coverImage} onChange={(e) => set('coverImage', e.target.value)}
              className="input-field" placeholder="https://..." />
          </Field>
        </fieldset>

        {/* Preço e publicação */}
        <fieldset className="space-y-4 border border-border rounded-sm p-6">
          <legend className="text-[10px] uppercase tracking-widest text-foreground-muted px-1">Acesso e preço</legend>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="isFree" checked={form.isFree} onChange={(e) => set('isFree', e.target.checked)}
              className="w-4 h-4 accent-primary" />
            <label htmlFor="isFree" className="text-sm text-foreground">Gratuito</label>
          </div>

          {!form.isFree && (
            <Field label="Preço (R$)">
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)}
                className="input-field" placeholder="97.00" />
            </Field>
          )}

          <div className="flex items-center gap-3">
            <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => set('featured', e.target.checked)}
              className="w-4 h-4 accent-primary" />
            <label htmlFor="featured" className="text-sm text-foreground">Marcar como destaque</label>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="isPublished" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)}
              className="w-4 h-4 accent-primary" />
            <label htmlFor="isPublished" className="text-sm text-foreground">Publicar imediatamente</label>
          </div>
        </fieldset>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-semibold py-2.5 px-7 rounded-sm text-sm transition-colors">
            {saving ? 'Criando...' : 'Criar trilha'}
          </button>
          <Link href="/admin/cursos" className="border border-border hover:border-primary/50 text-foreground py-2.5 px-7 rounded-sm text-sm transition-colors">
            Cancelar
          </Link>
        </div>
      </form>

      <style>{`
        .input-field {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 2px;
          padding: 8px 12px;
          font-size: 14px;
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
      <label className="text-xs text-foreground-muted uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}
