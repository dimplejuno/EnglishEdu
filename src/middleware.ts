import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, getSessionUser } from './lib/auth';

// 모든 요청에서 세션 쿠키를 읽어 현재 사용자를 locals 에 채워줍니다.
export const onRequest = defineMiddleware(async (context, next) => {
  const sessionId = context.cookies.get(SESSION_COOKIE)?.value;
  const user = getSessionUser(sessionId);
  context.locals.user = user
    ? { id: user.id, email: user.email, name: user.name, created_at: user.created_at }
    : null;

  // 로그인이 필요한 경로 보호
  const protectedPaths = ['/dashboard', '/account'];
  const url = new URL(context.request.url);
  if (!user && protectedPaths.some((p) => url.pathname.startsWith(p))) {
    return context.redirect('/login');
  }

  return next();
});
