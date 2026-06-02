import type { NextAuthConfig } from "next-auth";

// Edge-safe configuration. Contains NO Node-only imports (no Prisma, no bcrypt)
// so it can be used by middleware on the edge runtime. The Credentials provider
// (which needs Node) is added in auth.ts.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = ["/play", "/onboarding", "/dashboard"];
      const isProtected = protectedPaths.some((p) => nextUrl.pathname.startsWith(p));
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
