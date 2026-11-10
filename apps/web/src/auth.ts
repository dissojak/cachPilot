import NextAuth from "next-auth";
import type { NextAuthConfig, NextAuthResult } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * OAuth only (UNDERSTANDING §0): no passwords stored. Short sessions (8 h,
 * refreshed hourly) in an httpOnly cookie (P2-5). The middleware uses
 * `authorized` to check that a session exists; permissions are checked in
 * the use cases.
 */
const config: NextAuthConfig = {
  providers: [Google],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60, updateAge: 60 * 60 },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ auth }) => Boolean(auth?.user),
  },
};

const nextAuth: NextAuthResult = NextAuth(config);

export const handlers: NextAuthResult["handlers"] = nextAuth.handlers;
export const auth: NextAuthResult["auth"] = nextAuth.auth;
export const signIn: NextAuthResult["signIn"] = nextAuth.signIn;
export const signOut: NextAuthResult["signOut"] = nextAuth.signOut;
