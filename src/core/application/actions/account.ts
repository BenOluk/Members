'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireUser } from '../session';
import { changePassword, editProfile, issuePasswordReset, resetPassword, requestAccessEmail } from '../account';
export async function requestAccess(form: FormData): Promise<void> {
    await requestAccessEmail(String(form.get('email') ?? ''));
    redirect('/primeiro-acesso?enviado=1');
}
export async function updateProfile(form: FormData): Promise<void> {
    const user = await requireUser();
    const ok = (await editProfile(user.id, String(form.get('name') ?? ''), String(form.get('bio') ?? ''), String(form.get('location') ?? '')));
    revalidatePath('/', 'layout');
    redirect(`/conta?status=${ok ? 'salvo' : 'erro'}`);
}
export async function updatePassword(form: FormData): Promise<void> {
    const user = await requireUser();
    const ok = (await changePassword(user.id, String(form.get('current') ?? ''), String(form.get('password') ?? '')));
    redirect(ok ? '/login?criada=1' : '/conta?status=senha');
}
export async function recoverPassword(form: FormData): Promise<void> {
    const token = String(form.get('token') ?? '');
    if (!(await resetPassword(token, String(form.get('password') ?? ''))))
        redirect('/recuperar?erro=1');
    redirect('/login?criada=1');
}
export async function recoveryLink(userId: string, _previous: {
    token: string;
}, _form: FormData): Promise<{
    token: string;
}> {
    const admin = await requireAdmin();
    void _previous; void _form;
    return { token: (await issuePasswordReset(admin.id, userId)) ?? '' };
}
