import type { APIRoute } from 'astro';
import { SESSION_COOKIE, destroySession } from '../../lib/auth';

export const POST: APIRoute = ({ cookies, redirect }) => {
  const sid = cookies.get(SESSION_COOKIE)?.value;
  if (sid) destroySession(sid);
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return redirect('/');
};
