'use server';
import { redirect } from 'next/navigation';
import { installAdmin } from '../installation';
export async function setup(form: FormData): Promise<void> {
    const ok = (await installAdmin({ key: String(form.get('key') ?? ''), name: String(form.get('name') ?? ''), email: String(form.get('email') ?? '').trim().toLowerCase(), password: String(form.get('password') ?? '') }));
    if (!ok)
        redirect('/setup?erro=1');
    redirect('/login?criada=1');
}
