import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
  depends('app:auth');
  const session = await locals.getSession?.();
  const authUser = (session?.user ?? null) as any;
  const user = authUser
    ? { id: authUser.id, name: authUser.name, email: authUser.email, role: authUser.role ?? 'user', image: authUser.image }
    : null;
  return { user };
};
