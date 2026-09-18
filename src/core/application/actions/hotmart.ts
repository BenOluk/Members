'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '../session';
import { saveMapping, removeMapping } from '../hotmart';

export async function configureProduct(form: FormData): Promise<void> {
  await requireAdmin();
  const ok = await saveMapping(String(form.get('productId') ?? '').trim(), String(form.get('offerCode') ?? '').trim(), String(form.get('courseId') ?? ''), Number(form.get('days') ?? 0));
  revalidatePath('/admin/integracoes');
  redirect(`/admin/integracoes?status=${ok ? 'salvo' : 'erro'}`);
}
export async function deleteMapping(id: string): Promise<void> {
  await requireAdmin();
  await removeMapping(id);
  revalidatePath('/admin/integracoes');
}
