import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

const config: NextAuthConfig = {
  providers: [Google],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ auth, request: { nextUrl } }) => {
      if (auth?.user) return true;
      return false;
    },
  },
  logger: {
    warn: (msg) => console.warn("[authjs-warn]", msg),
    error: (msg) => console.error("[authjs-error]", msg),
  },
};

const nextAuth = NextAuth(config);

export const handlers = nextAuth.handlers;
export const auth = nextAuth.auth as any;
export const signIn = nextAuth.signIn as any;
export const signOut = nextAuth.signOut as any;
