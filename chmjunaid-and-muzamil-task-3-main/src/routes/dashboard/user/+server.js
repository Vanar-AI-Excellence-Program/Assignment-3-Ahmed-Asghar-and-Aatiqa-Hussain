export async function GET({ locals }) {
  const session = await locals.getSession();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }
  return new Response(JSON.stringify(session.user), { status: 200 });
}